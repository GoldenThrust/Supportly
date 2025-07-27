import Queue from 'bull';
import mailService from './config/mailservice.js';
import logger from './config/logger.js';

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

        logger.info(`Processing email notification for session ${sessionId}`);

        // Send notification to customer using dedicated method
        await mailService.sendCustomerSessionReminder({
            customerName,
            customerEmail,
            agentName,
            sessionId,
            sessionDate,
            subject,
            description,
            category,
            meetingLink
        });

        // Send notification to agent using dedicated method
        await mailService.sendAgentSessionReminder({
            customerName,
            agentName,
            agentEmail,
            sessionId,
            sessionDate,
            subject,
            description,
            category,
            meetingLink
        });

        console.log(`Email notifications sent successfully for session ${sessionId}`);
    } catch (error) {
        console.error('Error processing email notification:', error);
        throw error; // This will trigger retry mechanism
    }
});

// Process agent assignment notifications
SessionQueue.process('agent-assignment-notification', async (job) => {
    try {
        const sessionData = job.data;
        
        logger.info(`Processing agent assignment notification for session ${sessionData.sessionId}`);

        // Send notification to the assigned agent
        await mailService.sendAgentAssignmentNotification({
            agentName: sessionData.agentName,
            agentEmail: sessionData.agentEmail,
            customerName: sessionData.customerName,
            sessionId: sessionData.sessionId,
            subject: sessionData.subject,
            category: sessionData.category,
            description: sessionData.description,
            sessionDate: sessionData.sessionDate,
            meetingLink: sessionData.meetingLink
        });

        // Send update notification to the customer
        await mailService.sendCustomerAgentAssignmentUpdate({
            customerName: sessionData.customerName,
            customerEmail: sessionData.customerEmail,
            agentName: sessionData.agentName,
            sessionId: sessionData.sessionId,
            subject: sessionData.subject,
            category: sessionData.category,
            description: sessionData.description,
            sessionDate: sessionData.sessionDate,
            meetingLink: sessionData.meetingLink
        });

        console.log(`Agent assignment notifications sent successfully for session ${sessionData.sessionId}`);
    } catch (error) {
        console.error('Error processing agent assignment notification:', error);
        throw error;
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