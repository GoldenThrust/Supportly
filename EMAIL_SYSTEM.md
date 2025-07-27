# Email Notification System

This document outlines the email notification system implemented for the Supportly application.

## Overview

The email system handles various notifications throughout the support session lifecycle:

1. **Session Confirmation** - Sent when a session is first booked
2. **Agent Assignment** - Sent when an agent is assigned to a session
3. **Session Reminders** - Sent 15 minutes before a session starts (to both customer and agent)

## Email Templates

All email templates are located in `/templates/emails/` directory:

### 1. Session Confirmation (`session-confirmation.html`)
- **Trigger**: When a customer books a new support session
- **Recipient**: Customer
- **Purpose**: Confirms session booking and provides session details
- **Features**:
  - Session ID for reference
  - Scheduled time and details
  - Calendar integration buttons
  - Preparation tips
  - Next steps information
  - Dynamic content based on agent assignment status

### 2. Session Reminder - Customer (`session-reminder-customer.html`)
- **Trigger**: 15 minutes before session start time
- **Recipient**: Customer
- **Purpose**: Reminds customer about upcoming session
- **Features**:
  - Urgent reminder styling
  - Session details summary
  - Direct join link
  - Pre-session tips
  - Agent information

### 3. Session Reminder - Agent (`session-reminder-agent.html`)
- **Trigger**: 15 minutes before session start time
- **Recipient**: Assigned agent
- **Purpose**: Notifies agent about upcoming session
- **Features**:
  - Agent-specific styling and content
  - Customer information
  - Session preparation checklist
  - Professional tone and guidance

## Mail Service Methods

### Core Methods

#### `sendSessionConfirmation(sessionData)`
Sends initial confirmation when session is booked.

**Parameters:**
```javascript
{
  customerName: string,
  customerEmail: string,
  sessionId: string,
  subject: string,
  category: string,
  description: string,
  sessionDate: Date
}
```

#### `sendSessionReminder(sessionData)`
Sends reminder 15 minutes before session start.

**Parameters:**
```javascript
{
  to: string,
  customerName: string,
  agentName: string,
  sessionDate: Date,
  subject: string,
  description: string,
  category: string,
  meetingLink: string,
  type: 'customer' | 'agent',
  customerEmail: string
}
```

#### `sendAgentAssignment(sessionData)`
Sends notification when agent is assigned to session.

**Parameters:**
```javascript
{
  customerName: string,
  customerEmail: string,
  agentName: string,
  sessionId: string,
  subject: string,
  category: string,
  description: string,
  sessionDate: Date,
  meetingLink: string
}
```

## Integration Points

### 1. Session Creation
Located in `controllers/supportSessionController.js` - `createSession()` method:
- Automatically sends confirmation email after successful session creation
- Email failure doesn't affect session creation

### 2. Agent Assignment
Located in `controllers/supportSessionController.js` - `assignAgent()` and `updateSession()` methods:
- Sends agent assignment notification immediately
- Schedules reminder notifications for 15 minutes before session

### 3. Background Processing
Uses Bull Queue (`worker.js`) for scheduled email delivery:
- Processes reminder emails at scheduled times
- Includes retry logic and error handling
- Supports both customer and agent notifications

## Email Queue System

### Queue Configuration
- **Development**: In-memory queue
- **Production**: Redis-backed queue
- **Job Type**: `email-notification`
- **Retry Policy**: 3 attempts with exponential backoff

### Queue Events
- `completed`: Logs successful email delivery
- `failed`: Logs email delivery failures
- `stalled`: Warns about stalled jobs

## Template System

### Template Engine Features
- Variable interpolation using `${variable}` syntax
- Nested object support (e.g., `${user.name}`)
- Redis caching for template files
- Fallback error handling

### Template Variables
All templates support these common variables:
- `appName`: Application name
- `customerName`: Customer's name
- `agentName`: Agent's name (when applicable)
- `sessionDate`: Formatted session date/time
- `subject`: Session subject
- `category`: Session category
- `description`: Session description
- `sessionId`: Unique session identifier
- `meetingLink`: Video call URL

## Email Configuration

### Development
- Uses local mail server (Mailhog recommended)
- Host: `0.0.0.0`
- Port: `1025`
- No authentication required

### Production
- Uses Gmail SMTP
- Requires environment variables:
  - `MAIL_HOST`
  - `MAIL_PORT`
  - `MAIL_USERNAME`
  - `MAIL_PASSWORD`

## Environment Variables

Required environment variables for email functionality:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Application URLs
CLIENT_URL=http://localhost:3000

# Redis (for production)
REDIS_URL=redis://localhost:6379

# Application
NODE_ENV=development|production
```

## Error Handling

### Email Failures
- All email sending is wrapped in try-catch blocks
- Email failures are logged but don't affect core functionality
- Queue system provides automatic retry for scheduled emails

### Template Errors
- Missing templates throw descriptive errors
- Template interpolation handles missing variables gracefully
- Redis caching provides fallback to file system

## Testing

### Development Testing
1. Set up Mailhog for local email testing:
   ```bash
   docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```
2. Access web interface at `http://localhost:8025`
3. All emails will be captured and displayed

### Template Testing
Templates can be tested by calling mail service methods directly:
```javascript
import mailService from './config/mailservice.js';

// Test session confirmation
await mailService.sendSessionConfirmation({
  customerName: "John Doe",
  customerEmail: "john@example.com",
  sessionId: "ABC123",
  subject: "Technical Support",
  category: "Technical",
  description: "Login issues",
  sessionDate: new Date()
});
```

## Future Enhancements

### Planned Features
1. **Email Preferences**: Allow users to configure notification preferences
2. **SMS Integration**: Add SMS reminder option
3. **Calendar Integration**: Direct calendar event creation
4. **Template Customization**: Admin interface for template management
5. **Email Analytics**: Track delivery rates and engagement
6. **Internationalization**: Multi-language template support

### Performance Optimizations
1. **Template Caching**: Implement more sophisticated caching
2. **Batch Processing**: Group multiple notifications
3. **Rate Limiting**: Implement sending rate limits
4. **CDN Integration**: Serve email assets from CDN

## Troubleshooting

### Common Issues

1. **Emails not sending in development**
   - Check if Mailhog is running
   - Verify mail configuration in `config/mailservice.js`

2. **Templates not loading**
   - Ensure template files exist in `/templates/emails/`
   - Check Redis connection for caching issues

3. **Scheduled emails not working**
   - Verify Redis connection for queue processing
   - Check if worker process is running

4. **Production email failures**
   - Verify Gmail app password is correct
   - Check Gmail account security settings
   - Ensure environment variables are set

### Debug Tips
- Enable debug logging in mail service
- Use queue monitoring tools for Bull queue
- Test templates individually before integration
- Monitor email delivery logs
