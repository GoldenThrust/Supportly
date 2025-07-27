import Queue from 'bull';
import mailService from './config/mailservice.js';

const isDev = process.env.NODE_ENV === 'development';

export const SessionQueue = isDev ? new Queue('SessionQueue') : new Queue('SessionQueue', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

SessionQueue.process('email-notification', async (job) => {
    try {
        const { 
            sessionId, 
            customerId, 
            customerName, 
            customerEmail, 
            agentId, 
            agentName, 
            agentEmail, 
            sessionDate, 
            subject, 
            description, 
            category, 
            meetingLink 
        } = job.data;

        console.log(`Processing email notification for session ${sessionId}`);

        // Send notification to customer
        await mailService.sendSessionReminder({
            to: customerEmail,
            customerName,
            agentName,
            sessionDate,
            subject,
            description,
            category,
            meetingLink,
            type: 'customer'
        });

        // Send notification to agent
        await mailService.sendSessionReminder({
            to: agentEmail,
            customerName,
            agentName,
            sessionDate,
            subject,
            description,
            category,
            meetingLink,
            type: 'agent'
        });

        console.log(`Email notifications sent successfully for session ${sessionId}`);
    } catch (error) {
        console.error('Error processing email notification:', error);
        throw error; // This will trigger retry mechanism
    }
});

// Handle queue events
SessionQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

SessionQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed:`, error);
});

SessionQueue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled`);
});