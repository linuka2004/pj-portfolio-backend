// import Review from "../models/review.js";


// export function createReview(req, res) {
//   if (!req.body) {
//     return res.status(400).json({ message: "Request body missing" });
//   }

//   const review = new Review(req.body);

//   review.save()
//     .then(() => res.json({ message: "Review Sent Successfully" }))
//     .catch(err =>
//       res.status(500).json({ message: "Database error", error: err })
//     );
// }

import Review from "../models/review.js";
import { isAdmin } from "./userController.js";

/* ---------- CREATE REVIEW (PUBLIC) ---------- */
// export function createReview(req, res) {
//   if (!req.body || Object.keys(req.body).length === 0) {
//     return res.status(400).json({ message: "Request body missing" });
//   }

//   const review = new Review(req.body);

//   review.save()
//     .then(() => res.json({ message: "Review Sent Successfully" }))
//     .catch(err =>
//       res.status(500).json({ message: "Database error", error: err.message })
//     );
// }
export const createReview = async (req, res) => {
    try {
        // 1. Find the latest review to get the highest ID
        // Note: Use .sort({ _id: -1 }) or .sort({ createdAt: -1 }) 
        // to ensure you get the truly newest entry
        const latestReview = await Review.findOne().sort({ _id: -1 });

        let reviewID = "REW00001"; // Default for the very first review

        if (latestReview != null && latestReview.reviewID) {
            // latestReview.reviewID example: "REW00012"
            const latestIdString = latestReview.reviewID.replace("REW", ""); // "00012"
            const latestNumber = parseInt(latestIdString); // 12

            const newNumber = latestNumber + 1; // 13
            // padStart(5, "0") ensures it stays as "00013"
            const newNumberString = newNumber.toString().padStart(5, "0"); 

            reviewID = "REW" + newNumberString; // "REW00013"
        }

        // 2. Create the new review with the generated ID
        const newReview = new Review({
            reviewID: reviewID,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            telephone: req.body.telephone,
            message: req.body.message
        });

        // 3. Save to Database
        await newReview.save();

        return res.status(201).json({
            message: "Review submitted successfully",
            reviewID: reviewID
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error submitting review",
            error: error.message,
        });
    }
};

/* ---------- GET ALL REVIEWS ---------- */
export async function getAllReviews(req, res) {
  if (isAdmin(req)) {
    try {
      // .sort({ createdAt: -1 }) puts the most recent dates at the top
      const reviews = await Review.find().sort({ createdAt: -1 });
      
      res.json(reviews);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching reviews",
        error: error.message,
      });
    }
  } else {
    res.status(403).json({
      message: "Forbidden"
    });
  }
}

/* ---------- DELETE REVIEW BY ID ---------- */
export function deleteReview(req,res){
  if(!isAdmin(req)){
    res.status(403).json({
      message : "Only Admins can delete reviews"
    })
    return;
  }

  const reviewID = req.params.reviewID;

  Review.deleteOne({reviewID : reviewID}).then(
    ()=>{
      res.json({
        message : "Review deleted successfully"
      })
    }
  )
}
