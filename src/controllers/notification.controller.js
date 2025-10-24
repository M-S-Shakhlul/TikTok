import mongoose from 'mongoose';
import Notification from "../models/notification.model.js";

export const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .populate("senderId", "name email")
      .populate("relatedPost", "title");
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
  const rawId = (req.params.id || '').toString().trim();
  const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid notification id' });
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const result = await Notification.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
