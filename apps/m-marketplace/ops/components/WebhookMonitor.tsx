'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ops/components/ui/card';
import { Button } from '@ops/components/ui/button';
import { Badge } from '@ops/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface WebhookEvent {
  id: string;
  event_type: string;
  event_id: string;
  status: 'success' | 'failed' | 'pending';
  received_at: string;
  processed_at?: string;
  error?: string;
}

export default function WebhookMonitor() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0
  });

  useEffect(() => {
    fetchWebhookEvents();
    const interval = setInterval(fetchWebhookEvents, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchWebhookEvents = async () => {
    try {
      const response = await fetch('/api/webhooks/events');
      if (!response.ok) {
        throw new Error('Failed to fetch webhook events');
      }
      const data = await response.json();
      setEvents(data.events || []);
      
      // Calculate stats
      const total = data.events?.length || 0;
      const success = data.events?.filter((e: WebhookEvent) => e.status === 'success').length || 0;
      const failed = data.events?.filter((e: WebhookEvent) => e.status === 'failed').length || 0;
      const pending = data.events?.filter((e: WebhookEvent) => e.status === 'pending').length || 0;
      
      setStats({ total, success, failed, pending });
    } catch (error) {
      console.error('Failed to fetch webhook events:', error);
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (eventType: string) => {
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType })
      });
      
      if (response.ok) {
        alert(`Test webhook sent for: ${eventType}`);
        // Refresh events after a short delay
        setTimeout(fetchWebhookEvents, 2000);
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to send test webhook' }));
        alert(`Error: ${error.error || 'Failed to send test webhook'}`);
      }
    } catch (error) {
      console.error('Failed to send test webhook:', error);
      alert('Failed to send test webhook. Check console for details.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stripe Webhook Monitor</CardTitle>
              <CardDescription>
                Real-time monitoring of Stripe webhook events
              </CardDescription>
            </div>
            <Button onClick={fetchWebhookEvents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-500">Total Events</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-sm text-green-500">Successful</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-red-500">Failed</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-yellow-500">Pending</div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2 mb-6">
            <h3 className="font-semibold">Test Webhooks</h3>
            <div className="flex flex-wrap gap-2">
              {['checkout.session.completed', 'customer.subscription.updated', 'invoice.payment_failed', 'payment_intent.succeeded'].map((eventType) => (
                <Button
                  key={eventType}
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook(eventType)}
                >
                  Test {eventType.split('.').pop()}
                </Button>
              ))}
            </div>
          </div>

          {/* Event List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Recent Events</h3>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-gray-500">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No webhook events received yet
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{event.event_type}</span>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {event.event_id} • Received: {new Date(event.received_at).toLocaleString()}
                      </div>
                      {event.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {event.error}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const details = JSON.stringify(event, null, 2);
                        alert(`Event details:\n\n${details}`);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
