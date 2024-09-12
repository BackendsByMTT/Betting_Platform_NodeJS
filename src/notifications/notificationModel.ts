import mongoose, { Schema } from "mongoose";
import INotification from "./notifcationType";

const notificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: ["alert", "info", "message"],
    required: true
  },
  payload: {
    type: Schema.Types.Mixed
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User" || "Player",
    required: true
  },
  viewed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Notification", notificationSchema);