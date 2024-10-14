import mongoose, { Schema } from "mongoose";
import { IScores } from "./scoreTypes";

const ScoreSchema: Schema = new Schema({
    event_id: {
        type: String,
        required: true,
        unique: true, 
      },
      home_team: {
        type: String,
        required: true,
      },
      away_team: {
        type: String,
        required: true,
      },
      home_score: {
        type: Number,
        required: true,
      },
      away_score: {
        type: Number,
        required: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
    }, { timestamps: true });

    const Score = mongoose.model<IScores>("Score", ScoreSchema);
    export default Score;