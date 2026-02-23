# Components

## WebhookMonitor

A React component for monitoring Stripe webhook events in real-time.

### Usage

```tsx
import WebhookMonitor from '@/components/WebhookMonitor';

export default function WebhookMonitoringPage() {
  return (
    <div className="container mx-auto p-6">
      <WebhookMonitor />
    </div>
  );
}
```

### Features

- **Real-time Monitoring**: Automatically polls for webhook events every 30 seconds
- **Statistics Dashboard**: Shows total, successful, failed, and pending events
- **Test Webhooks**: Trigger test webhook events directly from the UI
- **Event Details**: View detailed information about each webhook event
- **Status Badges**: Visual indicators for event status (success, failed, pending)

### API Endpoints

The component uses the following API routes:

- `GET /api/webhooks/events` - Fetches webhook events from the backend
- `POST /api/webhooks/test` - Triggers a test webhook event

### Backend Requirements

The component requires the backend API to have:

- `GET /webhooks/status` - Returns webhook status and recent logs
- `POST /webhooks/test` - Logs test webhook requests (optional)

### Authentication

The component will automatically include authentication headers if available. Make sure your API routes handle authentication properly.
