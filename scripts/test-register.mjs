import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

(async () => {
    const email = `testuser+${Date.now()}@example.com`;
    const payload = {
        name: 'Test User',
        email,
        password: 'P@ssw0rd123',
        age: 25,
        gender: 'other'
    };

    try {
        const res = await fetch(process.env.SERVER_URL || 'http://localhost:3000' + '/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const body = await res.json();
        console.log('Status:', res.status);
        console.log('Body:', body);
    } catch (err) {
        console.error('Test register failed:', err);
        process.exit(1);
    }

    process.exit(0);
})();
