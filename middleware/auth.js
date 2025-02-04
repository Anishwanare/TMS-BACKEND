import express from "express";
import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken"
import { userModel } from "../model/userModel.js";


export const isAuthenticated = catchAsyncError(async (req, res, next) => {
    try {
        const token = req.cookies.User_Token || req.cookies.Admin_Token || req.cookies.SuperAdmin_Token;
        if (!token) {
            return next(new ErrorHandler("Token is not available", 400))
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.user = await userModel.findById(decoded.id)
        next()
    } catch (error) {
        console.log("Error while isAuthenticated", error)
        next(new ErrorHandler('Token invalid or expired', 401))
    }
})

export const isAuthorized = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return next(new ErrorHandler("Authentication failed. Please login.", 401));
            }

            if (!roles.includes(req.user?.role)) {
                return next(new ErrorHandler("You are not authorized to perform this action", 403));
            }

            next();
        } catch (error) {
            console.error("Error in isAuthorized middleware:", error);
            next(new ErrorHandler("Token invalid or expired", 401));
        }
    };
};