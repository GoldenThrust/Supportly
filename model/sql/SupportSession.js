import { DataTypes } from 'sequelize';

const defineSupportSession = (sequelize) => {
    const SupportSession = sequelize.define('SupportSession', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sessionId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            defaultValue: () => `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        customerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        agentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        teamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Teams',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('chat', 'video', 'voice', 'screen_share'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'active', 'waiting', 'resolved', 'closed', 'escalated'),
            defaultValue: 'pending'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium'
        },
        category: {
            type: DataTypes.ENUM('technical', 'billing', 'general', 'complaint', 'feature_request'),
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        tags: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        messages: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        timeline: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        videoCall: {
            type: DataTypes.JSON,
            defaultValue: null
        },
        rating: {
            type: DataTypes.JSON,
            defaultValue: {
                score: null,
                feedback: '',
                ratedAt: null
            }
        },
        resolution: {
            type: DataTypes.JSON,
            defaultValue: {
                summary: '',
                resolvedAt: null,
                resolutionTime: null
            }
        },
        escalation: {
            type: DataTypes.JSON,
            defaultValue: null
        },
        escalatedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Teams',
                key: 'id'
            }
        },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {
                userAgent: '',
                ipAddress: '',
                referrer: '',
                customerLocation: {
                    country: '',
                    region: '',
                    city: ''
                }
            }
        }
    }, {
        tableName: 'support_sessions',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['sessionId']
            },
            {
                fields: ['customerId']
            },
            {
                fields: ['agentId']
            },
            {
                fields: ['teamId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['category']
            },
            {
                fields: ['createdAt']
            },
            {
                fields: ['status', 'priority', 'createdAt']
            },
            {
                fields: ['teamId', 'status']
            },
            {
                fields: ['agentId', 'status']
            },
            {
                fields: ['escalatedTo']
            }
        ]
    });

    // Instance methods
    SupportSession.prototype.addMessage = async function(senderId, message, messageType = 'text', attachments = []) {
        const newMessage = {
            senderId,
            message,
            messageType,
            attachments,
            timestamp: new Date(),
            isRead: false
        };

        const newTimelineEntry = {
            action: 'message_sent',
            performedBy: senderId,
            timestamp: new Date(),
            details: `${messageType} message sent`
        };

        this.messages = [...this.messages, newMessage];
        this.timeline = [...this.timeline, newTimelineEntry];
        
        await this.save();
        return this;
    };

    SupportSession.prototype.assignAgent = async function(agentId) {
        this.agentId = agentId;
        this.status = 'active';
        
        const timelineEntry = {
            action: 'assigned',
            performedBy: agentId,
            timestamp: new Date(),
            details: 'Agent assigned to session'
        };
        
        this.timeline = [...this.timeline, timelineEntry];
        await this.save();
        return this;
    };

    SupportSession.prototype.resolve = async function(agentId, summary = '') {
        const resolvedAt = new Date();
        const resolutionTime = Math.floor((resolvedAt - this.createdAt) / (1000 * 60));
        
        this.status = 'resolved';
        this.resolution = {
            summary,
            resolvedAt,
            resolutionTime
        };
        
        const timelineEntry = {
            action: 'resolved',
            performedBy: agentId,
            timestamp: new Date(),
            details: 'Session resolved'
        };
        
        this.timeline = [...this.timeline, timelineEntry];
        await this.save();
        return this;
    };

    SupportSession.prototype.escalate = async function(escalatedBy, escalatedTo, reason) {
        this.status = 'escalated';
        this.escalatedTo = escalatedTo;
        this.escalation = {
            reason,
            escalatedTo,
            escalatedBy,
            escalatedAt: new Date()
        };
        
        const timelineEntry = {
            action: 'escalated',
            performedBy: escalatedBy,
            timestamp: new Date(),
            details: `Session escalated: ${reason}`
        };
        
        this.timeline = [...this.timeline, timelineEntry];
        await this.save();
        return this;
    };

    SupportSession.prototype.rate = async function(customerId, score, feedback = '') {
        this.rating = {
            score,
            feedback,
            ratedAt: new Date()
        };
        
        await this.save();
        return this;
    };

    SupportSession.prototype.getDuration = function() {
        if (this.resolution.resolvedAt) {
            return Math.floor((new Date(this.resolution.resolvedAt) - this.createdAt) / (1000 * 60));
        }
        return null;
    };

    SupportSession.prototype.getUnreadMessagesCount = function() {
        return this.messages.filter(msg => !msg.isRead).length;
    };

    // Class methods
    SupportSession.associate = function(models) {
        // A support session belongs to a customer
        SupportSession.belongsTo(models.User, {
            foreignKey: 'customerId',
            as: 'customer'
        });

        // A support session belongs to an agent
        SupportSession.belongsTo(models.User, {
            foreignKey: 'agentId',
            as: 'agent'
        });

        // A support session belongs to a team
        SupportSession.belongsTo(models.Team, {
            foreignKey: 'teamId',
            as: 'team'
        });

        // A support session can be escalated to another team
        SupportSession.belongsTo(models.Team, {
            foreignKey: 'escalatedTo',
            as: 'escalatedTeam'
        });
    };

    // Hooks
    SupportSession.addHook('beforeSave', (session, options) => {
        // Add initial timeline entry for new sessions
        if (session.isNewRecord) {
            session.timeline = [{
                action: 'created',
                performedBy: session.customerId,
                timestamp: new Date(),
                details: 'Support session created'
            }];
        }
    });

    return SupportSession;
};

export default defineSupportSession;
