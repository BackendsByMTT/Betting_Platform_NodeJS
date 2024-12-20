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
exports.checkBetsCommenceTime = checkBetsCommenceTime;
const redisclient_1 = require("../redisclient");
const mongoose_1 = __importDefault(require("mongoose"));
const betModel_1 = __importStar(require("../bets/betModel"));
const config_1 = require("../config/config");
const worker_threads_1 = require("worker_threads");
const storeController_1 = __importDefault(require("../store/storeController"));
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            mongoose_1.default.connection.on("connected", () => __awaiter(this, void 0, void 0, function* () {
                console.log("Connected to database successfully");
            }));
            mongoose_1.default.connection.on("error", (err) => {
                console.log("Error in connecting to database.", err);
            });
            yield mongoose_1.default.connect(config_1.config.databaseUrl);
        }
        catch (err) {
            console.error("Failed to connect to database.", err);
            process.exit(1);
        }
    });
}
function checkBetsCommenceTime() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date().getTime();
        const bets = yield redisclient_1.redisClient.zrangebyscore('waitingQueue', 0, now);
        for (const bet of bets) {
            const data = JSON.parse(bet);
            const commenceTime = data.commence_time;
            const betId = data.betId;
            if (now >= new Date(commenceTime).getTime()) {
                try {
                    const betDetail = yield betModel_1.BetDetail.findById(betId).lean();
                    const betParent = yield betModel_1.default.findById(betDetail.key).lean();
                    if (!betDetail || !betParent) {
                        console.log(`BetDetail or BetParent not found for betId: ${betId}, removing from queue`);
                        yield redisclient_1.redisClient.zrem('waitingQueue', bet);
                        continue;
                    }
                    const multi = redisclient_1.redisClient.multi();
                    multi.lpush('processingQueue', JSON.stringify(betDetail));
                    multi.zrem('waitingQueue', bet);
                    yield multi.exec();
                }
                catch (error) {
                    console.log(`Error processing bet with ID ${betId}:`, error);
                    yield redisclient_1.redisClient.zrem('waitingQueue', bet);
                }
            }
        }
    });
}
function getLatestOddsForAllEvents() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch globalEventRooms data from Redis
            const redisKey = 'globalEventRooms';
            const eventRoomsData = yield redisclient_1.redisClient.get(redisKey);
            if (!eventRoomsData) {
                console.log("No event rooms data found in Redis.");
                return;
            }
            // Parse the data from Redis into a Map<string, Set<string>>
            const eventRoomsMap = new Map(JSON.parse(eventRoomsData, (key, value) => {
                if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
                    return new Set(value);
                }
                return value;
            }));
            for (const [sportKey, eventIdsSet] of eventRoomsMap.entries()) {
                for (const eventId of eventIdsSet) {
                    console.log(eventId, "EVENT ID IN WAITING QUEUE");
                    const latestOdds = yield storeController_1.default.getEventOdds(sportKey, eventId);
                    const oddsUpdate = {
                        eventId,
                        latestOdds,
                    };
                    yield redisclient_1.redisClient.publish("live-update-odds", JSON.stringify(oddsUpdate));
                    console.log(`Published latest odds for event: ${eventId} on channel: live-update-odds`);
                }
            }
        }
        catch (error) {
            console.error("Error fetching latest odds:", error);
        }
    });
}
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                yield checkBetsCommenceTime();
                yield getLatestOddsForAllEvents();
            }
            catch (error) {
                console.log("Error in Waiting Queue Worker:", error);
            }
            yield new Promise((resolve) => setTimeout(resolve, 30000));
        }
    });
}
worker_threads_1.parentPort.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message === "start") {
        yield connectDB();
        yield startWorker();
    }
}));
