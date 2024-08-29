import mongoose from "mongoose";

export interface IBetDetail extends Document {
  _id: mongoose.Types.ObjectId;
  key: mongoose.Schema.Types.ObjectId;
  event_id: string;
  sport_title: string;
  sport_key: string;
  commence_time: Date;
  home_team: {
    name: string;
    odds: number;
  };
  away_team: {
    name: string;
    odds: number;
  };
  market: string;
  bet_on: "home_team" | "away_team";
  selected: string;
  oddsFormat: string;
  status: "won" | "lost" | "pending" | "locked" | "retry" | "redeem";
}

export interface IBet extends Document {
  player: mongoose.Schema.Types.ObjectId;
  data: mongoose.Schema.Types.ObjectId[];
  amount: number;
  possibleWinningAmount: number;
  status: "won" | "lost" | "pending" | "locked" | "retry" | "redeem";
  retryCount: number;
  betType: "single" | "combo";
}

export interface Bet {
  id: string;
  category: string;
}

export interface WorkerPoolOptions {
  workerCount: number;
}