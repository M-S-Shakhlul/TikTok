import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    type: { type: String, enum: ["follow", "like", "comment"], required: true },
    message: String, 
    read: { type: Boolean, default: false },
    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
