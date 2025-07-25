# Database Schema Documentation

This document describes the database schemas for the Supportly application, available in both MongoDB (Mongoose) and SQL (Sequelize) formats.

## Models Overview

### 1. User Model
Represents users in the system (customers, support agents, and administrators).

**Key Features:**
- Role-based access control (admin, support_agent, customer)
- User preferences and settings
- Team membership tracking
- Authentication data

**Relationships:**
- Belongs to a Team (optional)
- Has many SupportSessions (as customer or agent)
- Can lead multiple Teams

### 2. Team Model
Represents support teams with specific departments and working hours.

**Key Features:**
- Department-based organization
- Working hours and timezone management
- Skill tags for specialized support
- Team statistics tracking
- Member management

**Relationships:**
- Has many Users (team members)
- Has one User as leader
- Has many SupportSessions
- Can receive escalated sessions

### 3. SupportSession Model
Represents customer support interactions across different channels.

**Key Features:**
- Multi-channel support (chat, video, voice, screen sharing)
- Priority and status management
- Message history and timeline tracking
- Rating and feedback system
- Escalation workflow
- Video call integration

**Relationships:**
- Belongs to a User (customer)
- Belongs to a User (agent) - optional
- Belongs to a Team
- Can be escalated to another Team

## Usage Examples

### MongoDB (Mongoose)

```javascript
import { User, Team, SupportSession } from './model/mongoose/index.js';

// Create a new user
const user = new User({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: 'customer'
});

// Create a new team
const team = new Team({
    name: 'Technical Support',
    department: 'technical',
    workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
});

// Create a new support session
const session = new SupportSession({
    customerId: user._id,
    teamId: team._id,
    type: 'chat',
    category: 'technical',
    subject: 'Login Issues',
    description: 'Unable to login to my account'
});
```

### SQL (Sequelize)

```javascript
import { Sequelize } from 'sequelize';
import initializeModels from './model/sql/index.js';

const sequelize = new Sequelize(/* connection config */);
const { User, Team, SupportSession } = initializeModels(sequelize);

// Create a new user
const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: 'customer'
});

// Create a new team
const team = await Team.create({
    name: 'Technical Support',
    department: 'technical',
    workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
});

// Create a new support session
const session = await SupportSession.create({
    customerId: user.id,
    teamId: team.id,
    type: 'chat',
    category: 'technical',
    subject: 'Login Issues',
    description: 'Unable to login to my account'
});
```

## Key Methods

### User Methods
- `canProvideSupport()` - Check if user can provide support
- `toSafeObject()` - Get user data without sensitive information

### Team Methods
- `isAvailable(currentTime)` - Check if team is available based on working hours
- `addMember(userId)` / `removeMember(userId)` - Manage team members (Mongoose only)
- `getActiveMembersCount()` - Get count of active team members (Sequelize only)

### SupportSession Methods
- `addMessage(senderId, message, messageType, attachments)` - Add a new message
- `assignAgent(agentId)` - Assign an agent to the session
- `resolve(agentId, summary)` - Mark session as resolved
- `escalate(escalatedBy, escalatedTo, reason)` - Escalate session to another team
- `rate(customerId, score, feedback)` - Rate the support session
- `getDuration()` - Calculate session duration
- `getUnreadMessagesCount()` - Count unread messages

## Database Indexes

Both implementations include optimized indexes for:
- User lookups by email, team, and role
- Team queries by department and status
- Support session queries by status, priority, customer, agent, and team
- Compound indexes for complex queries

## Migration and Setup

### For Sequelize (SQL)
```javascript
// Sync database (development only)
await sequelize.sync({ force: false });

// For production, use migrations
const { User, Team, SupportSession } = initializeModels(sequelize);
```

### For Mongoose (MongoDB)
```javascript
import mongoose from 'mongoose';
import './model/mongoose/index.js'; // This will register all models

await mongoose.connect('mongodb://localhost:27017/supportly');
```

## Security Considerations

1. **Password Hashing**: Always hash passwords before storing
2. **Input Validation**: Both schemas include validation rules
3. **Sensitive Data**: Use `toSafeObject()` method to exclude passwords from API responses
4. **Role-based Access**: Implement proper role checking using `canProvideSupport()` method
5. **Data Sanitization**: Validate and sanitize all user inputs

## Performance Optimization

1. **Indexes**: Both implementations include comprehensive indexing strategies
2. **Pagination**: Implement pagination for large datasets
3. **Aggregation**: Use database aggregation for statistics and reporting
4. **Connection Pooling**: Configure appropriate connection pools
5. **Query Optimization**: Use populate/include selectively for related data
