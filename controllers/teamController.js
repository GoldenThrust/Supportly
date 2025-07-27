
import Team from "../model/Team.js";

class TeamController {
    async fetchTeams(req, res) {
        try {
            const { role } = req.query;
            const teams = await Team.find(role ? { role } : {}).select('name email id'); // TODO: Don't use ID
            res.status(200).json(teams);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching teams', error: error.message });
        }
    };
}

export default new TeamController();