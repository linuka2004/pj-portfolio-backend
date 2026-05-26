import express from "express"
import mongoose from "mongoose"
import userRouter from "./routes/userRouter.js"
import jwt from "jsonwebtoken"
import productRouter from "./routes/productRouter.js"
import cors from "cors"
import dotenv from "dotenv"
import reviewRouter from "./routes/reviewRouter.js"

import User from "./models/User.js";
import bcrypt from "bcrypt";


dotenv.config()  // load the .env file contents

const mongoURI = process.env.MONGO_URL  // read the MONGO_URL value from .env file



mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB Cluster");
        // Ensure default admin user exists
        (async () => {
            const adminEmail = "linuka@gmail.com";
            const adminPassword = "linu123";
            const adminFirstName = "Admin";
            const adminLastName = "User";
            const adminRole = "admin";
            const adminImage = "/default.jpg";

            const existingAdmin = await User.findOne({ email: adminEmail });
            if (!existingAdmin) {
                const hashedPassword = bcrypt.hashSync(adminPassword, 10);
                await User.create({
                    email: adminEmail,
                    firstName: adminFirstName,
                    lastName: adminLastName,
                    password: hashedPassword,
                    role: adminRole,
                    isBlocked: false,
                    isEmailVerified: true,
                    image: adminImage
                });
                console.log("Default admin user created.");
            } else {
                console.log("Default admin user already exists.");
            }
        })();
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });


const app = express()

app.use(
    cors()   // allow all origins (websites
)

app.use(express.json())

app.use(
    (req,res,next)=>{
        
        const authorizationHeader = req.header("Authorization")

        if(authorizationHeader != null){
            const token = authorizationHeader.replace("Bearer ","")

            //console.log(token)

            jwt.verify(token, process.env.JWT_SECRET,
                (error,content)=>{
                    if(content == null){
                        console.log("invalid token")
                        res.json({
                            message:"Invalid token"
                        })
                        return
                    }else{
                        

                        req.user = content
                        
                        next()
                    }

                }
            )


        }else{
            next()
        }
        

    }
)

app.use ("/api/users",userRouter)
app.use("/api/products",productRouter)
app.use("/api/reviews",reviewRouter)


app.listen(5000 , 
    ()=>{
        console.log("server is running")
    }
)