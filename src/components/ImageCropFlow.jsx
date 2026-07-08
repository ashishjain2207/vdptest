import { ImageCropper } from '@/components/ImageCropper';

/**
 * Renders the shared adjust/crop dialog from {@link useImageCropQueue}.
 * @param {{ cropper: { open: boolean, imageSrc: string | null, onClose: () => void, onCropComplete: (blob: Blob) => void, aspectRatio: number, aspectLabel?: string, isCircular: boolean, title?: string } }} props
 */
export function ImageCropFlow({ cropper }) {
  if (!cropper.open || !cropper.imageSrc) {
    return null;
  }
  return (
    <ImageCropper
      open={cropper.open}
      onClose={cropper.onClose}
      imageSrc={cropper.imageSrc}
      onCropComplete={cropper.onCropComplete}
      closeOnCropComplete={false}
      aspectRatio={cropper.aspectRatio}
      isCircular={cropper.isCircular}
      title={cropper.title}
    />
  );
}
