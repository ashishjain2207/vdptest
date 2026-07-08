/**
 * Client-side media compression before upload (images via canvas; videos via canvas + MediaRecorder when supported).
 * Align defaults with API `PostMedia:MaxStoredMediaBytes` / `MaxIncomingRasterBytes` where applicable.
 */

/** Target max output size (bytes) for post/admin uploads — default 3 MiB matches API appsettings. */
export const DEFAULT_MAX_OUTPUT_BYTES = Number(import.meta.env.VITE_POST_MEDIA_MAX_OUTPUT_BYTES) || 3145728;

/** Max raw image size accepted before client rejects (default 50 MiB). */
export const DEFAULT_MAX_INPUT_IMAGE_BYTES =
  Number(import.meta.env.VITE_POST_MEDIA_MAX_INPUT_IMAGE_BYTES) || 52428800;

/** Max raw video size before client-side compression attempt (default 120 MiB). */
export const DEFAULT_MAX_INPUT_VIDEO_BYTES =
  Number(import.meta.env.VITE_POST_MEDIA_MAX_INPUT_VIDEO_BYTES) || 120 * 1024 * 1024;

/** Absolute guard to avoid OOM in the browser. */
export const DEFAULT_HARD_MAX_INPUT_BYTES = 500 * 1024 * 1024;

function replaceExtension(name, newExt) {
  const base = String(name || 'upload').replace(/[/\\]/g, '_');
  const i = base.lastIndexOf('.');
  if (i <= 0) {
    return `${base}${newExt}`;
  }
  return `${base.slice(0, i)}${newExt}`;
}

function formatMaxMb(maxBytes) {
  return (maxBytes / (1024 * 1024)).toFixed(1);
}

/**
 * Merges audio tracks from the source <video> into a canvas-captured stream when supported.
 * @param {HTMLVideoElement} video
 * @param {MediaStream} canvasStream
 * @returns {{ stream: MediaStream, sourceHadAudio: boolean, audioAttached: boolean }}
 */
function mergeSourceAudioIntoStream(video, canvasStream) {
  if (typeof video.captureStream !== 'function') {
    return { stream: canvasStream, sourceHadAudio: false, audioAttached: true };
  }

  try {
    const sourceStream = video.captureStream();
    const audioTracks = sourceStream.getAudioTracks();
    if (audioTracks.length === 0) {
      return { stream: canvasStream, sourceHadAudio: false, audioAttached: true };
    }

    for (const track of audioTracks) {
      canvasStream.addTrack(track);
    }

    return {
      stream: canvasStream,
      sourceHadAudio: true,
      audioAttached: canvasStream.getAudioTracks().length > 0,
    };
  } catch {
    return { stream: canvasStream, sourceHadAudio: true, audioAttached: false };
  }
}

/**
 * @param {File} file
 * @param {number} maxBytes
 * @returns {Promise<Blob>}
 */
async function compressImageToJpegUnderMaxBytes(file, maxBytes) {
  const bitmap = await createImageBitmap(file);
  try {
    let w = bitmap.width;
    let h = bitmap.height;
    let quality = 0.88;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas not supported');
    }

    for (let iter = 0; iter < 48; iter += 1) {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });
      if (blob && blob.size > 0 && blob.size <= maxBytes) {
        return blob;
      }
      if (quality > 0.42) {
        quality = Math.max(0.42, quality - 0.06);
      } else {
        quality = 0.88;
        w = Math.max(320, Math.floor(w * 0.86));
        h = Math.max(320, Math.floor(h * 0.86));
      }
    }

    canvas.width = Math.max(320, bitmap.width);
    canvas.height = Math.max(320, bitmap.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const last = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.42);
    });
    if (last && last.size > 0 && last.size <= maxBytes) {
      return last;
    }

    throw new Error(
      `Image is still larger than ${formatMaxMb(maxBytes)} MB after compression. Try a smaller source image.`,
    );
  } finally {
    bitmap.close();
  }
}

/**
 * Best-effort WebM re-encode via canvas + MediaRecorder (short clips only).
 * @param {File} file
 * @param {number} maxBytes
 * @param {{ maxDurationSec?: number }} [opts]
 * @returns {Promise<File>}
 */
async function compressVideoWithCanvasRecorder(file, maxBytes, opts = {}) {
  const maxDurationSec = opts.maxDurationSec ?? 90;
  if (!file.type.startsWith('video/') || typeof MediaRecorder === 'undefined') {
    return file;
  }

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Video load failed'));
    });

    if (Number.isFinite(video.duration) && video.duration > maxDurationSec) {
      return file;
    }

    const maxW = 854;
    const scale = Math.min(1, maxW / video.videoWidth);
    const w = Math.max(2, Math.floor(video.videoWidth * scale) & ~1);
    const h = Math.max(2, Math.floor(video.videoHeight * scale) & ~1);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    const bitrates = [2_000_000, 1_000_000, 500_000];
    for (const bitrate of bitrates) {
      const canvasStream = canvas.captureStream(24);
      let mime = '';
      for (const m of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) {
        if (MediaRecorder.isTypeSupported(m)) {
          mime = m;
          break;
        }
      }
      if (!mime) {
        break;
      }

      await video.play();

      const { stream, sourceHadAudio, audioAttached } = mergeSourceAudioIntoStream(video, canvasStream);
      if (sourceHadAudio && !audioAttached) {
        try {
          video.pause();
        } catch {
          /* ignore */
        }
        return file;
      }

      const chunks = [];
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const stopped = new Promise((resolve) => {
        rec.onstop = () => resolve();
      });

      rec.start(250);

      await new Promise((resolve) => {
        const tick = () => {
          if (video.ended) {
            resolve();
            return;
          }
          ctx.drawImage(video, 0, 0, w, h);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(resolve, Math.ceil((Math.min(video.duration || 0, maxDurationSec) + 2) * 1000));
      });

      try {
        video.pause();
      } catch {
        /* ignore */
      }
      if (rec.state === 'recording') {
        rec.stop();
      }
      await stopped;

      const out = new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' });
      if (out.size > 0 && out.size <= maxBytes) {
        return new File([out], replaceExtension(file.name, '.webm'), { type: out.type });
      }
    }
  } catch {
    /* ignore */
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return file;
}

/**
 * @param {File} file
 * @param {{ maxOutputBytes?: number, maxDurationSec?: number }} [options]
 * @returns {Promise<File>}
 */
export async function prepareMediaFileForUpload(file, options = {}) {
  if (!file || !(file instanceof File)) {
    return file;
  }

  const maxOut = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  if (file.size <= maxOut) {
    return file;
  }

  if (file.type.startsWith('image/')) {
    const blob = await compressImageToJpegUnderMaxBytes(file, maxOut);
    if (blob.size > maxOut) {
      throw new Error(
        `Image is still larger than ${formatMaxMb(maxOut)} MB after compression. Try a smaller source image.`,
      );
    }
    return new File([blob], replaceExtension(file.name, '.jpg'), { type: 'image/jpeg' });
  }

  if (file.type.startsWith('video/')) {
    const compressed = await compressVideoWithCanvasRecorder(file, maxOut, options);
    if (compressed.size <= maxOut) {
      return compressed;
    }
    throw new Error(
      `Video is still larger than ${(maxOut / (1024 * 1024)).toFixed(1)} MB after compression. Try a shorter clip or lower resolution.`,
    );
  }

  return file;
}
