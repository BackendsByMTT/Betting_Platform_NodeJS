import { NextFunction, Request, Response } from "express";
import User from "./userModel";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Player from "../players/playerModel";
import { config } from "../config/config";
import { AuthRequest } from "../utils/utils";

class UserController {
  static saltRounds: Number = 10;


  async login(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;
    if (!username || !password) {
      throw createHttpError(400, "Username, password are required");
    }
    try {
      const user =
        (await User.findOne({ username })) ||
        (await Player.findOne({ username }));

      if (!user) {
        throw createHttpError(401, "User not found");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw createHttpError(401, "Invalid password");
      }

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { userId: user._id, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: "24h" }
      );
      res.cookie("userToken", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "none",
      });

      res.status(200).json({
        message: "Login successful",
        token: token,
        role: user.role,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    const _req = req as AuthRequest;
    const { userId, role } = _req.user;
    if (!userId) throw createHttpError(400, "Invalid Request, Missing User");
    try {
      const user =
        (await User.findById({ _id: userId })) ||
        (await Player.findById({ _id: userId }));
      if (!user) throw createHttpError(404, "User not found");
      res.status(200).json(user);
    } catch (err) {
      next(err);

    }
  }
}

export default new UserController();