# Session Summary Email Feature - Simplified Implementation

This feature automatically sends session summary emails to both customers and support agents when a support session ends via the WebSocket `end-call` event.

## 📧 Email Functions

Two simplified email functions have been implemented in `MailService`:

### 1. `sendSummaryCustomer(sessionId, subject, description, category, summary, agentName, user, session)`
- **Purpose**: Sends a summary email to the customer
- **Template**: `customer-session-summary.html`
- **Features**: Session details, AI summary, and rating request

### 2. `sendSummaryAgent(sessionId, subject, description, category, summary, agentName, user, session)`
- **Purpose**: Sends a summary email to the agent
- **Template**: `agent-session-summary.html`
- **Features**: Session details, AI summary, and dashboard links

## 🔧 Function Parameters

Both functions use the same parameter structure:

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Unique session identifier |
| `subject` | string | Session subject/title |
| `description` | string | Session description |
| `category` | string | Formatted category (e.g., "Technical Support") |
| `summary` | string | AI-generated session summary |
| `agentName` | string | Name of the support agent |
| `user` | object | Customer user object with `name` and `email` |
| `session` | object | Session object with `date` and optional `agentId` |

## 🔄 WebSocket Integration

The emails are automatically triggered in `websocket.js` when the `end-call` event is received:

```javascript
socket.on("end-call", async () => {
    if (["support_agent", 'admin'].includes(socket.user.role)) {
        // Generate AI summary
        const summary = await aiservice.generateSummary(socket.session);
        
        // End session and send emails
        await mailservice.sendSummaryCustomer(sessionId, subject, description, category, summary, agentName, user, session);
        await mailservice.sendSummaryAgent(sessionId, subject, description, category, summary, agentName, user, session);
    }
});
```

## 🎨 Email Templates

### Customer Email (`customer-session-summary.html`)
- Clean, customer-friendly design
- Session details grid showing:
  - Customer name
  - Support agent
  - Subject and category
  - Session date
  - Description
- AI-generated summary section
- Rating request with direct link
- Support contact links

### Agent Email (`agent-session-summary.html`)
- Professional agent report design
- Session details grid showing:
  - Customer information with email
  - Agent name
  - Subject and category
  - Session date
  - Description
- AI-generated summary section
- Action buttons for dashboard and session details
- Support links and preferences

## 🧪 Testing

Test the simplified email functions:

```bash
node test/test-session-summary-emails.js
```

This test script will:
- Call both email functions with sample data
- Verify email delivery (development mode uses local mail server)
- Display test results

## � Email Content Structure

### Customer Email Includes:
- ✅ Session completion badge
- 📋 6-item session details grid
- 🤖 AI-generated summary (if available)
- ⭐ Rating request section
- 📞 Support and unsubscribe links

### Agent Email Includes:
- 📊 Agent report badge
- 📋 6-item session details grid
- 🤖 AI-generated summary (if available)
- 🎯 Success completion message
- 🔗 Dashboard and session detail buttons

## 🛠️ Key Features

1. **Simple Parameter Structure**: Easy to call with basic session data
2. **Automatic Category Formatting**: Converts database categories to display-friendly names
3. **Fallback Email Handling**: Agent emails use fallback if email not in session
4. **Mobile Responsive**: Both templates work on all devices
5. **Professional Design**: Clean, branded email layouts
6. **Error Handling**: Robust error handling with detailed logging

## 🔧 Usage Example

```javascript
// In your WebSocket handler or anywhere else
await mailservice.sendSummaryCustomer(
    'SESS-123',
    'Login Issues',
    'Customer cannot access account',
    'Technical Support',
    'Issue resolved by clearing cache',
    'John Agent',
    { name: 'Jane Customer', email: 'jane@example.com' },
    { date: new Date(), agentId: { email: 'john@supportly.com' } }
);

await mailservice.sendSummaryAgent(
    'SESS-123',
    'Login Issues', 
    'Customer cannot access account',
    'Technical Support',
    'Issue resolved by clearing cache',
    'John Agent',
    { name: 'Jane Customer', email: 'jane@example.com' },
    { date: new Date(), agentId: { email: 'john@supportly.com' } }
);
```

## 🎯 Benefits

- **Simplified API**: Single function calls with clear parameters
- **Consistent Data**: Both emails use the same data structure
- **Automatic Formatting**: Category names automatically formatted for display
- **Professional Communication**: Branded, well-designed email templates
- **Easy Integration**: Simple to integrate with existing WebSocket flow
