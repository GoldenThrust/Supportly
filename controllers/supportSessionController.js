import mailService from "../services/mailservice.js";
import SupportSession from "../model/SupportSession.js";
import Team from "../model/Team.js";
import User from "../model/User.js";
import { clientUrl } from "../utils/constants.js";
import { SessionQueue } from "../worker.js";


class SupportSessionController {
    constructor() {
        this.updateSession = this.updateSession.bind(this);
    }
    async createSession(req, res) {
        try {
            const { category, subject, description, date, time } = req.body;

            const activeTeams = await Team.find({ isActive: true });
            const [hour, minute] = time.split(':').map(Number);

            const formatDate = new Date(date);
            formatDate.setHours(hour, minute, 0, 0);

            if (isNaN(formatDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }

            if (formatDate <= new Date()) {
                return res.status(400).json({ message: 'Invalid date and time' });
            }

            const team = activeTeams.find(team => {
                return team.isAvailable(formatDate)
            });


            if (!team) {
                return res.status(404).json({ message: 'No available team found for this time' });
            }


            const sessionDetails = new SupportSession({
                customerId: req.user,
                teamId: team,
                category,
                subject,
                description,
                date: formatDate,
            });

            team.numberofCurrentSessions += 1;
            await team.save();

            await sessionDetails.save();

            // Send confirmation email to customer
            try {
                await mailService.sendSessionConfirmation({
                    customerName: sessionDetails.customerId.name,
                    customerEmail: sessionDetails.customerId.email,
                    sessionId: sessionDetails.sessionId,
                    subject: sessionDetails.subject,
                    category: sessionDetails.category,
                    description: sessionDetails.description,
                    sessionDate: sessionDetails.date
                });
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
                // Don't fail the request if email fails
            }

            const { customerId: { name, email }, description: desc, sessionId } = sessionDetails;

            res.status(201).json({ message: 'Support session booked successfully', session: { id: sessionId, customer: { name, email }, description: desc } });
        } catch (error) {
            res.status(500).json({ message: 'Error booking support session', error: error.message });
        }
    }

    async fetchSession(req, res) {
        try {
            const sessionId = req.params.id;
            const session = await SupportSession.findOne({ sessionId }).populate('customerId agentId teamId');
            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }
            res.status(200).json({ session });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching session', error: error.message });
        }
    }

    async fetchSessions(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            // Get total count for pagination
            const totalSessions = await SupportSession.countDocuments();

            const sessions = await SupportSession.find()
                .populate('customerId agentId teamId')
                .sort({ createdAt: -1 }) // Sort by newest first
                .skip(skip)
                .limit(parseInt(limit));

            res.status(200).json({
                sessions,
                total: totalSessions,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSessions / limit),
                limit: parseInt(limit)
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching sessions', error: error.message });
        }
    }

    async updateSession(req, res) {
        try {
            const { sessionId } = req.params;
            const { status, priority, notes, email } = req.body;

            // Find the session
            const session = await SupportSession.findOne({ sessionId }).populate('customerId teamId');
            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            // If assigning an agent, validate the agent exists and is available
            if (email) {
                const agent = await User.findOne({ email });

                if (!agent) {
                    return res.status(404).json({ message: 'Agent not found' });
                }


                // Check if agent is part of a team or has appropriate role
                if (agent.role !== 'support_agent' && agent.role !== 'admin') {
                    return res.status(403).json({ message: 'User is not authorized to be assigned as agent' });
                }

                session.agentId = agent;

                // Auto-activate session when agent is assigned
                if (session.status === 'pending') {
                    session.status = 'active';
                }
            }

            // Update other fields if provided
            if (status && ['active', 'waiting', 'resolved', 'closed', 'escalated'].includes(status)) {
                session.status = status;
            }

            if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
                session.priority = priority;
            }

            if (notes) {
                session.notes = notes;
            }

            // Update the updatedAt timestamp
            session.updatedAt = new Date();

            await session.recordTimeline(req.user);

            // Populate the updated session for response
            const updatedSession = await SupportSession.findOne({ sessionId }).populate('customerId agentId teamId');


            // Schedule email notification 15 minutes before session if agent is assigned and session is active
            if (email && session.status === 'active' && session.date) {
                await this.scheduleEmailNotification(updatedSession);

                // Send immediate agent assignment notification using Bull queue
                try {
                    await SessionQueue.add('agent-assignment-notification', {
                        customerName: updatedSession.customerId.name,
                        customerEmail: updatedSession.customerId.email,
                        agentName: updatedSession.agentId.name,
                        agentEmail: updatedSession.agentId.email,
                        sessionId: updatedSession.sessionId,
                        subject: updatedSession.subject,
                        category: updatedSession.category,
                        description: updatedSession.description,
                        sessionDate: updatedSession.date,
                        meetingLink: updatedSession.meetingLink || `${clientUrl}/video-call/${updatedSession.sessionId}`
                    }, {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 2000
                        },
                        removeOnComplete: 10,
                        removeOnFail: 5
                    });

                    console.log(`Queued agent assignment notifications for session ${updatedSession.sessionId}`);
                } catch (emailError) {
                    console.error('Error queuing agent assignment notifications:', emailError);
                }
            }

