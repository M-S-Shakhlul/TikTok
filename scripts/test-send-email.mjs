import dotenv from 'dotenv';
import sendEmail from '../src/utils/sendEmail.js';

dotenv.config();

(async () => {
    try {
        const res = await sendEmail({
            to: process.env.TEST_RECEIVER_EMAIL || 'recipient@example.com',
            subject: 'Test: verification email',
            template: 'verifyEmail.html',
            templateVars: { verify_link: 'https://example.com/verify?token=TEST_TOKEN' },
        });
        console.log('sendEmail test result:', { messageId: res.info && res.info.messageId, previewUrl: res.previewUrl });
        if (res.previewUrl) console.log('Open preview in browser to inspect the email.');
        process.exit(0);
    } catch (err) {
        console.error('sendEmail test failed:', err);
        process.exit(1);
    }
})();
