declare module '@kealee/storage' {
  export type OnEvent = (...args: any[]) => any
  export type AnalyzeImageFn = (...args: any[]) => any

  export function uploadFile(...args: any[]): Promise<any>
  export function uploadSitePhoto(...args: any[]): Promise<any>
  export function uploadReceipt(...args: any[]): Promise<any>
  export function uploadDocument(...args: any[]): Promise<any>
  export function getProjectPhotos(...args: any[]): Promise<any>
  export function getSignedUrl(...args: any[]): Promise<any>
  export function deleteFile(...args: any[]): Promise<any>
  export function processReceipt(...args: any[]): Promise<any>
  export function processPermitDocument(...args: any[]): Promise<any>
  export function optimizeImage(...args: any[]): Promise<any>
  export function createThumbnail(...args: any[]): Promise<any>
  export function getImageBase64(...args: any[]): Promise<any>
  export function extractExifData(...args: any[]): Promise<any>
  export function getImageDimensions(...args: any[]): Promise<any>
}
