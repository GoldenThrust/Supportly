import jwt from 'jsonwebtoken';
import { COOKIE_NAME } from '../utils/constants.js';
import User from '../model/User.js';

export function createToken(user, expiresIn = '1h') {
    if (!user || !user.id) {
        throw new Error('Invalid user object');
    }

    const { _id, name, email, role, avatar, phone, preferences } = user;

    return jwt.sign({ _id, name, email, role, avatar, phone, preferences }, process.env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function authenticate(req, res, next) {
    const token = req.signedCookies[COOKIE_NAME];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
        if (req.path.includes('/api')) {
            return res.status(401).json({ message: 'Invalid token' });
        } else {
            return res.redirect('/login');
        }
    }

    const user = await User.findById(decoded._id);
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
}