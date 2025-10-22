import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const sendEmail = async({ to, subject, template, templateVars }) => {
    try {
        const templatePath = path.join(__dirname, 'templates', template);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Email template not found: ${templatePath}`);
        }
        let html = fs.readFileSync(templatePath, 'utf-8');

        // Replace variables like {{verify_link}}
        Object.entries(templateVars || {}).forEach(([key, value]) => {
            html = html.replace(`{{${key}}}`, value);
        });

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465,
            secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                // Accept self-signed certs in development if explicitly allowed
                rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false'
            },
            // connection timeouts
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });

        // Verify transporter configuration (will throw if connection can't be established)
        try {
            await transporter.verify();
            console.log('sendEmail: SMTP transporter verified');
        } catch (verifyErr) {
            console.error('sendEmail: transporter.verify() failed', verifyErr);
            throw verifyErr;
        }

        try {
            const info = await transporter.sendMail({
                from: `"TikTok Clone" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
            });

        } catch (sendErr) {
            console.error('sendEmail: sendMail failed', sendErr);
            throw sendErr;
        }
    } catch (err) {
        console.error('sendEmail error:', err);
        throw err;
    }
};

export default sendEmail;