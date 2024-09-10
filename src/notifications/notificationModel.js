"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const notificationSchema = new mongoose_1.Schema({
    initiatorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        refPath: "initiatorModel",
    },
    targetId: {
        type: mongoose_1.Schema.Types.ObjectId,
        //   required: true,
        refPath: "targetModel",
    },
    initiatorModel: {
        type: String,
        required: true,
        enum: ["User", "Player"],
    },
    targetModel: {
        type: String,
        required: true,
        enum: ["User", "Player"],
    },
    type: {
        type: String,
        enum: ["error", "success"],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    reference: {
        type: String,
        enum: ["bet", "transaction"],
        required: true,
    },
    referenceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "sent"],
        default: "pending",
    },
    action: {
        type: String,
        enum: ["refund"],
        required: true,
    },
}, {
    timestamps: true,
});
const Notification = mongoose_1.default.model("Notification", notificationSchema);
exports.default = Notification;