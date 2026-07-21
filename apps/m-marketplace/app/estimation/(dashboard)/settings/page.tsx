'use client';

import { useState, useEffect } from 'react';
import { Button } from '@estimation/components/ui/button';
import { Input } from '@estimation/components/ui/input';
import { Label } from '@estimation/components/ui/label';
import { Badge } from '@estimation/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@estimation/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@estimation/components/ui/tabs';
import {
  Save,
  User,
  Settings,
  Plug,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@estimation/components/ui/use-toast';

interface UserProfile {
  name: string;
  email: string;
  company: string;
  phone: string;
  role: string;
}

interface EstimateDefaults {
  overheadPercent: number;
  profitPercent: number;
  contingencyPercent: number;
  taxPercent: number;
  wasteFactorPercent: number;
  defaultRegion: string;
}

interface IntegrationConfig {
  name: string;
  description: string;
  connected: boolean;
  lastSync?: string;
}

const STORAGE_KEY = 'kealee-estimation-settings';

const defaultProfile: UserProfile = {
  name: '',
  email: '',
  company: '',
  phone: '',
  role: 'Estimator',
};

const defaultEstimateDefaults: EstimateDefaults = {
  overheadPercent: 15,
  profitPercent: 10,
  contingencyPercent: 5,
  taxPercent: 7.5,
  wasteFactorPercent: 5,
  defaultRegion: 'US-National',
};

const regions = [
  'US-National', 'US-Northeast', 'US-Southeast', 'US-Midwest',
  'US-Southwest', 'US-West', 'US-Pacific',
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [defaults, setDefaults] = useState<EstimateDefaults>(defaultEstimateDefaults);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([
    { name: 'Bid Engine', description: 'Sync estimates with bid management system', connected: false },
    { name: 'Budget Tracker', description: 'Transfer approved estimates to project budgets', connected: false },
    { name: 'RSMeans', description: 'Import industry-standard cost data', connected: false },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profile) setProfile({ ...defaultProfile, ...parsed.profile });
        if (parsed.defaults) setDefaults({ ...defaultEstimateDefaults, ...parsed.defaults });
        if (parsed.integrations) setIntegrations(parsed.integrations);
      }
    } catch {
      // Use defaults
    }
  }, []);

  const saveSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, defaults, integrations }));
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleIntegration = (index: number) => {
    setIntegrations((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, connected: !item.connected, lastSync: item.connected ? undefined : new Date().toISOString() }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile, defaults, and integrations</p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Defaults
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal and company information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="ABC Construction"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option>Estimator</option>
                    <option>Project Manager</option>
                    <option>General Contractor</option>
                    <option>Subcontractor</option>
                    <option>Owner/Developer</option>
                    <option>Architect</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estimate Defaults</CardTitle>
              <CardDescription>Default percentages applied to new estimates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overhead">Overhead (%)</Label>
                  <Input
                    id="overhead"
                    type="number"
                    value={defaults.overheadPercent}
                    onChange={(e) => setDefaults({ ...defaults, overheadPercent: parseFloat(e.target.value) || 0 })}
                    step="0.5"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profit">Profit (%)</Label>
                  <Input
                    id="profit"
                    type="number"
                    value={defaults.profitPercent}
                    onChange={(e) => setDefaults({ ...defaults, profitPercent: parseFloat(e.target.value) || 0 })}
                    step="0.5"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contingency">Contingency (%)</Label>
                  <Input
                    id="contingency"
                    type="number"
                    value={defaults.contingencyPercent}
                    onChange={(e) => setDefaults({ ...defaults, contingencyPercent: parseFloat(e.target.value) || 0 })}
                    step="0.5"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    value={defaults.taxPercent}
                    onChange={(e) => setDefaults({ ...defaults, taxPercent: parseFloat(e.target.value) || 0 })}
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste">Waste Factor (%)</Label>
                  <Input
                    id="waste"
                    type="number"
                    value={defaults.wasteFactorPercent}
                    onChange={(e) => setDefaults({ ...defaults, wasteFactorPercent: parseFloat(e.target.value) || 0 })}
                    step="0.5"
                    min="0"
                    max="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Default Region</Label>
                  <select
                    id="region"
                    value={defaults.defaultRegion}
                    onChange={(e) => setDefaults({ ...defaults, defaultRegion: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Defaults Preview</CardTitle>
              <CardDescription>How these defaults affect a $100,000 estimate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm max-w-md">
                <div className="flex justify-between">
                  <span>Direct Costs (Subtotal)</span>
                  <span className="font-medium">$100,000</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Overhead ({defaults.overheadPercent}%)</span>
                  <span>${(100000 * defaults.overheadPercent / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Profit ({defaults.profitPercent}%)</span>
                  <span>${(100000 * defaults.profitPercent / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Contingency ({defaults.contingencyPercent}%)</span>
                  <span>${(100000 * defaults.contingencyPercent / 100).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span>Subtotal with Markup</span>
                  <span className="font-medium">
                    ${(100000 * (1 + (defaults.overheadPercent + defaults.profitPercent + defaults.contingencyPercent) / 100)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Tax ({defaults.taxPercent}%)</span>
                  <span>
                    ${(100000 * (1 + (defaults.overheadPercent + defaults.profitPercent + defaults.contingencyPercent) / 100) * defaults.taxPercent / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Grand Total</span>
                  <span>
                    ${(100000 * (1 + (defaults.overheadPercent + defaults.profitPercent + defaults.contingencyPercent) / 100) * (1 + defaults.taxPercent / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          {integrations.map((integration, index) => (
            <Card key={integration.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      integration.connected ? 'bg-green-100' : 'bg-muted'
                    }`}>
                      <Plug className={`h-6 w-6 ${integration.connected ? 'text-green-700' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{integration.name}</h3>
                        {integration.connected ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last synced: {new Date(integration.lastSync).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {integration.connected && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync
                      </Button>
                    )}
                    <Button
                      variant={integration.connected ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => toggleIntegration(index)}
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
