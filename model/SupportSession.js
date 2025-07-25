import { Schema, model } from 'mongoose';

const supportSessionSchema = new Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        default: () => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    agentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    teamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    type: {
        type: String,
        enum: ['chat', 'video', 'voice', 'screen_share'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'waiting', 'resolved', 'closed', 'escalated'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['technical', 'billing', 'general', 'complaint', 'feature_request'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    messages: [{
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        messageType: {
            type: String,
            enum: ['text', 'file', 'image', 'system'],
            default: 'text'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        isRead: {
            type: Boolean,
            default: false
        },
        attachments: [{
            fileName: String,
            fileUrl: String,
            fileType: String,
            fileSize: Number
        }]
    }],
    timeline: [{
        action: {
            type: String,
            enum: ['created', 'assigned', 'agent_joined', 'customer_joined', 'message_sent', 'escalated', 'resolved', 'closed', 'reopened'],
            required: true
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: {
            type: String,
            default: ''
        }
    }],
    videoCall: {
        roomId: String,
        startedAt: Date,
        endedAt: Date,
        duration: Number, // in seconds
        recordingUrl: String,
        participants: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            joinedAt: Date,
            leftAt: Date
        }]
    },
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        feedback: {
            type: String,
            default: ''
        },
        ratedAt: {
            type: Date,
            default: null
        }
    },
    resolution: {
        summary: {
            type: String,
            default: ''
        },
        resolvedAt: {
            type: Date,
            default: null
        },
        resolutionTime: {
            type: Number, // in minutes
            default: null
        }
    },
    escalation: {
        reason: String,
        escalatedTo: {
            type: Schema.Types.ObjectId,
            ref: 'Team'
        },
        escalatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        escalatedAt: Date
    },
    metadata: {
        userAgent: String,
        ipAddress: String,
        referrer: String,
        customerLocation: {
            country: String,
            region: String,
            city: String
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
supportSessionSchema.index({ sessionId: 1 });
supportSessionSchema.index({ customerId: 1 });
supportSessionSchema.index({ agentId: 1 });
supportSessionSchema.index({ teamId: 1 });
supportSessionSchema.index({ status: 1 });
supportSessionSchema.index({ priority: 1 });
supportSessionSchema.index({ category: 1 });
supportSessionSchema.index({ createdAt: -1 });
supportSessionSchema.index({ 'rating.score': 1 });

// Compound indexes
supportSessionSchema.index({ status: 1, priority: -1, createdAt: -1 });
supportSessionSchema.index({ teamId: 1, status: 1 });
supportSessionSchema.index({ agentId: 1, status: 1 });

// Virtual to calculate session duration
supportSessionSchema.virtual('duration').get(function() {
    if (this.resolution.resolvedAt) {
        return Math.floor((this.resolution.resolvedAt - this.createdAt) / (1000 * 60)); // in minutes
    }
    return null;
});

// Virtual to get unread messages count
supportSessionSchema.virtual('unreadMessagesCount').get(function() {
    return this.messages.filter(msg => !msg.isRead).length;
});

// Method to add a message
supportSessionSchema.methods.addMessage = function(senderId, message, messageType = 'text', attachments = []) {
    this.messages.push({
        senderId,
        message,
        messageType,
        attachments,
        timestamp: new Date()
    });
    
    // Add timeline entry
    this.timeline.push({
        action: 'message_sent',
        performedBy: senderId,
        details: `${messageType} message sent`
    });
    
    return this.save();
};

// Method to assign agent
supportSessionSchema.methods.assignAgent = function(agentId) {
    this.agentId = agentId;
    this.status = 'active';
    
    // Add timeline entry
    this.timeline.push({
        action: 'assigned',
        performedBy: agentId,
        details: 'Agent assigned to session'
    });
    
    return this.save();
};

// Method to resolve session
supportSessionSchema.methods.resolve = function(agentId, summary = '') {
    this.status = 'resolved';
    this.resolution.summary = summary;
    this.resolution.resolvedAt = new Date();
    this.resolution.resolutionTime = Math.floor((this.resolution.resolvedAt - this.createdAt) / (1000 * 60));
    
    // Add timeline entry
    this.timeline.push({
        action: 'resolved',
        performedBy: agentId,
        details: 'Session resolved'
    });
    
    return this.save();
};

// Method to escalate session
supportSessionSchema.methods.escalate = function(escalatedBy, escalatedTo, reason) {
    this.status = 'escalated';
    this.escalation = {
        reason,
        escalatedTo,
        escalatedBy,
        escalatedAt: new Date()
    };
    
    // Add timeline entry
    this.timeline.push({
        action: 'escalated',
        performedBy: escalatedBy,
        details: `Session escalated: ${reason}`
    });
    
    return this.save();
};

// Method to rate session
supportSessionSchema.methods.rate = function(customerId, score, feedback = '') {
    this.rating = {
        score,
        feedback,
        ratedAt: new Date()
    };
    
    return this.save();
};

// Pre-save middleware to update timeline on status change
supportSessionSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.timeline.push({
            action: this.status,
            performedBy: this.agentId || this.customerId,
            details: `Status changed to ${this.status}`
        });
    }
    next();
});

const SupportSession = model('SupportSession', supportSessionSchema);

export default SupportSession;
