import { DataTypes } from 'sequelize';

const defineTeam = (sequelize) => {
    const Team = sequelize.define('Team', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [1, 255]
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: ''
        },
        department: {
            type: DataTypes.ENUM('technical', 'billing', 'general', 'sales', 'escalation'),
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        maxConcurrentSessions: {
            type: DataTypes.INTEGER,
            defaultValue: 10,
            validate: {
                min: 1
            }
        },
        workingHours: {
            type: DataTypes.JSON,
            defaultValue: {
                start: '09:00',
                end: '17:00',
                timezone: 'UTC',
                workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
        },
        skillTags: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        leaderId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        statistics: {
            type: DataTypes.JSON,
            defaultValue: {
                totalSessions: 0,
                averageResolutionTime: 0,
                customerSatisfactionScore: 0
            }
        }
    }, {
        tableName: 'teams',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['name']
            },
            {
                fields: ['department']
            },
            {
                fields: ['isActive']
            },
            {
                fields: ['leaderId']
            }
        ]
    });

    // Instance methods
    Team.prototype.isAvailable = function(currentTime = new Date()) {
        if (!this.isActive) return false;
        
        const now = new Date(currentTime);
        const dayName = now.toLocaleDateString('en', { weekday: 'lowercase' });
        
        // Check if current day is in working days
        if (!this.workingHours.workingDays.includes(dayName)) {
            return false;
        }
        
        // Check if current time is within working hours
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        
        const [startHour, startMinute] = this.workingHours.start.split(':').map(Number);
        const [endHour, endMinute] = this.workingHours.end.split(':').map(Number);
        
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        
        return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    };

    Team.prototype.getActiveMembersCount = async function() {
        const User = sequelize.models.User;
        const count = await User.count({
            where: {
                teamId: this.id,
                isActive: true
            }
        });
        return count;
    };

    // Class methods
    Team.associate = function(models) {
        // A team has many users
        Team.hasMany(models.User, {
            foreignKey: 'teamId',
            as: 'members'
        });

        // A team has a leader
        Team.belongsTo(models.User, {
            foreignKey: 'leaderId',
            as: 'leader'
        });

        // A team can have many support sessions
        Team.hasMany(models.SupportSession, {
            foreignKey: 'teamId',
            as: 'sessions'
        });

        // A team can receive escalated sessions
        Team.hasMany(models.SupportSession, {
            foreignKey: 'escalatedTo',
            as: 'escalatedSessions'
        });
    };

    return Team;
};

export default defineTeam;
