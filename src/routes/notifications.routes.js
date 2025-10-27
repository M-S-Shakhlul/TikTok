import express from 'express';
import {
    createNotification,
    getUserNotifications,
    markAsRead,
    deleteNotification,
    removeNotificationByAction,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.post('/', createNotification);
router.get('/user/:userId', getUserNotifications);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.post('/remove', removeNotificationByAction);

export default router;