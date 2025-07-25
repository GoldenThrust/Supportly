import jwt from 'jsonwebtoken';

export function createToken(user, expiresIn = '1h') {
    if (!user || !user.id) {
        throw new Error('Invalid user object');
    }

    return jwt.sign(user.toJSON(), process.env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

export function authenticate(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
}