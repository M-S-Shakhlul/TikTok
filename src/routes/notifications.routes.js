import express from "express";
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/", createNotification);

router.get("/user/:userId", getUserNotifications);

router.patch("/:id/read", markAsRead);

router.delete("/:id", deleteNotification);

export default router;
