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
const http_errors_1 = __importDefault(require("http-errors"));
const scoreModel_1 = __importDefault(require("./scoreModel"));
class scoreContoller {
    //STEPS
    //-> get eventId from request params
    //->if no eventId in params throw error
    //->match and get eventId with event_id in scorecollection 
    //send response
    getEventScore(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { eventId } = req.params;
                if (!eventId)
                    throw (0, http_errors_1.default)(400, "eventId not found");
                const score = yield scoreModel_1.default.findOne({
                    event_id: eventId
                });
                res.status(200).json(score);
            }
            catch (error) {
                console.log(error);
                next(error);
            }
        });
    }
}
exports.default = new scoreContoller();
