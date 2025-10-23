// Moderation schema
import mongoose from "mongoose";

const moderationSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["approve", "reject", "flag"], required: true },
    reason: { type: String }, 
  },
  { timestamps: true }
);

export default mongoose.model("ModerationLog", moderationSchema);
