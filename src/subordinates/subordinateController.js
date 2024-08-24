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
const bcrypt_1 = __importDefault(require("bcrypt"));
const utils_1 = require("../utils/utils");
const userModel_1 = __importDefault(require("../users/userModel"));
const playerModel_1 = __importDefault(require("../players/playerModel"));
class SubordinateController {
    //CREATE SUBORDINATE
    createSubordinate(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //INPUT
                const { username, password, role } = req.body;
                const sanitizedUsername = (0, utils_1.sanitizeInput)(username);
                const sanitizedPassword = (0, utils_1.sanitizeInput)(password);
                const sanitizedRole = (0, utils_1.sanitizeInput)(role);
                if (!sanitizedUsername || !sanitizedPassword || !sanitizedRole)
                    throw (0, http_errors_1.default)(400, "Username, password and role are required");
                //SUPERIOR USER OR CREATOR
                const _req = req;
                const { userId, role: requestingUserRole } = _req.user;
                const superior = yield userModel_1.default.findById(userId);
                if (!superior)
                    throw (0, http_errors_1.default)(401, "Unauthorized");
                // PERMISSION CHECK
                const hasPermissionToCreate = () => {
                    console.log(requestingUserRole);
                    const allowedRoles = utils_1.rolesHierarchy[requestingUserRole];
                    if (requestingUserRole === superior.role)
                        return allowedRoles.includes(sanitizedRole);
                    return false;
                };
                if (!hasPermissionToCreate())
                    throw (0, http_errors_1.default)(403, "YOU DON'T HAVE PERMISSION");
                //CREATE
                let existingSubordinate;
                if (sanitizedRole === "player") {
                    existingSubordinate = yield playerModel_1.default.findOne({ username: sanitizedUsername });
                }
                else {
                    existingSubordinate = yield userModel_1.default.findOne({ username: sanitizedUsername });
                }
                if (existingSubordinate) {
                    throw (0, http_errors_1.default)(400, "username already exists");
                }
                const hashedPassword = yield bcrypt_1.default.hash(sanitizedPassword, SubordinateController.saltRounds);
                let newSubordinate;
                if (sanitizedRole === "player") {
                    newSubordinate = new playerModel_1.default({
                        username: sanitizedUsername,
                        password: hashedPassword,
                        role: sanitizedRole,
                        createdBy: userId,
                    });
                }
                else {
                    newSubordinate = new userModel_1.default({
                        username: sanitizedUsername,
                        password: hashedPassword,
                        role: sanitizedRole,
                        createdBy: userId,
                    });
                }
                yield newSubordinate.save();
                if (sanitizedRole === "player") {
                    console.log("playet");
                    console.log();
                    superior.players.push(newSubordinate._id);
                }
                else {
                    superior.subordinates.push(newSubordinate._id);
                }
                yield superior.save();
                //RESPONSE
                res
                    .status(201)
                    .json({ message: `${role} Created Succesfully`, Subordinate: newSubordinate });
            }
            catch (error) {
                next(error);
            }
        });
    }
    //GET SPECIFC SUBORDINATE
    getSubordinate(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username } = req.params;
            try {
                const sanitizedUsername = (0, utils_1.sanitizeInput)(username);
                const subordinate = (yield userModel_1.default.findOne({ username: sanitizedUsername }).select('-transactions -password')) || (yield playerModel_1.default.findOne({ username: sanitizedUsername }).select('-betHistory -transactions -password'));
                if (!subordinate) {
                    throw (0, http_errors_1.default)(404, "User not found");
                }
                res.status(200).json(subordinate);
            }
            catch (error) {
                next(error);
            }
        });
    }
    //GET ALL SUBORDINATES  (ADMIN SPECIFC)
    getAllSubordinates(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type } = req.query;
                if (!SubordinateController.roles.includes(type)) {
                    throw (0, http_errors_1.default)(400, "Invalid role type");
                }
                const _req = req;
                const { userId } = _req.user;
                const admin = yield userModel_1.default.findById(userId);
                if (!admin)
                    throw (0, http_errors_1.default)(401, "You are Not Authorized");
                //GETTING USERS BASED ON QUERY
                let subordinates;
                if (type === "all") {
                    const user = yield userModel_1.default.find();
                    const player = yield playerModel_1.default.find();
                    subordinates = [...user, ...player];
                }
                else if (type === "player")
                    subordinates = yield playerModel_1.default.find();
                else
                    subordinates = yield userModel_1.default.find({
                        role: type
                    });
                res.status(200).json(subordinates);
            }
            catch (error) {
                next(error);
            }
        });
    }
    //UPDATE USER (SUBORDINATES)
    updateSubordinate(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password, status } = req.body;
            const { id } = req.params;
            try {
                //INPUT
                const sanitizedUsername = username ? (0, utils_1.sanitizeInput)(username) : undefined;
                const sanitizedPassword = password ? (0, utils_1.sanitizeInput)(password) : undefined;
                const sanitizedStatus = status ? (0, utils_1.sanitizeInput)(status) : undefined;
                const _req = req;
                const { userId, role } = _req.user;
                // PERMISSION CHECK
                const hasPermissionToUpadte = yield (0, utils_1.hasPermission)(userId, id, role);
                if (!hasPermissionToUpadte) {
                    throw (0, http_errors_1.default)(403, "You do not have permission to update this user.");
                }
                //UPDATE
                const updateData = Object.assign(Object.assign(Object.assign({}, (sanitizedUsername && { username: sanitizedUsername })), (sanitizedPassword && {
                    password: yield bcrypt_1.default.hash(sanitizedPassword, SubordinateController.saltRounds),
                })), (sanitizedStatus && { status: sanitizedStatus }));
                const updateSubordinate = yield userModel_1.default.findByIdAndUpdate(id, updateData, {
                    new: true,
                });
                if (!updateSubordinate) {
                    throw (0, http_errors_1.default)(404, "User not found");
                }
                res.status(200).json({
                    message: "User updated successfully",
                    agent: updateSubordinate,
                });
            }
            catch (error) {
                console.log(error);
                next(error);
            }
        });
    }
    //DELETE SUBORDINATE
    deleteSubordinate(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const _req = req;
                const { userId, role } = _req.user;
                const superior = yield userModel_1.default.findById(userId);
                if (!superior)
                    throw (0, http_errors_1.default)(401, "Unauthorized");
                //PERMISSION CHECK
                const hasPermissionToDelete = yield (0, utils_1.hasPermission)(userId, id, role);
                if (!hasPermissionToDelete)
                    throw (0, http_errors_1.default)(401, "You do not have permission to delete this user");
                //DELETE
                const deleteSubordinate = yield userModel_1.default.findByIdAndDelete(id);
                if (!deleteSubordinate)
                    throw (0, http_errors_1.default)(404, "Unable to Delete");
                //REMOVING SUBORDINATE REFERENCE FROM SUPERIOR
                superior.subordinates = superior.subordinates.filter((superiorId) => superiorId.toString() !== id);
                yield superior.save();
                res.status(200).json({ message: "User deleted successfully" });
            }
            catch (error) {
                next(error);
            }
        });
    }
    //GET SUBORDINATE UNDER SUPERIOR
    getSubordinatessUnderSuperior(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { superior } = req.params;
                const { type } = req.query;
                let superiorUser;
                // GETTING SUBORDINATE BASED ON QUERY TYPE(username, id)
                if (type === "id") {
                    superiorUser = yield userModel_1.default.findById(superior).populate({
                        path: 'subordinates',
                        select: '-password'
                    });
                    //PLAYERS FOR AGENT(AGENT HAS PLAYERS AS SUBORDINATE)
                    if (superiorUser.role === "agent") {
                        superiorUser = yield userModel_1.default.findById(superior).populate({
                            path: 'players',
                            select: '-password'
                        });
                    }
                    else if (superiorUser.role === "admin") {
                        superiorUser = yield userModel_1.default.findById(superior).populate({
                            path: 'subordinates players',
                            select: '-password'
                        });
                    }
                    if (!superiorUser)
                        throw (0, http_errors_1.default)(404, "User Not Found");
                }
                else if (type === "username") {
                    superiorUser = yield userModel_1.default.findOne({ username: superior }).populate({
                        path: 'subordinates',
                        select: '-password'
                    });
                    if (superiorUser.role === "agent") {
                        superiorUser = yield userModel_1.default.findOne({ username: superior }).populate({
                            path: 'players',
                            select: '-password'
                        });
                    }
                    else if (superiorUser.role === "admin") {
                        superiorUser = yield userModel_1.default.findOne({ username: superior }).populate({
                            path: 'subordinates players',
                            select: '-password'
                        });
                    }
                    if (!superiorUser)
                        throw (0, http_errors_1.default)(404, "User Not Found with the provided username");
                }
                else {
                    throw (0, http_errors_1.default)(400, "Usr Id or Username not provided");
                }
                // ACCESS SUBORDINATE DEPENDING ON ROLE
                let subordinates = superiorUser.role === "admin"
                    ? [
                        ...superiorUser.subordinates, ...superiorUser.players
                    ] : superiorUser.role === "agent" ? superiorUser.players : superiorUser.subordinates;
                return res.status(200).json(subordinates);
            }
            catch (error) {
                console.log(error);
                next(error);
            }
        });
    }
}
SubordinateController.saltRounds = 10;
SubordinateController.roles = Object.freeze([
    'all',
    'distributor',
    'subdistributor',
    'agent',
    'player'
]);
exports.default = new SubordinateController();