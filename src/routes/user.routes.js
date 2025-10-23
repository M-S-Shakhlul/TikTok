import express from "express";
import {
  createUser,
  getAllUsers,
  getUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserProfile); 

export default router;
