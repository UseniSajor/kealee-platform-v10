import { geocodeAddress, determineJurisdictionFromAddress, queryArcGisFeature, getJurisdictionGisData } from '../gis-client';
import * as https from 'https';
import { EventEmitter } from 'events';

// Mock Node's https.get
jest.mock('https');

describe('Kealee GIS Client Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('determineJurisdictionFromAddress', () => {
    test('resolves DC addresses correctly', () => {
      expect(determineJurisdictionFromAddress('1350 Pennsylvania Ave NW', 'Washington, D.C.')).toBe('dc');
      expect(determineJurisdictionFromAddress('Wilson Building', 'District of Columbia')).toBe('dc');
    });

    test('resolves Montgomery County MD addresses correctly', () => {
      expect(determineJurisdictionFromAddress('1001 Broadwood Dr', 'Rockville, MD')).toBe('montgomery_md');
      expect(determineJurisdictionFromAddress('7400 Wisconsin Ave', 'Bethesda, MD')).toBe('montgomery_md');
    });

    test('resolves Fairfax County VA addresses correctly', () => {
      expect(determineJurisdictionFromAddress('1600 Tysons Blvd', 'McLean, VA')).toBe('fairfax_va');
      expect(determineJurisdictionFromAddress('12000 Government Center Pkwy', 'Reston, VA')).toBe('fairfax_va');
    });

    test('resolves Arlington County VA addresses correctly', () => {
      expect(determineJurisdictionFromAddress('2100 Clarendon Blvd', 'Arlington, VA')).toBe('arlington_va');
    });

    test('returns null for unsupported jurisdictions', () => {
      expect(determineJurisdictionFromAddress('100 Main St', 'Boston, MA')).toBeNull();
    });
  });

  describe('geocodeAddress', () => {
    test('resolves coordinates on successful API response', async () => {
      const mockResponseData = [{ lat: '38.8949', lon: '-77.0313' }];
      setupHttpsGetMock(200, JSON.stringify(mockResponseData));

      const coords = await geocodeAddress('1350 Pennsylvania Ave NW');
      expect(coords).toEqual({ lat: 38.8949, lng: -77.0313 });
    });

    test('returns null on empty geocoding response', async () => {
      setupHttpsGetMock(200, '[]');

      const coords = await geocodeAddress('Unknown address');
      expect(coords).toBeNull();
    });

    test('returns null on geocoding error', async () => {
      (https.get as jest.Mock).mockImplementationOnce((options: any, callback: any) => {
        const req = new EventEmitter() as any;
        process.nextTick(() => {
          req.emit('error', new Error('Network error'));
        });
        return req;
      });

      const coords = await geocodeAddress('Error address');
      expect(coords).toBeNull();
    });
  });

  describe('queryArcGisFeature', () => {
    test('queries Arlington County zoning successfully', async () => {
      const mockZoningData = {
        features: [
          {
            attributes: {
              ZN_DESIG: 'C-O',
              LABEL: 'Commercial Office',
              RPC_NUMBER: '12345'
            }
          }
        ]
      };
      setupHttpsGetMock(200, JSON.stringify(mockZoningData));

      const result = await queryArcGisFeature(
        { lat: 38.8904, lng: -77.0853 },
        'https://arlgis.arlingtonva.us/.../MapServer/0',
        'arlington_va'
      );

      expect(result).toEqual({
        zoningClass: 'C-O',
        zoningDescription: 'Commercial Office',
        parcelId: '12345',
        zoningMapUrl: undefined,
        rawAttributes: mockZoningData.features[0].attributes
      });
    });

    test('returns null when no features found', async () => {
      setupHttpsGetMock(200, '{"features": []}');

      const result = await queryArcGisFeature(
        { lat: 38.8904, lng: -77.0853 },
        'https://arlgis.arlingtonva.us/.../MapServer/0',
        'arlington_va'
      );

      expect(result).toBeNull();
    });
  });
});

// Helper to mock https.get
function setupHttpsGetMock(statusCode: number, data: string) {
  const mockResponse = new EventEmitter() as any;
  mockResponse.statusCode = statusCode;
  mockResponse.headers = {};

  (https.get as jest.Mock).mockImplementationOnce((options: any, callback: any) => {
    callback(mockResponse);
    process.nextTick(() => {
      mockResponse.emit('data', Buffer.from(data));
      mockResponse.emit('end');
    });
    return new EventEmitter() as any;
  });
}
