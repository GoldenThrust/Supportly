
import User from "../model/User.js";

class UserController {
    async fetchUsers(req, res) {
        try {
            const { role } = req.query;
            const users = await User.find(role ? { role } : {}).select('name email id'); // TODO: Don't use ID
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching teams', error: error.message });
        }
    };
}

export default new UserController();