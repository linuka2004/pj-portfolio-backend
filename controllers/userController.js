import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";
import Otp from "../models/otp.js";


dotenv.config();

const transporter = nodemailer.createTransport({
	service: 'gmail',
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	auth: {
		user: 'pasanjayasinghe20@gmail.com',
		pass: process.env.GMAIL_APP_PASSWORD,
	}
})
//create user
export function createUser(req,res){

    const data = req.body

    const hashedPassword = bcrypt.hashSync(data.password, 10)

    const user = new User({
        email : data.email,
        firstName : data.firstName,
        lastName : data.lastName,
        password : hashedPassword,
    })

    user.save().then(
        ()=>{
            res.json({
                message: "User created successfully"
            })
        }
    )
}

export function loginUser(req, res) {
	const email = req.body.email;
	const password = req.body.password;



	User.find({ email: email }).then((users) => {
		if (users[0] == null) {
				res.status(404).json({
				message: "User not found",
				}
			);
			
		} else {
			const user = users[0];

		if(user.isBlocked){
			res.status(403).json({
				message : "Your account has been blocked. Please contact support."
			})
			return;
		}

			const isPasswordCorrect = bcrypt.compareSync(password, user.password);

			if (isPasswordCorrect) {
				const payload = {
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					isEmailVerified: user.isEmailVerified,
					image: user.image,
				};

				const token = jwt.sign(payload, process.env.JWT_SECRET, {
					expiresIn: "150h",
				});

				res.json({
					message: "Login successful",
					token: token,
          role:user.role,
				});
			} else {
				res.status(401).json({
					message: "Invalid password",
				});
			}
		}
	});
}
//below part has an error
// export function loginUser(req,res){

//     const email = req.body.email
//     const password = req.body.password

//     User.find({email : email}).then(
//         (users)=>{
//             if(users[0] == null){
//                 res.json({
//                     message: "User not found"
//                 })
//             }else{
//                 const user = users[0];
                
//                 /*if(user.invalidTries > 3){
//                     res.json({
//                         message: "Your account is temporarily locked due to multiple failed login attempts"
//                     });
//                     return;
//                 }*/

//                 const isPasswordCorrect = bcrypt.compareSync(password,user.password)


//                 if(isPasswordCorrect){

                    
//                 const payload = {
//                     email: user.email,
//                     firstName : user.firstName,
//                     lastName : user.lastName,
//                     role : user.role,
//                     isEmailVerified : user.isEmailVerified,
//                     image : user.image
//                 };

//                 const token = jwt.sign(payload,process.env.JWT_SECRET,{
//                     expiresIn: "150h"
//                 })

//                     res.json({
//                         message: "Login successful",
//                         token : token,
//                         role : user.role,
//                     })
//                 }else{
//                     /*User.updateOne({email:email},{
//                         invalidTries: user.invalidTries + 1
//                     }).then(()=>{
//                         res.json({
//                         message: "Invalid password",
//                     })})*/
//                    res.status(401).json({
//                     message : "Invalid password"
//                    })

                    
//                 }
//             }
//         }
//     )
// } 

export function isAdmin(req){
  if(req.user == null){
    return false;
  }
  if(req.user.role != "admin"){
    return false;
  }

  return true;
}

export function getUser(req,res){ //get user info 		
	if(req.user == null){
		res.status(401).json({
			message: "Unauthorized"
		})
		return;
	}
	res.json(req.user)
}

