import createHttpError from "http-errors";
import UserModel from "../users/userModel";
import PlayerModel from "../players/playerModel";
import NotificationModel from "./notificationModel";


class NotificationService {
    async create(type: "alert" | "info" | "message", payload: any, recipientId: string) {
        try {
            const recipient = await UserModel.findById(recipientId) || await PlayerModel.findById(recipientId);

            if (!recipient) {
                throw createHttpError(401, "User not found");
            }

            const newNotification = new NotificationModel({
                type,
                payload,
                recipient: recipientId,
                viewed: false
            });

            await newNotification.save();
            return newNotification;
        } catch (error) {
            throw createHttpError(500, error.message);
        }
    }

    async get(recipientId: string) {
        try {
            const recipient = await PlayerModel.findById(recipientId) || UserModel.findById(recipientId);

            if (!recipient) {
                throw createHttpError(401, "User not found");
            }

            const notifications = await NotificationModel.find({ recipient: recipientId })
            return notifications;
        }
        catch (error) {
            console.error("Error fetching notifications:", error);
            throw createHttpError(500, "Error fetching notifications");
        }
    }

    async update(notificationId: string) {
        try {
            const notification = await NotificationModel.findById(notificationId);
            if (!notification) {
                throw createHttpError(404, "Notification not found");
            }
            notification.viewed = true;
            await notification.save();
        }
        catch (error) {
            console.error("Error marking notification as read:", error);
            throw createHttpError(500, "Error marking notification as viewed");
        }
    }
}

export default NotificationService