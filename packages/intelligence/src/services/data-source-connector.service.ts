import type { DataSourceConnectorService, DataSourceBundle, DataSourceConnectorOptions } from './interfaces.js'

/** MVP stub — returns empty bundle; Phase 6 connects real GIS/permit/CRM sources */
export class StubDataSourceConnectorService implements DataSourceConnectorService {
  async fetchBundle(options: DataSourceConnectorOptions): Promise<DataSourceBundle> {
    return {
      parcelData: options.parcelId ? { parcelId: options.parcelId } : undefined,
      permitData: [],
      gisData: options.address ? { address: options.address } : undefined,
      censusMarketData: options.jurisdiction ? { jurisdiction: options.jurisdiction } : undefined,
      crmHistory: [],
      campaignHistory: [],
      dataSources: ['stub'],
      dataQualityScore: 0.5,
    }
  }
}

export const stubDataSourceConnector = new StubDataSourceConnectorService()
