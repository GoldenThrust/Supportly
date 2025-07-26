import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    department: {
        type: String,
        enum: ['technical', 'billing', 'general', 'sales', 'escalation'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxConcurrentSessions: {
        type: Number,
        default: 10,
        min: 1
    },
    numberofCurrentSessions: {
        type: Number,
        default: 0,
        min: 0
    },
    workingHours: {
        start: { type: String, default: '09:00' }, // 24h format
        end: { type: String, default: '17:00' },
        timezone: { type: String, default: 'UTC' },
        workingDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }]
    },
    skillTags: [{
        type: String,
        trim: true
    }],
    leaderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    members: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    statistics: {
        totalSessions: { type: Number, default: 0 },
        averageResolutionTime: { type: Number, default: 0 }, // in minutes
        customerSatisfactionScore: { type: Number, default: 0, min: 0, max: 5 }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
teamSchema.index({ department: 1 });
teamSchema.index({ isActive: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ leaderId: 1 });

// Virtual to get active members count
teamSchema.virtual('activeMembersCount').get(function () {
    return this.members.filter(member => member.isActive).length;
});

// Method to check if team is available based on working hours
teamSchema.methods.isAvailable = function (currentTime = new Date()) {
    if (!this.isActive) return false;

    const now = new Date(currentTime);
    const dayName = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();

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

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes && this.numberofCurrentSessions < this.maxConcurrentSessions;
};

// Method to add a member to the team
teamSchema.methods.addMember = function (userId) {
    const existingMember = this.members.find(member =>
        member.userId.toString() === userId.toString()
    );

    if (existingMember) {
        existingMember.isActive = true;
        return this.save();
    }

    this.members.push({ userId });
    return this.save();
};

// Method to remove a member from the team
teamSchema.methods.removeMember = function (userId) {
    const member = this.members.find(member =>
        member.userId.toString() === userId.toString()
    );

    if (member) {
        member.isActive = false;
    }

    return this.save();
};


const Team = model('Team', teamSchema);

export default Team;
