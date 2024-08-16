import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { AuthRequest } from "../utils/utils";
import User from "../users/userModel";
import Player from "../players/playerModel";
import { TransactionService } from "./transactionService";
import mongoose from "mongoose";
import Transaction from "./transactionModel";
import Agent from "../agents/agentModel";

class TransactionController {
  async transaction(req: Request, res: Response, next: NextFunction) {
    const { reciever: receiverId, amount, type } = req.body;

    try {
      if (!receiverId || !amount || amount <= 0)
        throw createHttpError(400, "Reciever or Amount is missing");
      const _req = req as AuthRequest;
      const { userId, role } = _req.user;
      const newObjectId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(
        userId
      );
      const agentId: mongoose.Schema.Types.ObjectId = new mongoose.Schema.ObjectId(
        userId
      );
      
      if (receiverId == userId) {
        throw createHttpError(500, "Can't Recharge or redeem Yourself");
      }
      const sender =
        (await User.findById({ _id: userId })) ||
        (await Player.findById({ _id: userId }));
      if (!sender) throw createHttpError(404, "User Not Found");
      const reciever =
        (await User.findById({ _id: receiverId })) ||
        (await Player.findById({ _id: receiverId }));
      if (!reciever) throw createHttpError(404, "Reciever does not exist");
      if(role==="agent"){
       if(reciever?.createdBy!== agentId)
        throw createHttpError(404, "You Are Not Authorised")
      }
      const senderModelName =
        sender instanceof User
          ? "User"
          : sender instanceof Player
            ? "Player"
            : (() => {
              throw createHttpError(500, "Unknown sender model");
            })();
      const recieverModelName =
        reciever instanceof User
          ? "User"
          : reciever instanceof Player
            ? "Player"
            : (() => {
              throw createHttpError(500, "Unknown reciever model");
            })();

      
      await TransactionService.performTransaction(
        newObjectId,
        receiverId,
        sender,
        reciever,
        senderModelName,
        recieverModelName,
        type,
        amount,
        role
      );
      res.status(200).json({ message: "Transaction successful" });
    } catch (err) {
      console.log(err);

      next(err);
    }
  }

  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const allTransactions = await Transaction.find().select('+senderModel +receiverModel') 
      .populate({
        path: 'sender',
        select: '-password', 
      })
      .populate({
        path: 'receiver',
        select: '-password',
      });
      res.status(200).json({ message: "Success!", transactions: allTransactions })
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async getSpecificAgentTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      if (!agentId) throw createHttpError(400, "Agent Id not Found");
      const transactionsOfAgent = await Transaction.find({
        $or: [
          { sender: agentId },
          { receiver: agentId }
        ]
      }).select('+senderModel +receiverModel') 
      .populate({
        path: 'sender',
        select: '-password', 
      })
      .populate({
        path: 'receiver',
        select: '-password',
      });
      if (transactionsOfAgent.length === 0)
        res.status(404).json({ message: "No transactions found for this agent." });

      res.status(200).json({ message: "Success!", transactions: transactionsOfAgent });

    } catch (error) {
      next(error);
    }

  }


  async getAgentPlayerTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      console.log("hi");
      
      if (!agentId) throw createHttpError(400, "Agent Id not Found");
      const playersUnderAgent = await Agent.findById(agentId);
      if (!playersUnderAgent || playersUnderAgent?.players.length === 0)
        res.status(404).json({ message: 'No players found for this agent.' });
      const playerIds = playersUnderAgent.players.map(player => player);
      const transactions = await Transaction.find({
        $or: [
          { sender: { $in: playerIds } },
          { receiver: { $in: playerIds } }
        ]
      }).select('+senderModel +receiverModel') 
      .populate({
        path: 'sender',
        select: '-password', 
      })
      .populate({
        path: 'receiver',
        select: '-password',
      });
  
      const agentTransactions = await Transaction.find({
        $or: [
          { sender: agentId },
          { receiver: agentId }
        ]
      }).select('+senderModel +receiverModel')
        .populate({
          path: 'sender',
          select: '-password',
        })
        .populate({
          path: 'receiver',
          select: '-password',
        });
        const combinedTransactions = [...transactions, ...agentTransactions];
        if (combinedTransactions.length === 0)
          res.status(404).json({ message: 'No transactions for agent.' });

      res.status(200).json({ message: "Success", transactions: combinedTransactions });
    } catch (error) {
      console.log(error);
      next(error);

    }
  }

  async getSpecificPlayerTransactions(req:Request, res:Response, next:NextFunction){
    try {
      const {playerId} = req.params;
      if(!playerId) throw createHttpError(400, "Player Id not Found");
      const playerTransaction = await Transaction.find({receiver:playerId}).select('+senderModel +receiverModel') 
      .populate({
        path: 'sender',
        select: '-password', 
      })
      .populate({
        path: 'receiver',
        select: '-password',
      });
      if(playerTransaction.length === 0)
        res.status(404).json({ message:"No Transaction Found"});
      res.status(200).json({message:"Success!", transactions:playerTransaction});
    } catch (error) {
      next(error);
    }
  }

}

