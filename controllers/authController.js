import mailService from "../config/mailservice.js";
import { redis } from "../config/redis.js";
import { v4 as uuid } from 'uuid';
import User from "../model/User.js";
import { hash, verify } from 'argon2';


class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(403).json({ status: "ERROR", message: "Account not registered" });
            }

            if (!user.isActive) {
                return res.status(403).json({ status: "ERROR", message: "Account is not active" })
            }

            const isPasswordCorrect = await verify(user.password, password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ status: "ERROR", message: "Password is incorrect" })
            }

            res.clearCookie(COOKIE_NAME, {
                secure: true,
                sameSite: "none",
                httpOnly: true,
                domain,
                signed: true,
                path: "/",
            });

            const token = createToken(user, "7d");
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);

            res.cookie(COOKIE_NAME, token, {
                secure: true,
                sameSite: "none",
                httpOnly: true,
                path: "/",
                domain,
                expires,
                signed: true,
            });

            const { password: _, id, ...userDetails } = user;

            return res
                .status(200)
                .json({ status: "OK", message: { ...userDetails, token } });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: "ERROR", message: "Internal Server Error" });
        }
    }

    async register(req, res) {
        try {
            const { firstname, lastname, email, password } = req.body;
            const name = `${firstname} ${lastname}`.trim();

            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(403).json({ status: "ERROR", message: "User already registered" });
            }

            const hashedPassword = await hash(password);

            const user = { name, email, password: hashedPassword };
            const token = uuid();

            await redis.set(`activations-token:${token}`, JSON.stringify(user), 60 * 60 * 24); // Store for 24 hours

            try {
                await mailService.sendOTP(user, token)
            } catch (error) {
                console.error(error);
                return res.status(500).json({ status: "ERROR", message: "Failed to send activation link" });
            }

            return res
                .status(201)
                .json({ status: "OK", message: "We've sent an otp to your email. Please check your inbox to activate your account.", token });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: "ERROR", message: "Internal Server Error" });
        }
    }

    async logout(req, res) {
        try {
            const user = await User.findById(res.jwt.id);
            if (!user) {
                return res.status(401).send({ message: "Account not registered OR Token malfunctioned" });
            }

            if (user._id.toString() !== res.jwt.id) {
                return res.status(403).send("Permissions didn't match");
            }

            res.clearCookie(COOKIE_NAME, {
                secure: true,
                sameSite: "none",
                httpOnly: true,
                domain,
                signed: true,
                path: "/",
            });


            return res
                .status(200)
                .json({ status: "OK" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: "ERROR", message: "Internal Server Error" });
        }
    }

    async forgotPassword(req, res) {

    }

    async resetPassword(req, res) {

    }

    async verifyEmail(req, res) {
        try {
            const { token: authToken } = req.params;

            const userDetails = await redis.get(`activations-token:${authToken}`);

            if (!userDetails) {
                return res.status(401).json({ status: "ERROR", message: "Invalid or expired token" });
            }

            const user = await User.create(JSON.parse(userDetails));

            if (!user) {
                return res.status(500).json({ status: "ERROR", message: "User not found" });
            }


            res.clearCookie(COOKIE_NAME, {
                secure: true,
                sameSite: "none",
                httpOnly: true,
                domain,
                signed: true,
                path: "/",
            });

            const token = createToken(user, "7d");
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);

            res.cookie(COOKIE_NAME, token, {
                secure: true,
                sameSite: "none",
                httpOnly: true,
                path: "/",
                domain,
                expires,
                signed: true,
            });

            await redis.del(`activations-token:${authtoken}`);
            const { password, isActive, id, ...response } = user.toJSON();

            return res
                .status(200)
                .json({ status: "OK", message: response });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: "ERROR", message: 'Internal Server Error' });
        }
    }

    async resendVerification(req, res) {
        // Implement resend verification logic here
    }

    async getProfile(req, res) {

    }

    async updateProfile(req, res) {

    }
}

export default new AuthController();
