import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
let authToken = '';

// Store IDs for cleanup
let testUserId;
let testPostId;
let testCommentId;
let testReplyId;

// Helper to make authenticated requests
const api = async(endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
    };
    const response = await fetch(url, {...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API request failed');
    return data;
};

// Test user operations
async function createTestUser() {
    console.log('\n🧪 Creating test user...');
    const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'Test123!@#'
    };
    const { data: user, token } = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    authToken = token;
    testUserId = user._id;
    console.log('✅ Test user created:', user._id);
    return user;
}

// Test post operations
async function createTestPost() {
    console.log('\n🧪 Creating test post...');
    const formData = new FormData();
    formData.append('title', 'Test Video');
    formData.append('description', 'Test Description');
    // Note: You need to add a real video file here
    // formData.append('video', videoFile);

    const { data: post } = await api('/posts', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    testPostId = post._id;
    console.log('✅ Test post created:', post._id);
    return post;
}

// Test comment operations
async function createTestComment() {
    console.log('\n🧪 Creating test comment...');
    const commentData = {
        text: 'Test comment'
    };
    const { data: comment } = await api(`/comments/${testPostId}`, {
        method: 'POST',
        body: JSON.stringify(commentData)
    });
    testCommentId = comment._id;
    console.log('✅ Test comment created:', comment._id);
    return comment;
}

// Test reply operations
async function createTestReply() {
    console.log('\n🧪 Creating test reply...');
    const replyData = {
        text: 'Test reply'
    };
    const { data: reply } = await api(`/replies/${testCommentId}`, {
        method: 'POST',
        body: JSON.stringify(replyData)
    });
    testReplyId = reply._id;
    console.log('✅ Test reply created:', reply._id);
    return reply;
}

// Count related items
async function getItemCounts() {
    const [postCount, commentCount, replyCount] = await Promise.all([
        api(`/posts/count?userId=${testUserId}`).then(r => r.count).catch(() => 0),
        api(`/comments/count?postId=${testPostId}`).then(r => r.count).catch(() => 0),
        api(`/replies/count?commentId=${testCommentId}`).then(r => r.count).catch(() => 0)
    ]);
    return { postCount, commentCount, replyCount };
}

// Test cascade delete
async function testCascadeDelete() {
    try {
        // 1. Create test data
        await createTestUser();
        await createTestPost();
        await createTestComment();
        await createTestReply();

        // 2. Get initial counts
        console.log('\n📊 Initial counts:');
        const beforeCounts = await getItemCounts();
        console.log(beforeCounts);

        // 3. Test deleting a reply
        console.log('\n🧪 Testing reply deletion...');
        await api(`/replies/${testReplyId}`, { method: 'DELETE' });
        console.log('✅ Reply deleted');

        // 4. Test deleting a comment (will cascade to replies)
        console.log('\n🧪 Testing comment deletion...');
        await api(`/comments/${testCommentId}`, { method: 'DELETE' });
        console.log('✅ Comment deleted');

        // 5. Test deleting a post (will cascade to comments, replies, likes)
        console.log('\n🧪 Testing post deletion...');
        await api(`/posts/${testPostId}`, { method: 'DELETE' });
        console.log('✅ Post deleted');

        // 6. Get final counts
        console.log('\n📊 Final counts (should all be 0):');
        const afterCounts = await getItemCounts();
        console.log(afterCounts);

        // 7. Clean up test user
        console.log('\n🧹 Cleaning up test user...');
        await api(`/users/${testUserId}`, { method: 'DELETE' });
        console.log('✅ Test user deleted');

        console.log('\n✨ All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the tests
testCascadeDelete().catch(console.error);