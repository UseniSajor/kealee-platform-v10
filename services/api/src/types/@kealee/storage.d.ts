declare module '@kealee/storage' {
  export type OnEvent = (...args: any[]) => any
  export type AnalyzeImageFn = (...args: any[]) => any

  export function uploadSitePhoto(...args: any[]): Promise<any>
  export function uploadReceipt(...args: any[]): Promise<any>
  export function uploadDocument(...args: any[]): Promise<any>
  export function getProjectPhotos(...args: any[]): Promise<any>
  export function processReceipt(...args: any[]): Promise<any>
}
