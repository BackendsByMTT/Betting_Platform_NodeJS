import mongoose from "mongoose";

export interface IScores extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  event_id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  completed: boolean;
}


