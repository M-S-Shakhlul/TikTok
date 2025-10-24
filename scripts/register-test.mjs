import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const server = process.env.SERVER_URL || 'http://localhost:3000';
    const url = `${server}/api/auth/register`;
    const body = {
      name: 'Test User',
      email: `test+${Date.now()}@example.com`,
      password: 'password123',
      age: 25,
      gender: 'other'
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('register-test error:', err);
    process.exit(1);
  }
})();
