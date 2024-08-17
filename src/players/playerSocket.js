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
const playerModel_1 = __importDefault(require("./playerModel"));
const betController_1 = __importDefault(require("../bets/betController"));
const storeController_1 = __importDefault(require("../store/storeController"));
class Player {
    constructor(socket, userId, username, credits) {
        this.socket = socket;
        this.userId = userId;
        this.username = username;
        this.credits = credits;
        this.initializeHandlers();
        this.betHandler();
    }
    updateSocket(socket) {
        this.socket = socket;
        this.initializeHandlers();
        this.betHandler();
    }
    updateBalance(type, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const player = yield playerModel_1.default.findById(this.userId).exec();
                if (player) {
                    if (type === "credit") {
                        player.credits += amount;
                    }
                    else if (type === "debit") {
                        player.credits -= amount;
                        if (player.credits < 0) {
                            player.credits = 0; // Ensure credits do not go below zero
                        }
                    }
                    yield player.save();
                    this.credits = player.credits; // Update the local credits value
                    this.sendAlert({ credits: this.credits });
                }
                else {
                    console.error(`Player with ID ${this.userId} not found.`);
                }
            }
            catch (error) {
                console.error(`Error updating balance for player ${this.userId}:`, error);
            }
        });
    }
    sendMessage(message) {
        try {
            this.socket.emit("message", message);
        }
        catch (error) {
            console.error(`Error sending message for player ${this.userId}:`, error);
        }
    }
    sendError(message) {
        try {
            this.socket.emit("error", { message });
        }
        catch (error) {
            console.error(`Error sending error for player ${this.userId}:`, error);
        }
    }
    sendAlert(message) {
        try {
            this.socket.emit("alert", { message });
        }
        catch (error) {
            console.error(`Error sending alert for player ${this.userId}:`, error);
        }
    }
    sendData(data) {
        try {
            this.socket.emit("data", data);
        }
        catch (error) {
            console.error(`Error sending data for player ${this.userId}:`, error);
        }
    }
    initializeHandlers() {
        this.socket.on("data", (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const res = message;
                switch (res.action) {
                    case "INIT":
                        // Fetch initial data from Store
                        const sports = yield storeController_1.default.getCategories();
                        this.sendData({ type: "CATEGORIES", data: sports });
                        break;
                    case "CATEGORIES":
                        const categoriesData = yield storeController_1.default.getCategories();
                        this.sendData({
                            type: "CATEGORIES",
                            data: ["All", ...categoriesData],
                        });
                        break;
                    case "CATEGORY_SPORTS":
                        const categorySportsData = yield storeController_1.default.getCategorySports(res.payload);
                        this.sendData({
                            type: "CATEGORY_SPORTS",
                            data: categorySportsData,
                        });
                        break;
                    case "EVENTS":
                        const eventsData = yield storeController_1.default.getEvents(res.payload.sport, res.payload.dateFormat);
                        this.sendData({ type: "EVENTS", data: eventsData });
                        break;
                    case "SCORES":
                        const scoresData = yield storeController_1.default.getScores(res.payload.sport, res.payload.daysFrom, res.payload.dateFormat);
                        this.sendData({ scores: scoresData });
                        break;
                    case "ODDS":
                        console.log("ODDS : ", res);
                        const oddsData = yield storeController_1.default.getOdds(res.payload.sport, res.payload.markets, res.payload.regions, this);
                        this.sendData({ type: "ODDS", data: oddsData });
                        console.log("HERE");
                        break;
                    case "EVENT_ODDS":
                        const eventOddsData = yield storeController_1.default.getEventOdds(res.payload.sport, res.payload.eventId, res.payload.regions, res.payload.markets, res.payload.dateFormat, res.payload.oddsFormat);
                        this.sendData({ type: "EVENT_ODDS", data: eventOddsData });
                        break;
                    case "SPORTS":
                        const sportsData = yield storeController_1.default.getSports();
                        this.sendData({ sports: sportsData });
                        break;
                    default:
                        console.warn(`Unknown action: ${res.action}`);
                        this.sendError(`Unknown action: ${res.action}`);
                }
            }
            catch (error) {
                console.log(error);
                this.sendError("An error occurred while processing your request.");
            }
        }));
    }
    betHandler() {
        this.socket.on("bet", (message, callback) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { action, payload } = message;
                switch (action) {
                    case "PLACE":
                        try {
                            // Check if the payload is an array of bets
                            if (Array.isArray(payload)) {
                                for (const bet of payload) {
                                    try {
                                        const betRes = yield betController_1.default.placeBet(this, bet);
                                        console.log("BET RECEIVED AND PROCESSED: ", bet);
                                        if (betRes) {
                                            // Send success acknowledgment to the client after all bets are processed
                                            callback({
                                                status: "success",
                                                message: "Bet placed successfully.",
                                            });
                                        }
                                    }
                                    catch (error) {
                                        console.error("Error adding bet: ", error);
                                        // Send failure acknowledgment to the client for this particular bet
                                        callback({
                                            status: "error",
                                            message: `Failed to place bet: ${bet}.`,
                                        });
                                        return; // Optionally, stop processing further bets on error
                                    }
                                }
                            }
                            else {
                                // Handle single bet case (fallback if payload is not an array)
                                const betRes = yield betController_1.default.placeBet(this, payload);
                                console.log("BET RECEIVED AND PROCESSED: ", payload);
                                if (betRes) {
                                    callback({
                                        status: "success",
                                        message: "Bet placed successfully.",
                                    });
                                }
                            }
                        }
                        catch (error) {
                            console.error("Error processing bet array: ", error);
                            // Send failure acknowledgment to the client
                            callback({ status: "error", message: "Failed to place bet." });
                        }
                        break;
                    case "START":
                        // Handle "START" action if needed
                        break;
                    default:
                        console.log("UNKNOWN ACTION: ", payload);
                        // Send error acknowledgment for unknown actions
                        callback({ status: "error", message: "Unknown action." });
                }
            }
            catch (error) {
                console.error("Error processing bet event:", error);
                // Send failure acknowledgment to the client if an exception occurs
                callback({
                    status: "error",
                    message: "Server error processing the bet.",
                });
            }
        }));
    }
}
exports.default = Player;
// {
//     player: '66b4669df50c0da50679c821',
//     sport_title: 'CFL',
//     commence_time: '2024-08-16T01:00:00Z',
//     home_team: { name: 'Calgary Stampeders', odds: 1.66 },
//     away_team: { name: 'Ottawa Redblacks', odds: 2.26 },
//     market: 'h2h',
//     bet_on: 'home_team',
//     amount: '12',
//     status: 'pending',
//     sport: 'americanfootball_cfl',
//     eventId: '1927cc7c6702c485102eb689b64d72ea',
//     regions: 'us',
//     oddsFormat: 'decimal'
//   }
