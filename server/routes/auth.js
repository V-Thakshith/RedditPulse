import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router=express.Router();

router.post("/signup",async(req,res)=>{
    try{
        const {name,email,password}=req.body;
        const existing=await User.findOne({email})
        if(existing){
            return res.status(400).json({error:"User already exists"})
        }
        const hashed= await bcrypt.hash(password,10);

        const user=await User.create({
            name,
            email,
            password:hashed,
        })
        res.json({message:"User created successfully"})
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
})

router.post("/login",async(req,res)=>{
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({error: "Invalid creds"})
        }
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400),json({error:"Invalid creds"})
        }

        const token=jwt.sign(
            {userId:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );

        res.json({
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        })
    }
    catch (err) {
    res.status(500).json({ error: err.message });
  }
})

export default router;