// Auth controller
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const register = async(req, res) => {
    try {
        let { name, email, password, age, gender } = req.body;
        email = (email || '').toLowerCase().trim();

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const passwordHash = await bcrypt.hash(password, 12);

        // Generate initial refresh token
        const refreshToken = crypto.randomBytes(32).toString('hex');
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const newUser = new User({
            name,
            email,
            passwordHash,
            age,
            gender,
            refreshTokenHash,
            refreshTokenIssuedAt: new Date(),
        });

        await newUser.save();

        // Generate access token (15 min)
        const accessToken = jwt.sign({ id: newUser._id, role: newUser.role, email: newUser.email },
            process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        res.status(201).json({
            message: 'Registered successfully',
            user: { id: newUser._id, name: newUser.name, email: newUser.email },
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};



export const login = async(req, res) => {
    try {
        let { email, password } = req.body;
        email = (email || '').toLowerCase().trim();

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate access token (short-lived)
        const accessToken = jwt.sign({ id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        // Generate refresh token (random, long-lived)
        const refreshToken = crypto.randomBytes(32).toString('hex');
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Store hashed refresh token and issuance time
        user.refreshTokenHash = refreshTokenHash;
        user.refreshTokenIssuedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Refresh token endpoint - implements token rotation
export const refresh = async(req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

        // Hash the provided refresh token
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Find user with matching refresh token
        const user = await User.findOne({ refreshTokenHash });
        if (!user) {
            // Token not found or mismatch — possible token reuse attack
            console.warn('Refresh token reuse attempt detected');
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Generate new access token
        const accessToken = jwt.sign({ id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        // Generate new refresh token (token rotation)
        const newRefreshToken = crypto.randomBytes(32).toString('hex');
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

        // Update user with new refresh token (old one is invalidated)
        user.refreshTokenHash = newRefreshTokenHash;
        user.refreshTokenIssuedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Token refreshed successfully',
            accessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout endpoint - invalidate refresh token
export const logout = async(req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

        // Hash the provided refresh token
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Find and clear the refresh token
        const user = await User.findOne({ refreshTokenHash });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Clear refresh token
        user.refreshTokenHash = null;
        user.refreshTokenIssuedAt = null;
        await user.save();

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPassword = async(req, res) => {
    try {
        let { email } = req.body;
        email = (email || '').toLowerCase().trim();

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate random reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Set expire (15 minutes)
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request - TikTok Clone",
                template: "resetPassword.html",
                templateVars: {
                    reset_link: resetUrl,
                    username: user.name
                }
            });

            res.status(200).json({
                message: "Password reset email sent successfully",
                debug_link: resetUrl // Remove in production
            });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            console.error("Send reset email failed:", err);
            return res.status(500).json({
                message: "Email could not be sent",
                error: err.message
            });
        }
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({
            message: "Something went wrong",
            error: err.message
        });
    }
};

export const resetPassword = async(req, res) => {
    try {
        const { token, email, password } = req.body;

        if (!token || !email || !password) {
            return res.status(400).json({
                message: "Missing required fields: token, email, and password"
            });
        }

        // Get hashed token
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        // Set new password
        const salt = await bcrypt.genSalt(12);
        user.passwordHash = await bcrypt.hash(password, salt);

        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            message: "Password reset successful"
        });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({
            message: "Password reset failed",
            error: err.message
        });
    }
};