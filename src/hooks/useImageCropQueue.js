import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { croppedBlobToImageFile, readImageFileAsDataUrl } from '@/lib/imageCropPresets';
import { buildCoverCropMetadata } from '@/lib/imageCropMetadata';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

/**
 * Sequential image crop queue (one adjust dialog at a time).
 * @returns {{
 *   cropper: {
 *     open: boolean,
 *     imageSrc: string | null,
 *     onClose: () => void,
 *     onCropComplete: (blob: Blob, meta?: { mode: 'crop', aspectRatio: number, crop?: object, rotation?: number }) => void,
 *     aspectRatio: number,
 *     aspectLabel?: string,
 *     isCircular: boolean,
 *     title?: string,
 *   },
 *   enqueue: (items: Array<{ file: File, config: { aspectRatio: number, aspectLabel?: string, isCircular: boolean, title?: string } }>, onFinish: (files: File[]) => void) => void,
 *   isProcessing: boolean,
 * }}
 */
export function useImageCropQueue() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(/** @type {string | null} */ (null));
  const [config, setConfig] = useState(
    /** @type {{ aspectRatio: number, aspectLabel?: string, isCircular: boolean, title?: string } | null} */ (null),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const queueRef = useRef(/** @type {Array<{ file: File, config: { aspectRatio: number, aspectLabel?: string, isCircular: boolean, title?: string } }>} */ ([]));
  const resultsRef = useRef(/** @type {File[]} */ ([]));
  const onFinishRef = useRef(/** @type {((files: File[]) => void) | null} */ (null));
  const currentFileRef = useRef(/** @type {File | null} */ (null));
  /** Suppresses queue reset when the dialog closes to advance to the next image. */
  const advancingRef = useRef(false);

  const resetSession = useCallback(() => {
    queueRef.current = [];
    resultsRef.current = [];
    onFinishRef.current = null;
    currentFileRef.current = null;
    setIsProcessing(false);
    setOpen(false);
    setImageSrc(null);
    setConfig(null);
  }, []);

  const finishQueue = useCallback(() => {
    const results = resultsRef.current;
    const cb = onFinishRef.current;
    resetSession();
    cb?.(results);
  }, [resetSession]);

  const processNext = useCallback(async () => {
    const item = queueRef.current.shift();
    if (!item) {
      finishQueue();
      return;
    }
    currentFileRef.current = item.file;
    try {
      const dataUrl = await readImageFileAsDataUrl(item.file);
      setConfig(item.config);
      setImageSrc(dataUrl);
      setOpen(true);
    } catch (err) {
      toast.error(err?.message || t(language, 'toasts.couldNotReadImage'));
      void processNext();
    }
  }, [finishQueue, language]);

  const enqueue = useCallback(
    (items, onFinish) => {
      if (!items.length) {
        onFinish([]);
        return;
      }
      if (isProcessing) {
        toast.error(t(language, 'toasts.finishAdjustingImage'));
        return;
      }
      setIsProcessing(true);
      queueRef.current = [...items];
      resultsRef.current = [];
      onFinishRef.current = onFinish;
      void processNext();
    },
    [isProcessing, language, processNext],
  );

  const handleCropComplete = useCallback(
    (blob, cropMeta) => {
      const original = currentFileRef.current;
      if (original) {
        const displayMeta = buildCoverCropMetadata(cropMeta?.aspectRatio ?? config?.aspectRatio ?? 1);
        resultsRef.current.push(
          croppedBlobToImageFile(blob, original.name, 'image', displayMeta),
        );
      }
      advancingRef.current = true;
      setOpen(false);
      setImageSrc(null);
      setConfig(null);
      currentFileRef.current = null;
      void processNext().finally(() => {
        advancingRef.current = false;
      });
    },
    [processNext, config?.aspectRatio],
  );

  const handleClose = useCallback(() => {
    if (advancingRef.current) {
      return;
    }
    resetSession();
  }, [resetSession]);

  return {
    cropper: {
      open,
      imageSrc,
      onClose: handleClose,
      onCropComplete: handleCropComplete,
      aspectRatio: config?.aspectRatio ?? 1,
      aspectLabel: config?.aspectLabel,
      isCircular: config?.isCircular ?? false,
      title: config?.title,
    },
    enqueue,
    isProcessing,
  };
}
