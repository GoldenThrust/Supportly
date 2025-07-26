import SupportSession from "../model/SupportSession.js";
import Team from "../model/Team.js";

class SupportSessionController {
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

            const team = activeTeams.find(team => team.isAvailable(formatDate));


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

            const { customerId: { name, email }, description: desc, sessionId } = sessionDetails;

            res.status(201).json({ message: 'Support session booked successfully', session: { id: sessionId, customer: { name, email }, description: desc } });
        } catch (error) {
            res.status(500).json({ message: 'Error booking support session', error: error.message });
        }
    }

    async fetchSession(req, res) {
        try {
            const sessionId = req.params.id;
            const session = await SupportSession.findById(sessionId).populate('customerId agentId teamId');
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

}

export default new SupportSessionController();