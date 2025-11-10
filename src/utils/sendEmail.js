// import nodemailer from 'nodemailer';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(
//     import.meta.url);
// const __dirname = path.dirname(__filename);

// const buildHtmlFromTemplate = (templateFile, vars = {}) => {
//     const templatePath = path.join(__dirname, 'templates', templateFile);
//     if (!fs.existsSync(templatePath)) {
//         throw new Error(`Email template not found: ${templatePath}`);
//     }
//     let html = fs.readFileSync(templatePath, 'utf-8');
//     Object.entries(vars).forEach(([key, value]) => {
//         html = html.split(`{{${key}}}`).join(value);
//     });
//     return html;
// };

// const createTransportFromEnv = async() => {
//     // If SMTP creds are provided, try to use them first
//     if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//             tls: {
//                 rejectUnauthorized: false // تعطيل التحقق من TLS للتطوير
//             },
//             connectionTimeout: 10000,
//             greetingTimeout: 10000,
//             socketTimeout: 10000,
//         });

//         try {
//             await transporter.verify();
//             console.log('sendEmail: SMTP transporter verified');
//             return { transporter, from: process.env.EMAIL_FROM || process.env.EMAIL_USER, isTest: false };
//         } catch (err) {
//             console.error('sendEmail: SMTP verify failed:', err && err.message ? err.message : err);
//             if (process.env.NODE_ENV === 'production') throw err;
//             // otherwise fall through to Ethereal
//         }
//     }

//     // Ethereal fallback for development/testing
//     console.log('sendEmail: Creating Ethereal test account for local email preview');
//     const testAccount = await nodemailer.createTestAccount();
//     const transporter = nodemailer.createTransport({
//         host: testAccount.smtp.host,
//         port: testAccount.smtp.port,
//         secure: testAccount.smtp.secure,
//         auth: {
//             user: testAccount.user,
//             pass: testAccount.pass,
//         },
//     });
//     return { transporter, from: process.env.EMAIL_FROM || testAccount.user, isTest: true, testAccount };
// };

// const sendEmail = async({ to, subject, template, templateVars }) => {
//     try {
//         const html = buildHtmlFromTemplate(template, templateVars || {});

//         const { transporter, from, isTest } = await createTransportFromEnv();

//         const info = await transporter.sendMail({
//             from: process.env.EMAIL_FROM_NAME ? `${process.env.EMAIL_FROM_NAME} <${from}>` : `"TikTok Clone" <${from}>`,
//             to,
//             subject,
//             html,
//         });

//         let previewUrl = null;
//         try {
//             previewUrl = nodemailer.getTestMessageUrl(info) || null;
//         } catch (e) {
//             // ignore
//         }

//         if (isTest && previewUrl) {
//             console.log('sendEmail: Message preview URL (Ethereal):', previewUrl);
//         } else {
//             console.log('sendEmail: Message sent, messageId=', info.messageId);
//         }

//         return { info, previewUrl };
//     } catch (err) {
//         console.error('sendEmail error:', err && (err.message || err));
//         throw err;
//     }
// };

// export default sendEmail;
// sendEmail.js (No optional chaining at all)
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const buildHtmlFromTemplate = (templateFile, vars = {}) => {
    try {
        const templatePath = path.join(__dirname, 'templates', templateFile);

        if (!fs.existsSync(templatePath)) {
            console.error('⚠️ Template not found: ' + templatePath);
            return '<p>Template "' + templateFile + '" not found.</p>';
        }

        let html = fs.readFileSync(templatePath, 'utf-8');

        Object.entries(vars).forEach(([key, value]) => {
            const safeValue = value !== undefined && value !== null ? String(value) : '';
            html = html.split('{{' + key + '}}').join(safeValue);
        });

        return html;
    } catch (err) {
        console.error('❌ Error building email template:', (err && err.message) ? err.message : err);
        return '<p>Error loading email template</p>';
    }
};

const sendEmail = async({ to, subject, template, templateVars }) => {
    try {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
            console.error('❌ Missing SENDGRID_API_KEY in .env');
            return { success: false, error: 'SENDGRID_API_KEY not found' };
        }

        sgMail.setApiKey(apiKey.trim());

        const html = buildHtmlFromTemplate(template, templateVars || {});

        const msg = {
            to: to,
            from: (process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim() !== '') ? process.env.EMAIL_FROM.trim() : 'no-reply@tiktok-clone.com',
            subject: subject || 'No Subject',
            html: html,
        };

        const response = await sgMail.send(msg);
        console.log('✅ Email sent successfully to ' + to + ' [Status: ' + ((response && response[0] && response[0].statusCode) ? response[0].statusCode : 'unknown') + ']');

        return { success: true, status: (response && response[0] && response[0].statusCode) ? response[0].statusCode : 200 };
    } catch (error) {
        console.error('❌ sendEmail error:', (error && error.response && error.response.body) ? error.response.body : (error && error.message) ? error.message : error);
        return { success: false, error: (error && error.message) ? error.message : 'Unknown send error' };
    }
};

export default sendEmail;