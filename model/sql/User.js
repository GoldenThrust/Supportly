import { DataTypes } from 'sequelize';

const defineUser = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255]
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [6, 255]
            }
        },
        role: {
            type: DataTypes.ENUM('admin', 'support_agent', 'customer'),
            allowNull: false,
            defaultValue: 'customer'
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        teamId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Teams',
                key: 'id'
            }
        },
        preferences: {
            type: DataTypes.JSON,
            defaultValue: {
                notifications: {
                    email: true,
                    push: true
                },
                language: 'en',
                timezone: 'UTC'
            }
        }
    }, {
        tableName: 'users',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['teamId']
            },
            {
                fields: ['role']
            },
            {
                fields: ['isActive']
            }
        ]
    });

    // Instance methods
    User.prototype.canProvideSupport = function() {
        return ['admin', 'support_agent'].includes(this.role);
    };

    User.prototype.toSafeObject = function() {
        const user = this.toJSON();
        delete user.password;
        return user;
    };

    // Class methods
    User.associate = function(models) {
        // A user belongs to a team
        User.belongsTo(models.Team, {
            foreignKey: 'teamId',
            as: 'team'
        });

        // A user can have many support sessions as customer
        User.hasMany(models.SupportSession, {
            foreignKey: 'customerId',
            as: 'customerSessions'
        });

        // A user can have many support sessions as agent
        User.hasMany(models.SupportSession, {
            foreignKey: 'agentId',
            as: 'agentSessions'
        });

        // A user can be a team leader
        User.hasMany(models.Team, {
            foreignKey: 'leaderId',
            as: 'ledTeams'
        });
    };

    return User;
};

export default defineUser;