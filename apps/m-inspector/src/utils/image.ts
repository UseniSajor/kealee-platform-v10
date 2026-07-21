import ImageResizer from 'react-native-image-resizer';

export async function compressImage(uri: string, maxWidth: number = 1920, quality: number = 0.8): Promise<string> {
  try {
    const resized = await ImageResizer.createResizedImage(
      uri,
      maxWidth,
      maxWidth * 1.33, // Maintain aspect ratio
      'JPEG',
      quality * 100,
      0,
      undefined,
      false,
      {
        mode: 'contain',
        onlyScaleDown: true,
      },
    );
    return resized.uri;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return uri;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
