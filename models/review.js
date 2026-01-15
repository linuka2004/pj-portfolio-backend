import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewID : {
      type : String, 
      required : true,
      unique : true   
    },
    fname : {
      type : String,
      required : true,
    },
    lname :  {
      type : String,
      required : true
    },
    email : {
      type : String,
      required : true
    },
    telephone : {
      type : String,
      required : true
    },
    message : {
      type : String,
      required : true
    }
  },
  { timestamps: true }
)

const Review = mongoose.model("Review",reviewSchema)

export default Review;