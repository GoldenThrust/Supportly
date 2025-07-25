import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'support_agent', 'customer'],
        default: 'customer'
    },
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    teamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' }
    }
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ teamId: 1 });
userSchema.index({ role: 1 });

// Virtual for user's full name
userSchema.virtual('displayName').get(function() {
    return this.name;
});

// Method to check if user is support agent or admin
userSchema.methods.canProvideSupport = function() {
    return ['admin', 'support_agent'].includes(this.role);
};

// Method to get user without sensitive data
userSchema.methods.toSafeObject = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = model('User', userSchema);

export default User;
