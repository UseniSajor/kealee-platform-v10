const TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  heic: 'image/heic', heif: 'image/heif',
  mp4: 'video/mp4', mov: 'video/quicktime', pdf: 'application/pdf',
}

/** File pickers can omit MIME metadata or supply a generic binary type. */
export function resolveIntakeFileType(file: { name: string; type: string }): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return TYPES_BY_EXTENSION[extension] ?? file.type
}
