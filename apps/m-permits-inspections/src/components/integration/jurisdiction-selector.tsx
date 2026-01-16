// ============================================================
// JURISDICTION SELECTOR
// Auto-detect jurisdiction by address with Mapbox
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface JurisdictionSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  jurisdictions: Array<{
    id: string;
    name: string;
    code: string;
    state: string;
    county?: string;
    city?: string;
  }>;
}

export function JurisdictionSelector({
  value,
  onValueChange,
  jurisdictions,
}: JurisdictionSelectorProps) {
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const supabase = createClient();

  // Auto-detect jurisdiction by address (simplified - would use Mapbox Geocoding API)
  const handleAddressSearch = async () => {
    if (!address.trim()) return;

    setSearching(true);
    try {
      // In production, use Mapbox Geocoding API to get coordinates
      // Then match against jurisdiction service areas
      
      // For now, simple text matching
      const matched = jurisdictions.find((j) => {
        const lowerAddress = address.toLowerCase();
        return (
          lowerAddress.includes(j.city?.toLowerCase() || '') ||
          lowerAddress.includes(j.county?.toLowerCase() || '') ||
          lowerAddress.includes(j.state.toLowerCase())
        );
      });

      if (matched) {
        onValueChange(matched.id);
      }
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Enter property address to auto-detect jurisdiction"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddressSearch();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddressSearch}
          disabled={searching || !address.trim()}
        >
          <Search className="h-4 w-4 mr-2" />
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Or select manually:</label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select jurisdiction" />
          </SelectTrigger>
          <SelectContent>
            {jurisdictions.map((jurisdiction) => (
              <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium">{jurisdiction.name}</div>
                    <div className="text-xs text-gray-500">
                      {jurisdiction.city && `${jurisdiction.city}, `}
                      {jurisdiction.county && `${jurisdiction.county}, `}
                      {jurisdiction.state}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
