"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeRooms = exports.users = void 0;
const socketMiddleware_1 = require("./socketMiddleware");
const playerSocket_1 = __importDefault(require("../players/playerSocket"));
exports.users = new Map();
exports.activeRooms = new Set();
const socketController = (io) => {
    // socket authentication middleware
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const decoded = yield (0, socketMiddleware_1.verifySocketToken)(socket);
            socket.decoded = decoded;
            next();
        }
        catch (error) {
            console.error("Authentication error:", error.message);
            socket.disconnect();
            next(error);
        }
    }));
    // Error handling middleware
    io.use((socket, next) => {
        socket.on("error", (err) => {
            console.error("Socket Error:", err);
            socket.disconnect(true);
        });
        next();
    });
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const decoded = socket.decoded;
        if (!decoded || !decoded.username || !decoded.role || !decoded.userId) {
            console.error("Connection rejected: missing required fields in token");
            socket.disconnect(true);
            return;
        }
        const username = decoded.username;
        const existingSocket = exports.users.get(username);
        if (existingSocket) {
            if (existingSocket.socket.connected) {
                socket.emit("AnotherDevice", "You are already playing on another browser.");
                socket.disconnect(true);
            }
            else {
                existingSocket.updateSocket(socket);
            }
        }
        else {
            const newUser = new playerSocket_1.default(socket, decoded.userId, username, decoded.credits, io);
            exports.users.set(username, newUser);
            console.log(`Player ${username} entered the platform.`);
        }
    }));
};
exports.default = socketController;
