import SupportSession from "../model/SupportSession.js";

class SupportSessionController {
    async bookSession(req, res) {
        try {
            const { category, type, subject, description, tags } = req.body;

            new SupportSession({
                customerId: req.user,
                teamId: null,
                category,
                type,
                subject,
                description,
                tags
            });

            res.status(201).json({ message: 'Support session booked successfully', sessionDetails });
        } catch (error) {
            res.status(500).json({ message: 'Error booking support session', error: error.message });
        }
    }
}