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

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            name,
            email,
            passwordHash,
            age,
            gender,
            isEmailVerified: false,
            emailVerificationToken: verificationToken
        });

        await newUser.save();

        const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
        const verifyLink = `${serverUrl}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(newUser.email)}`;

        try {
            await sendEmail({
                to: newUser.email,
                subject: 'Verify your email to join TikTok Clone',
                template: 'verifyEmail.html',
                templateVars: { verify_link: verifyLink },
            });
        } catch (emailErr) {
            console.error('sendEmail error during registration:', emailErr);
            // Do not fail registration if email sending fails. Client still gets success response.
        }

        res.status(201).json({
            message: 'Registered successfully. Please verify your email before login (check your inbox).',
            user: { id: newUser._id, name: newUser.name, email: newUser.email },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const verifyEmail = async(req, res) => {
    try {
        const { token, email } = req.query;
        if (!token || !email) {
            console.warn('Verification: missing token or email');
            return res.redirect(`${process.env.CLIENT_URL}/verify?status=invalid`);
        }
        const user = await User.findOne({ email });
        if (!user) {
            console.warn('Verification: user not found', email);
            return res.redirect(`${process.env.CLIENT_URL}/verify?status=notfound`);
        }
        if (user.isEmailVerified) {
            console.info('Verification: already verified', email);
            return res.redirect(`${process.env.CLIENT_URL}/verify?status=already`);
        }
        if (!user.emailVerificationToken) {
            console.warn('Verification: no token stored for user', email);
            return res.redirect(`${process.env.CLIENT_URL}/verify?status=invalid`);
        }
        if (user.emailVerificationToken !== token) {
            console.warn('Verification: token mismatch', token, user.emailVerificationToken);
            return res.redirect(`${process.env.CLIENT_URL}/verify?status=invalid`);
        }
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
        console.info('Verification: success', email);
        return res.redirect(`${process.env.CLIENT_URL}/verify?status=success`);
    } catch (err) {
        console.error('Verification error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/verify?status=error`);
    }
};

export const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.isEmailVerified) return res.status(403).json({ message: 'Please verify your email first' });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET, { expiresIn: '2h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, emtail: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};