export default new TransactionController();

// import { Request, Response, NextFunction } from "express";
// import { Player, User } from "../usersTest/userModel";
// import Transaction from "./transactionModel";
// import createHttpError from "http-errors";
// import mongoose from "mongoose";
// import { AuthRequest } from "../utils/utils";
// import { IPlayer, IUser } from "../usersTest/userType";
// import { ITransaction } from "./transactionType";
// import TransactionService from "./transactionService";
// import { QueryParams } from "../utils/utils";

// export class TransactionController {
//   private transactionService: TransactionService;

//   constructor() {
//     this.transactionService = new TransactionService();
//     this.getTransactions = this.getTransactions.bind(this);
//     this.getTransactionsBySubId = this.getTransactionsBySubId.bind(this);
//     this.deleteTransaction = this.deleteTransaction.bind(this);
//     this.getAllTransactions = this.getAllTransactions.bind(this);
//   }

//   async createTransaction(
//     type: string,
//     debtor: IUser | IPlayer,
//     creditor: IUser,
//     amount: number,
//     session: mongoose.ClientSession
//   ): Promise<ITransaction> {
//     try {
//       const transaction = await this.transactionService.createTransaction(
//         type,
//         debtor,
//         creditor,
//         amount,
//         session
//       );
//       return transaction;
//     } catch (error) {
//       console.error(`Error creating transaction: ${error.message}`);
//       throw error;
//     }
//   }

//   async getTransactions(req: Request, res: Response, next: NextFunction) {
//     try {
//       const _req = req as AuthRequest;
//       const { username, role } = _req.user;

//       const page = parseInt(req.query.page as string) || 1;
//       const limit = parseInt(req.query.limit as string) || 10;
//       const search = req.query.search as string;
//       let parsedData: QueryParams = {
//         role: "",
//         status: "",
//         totalRecharged: { From: 0, To: 0 },
//         totalRedeemed: { From: 0, To: 0 },
//         credits: { From: 0, To: 0 },
//         updatedAt: { From: new Date(), To: new Date() },
//         type: "",
//         amount: { From: 0, To: Infinity },
//       };
//       let type, updatedAt, amount;

//       if (search) {
//         parsedData = JSON.parse(search);
//         if (parsedData) {
//           type = parsedData.type;
//           updatedAt = parsedData.updatedAt;
//           amount = parsedData.amount;
//         }
//       }

//       let query: any = {};
//       if (type) {
//         query.type = type;
//       }
//       if (updatedAt) {
//         query.updatedAt = {
//           $gte: parsedData.updatedAt.From,
//           $lte: parsedData.updatedAt.To,
//         };
//       }

//       if (amount) {
//         query.amount = {
//           $gte: parsedData.amount.From,
//           $lte: parsedData.amount.To,
//         };
//       }

//       const {
//         transactions,
//         totalTransactions,
//         totalPages,
//         currentPage,
//         outOfRange,
//       } = await this.transactionService.getTransactions(
//         username,
//         page,
//         limit,
//         query
//       );

//       if (outOfRange) {
//         return res.status(400).json({
//           message: `Page number ${page} is out of range. There are only ${totalPages} pages available.`,
//           totalTransactions,
//           totalPages,
//           currentPage: page,
//           transactions: [],
//         });
//       }

//       res.status(200).json({
//         totalTransactions,
//         totalPages,
//         currentPage,
//         transactions,
//       });
//     } catch (error) {
//       console.error(`Error fetching transactions: ${error.message}`);
//       next(error);
//     }
//   }

//   async getTransactionsBySubId(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const _req = req as AuthRequest;
//       const { username, role } = _req.user;
//       const { subordinateId } = req.params;

//       const page = parseInt(req.query.page as string) || 1;
//       const limit = parseInt(req.query.limit as string) || 10;

//       const user = await User.findOne({ username });
//       const subordinate =
//         (await User.findOne({ _id: subordinateId })) ||
//         (await Player.findOne({ _id: subordinateId }));

