# RFI Notification System

## Overview

The RFI Notification System provides real-time notifications when clients respond to RFIs, helping teams stay informed about project updates and maintain communication flow.

## Features

### 🔔 Real-time Notifications
- Instant notifications when client responses are received
- Visual indicators for unread notifications
- Automatic polling for new notifications every 30 seconds

### 📧 Email Notifications
- Customizable email templates for different notification types
- Automatic email delivery to project team members
- Rich HTML email formatting with project branding

### 🎯 Smart Targeting
- Notifications sent to relevant team members based on project settings
- Configurable recipient lists per notification type
- Support for multiple notification channels

### 📱 User Interface
- Notification bell icon in the header with unread count
- Dropdown preview of recent notifications
- Dedicated notifications page with search and filtering
- Mark as read functionality

## System Components

### NotificationService (`src/services/notificationService.ts`)
Core service that handles all notification operations:

```typescript
// Create a notification
await NotificationService.createNotification({
  rfi_id: 'uuid',
  type: 'response_received',
  message: 'Client response received with status: approved',
  metadata: { response_status: 'approved', client_name: 'ABC Corp' }
});

// Send client response notification
await NotificationService.notifyClientResponse(
  rfiId, 
  responseStatus, 
  clientName,
  teamEmails
);
```

### NotificationBell Component (`src/components/notifications/NotificationBell.tsx`)
Header notification bell with dropdown:
- Shows unread count badge
- Displays recent notifications
- Real-time updates
- Links to full notifications page

### Notifications Page (`src/app/notifications/page.tsx`)
Full-featured notifications management:
- Search and filter notifications
- Statistics dashboard
- Bulk mark as read
- Detailed notification history

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'response_received', 
        'overdue_reminder', 
        'status_changed', 
        'link_generated'
    )),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_notifications_rfi_id ON notifications(rfi_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## Notification Types

### 1. Response Received (`response_received`)
**Trigger**: When a client submits a response via secure link
**Recipients**: Project team members, project manager
**Content**: RFI details, response status, client information

### 2. Overdue Reminder (`overdue_reminder`)
**Trigger**: When RFI becomes overdue (automated check)
**Recipients**: Client contact, project manager
**Content**: Overdue information, escalation warnings

### 3. Status Changed (`status_changed`)
**Trigger**: When RFI status is manually updated
**Recipients**: Based on notification rules configuration
**Content**: Status change details, transition information

### 4. Link Generated (`link_generated`)
**Trigger**: When secure client link is created
**Recipients**: Client contacts
**Content**: Secure access link, instructions, expiration info

## Integration Points

### Client Response Flow
1. Client submits response via `/api/client/rfi/[token]`
2. Response data is validated and stored
3. `NotificationService.notifyClientResponse()` is called
4. In-app notification is created
5. Email notification is sent to team members
6. Real-time UI updates show new notification

### RFI Workflow Integration
```typescript
// In RFI status transition
await NotificationService.createNotification({
  rfi_id: rfiId,
  type: 'status_changed',
  message: `RFI status changed from ${oldStatus} to ${newStatus}`,
  metadata: { old_status: oldStatus, new_status: newStatus }
});
```

## Configuration

### Email Template Customization
Email templates can be customized in the Notification Center:
- Access via Admin Panel → Notifications Tab
- Customize sender information, signatures, and branding
- Preview templates before activation

### Notification Rules
Configure which events trigger notifications:
- Response Received: ✅ Enabled (recommended)
- Status Updates: ✅ Enabled
- Overdue Reminders: ✅ Enabled
- Link Generation: ✅ Enabled

### Recipient Management
- **Automatic**: Recipients determined from project settings
- **Manual**: Add custom email addresses for specific notifications
- **Role-based**: Different notification types for different roles

## Setup Instructions

### 1. Database Migration
Run the schema fix script to ensure all required tables and columns exist:
```bash
# Execute the SQL script
psql -d your_database -f scripts/fix-client-response-schema.sql
```

### 2. Environment Configuration
Ensure the following environment variables are set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Component Integration
The notification system is automatically integrated into:
- Header component (notification bell)
- Admin panel (notification center)
- Client response API routes

## API Reference

### NotificationService Methods

#### `createNotification(data: NotificationData)`
Creates a new in-app notification.

#### `notifyClientResponse(rfiId, responseStatus, clientName, teamEmails)`
Sends comprehensive notification for client responses.

#### `markNotificationsAsRead(rfiId)`
Marks all notifications for an RFI as read.

#### `getUnreadNotificationsCount()`
Returns count of unread notifications.

#### `getRecentNotifications(limit?)`
Retrieves recent notifications with RFI and project details.

## Troubleshooting

### Common Issues

**Notifications not appearing**
1. Check database connection
2. Verify notifications table exists
3. Check browser console for JavaScript errors

**Email notifications not sending**
1. Verify email service configuration
2. Check recipient email addresses
3. Review email template formatting

**Performance issues**
1. Check database indexes are created
2. Monitor notification table size
3. Consider archiving old notifications

**Database errors**
1. Run the schema fix script: `scripts/fix-client-response-schema.sql`
2. Check enum values exist
3. Verify foreign key relationships

### Monitoring
- Monitor notification creation success/failure rates
- Track email delivery statistics
- Review user engagement with notifications

## Future Enhancements

### Planned Features
- [ ] Push notifications for mobile devices
- [ ] Slack/Teams integration
- [ ] SMS notifications for urgent RFIs
- [ ] Notification preferences per user
- [ ] Advanced filtering and search
- [ ] Notification analytics dashboard

### Email Service Integration
Currently using console logging for email notifications. To integrate with a real email service:

1. **SendGrid Integration**:
```typescript
// Replace placeholder in NotificationService
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: data.to,
  from: 'noreply@yourcompany.com',
  subject: data.subject,
  html: data.body
});
```

2. **Resend Integration**:
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@yourcompany.com',
  to: data.to,
  subject: data.subject,
  html: data.body
});
```

## Support

For questions or issues with the notification system:
1. Check this documentation first
2. Review the console logs for error messages
3. Verify database schema is up to date
4. Test with a simple notification to isolate issues

---

*Last Updated: June 14, 2025*
*Version: 1.0* 