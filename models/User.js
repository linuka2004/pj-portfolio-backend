import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email : {
            type : String,
            required : true,
            unique : true
        },
        firstName : {
            type : String,
            required : true
        },
        lastName : {
            type : String,
            required : true
        },
        password : {
            type : String,
            required : true
        },
        role:{
            type : String,
            default : "admin"
        },
        isBlocked : {
            type : Boolean,
            default : false
        },
        isEmailVerified:{
            type : Boolean,
            default : false
        },
        image : {
            type : String,
            required : true,
            default : "/default.jpg"
        }
        /*invalidTries : {
            type : Number,
            default : 0
        }*/
    }
)

const User = mongoose.model("User", userSchema)

export default User