//       if (!user) {
//         throw createHttpError(404, "Unable to find logged in user");
//       }

//       if (!subordinate) {
//         throw createHttpError(404, "User not found");
//       }
//       let query: any = {};
//       if (
//         user.role === "superadmin" ||
//         user.subordinates.includes(new mongoose.Types.ObjectId(subordinateId))
//       ) {
//         const {
//           transactions,
//           totalTransactions,
//           totalPages,
//           currentPage,
//           outOfRange,
//         } = await this.transactionService.getTransactions(
//           subordinate.username,
//           page,
//           limit,
//           query
//         );

//         if (outOfRange) {
//           return res.status(400).json({
//             message: `Page number ${page} is out of range. There are only ${totalPages} pages available.`,
//             totalTransactions,
//             totalPages,
//             currentPage: page,
//             transactions: [],
//           });
//         }

//         res.status(200).json({
//           totalTransactions,
//           totalPages,
//           currentPage,
//           transactions,
//         });
//       } else {
//         throw createHttpError(
//           403,
//           "Forbidden: You do not have the necessary permissions to access this resource."
//         );
//       }
//     } catch (error) {
//       console.error(
//         `Error fetching transactions by client ID: ${error.message}`
//       );
//       next(error);
//     }
//   }

//   async getAllTransactions(req: Request, res: Response, next: NextFunction) {
//     try {
//       const _req = req as AuthRequest;
//       const { username, role } = _req.user;

//       if (role != "superadmin") {
//         throw createHttpError(
//           403,
//           "Access denied. Only users with the role 'superadmin' can access this resource."
//         );
//       }

//       const page = parseInt(req.query.page as string) || 1;
//       const limit = parseInt(req.query.limit as string) || 10;
//       const search = req.query.search as string;
//       let parsedData: QueryParams = {
//         role: "",
//         status: "",
//         totalRecharged: { From: 0, To: 0 },
//         totalRedeemed: { From: 0, To: 0 },
//         credits: { From: 0, To: 0 },
//         updatedAt: { From: new Date(), To: new Date() },
//         type: "",
//         amount: { From: 0, To: Infinity },
//       };
//       let type, updatedAt, amount;

//       if (search) {
//         parsedData = JSON.parse(search);
//         if (parsedData) {
//           type = parsedData.type;
//           updatedAt = parsedData.updatedAt;
//           amount = parsedData.amount;
//         }
//       }

//       let query: any = {};
//       if (type) {
//         query.type = type;
//       }
//       if (updatedAt) {
//         query.updatedAt = {
//           $gte: parsedData.updatedAt.From,
//           $lte: parsedData.updatedAt.To,
//         };
//       }

//       if (amount) {
//         query.amount = {
//           $gte: parsedData.amount.From,
//           $lte: parsedData.amount.To,
//         };
//       }

//       const skip = (page - 1) * limit;

//       const totalTransactions = await Transaction.countDocuments(query);
//       const totalPages = Math.ceil(totalTransactions / limit);

//       // Check if the requested page is out of range
//       if (page > totalPages) {
//         return res.status(400).json({
//           message: `Page number ${page} is out of range. There are only ${totalPages} pages available.`,
//           totalTransactions,
//           totalPages,
//           currentPage: page,
//           transactions: [],
//         });
//       }

//       const transactions = await Transaction.find(query)
//         .skip(skip)
//         .limit(limit);

//       res.status(200).json({
//         totalTransactions,
//         totalPages,
//         currentPage: page,
//         transactions,
//       });
//     } catch (error) {
//       console.error(
//         `Error fetching transactions by client ID: ${error.message}`
//       );
//       next(error);
//     }
//   }

//   async deleteTransaction(req: Request, res: Response, next: NextFunction) {
//     const { id } = req.params;
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     try {
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         throw createHttpError(400, "Invalid transaction ID");
//       }

//       const deletedTransaction =
//         await this.transactionService.deleteTransaction(id, session);
//       if (deletedTransaction instanceof mongoose.Query) {
//         const result = await deletedTransaction.lean().exec();
//         if (!result) {
//           throw createHttpError(404, "Transaction not found");
//         }
//         res.status(200).json({ message: "Transaction deleted successfully" });
//       } else {
//         if (!deletedTransaction) {
//           throw createHttpError(404, "Transaction not found");
//         }
//         res.status(200).json({ message: "Transaction deleted successfully" });
//       }
//     } catch (error) {
//       await session.abortTransaction();
//       session.endSession();
//       console.error(`Error deleting transaction: ${error.message}`);
//       next(error);
//     }
//   }
// }