declare module '@kealee/estimating' {
  export class ScopeAnalyzer {
    constructor(prisma: any)
    analyze(projectId: string, options?: any): Promise<any>
    [key: string]: any
  }

  export function getProjectTypes(): any[]

  export class EstimatingService {
    constructor(prisma: any)
    createEstimate(data: any): Promise<any>
    getEstimate(id: string): Promise<any>
    updateEstimate(id: string, data: any): Promise<any>
    deleteEstimate(id: string): Promise<void>
    listEstimates(filters?: any): Promise<any[]>
    [key: string]: any
  }
}
