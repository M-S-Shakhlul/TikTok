import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);

export default router;
