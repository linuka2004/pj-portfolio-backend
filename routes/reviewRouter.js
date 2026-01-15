import express from "express";
import { createReview, deleteReview, getAllReviews } from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", createReview);
reviewRouter.get("/", getAllReviews);
reviewRouter.delete("/:reviewID", deleteReview);

export default reviewRouter;
