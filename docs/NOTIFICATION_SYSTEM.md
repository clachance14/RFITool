# RFI Notification System - Enhanced with "Who Did What" Tracking

## Overview

The RFI Notification System provides real-time notifications when clients respond to RFIs, helping teams stay informed about project updates and maintain communication flow. **Now enhanced with detailed user tracking to show exactly who performed what actions.**

## Features

### 🔔 Real-time Notifications with User Tracking
- Instant notifications when client responses are received
- **NEW: Detailed information about who performed each action**
- **NEW: User avatars and role badges (Client, User, System)**
- **NEW: Action details and status transition tracking**
- Visual indicators for unread notifications
- Automatic polling for new notifications every 30 seconds

### 📧 Email Notifications with Enhanced User Context
- Customizable email templates for different notification types
- **NEW: "Who Responded" sections showing client details**
- **NEW: Enhanced user information in email templates**
- Automatic email delivery to project team members
- Rich HTML email formatting with project branding

### 🎯 Smart Targeting with Performance Tracking
- Notifications sent to relevant team members based on project settings
- **NEW: Audit trail integration showing who changed what**
- **NEW: Status transition history with user attribution**
- Configurable recipient lists per notification type
- Support for multiple notification channels

### 📱 Enhanced User Interface
- **NEW: User avatars and role indicators in notification bell**
- **NEW: "Who did what" information prominently displayed**
- **NEW: Action timeline with user attribution**
- **NEW: Status change visualization (from → to)**
- Notification bell icon in the header with unread count
- Dropdown preview of recent notifications
- Dedicated notifications page with search and filtering
- Mark as read functionality

## Enhanced User Tracking Features

### 👤 User Information Display
Each notification now shows:
- **User Name**: Full name of person who performed the action
- **User Email**: Contact information for follow-up
- **User Type**: Visual badge showing Client 👤, User 👨‍💼, or System 🤖
- **Action Details**: Specific description of what was done
- **Timestamp**: When the action occurred

### 🔄 Status Change Tracking
Status change notifications include:
- **From Status** → **To Status** visualization
- **Reason** for status change (if provided)
- **User who made the change** with contact info
- **Action timeline** showing progression

### 📋 Client Response Enhancement
Client response notifications now show:
- **Responder Name**: Who from the client company responded
- **Client Company**: Organization name
- **Client Email**: Contact information  
- **Response Details**: Status (approved/rejected/clarification)
- **Response Time**: When the response was submitted

## System Components

### Enhanced NotificationService (`src/services/notificationService.ts`)
Core service that handles all notification operations with user tracking:

```typescript
// Create a notification with enhanced user tracking
await NotificationService.createNotification({
  rfi_id: 'uuid',
  type: 'response_received',
  message: 'John Smith from ABC Corp submitted a response with status: approved',
  performed_by: 'user-id',
  performed_by_name: 'John Smith',
  performed_by_email: 'john@abccorp.com',
  performed_by_type: 'client',
  action_details: 'Client response submitted with status: approved',
  metadata: { response_status: 'approved', client_name: 'ABC Corp' }
});

// Send enhanced client response notification
await NotificationService.notifyClientResponse(
  rfiId, 
  responseStatus, 
  clientName,
  responderName,
  clientEmail,
  teamEmails
);

// Send status change notification with user tracking
await NotificationService.notifyStatusChange(
  rfiId,
  fromStatus,
  toStatus,
  changedBy,
  reason
);

// Send link generation notification with user attribution
await NotificationService.notifyLinkGenerated(
  rfiId,
  generatedBy,
  linkExpiresAt
);
```

### Enhanced NotificationBell Component (`src/components/notifications/NotificationBell.tsx`)
Header notification bell with enhanced user display:
- **User avatars** with role-based colors
- **Detailed "who did what" information**
- **Action icons** and status badges
- **Email addresses** for quick contact
- Real-time updates with user context
- Links to full notifications page

### Enhanced Notifications Page (`src/app/notifications/page.tsx`)
Full-featured notifications management with user tracking:
- **User profile cards** showing who performed actions
- **Action timeline** with detailed descriptions  
- **Status transition visualization**
- **User contact information** prominently displayed
- Search and filter notifications by user/action type
- Statistics dashboard with user attribution
- Bulk mark as read functionality
- Detailed notification history with audit trail

## Database Schema Enhancements

### Enhanced Notifications Table
```sql
-- Enhanced metadata field now stores user tracking information
metadata JSONB DEFAULT '{}' -- Now includes:
-- {
--   "performed_by": "user-uuid",
--   "performed_by_name": "John Smith", 
--   "performed_by_email": "john@company.com",
--   "performed_by_type": "user|client|system",
--   "action_details": "Generated secure client access link",
--   "response_status": "approved",
--   "from_status": "draft",
--   "to_status": "active",
--   "reason": "Ready to send to client"
-- }
```

## Notification Types with Enhanced User Tracking

### 1. Response Received (`response_received`)
**Trigger**: When a client submits a response via secure link
**Enhanced Display**:
- Client responder name and company
- Client email and contact info
- Response status with visual indicators
- Response submission time
- Action: "Client response submitted with status: [approved/rejected/clarification]"

