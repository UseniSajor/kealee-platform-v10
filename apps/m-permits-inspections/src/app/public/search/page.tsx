/**
 * Public Permit Search Page
 * Permit search by address, permit number, or owner
 */

'use client';

import {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {Search, MapPin, FileText, User, Hash} from 'lucide-react';
import {permitSearchService, PublicPermitInfo} from '@/services/public-portal/permit-search';

export default function PublicSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'ADDRESS' | 'PERMIT_NUMBER' | 'OWNER' | 'PARCEL' | 'ALL'>('ALL');
  const [results, setResults] = useState<PublicPermitInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResult = await permitSearchService.searchPermits({
        query: searchQuery,
        searchType,
      });

      setResults(searchResult.permits);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Permit Search</h1>
        <p className="text-gray-600">
          Search for permits by address, permit number, owner name, or parcel number
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Permits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    All Fields
                  </div>
                </SelectItem>
                <SelectItem value="ADDRESS">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </div>
                </SelectItem>
                <SelectItem value="PERMIT_NUMBER">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Permit Number
                  </div>
                </SelectItem>
                <SelectItem value="OWNER">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Owner Name
                  </div>
                </SelectItem>
                <SelectItem value="PARCEL">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Parcel Number
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={
                searchType === 'ADDRESS'
                  ? 'Enter property address'
                  : searchType === 'PERMIT_NUMBER'
                  ? 'Enter permit number'
                  : searchType === 'OWNER'
                  ? 'Enter owner name'
                  : searchType === 'PARCEL'
                  ? 'Enter parcel number'
                  : 'Search by address, permit number, owner, or parcel'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />

            <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Search Results ({results.length})</h2>
          <div className="space-y-4">
            {results.map(permit => (
              <Card key={permit.permitId} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {permit.permitNumber} - {permit.type}
                      </h3>
                      {permit.subtype && (
                        <p className="text-gray-600 mb-2">{permit.subtype}</p>
                      )}
                      <p className="text-gray-700 mb-2">{permit.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {permit.propertyAddress}
                        </div>
                        {permit.parcelNumber && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Parcel: {permit.parcelNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        permit.status === 'ISSUED' || permit.status === 'ACTIVE'
                          ? 'default'
                          : permit.status === 'COMPLETED'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {permit.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {permit.submittedAt && (
                      <span>
                        Submitted: {permit.submittedAt.toLocaleDateString()}
                      </span>
                    )}
                    {permit.issuedAt && (
                      <span>Issued: {permit.issuedAt.toLocaleDateString()}</span>
                    )}
                    {permit.expiresAt && (
                      <span>Expires: {permit.expiresAt.toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.location.href = `/public/permit/${permit.permitId}`;
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && searchQuery && !error && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No permits found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
