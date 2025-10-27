/*
  Test script for Notifications API
  Usage:
    NODE_OPTIONS=--experimental-fetch node scripts/test-notifications.mjs --server=http://localhost:5000 --userId=<recipientUserId> --senderId=<actorUserId> [--postId=<postId>]

  Notes:
  - Node 18+ has global fetch; if your Node version requires experimental fetch, run with `NODE_OPTIONS=--experimental-fetch`.
  - This script only tests the notifications endpoints; it doesn't create users/posts.
*/

import assert from 'assert';

const argv = Object.fromEntries(process.argv.slice(2).map((arg) => {
    const [k, v] = arg.split('=');
    return [k.replace(/^--/, ''), v || true];
}));

const SERVER = argv.server || process.env.SERVER_URL || 'http://localhost:5000';
const userId = argv.userId || process.env.TEST_NOTIFY_USERID;
const senderId = argv.senderId || process.env.TEST_NOTIFY_SENDERID;
const relatedPost = argv.postId || process.env.TEST_NOTIFY_POSTID || null;

if (!userId || !senderId) {
    console.error('Please provide --userId and --senderId (or set TEST_NOTIFY_USERID / TEST_NOTIFY_SENDERID env vars)');
    process.exit(1);
}

async function http(path, opts = {}) {
    const url = `${SERVER}${path}`;
    const res = await fetch(url, opts);
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
    return { status: res.status, body };
}

(async function run() {
    console.log('Server:', SERVER);
    console.log('Recipient userId:', userId);
    console.log('Sender senderId:', senderId);
    console.log('Related post:', relatedPost);

    // 1) create notification
    console.log('\n1) Creating notification...');
    const createRes = await http('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, senderId, type: 'like', relatedPost, message: 'Test like notification' }),
    });
    console.log('create status:', createRes.status);
    console.log('create body:', createRes.body);
    assert(createRes.status === 201 || createRes.status === 200, 'create should return 201 or 200');
    const created = createRes.body;

    // 2) list notifications for user
    console.log('\n2) Listing notifications for user...');
    const listRes = await http(`/api/notifications/user/${userId}`);
    console.log('list status:', listRes.status);
    console.log('list body (first 5):', Array.isArray(listRes.body) ? listRes.body.slice(0, 5) : listRes.body);
    assert(Array.isArray(listRes.body), 'list should return array');

    // 3) remove by action (simulate unlike/unfollow)
    console.log('\n3) Removing notification by action...');
    const removeRes = await http('/api/notifications/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, senderId, type: 'like', relatedPost }),
    });
    console.log('remove status:', removeRes.status);
    console.log('remove body:', removeRes.body);

    // 4) ensure deleted
    console.log('\n4) Verifying deletion by listing again...');
    const listRes2 = await http(`/api/notifications/user/${userId}`);
    const existsAfter = Array.isArray(listRes2.body) && listRes2.body.some(n => n._id === (created && created._id));
    console.log('existsAfter:', existsAfter);

    if (existsAfter) {
        console.error('Notification still exists after remove; you may need to adjust relatedPost or check server logs');
        process.exitCode = 2;
    } else {
        console.log('Notification successfully removed (or did not exist).');
    }

    console.log('\nDone.');
})();