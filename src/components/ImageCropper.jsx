import { useState, useCallback, useEffect, useRef } from 'react';
import ReactCrop, { convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { RotateCcw, RotateCw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportCroppedImageBlob } from '@/lib/imageCropOutput';
import { createMaxAspectCrop } from '@/lib/imageCropPresets';
import { buildCoverCropMetadata } from '@/lib/imageCropMetadata';

const ROTATION_STEP = 90;

export const ImageCropper = ({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  isCircular = false,
  aspectRatio = 1,
  title,
  closeOnCropComplete = true,
}) => {
  const t = useT();

  const imgRef = useRef(/** @type {HTMLImageElement | null} */ (null));
  const lastImageSrcRef = useRef(/** @type {string | null} */ (null));

  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotate, setRotate] = useState(0);
  const [layoutKey, setLayoutKey] = useState(0);

  const resetCropState = useCallback(() => {
    setCrop(undefined);
    setCompletedCrop(null);
    setRotate(0);
    setLayoutKey((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!open) {
      lastImageSrcRef.current = null;
      return;
    }
    if (!imageSrc) {
      return;
    }
    if (lastImageSrcRef.current !== imageSrc) {
      lastImageSrcRef.current = imageSrc;
      resetCropState();
    }
  }, [imageSrc, open, resetCropState]);

  const onImageLoad = useCallback((event) => {
    const { width, height } = event.currentTarget;
    const initialCrop = createMaxAspectCrop(width, height, aspectRatio);
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, width, height));
  }, [aspectRatio]);

  useEffect(() => {
    const image = imgRef.current;
    if (!image?.complete || image.width <= 0 || image.height <= 0) {
      return;
    }
    const initialCrop = createMaxAspectCrop(image.width, image.height, aspectRatio);
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, image.width, image.height));
  }, [aspectRatio, layoutKey]);

  const syncCompletedCrop = useCallback(() => {
    const image = imgRef.current;
    if (!image || !crop?.width || !crop?.height) {
      setCompletedCrop(null);
      return;
    }
    setCompletedCrop(convertToPixelCrop(crop, image.width, image.height));
  }, [crop]);

  useEffect(() => {
    syncCompletedCrop();
  }, [syncCompletedCrop, rotate]);

  const adjustRotation = useCallback((delta) => {
    setRotate((current) => (current + delta + 360) % 360);
  }, []);

  const isCropReady = completedCrop !== null && completedCrop.width > 0 && completedCrop.height > 0;

  const handleSave = async () => {
    if (!imageSrc || !imgRef.current || !isCropReady || !completedCrop) {
      toast.error(t('toasts.cropAreaNotReady'));
      return;
    }

    try {
      const croppedBlob = await exportCroppedImageBlob(
        imgRef.current,
        completedCrop,
        isCircular,
        1,
        rotate,
        aspectRatio,
      );

      if (!croppedBlob) {
        toast.error(t('toasts.cropGenerateFailed'));
        return;
      }

      onCropComplete(croppedBlob, buildCoverCropMetadata(aspectRatio));
      if (closeOnCropComplete) {
        onClose();
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error(error?.message || t('toasts.cropFailed'));
    }
  };

  const toolbar = (
    <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-md border border-border/60 bg-background/90 p-1 shadow-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => adjustRotation(-ROTATION_STEP)}
        aria-label={t('imageCrop.rotateLeft')}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => adjustRotation(ROTATION_STEP)}
        aria-label={t('imageCrop.rotateRight')}
      >
        <RotateCw className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={resetCropState}
        aria-label={t('imageCrop.reset')}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl gap-4 p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle>
            {title ?? `Adjust ${isCircular ? 'Profile' : 'Cover'} Image`}
          </DialogTitle>
        </DialogHeader>

        <div className="image-cropper-workspace relative inline-flex w-full justify-center rounded-lg bg-muted/40 p-2">
          {imageSrc ? (
            <ReactCrop
              key={`${imageSrc}-${layoutKey}`}
              className="image-cropper-root max-h-[min(70vh,28rem)] max-w-full"
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={syncCompletedCrop}
              aspect={aspectRatio}
              circularCrop={isCircular}
              keepSelection
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt=""
                onLoad={onImageLoad}
                className="block max-h-[min(70vh,28rem)] w-auto max-w-full"
                style={{ transform: `rotate(${rotate}deg)` }}
                draggable={false}
              />
            </ReactCrop>
          ) : null}

          {toolbar}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isCropReady}>
            {t('imageCrop.apply')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