            res.status(200).json({
                message: 'Session updated successfully',
                session: updatedSession
            });
        } catch (error) {
            res.status(500).json({ message: 'Error updating session', error: error.message });
        }
    }

    async assignAgent(req, res) {
        try {
            const { sessionId } = req.params;
            const { agentId } = req.body;

            if (!agentId) {
                return res.status(400).json({ message: 'Agent ID is required' });
            }

            // Find the session
            const session = await SupportSession.findOne({ sessionId }).populate('customerId teamId');
            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            // Validate the agent
            const agent = await User.findById(agentId);
            if (!agent) {
                return res.status(404).json({ message: 'Agent not found' });
            }

            if (agent.role !== 'agent' && agent.role !== 'admin') {
                return res.status(403).json({ message: 'User is not authorized to be assigned as agent' });
            }

            // Assign agent and activate session
            session.agentId = agentId;
            session.status = 'active';
            session.updatedAt = new Date();

            await session.save();

            // Populate the updated session
            const updatedSession = await SupportSession.findOne({ sessionId }).populate('customerId agentId teamId');

            // Schedule email notification
            await this.scheduleEmailNotification(updatedSession);

            // Send immediate agent assignment notification using Bull queue
            try {
                await SessionQueue.add('agent-assignment-notification', {
                    customerName: updatedSession.customerId.name,
                    customerEmail: updatedSession.customerId.email,
                    agentName: updatedSession.agentId.name,
                    agentEmail: updatedSession.agentId.email,
                    sessionId: updatedSession.sessionId,
                    subject: updatedSession.subject,
                    category: updatedSession.category,
                    description: updatedSession.description,
                    sessionDate: updatedSession.date,
                    meetingLink: updatedSession.meetingLink || `${clientUrl}/video-call/${updatedSession.sessionId}`
                }, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    },
                    removeOnComplete: 10,
                    removeOnFail: 5
                });

                console.log(`Queued agent assignment notifications for session ${updatedSession.sessionId}`);
            } catch (emailError) {
                console.error('Error queuing agent assignment notifications:', emailError);
            }

            res.status(200).json({
                message: 'Agent assigned successfully',
                session: updatedSession
            });
        } catch (error) {
            res.status(500).json({ message: 'Error assigning agent', error: error.message });
        }
    }

    async updateSessionStatus(req, res) {
        try {
            const { sessionId } = req.params;
            const { status } = req.body;

            if (!status || !['pending', 'active', 'waiting', 'resolved', 'closed', 'escalated'].includes(status)) {
                return res.status(400).json({ message: 'Valid status is required' });
            }

            const session = await SupportSession.findOne({ sessionId })
            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            session.status = status === 'pending' ? 'active' : status;
            session.updatedAt = new Date();

            await session.save();

            const updatedSession = await SupportSession.findOne({ sessionId }).populate('customerId agentId teamId'); //TODO: remove id

            res.status(200).json({
                message: 'Session status updated successfully',
                session: updatedSession
            });
        } catch (error) {
            res.status(500).json({ message: 'Error updating session status', error: error.message });
        }
    }

    async scheduleEmailNotification(session) {
        try {
            const sessionDate = new Date(session.date);
            const notificationTime = new Date(sessionDate.getTime() - (15 * 60 * 1000)); // 15 minutes before
            const now = new Date();

            // Only schedule if notification time is in the future
            if (notificationTime > now) {
                const delay = notificationTime.getTime() - now.getTime();

                // Add job to queue with delay for 15-minute reminder
                await SessionQueue.add('email-notification', {
                    sessionId: session.sessionId,
                    customerId: session.customerId._id,
                    customerName: session.customerId.name,
                    customerEmail: session.customerId.email,
                    agentId: session.agentId._id,
                    agentName: session.agentId.name,
                    agentEmail: session.agentId.email,
                    sessionDate: session.date,
                    subject: session.subject,
                    description: session.description,
                    category: session.category,
                    meetingLink: session.meetingLink || `${clientUrl}/video-call/${session.sessionId}`
                }, {
                    delay: delay,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    },
                    removeOnComplete: 10,
                    removeOnFail: 5
                });

                console.log(`Scheduled 15-minute reminder for session ${session.sessionId} at ${notificationTime}`);
            } else {
                console.log(`Session ${session.sessionId} is too close or in the past to schedule reminder`);
            }

        } catch (error) {
            console.error('Error scheduling email notification:', error);
        }
    }

}

export default new SupportSessionController();