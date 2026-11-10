const maxImageFileSize = 10 * 1024 * 1024;
const maxStoredImageSize = 2 * 1024 * 1024;

export async function prepareImageForStorage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > maxImageFileSize) throw new Error("Choose an image smaller than 10 MB.");

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let blob = await createJpegBlob(canvas, 0.8);
    if (blob.size > maxStoredImageSize) blob = await createJpegBlob(canvas, 0.6);
    if (blob.size > maxStoredImageSize) throw new Error("This image is too large to store in this browser.");

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("The selected image could not be read."));
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("The selected image could not be converted."));
      };
      reader.readAsDataURL(blob);
    });
  } finally {
    bitmap.close();
  }
}

function createJpegBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The selected image could not be converted."));
    }, "image/jpeg", quality);
  });
}
