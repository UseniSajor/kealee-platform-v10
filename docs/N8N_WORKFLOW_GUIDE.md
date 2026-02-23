# n8n Bid Scanner Workflow Setup

## Overview
Phase 2 implements automated bid discovery using n8n workflows.

## Workflow Components
1. **Email Monitor** - Gmail/IMAP trigger for BuildingConnected, eMMA emails
2. **Email Parser** - Extract project details, deadlines, contacts
3. **Bid Scorer** - AI scoring based on match criteria
4. **Notifier** - Alert via Telegram (KeaBot) and create opportunity in Kealee API
5. **Action Trigger** - Auto-download documents, add to checklist

## Setup Instructions
[To be completed in Phase 2]

## Webhook Endpoints
- `/webhook/bids` - Receive new bid notifications
- `/webhook/bids/parse` - Parse email content
