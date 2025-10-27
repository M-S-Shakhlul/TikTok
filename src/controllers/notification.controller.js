import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';

// Create notification (prevents self-notify and duplicates)
export const createNotification = async(req, res) => {
    try {
        const { userId, senderId, type, relatedPost, message } = req.body;
        if (!userId || !type) return res.status(400).json({ message: 'userId and type are required' });
        if (senderId && userId.toString() === senderId.toString()) return res.status(400).json({ message: "Can't notify yourself" });

        const existing = await Notification.findOne({ userId, senderId, type, relatedPost });
        if (existing) return res.status(200).json(existing);

        const notification = await Notification.create({ userId, senderId, type, relatedPost, message });
        return res.status(201).json(notification);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// Get notifications for a user
export const getUserNotifications = async(req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid user id' });

        const notifications = await Notification.find({ userId })
            .populate('senderId', 'name email avatarUrl')
            .populate('relatedPost', 'title')
            .sort({ createdAt: -1 });

        return res.json(notifications);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Mark notification as read
export const markAsRead = async(req, res) => {
    try {
        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(':') ? rawId.slice(1) : rawId;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid notification id' });

        const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        return res.json(notification);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// Delete notification by id
export const deleteNotification = async(req, res) => {
    try {
        const id = (req.params.id || '').toString().trim();
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid notification id' });

        const result = await Notification.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ message: 'Notification not found' });
        return res.json({ message: 'Notification deleted' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Remove notification matching an action (used on unlike/unfollow)
export const removeNotificationByAction = async(req, res) => {
    try {
        const { userId, senderId, type, relatedPost } = req.body;
        if (!userId || !type) return res.status(400).json({ message: 'userId and type are required' });

        const result = await Notification.findOneAndDelete({ userId, senderId, type, relatedPost });
        if (!result) return res.status(404).json({ message: 'Notification not found to delete' });
        return res.json({ message: 'Notification removed successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};