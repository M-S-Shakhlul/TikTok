import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const buildHtmlFromTemplate = (templateFile, vars = {}) => {
    const templatePath = path.join(__dirname, 'templates', templateFile);
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templatePath}`);
    }
    let html = fs.readFileSync(templatePath, 'utf-8');
    Object.entries(vars).forEach(([key, value]) => {
        html = html.split(`{{${key}}}`).join(value);
    });
    return html;
};

const createTransportFromEnv = async() => {
    // If SMTP creds are provided, try to use them first
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false // تعطيل التحقق من TLS للتطوير
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });

        try {
            await transporter.verify();
            console.log('sendEmail: SMTP transporter verified');
            return { transporter, from: process.env.EMAIL_FROM || process.env.EMAIL_USER, isTest: false };
        } catch (err) {
            console.error('sendEmail: SMTP verify failed:', err && err.message ? err.message : err);
            if (process.env.NODE_ENV === 'production') throw err;
            // otherwise fall through to Ethereal
        }
    }

    // Ethereal fallback for development/testing
    console.log('sendEmail: Creating Ethereal test account for local email preview');
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    return { transporter, from: process.env.EMAIL_FROM || testAccount.user, isTest: true, testAccount };
};

const sendEmail = async({ to, subject, template, templateVars }) => {
    try {
        const html = buildHtmlFromTemplate(template, templateVars || {});

        const { transporter, from, isTest } = await createTransportFromEnv();

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM_NAME ? `${process.env.EMAIL_FROM_NAME} <${from}>` : `"TikTok Clone" <${from}>`,
            to,
            subject,
            html,
        });

        let previewUrl = null;
        try {
            previewUrl = nodemailer.getTestMessageUrl(info) || null;
        } catch (e) {
            // ignore
        }

        if (isTest && previewUrl) {
            console.log('sendEmail: Message preview URL (Ethereal):', previewUrl);
        } else {
            console.log('sendEmail: Message sent, messageId=', info.messageId);
        }

        return { info, previewUrl };
    } catch (err) {
        console.error('sendEmail error:', err && (err.message || err));
        throw err;
    }
};

export default sendEmail;