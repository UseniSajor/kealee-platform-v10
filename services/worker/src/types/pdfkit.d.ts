declare module 'pdfkit' {
  // Minimal typing shim for pdfkit to satisfy TS strict builds.
  // If you want full typings, replace this with proper type definitions.
  const PDFDocument: any
  export default PDFDocument
  export type PDFDocument = any
}