export async function googleLogin(req,res){   //login with google
    console.log(req.body.token)
		try{
			const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo",{ 
				headers : {
					Authorization : `Bearer ${req.body.token}`
				}
			})

			console.log(response.data)

			const user= await User.findOne({ email : response.data.email})
			if(user==null){
				const hashedPassword = bcrypt.hashSync(data.password, 10)

				const newUser = new User({
					email : response.data.email,
					firstName : response.data.given_name,
					lastName : response.data.family_name,
					isEmailVerified : response.data.email_verified,
					image : response.data.picture,
					password : "123", // this can't be found anywhere
				})
				await newUser.save();

				const payload = {
					email: newUser.email,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					role: newUser.role,
					isEmailVerified: true,
					image: newUser.image,
				};

				const token = jwt.sign(payload, process.env.JWT_SECRET, {
					expiresIn: "150h",
				});

				res.json({
					message: "Login successful",
					token: token,
          role:newUser.role,
				});


			}else{

				if(user.isBlocked){
					res.status(403).json({
						message : "Your account has been blocked. Please contact support."
					})
					return;	
				}
				const payload = {
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					isEmailVerified: user.isEmailVerified,
					image: user.image,
				};

				const token = jwt.sign(payload, process.env.JWT_SECRET, {
					expiresIn: "150h",
				});

				res.json({
					message: "Login successful",
					token: token,
          role:user.role,
				});
				
			}

		}catch(error){
			res.status(500).json({
				message : "Google login failed",
				error : error.message,
			})
		}
    
}

export async function validateOTPAndUpdatePassword(req,res){ //validate OTP and update password
	try{
	const otp = req.body.otp;
	const newPassword = req.body.newPassword;
	const email = req.body.email;	

	const otpRecord = await Otp.findOne({email : email, otp: otp}); //find otp document
	if(otpRecord == null){ //no matching otp found
		res.status(400).json({
			message: "Invalid OTP"
		})
		return;
	}

	await Otp.deleteMany({email : email}); //delete used otps

	const hashedPassword = bcrypt.hashSync(newPassword, 10); //hash new password

	await User.updateOne( //update user's password
		{email : email},
		{
			$set: { password : hashedPassword, isEmailVerified: true }
		}
	);
	res.json({
		message: "Password updated successfully"
	});
}catch(error){
	res.status(500).json({
		message: "Failed to update password",
		error: error.message,
	})
	return;
}
}

export async function sendOTP(req,res){ //send OTP to email for password reset

	try{
	const email = req.params.email;  //get email from url parameter 

	const user = await User.findOne({ //check if user with the email exists
		email: email
	})
	if(user == null){  //no user found
		res.status(404).json({
			message: "User not found"
		})
		return;
	}

	await Otp.deleteMany({ //delete existing OTPs for the email
		email: email
	})

	//generate 6 digit otp
	const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

	const otp = new Otp({ // create new otp document
		email: email,
		otp: otpCode
	})

	await otp.save();  //save otp to db

	const message = {  //send email using nodemailer
		from : "pasanjayasinghe20@gmail.com",
		to : email,
		subject : "Password Reset OTP",
		text : "Your OTP code is " + otpCode
	}

	transporter.sendMail(message, (err, info)=>{  //callback function after attempting to send email
		if(err){
			res.status(500).json({
				message: "Failed to send OTP",
				error: err.message,
			})
		}else{
			res.json({
				message: "OTP sent successfully",
			})
		}
	})
}catch(error){
	res.status(500).json({
		message: "Failed to send OTP",
		error: error.message,
	})
}
}

export async function getAllUsers(req, res) {
	if(!isAdmin(req)){
		res.status(401).json({
			message : "Unauthorized"
		})
		return
	}

	try{
		const users = await User.find()
		res.json(users)
	}catch(error){
		res.status(500).json({
			message : "Error fetching users",
			error : error.message
		})
	}
}

export async function updateUserStatus(req, res) {
	if (!isAdmin(req)) {
		res.status(401).json({
			message: "Unauthorized",
		});
		return;
	}

	const email = req.params.email;

	if(req.user.email === email){
		res.status(400).json({
			message : "Admin cannot change their own status"
		})
		return
	}

	const isBlocked = req.body.isBlocked;

	try {
		await User.updateOne(
			{ email: email },
			{ $set: { isBlocked: isBlocked } }
		);
		res.json({
			message: "User status updated successfully",
		});
	}
	catch (error) {
		res.status(500).json({
			message: "Error updating user status",
			error: error.message,
		});
	}
}