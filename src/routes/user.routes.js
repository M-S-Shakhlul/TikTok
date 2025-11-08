import express from "express";
import {
    createUser,
    getAllUsers,
    getUserProfile,
    updateUserProfile,
    deleteUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserProfile);
router.patch("/:id", authenticate, uploadAvatar, updateUserProfile);
// delete user (authenticated). Controller enforces self-or-admin.
router.delete("/:id", authenticate, deleteUser);

export default router;