/**
 * API Key List Component
 */

'use client';

import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Key, Trash2, Activity, Calendar, Clock, AlertCircle} from 'lucide-react';
import {format} from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  jurisdictionId?: string;
  organizationId?: string;
  scopes: string[];
  rateLimit: number;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  active: boolean;
}

interface ApiKeyListProps {
  keys: ApiKey[];
  onRevoke: (id: string) => void;
  onViewUsage: (id: string) => void;
}

export function ApiKeyList({keys, onRevoke, onViewUsage}: ApiKeyListProps) {
  if (keys.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No API keys found. Create your first API key to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map((key) => {
        const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
        const isActive = key.active && !isExpired;

        return (
          <Card key={key.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{key.name}</h3>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {isActive ? 'Active' : isExpired ? 'Expired' : 'Revoked'}
                    </Badge>
                    {isExpired && <AlertCircle className="h-4 w-4 text-orange-500" />}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
                    <div>
                      <div className="font-medium text-gray-500 mb-1">Rate Limit</div>
                      <div>{key.rateLimit} req/min</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500 mb-1">Scopes</div>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500 mb-1">Created</div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(key.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500 mb-1">Last Used</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {key.lastUsedAt
                          ? format(new Date(key.lastUsedAt), 'MMM d, yyyy')
                          : 'Never'}
                      </div>
                    </div>
                  </div>

                  {key.expiresAt && (
                    <div className="mt-2 text-sm text-gray-500">
                      Expires: {format(new Date(key.expiresAt), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewUsage(key.id)}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Usage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevoke(key.id)}
                    disabled={!isActive}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