### 2. Status Changed (`status_changed`)
**Trigger**: When RFI status is manually updated
**Enhanced Display**:
- User who made the change (name + email)
- From status → To status visualization
- Reason for change (if provided)
- Action: "Status transition: [draft] → [active]"

### 3. Link Generated (`link_generated`)
**Trigger**: When secure client link is created
**Enhanced Display**:
- User who generated the link
- Link expiration date
- Action: "Generated secure client access link"

### 4. Overdue Reminder (`overdue_reminder`)
**Trigger**: When RFI becomes overdue (automated check)
**Enhanced Display**:
- System-generated notification
- Days overdue calculation
- Original due date and current status

## Integration Points with User Tracking

### Enhanced Client Response Flow
1. Client submits response via `/api/client/rfi/[token]`
2. Response data is validated and stored
3. `NotificationService.notifyClientResponse()` creates enhanced notification
4. **User information extracted and stored** (responder name, email, company)
5. In-app notification created with full client context
6. Email notification sent with "Who Responded" section
7. Real-time UI updates show detailed user information

### Enhanced RFI Workflow Integration
```typescript
// Enhanced workflow transition with user tracking
const result = await RFIWorkflowService.executeTransition(
  rfiId,
  targetStatus,
  currentStatus,
  userId, // Now tracked in notifications
  additionalData
);

// Automatically creates notification with user information
await NotificationService.notifyStatusChange(
  rfiId,
  currentStatus,
  targetStatus,
  userId,
  reason
);
```

## Enhanced Email Templates

### Client Response Email Template
Now includes a dedicated "Who Responded" section:

```html
<div style="background: #e0f2fe; border: 1px solid #0891b2; padding: 15px; border-radius: 6px;">
  <h3 style="color: #0c4a6e;">👤 Who Responded</h3>
  <ul style="color: #0c4a6e;">
    <li><strong>Responder:</strong> John Smith</li>
    <li><strong>Company:</strong> ABC Construction</li>
    <li><strong>Email:</strong> john@abcconstruction.com</li>
    <li><strong>Response Time:</strong> June 14, 2025 at 2:30 PM</li>
  </ul>
</div>
```

## User Interface Enhancements

### Notification Bell Dropdown
- **User avatars** with role-based background colors
- **Role badges**: Client 👤, User 👨‍💼, System 🤖  
- **Action descriptions** with full context
- **Email addresses** for quick reference
- **Status transition arrows** (Draft → Active)

### Main Notifications Page
- **User profile cards** for each notification
- **Contact information** prominently displayed
- **Action timeline** showing what happened when
- **Status change visualization** with color coding
- **User type filtering** (Client actions, User actions, System actions)

## API Enhancements

### Enhanced NotificationService Methods

#### `createNotification(data: EnhancedNotificationData)`
Now accepts user tracking information:
- `performed_by`: User ID who performed the action
- `performed_by_name`: Display name 
- `performed_by_email`: Contact email
- `performed_by_type`: 'user' | 'client' | 'system'
- `action_details`: Detailed description of action

#### `notifyStatusChange(rfiId, fromStatus, toStatus, changedBy, reason?)`
Automatically fetches user information and creates rich notification.

#### `notifyClientResponse(rfiId, responseStatus, clientName, responderName, clientEmail?, teamEmails?)`
Enhanced with full client responder information.

#### `notifyLinkGenerated(rfiId, generatedBy, linkExpiresAt?)`
Tracks who generated the link with user attribution.

## Configuration

### Enhanced Email Template Customization
- **User information sections** can be customized
- **Role-based styling** for different user types
- **Contact information display** options
- **Action description templates** can be modified

### User Attribution Settings
- **User information display** can be configured
- **Privacy settings** for showing email addresses
- **Role-based notifications** can be enabled/disabled
- **Action detail verbosity** can be adjusted

## Benefits of Enhanced User Tracking

### 🎯 Improved Accountability
- **Clear attribution** of all actions
- **Contact information** readily available
- **Action timeline** for project management
- **User performance** insights

### 📞 Better Communication
- **Direct contact** information in notifications
- **Role-based context** for appropriate follow-up
- **Client relationship** management through detailed tracking
- **Team coordination** improved with user visibility

### 📊 Enhanced Project Management
- **Action history** with user attribution
- **Status change** tracking and reasons
- **Client engagement** metrics and timing
- **Team performance** visibility

### 🔍 Better Troubleshooting
- **Who changed what** for issue resolution
- **When actions occurred** for timeline reconstruction
- **Why changes were made** through reason tracking
- **Contact paths** for quick problem resolution

## Migration and Compatibility

The enhanced notification system is **backward compatible** with existing notifications. Legacy notifications without user tracking information will display with:
- Generic user indicators
- System-generated messages
- Basic action descriptions
- No user contact information

New notifications will automatically include enhanced user tracking information.

## Security and Privacy

### User Information Protection
- **Email addresses** only shown to authorized users
- **Client information** properly scoped to project access
- **User IDs** never exposed in client-facing interfaces
- **Action details** filtered based on user permissions

### Data Retention
- **User tracking information** follows standard data retention policies
- **Contact information** automatically updated when user profiles change
- **Historical attributions** maintained for audit purposes
- **Privacy compliance** with user data regulations

---

*This enhanced notification system provides complete visibility into "who did what" while maintaining security and privacy standards. Users now have full context for every RFI action, improving accountability, communication, and project management effectiveness.*

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