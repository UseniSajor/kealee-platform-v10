// ============================================================
// WIZARD STEP 1: PROJECT INFO
// ============================================================

'use client';

import { UseFormReturn } from 'react-hook-form';
import { WizardFormData } from '../application-wizard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { propertyLookupService } from '@/services/permit-application/property-lookup';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface Step1ProjectInfoProps {
  form: UseFormReturn<WizardFormData>;
}

export function Step1ProjectInfo({ form }: Step1ProjectInfoProps) {
  const supabase = createClient();
  const { register, formState: { errors }, watch, setValue } = form;
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [parcelData, setParcelData] = useState<any>(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch user's projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Project')
        .select('id, name, address')
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch properties for selected project
  const selectedProjectId = watch('projectId');
  const { data: properties } = useQuery({
    queryKey: ['properties', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      
      const { data, error } = await supabase
        .from('Property')
        .select('id, address, parcelNumber, zoning')
        .eq('projectId', selectedProjectId)
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  const selectedProperty = properties?.find((p: any) => p.id === watch('propertyId'));
  const jurisdictionId = watch('jurisdictionId');

  // Auto-fill property data when selected
  useEffect(() => {
    if (selectedProperty && !watch('address')) {
      setValue('address', selectedProperty.address || '');
      setValue('parcelNumber', selectedProperty.parcelNumber || '');
      setValue('zoning', selectedProperty.zoning || '');
    }
  }, [selectedProperty, setValue, watch]);

  // Handle address search
  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) return;

    setIsLookingUp(true);
    try {
      const results = await propertyLookupService.searchProperties(
        addressSearch,
        jurisdictionId
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Handle property lookup
  const handleLookupProperty = async () => {
    const address = watch('address');
    if (!address) return;

    setIsLookingUp(true);
    try {
      const data = await propertyLookupService.lookupByAddress(address, jurisdictionId);
      if (data) {
        setParcelData(data);
        setValue('parcelNumber', data.parcelNumber);
        setValue('zoning', data.zoning || '');
        if (data.coordinates) {
          // Store coordinates if needed
        }
      }
    } catch (error) {
      console.error('Property lookup error:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Handle parcel number lookup
  const handleParcelLookup = async () => {
    const parcelNumber = watch('parcelNumber');
    if (!parcelNumber) return;

    setIsLookingUp(true);
    try {
      const data = await propertyLookupService.lookupByParcel(parcelNumber, jurisdictionId);
      if (data) {
        setParcelData(data);
        setValue('address', data.address);
        setValue('zoning', data.zoning || '');
      }
    } catch (error) {
      console.error('Parcel lookup error:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Project Information</h2>
        <p className="text-gray-600">
          Select the project and property for this permit application
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectId">Project *</Label>
          <Select
            value={watch('projectId') || ''}
            onValueChange={(value) => {
              setValue('projectId', value);
              setValue('propertyId', ''); // Reset property when project changes
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name || project.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectId && (
            <p className="text-sm text-red-600">{errors.projectId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyId">Property *</Label>
          <Select
            value={watch('propertyId') || ''}
            onValueChange={(value) => setValue('propertyId', value)}
            disabled={!selectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {properties?.map((property: any) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyId && (
            <p className="text-sm text-red-600">{errors.propertyId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Property Address *</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              {...register('address')}
              placeholder="123 Main St, City, State ZIP"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleLookupProperty}
              disabled={isLookingUp || !watch('address')}
            >
              {isLookingUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          {errors.address && (
            <p className="text-sm text-red-600">{errors.address.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Enter address and click search to auto-fill parcel data from GIS/Assessor records
          </p>
        </div>

        {/* Address Search Results */}
        {searchResults.length > 0 && (
          <Card className="p-4">
            <Label className="mb-2">Search Results</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setValue('address', result.address);
                    setValue('parcelNumber', result.parcelNumber);
                    setValue('zoning', result.zoning || '');
                    setSearchResults([]);
                    setAddressSearch('');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{result.address}</p>
                      {result.parcelNumber && (
                        <p className="text-xs text-gray-500">
                          Parcel: {result.parcelNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Parcel Data Display */}
        {parcelData && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <Label className="text-blue-900">Parcel Information (from GIS)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setParcelData(null)}
              >
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {parcelData.parcelNumber && (
                <div>
                  <span className="text-gray-600">Parcel:</span>{' '}
                  <span className="font-medium">{parcelData.parcelNumber}</span>
                </div>
              )}
              {parcelData.zoning && (
                <div>
                  <span className="text-gray-600">Zoning:</span>{' '}
                  <span className="font-medium">{parcelData.zoning}</span>
                </div>
              )}
              {parcelData.assessedValue && (
                <div>
                  <span className="text-gray-600">Assessed Value:</span>{' '}
                  <span className="font-medium">
                    ${parcelData.assessedValue.toLocaleString()}
                  </span>
                </div>
              )}
              {parcelData.lotSize && (
                <div>
                  <span className="text-gray-600">Lot Size:</span>{' '}
                  <span className="font-medium">
                    {parcelData.lotSize.toLocaleString()} sqft
                  </span>
                </div>
              )}
              {parcelData.ownerName && (
                <div className="col-span-2">
                  <span className="text-gray-600">Owner:</span>{' '}
                  <span className="font-medium">{parcelData.ownerName}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parcelNumber">Parcel Number</Label>
            <div className="flex gap-2">
              <Input
                id="parcelNumber"
                {...register('parcelNumber')}
                placeholder="Optional"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleParcelLookup}
                disabled={isLookingUp || !watch('parcelNumber')}
              >
                {isLookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Enter parcel number to auto-fill property information
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoning">Zoning</Label>
            <Input
              id="zoning"
              {...register('zoning')}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
