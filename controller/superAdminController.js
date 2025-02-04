import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userModel } from "../model/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

export const register = catchAsyncError(async (req, res, next) => {
    try {
        const { profileImage } = req.files || {};

        // Validate profile image
        if (!profileImage || !profileImage.tempFilePath) {
            // console.log("Profile image is missing or not properly uploaded.");
            return next(new ErrorHandler("Profile Image is Required", 400));
        }

        const allowedFormats = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
        if (!allowedFormats.includes(profileImage.mimetype)) {
            return next(new ErrorHandler("Invalid image format for profile image", 400));
        }

        console.log("Uploaded files:", req.files);

        let { firstName, middleName, lastName, email, phone, password, role, managedAccounts, partyName } = req.body;

        // console.log("body", req.body)

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !password) {
            console.log(firstName, lastName, email, password, phone, role);
            return next(new ErrorHandler("Please fill all required fields", 400));
        }


        const validRoles = ["User", "Admin", "SuperAdmin"];
        if (!validRoles.includes(role)) {
            return next(new ErrorHandler("Invalid role specified", 400));
        }

        // manage account by superadmin and we are assigning that id to that admin

        if (role === "Admin") {
            const superAdmin = await userModel.findOne({ role: "SuperAdmin" })
            if (!superAdmin) {
                return next(new ErrorHandler("No SuperAdmin present", 400))
            }
            managedAccounts = superAdmin._id;

            if (!partyName) {
                return next(new ErrorHandler("Party Name is required for Admin", 400))
            }
        }

        //logic for SuperAdmin if more than one SuperAdmin not allowed
        if (role === "SuperAdmin") {
            const superAdmin = await userModel.findOne({ role: "SuperAdmin" });
            if (superAdmin) {
                return next(new ErrorHandler("Only one SuperAdmin is allowed", 400))
            }
        }

        // Check if the user already exists
        const existingUser = await userModel.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return next(new ErrorHandler("Email or phone number is already registered. Please login.", 400));
        }

        // Upload profile image to Cloudinary
        let cloudinaryResponse;
        try {
            cloudinaryResponse = await cloudinary.uploader.upload(profileImage.tempFilePath, {
                folder: "TMS",
            });

            if (!cloudinaryResponse || cloudinaryResponse.error) {
                throw new Error("Failed to upload profile image to Cloudinary");
            }
        } catch (uploadError) {
            console.error("Cloudinary error: ", uploadError);
            return next(new ErrorHandler("Failed to upload profile image", 500));
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Prepare user data
        const userData = {
            firstName,
            middleName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role,
            profileImage: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url,
            }, managedAccounts
        };

        // Save user to the database
        const user = await userModel.create(userData);

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_TOKEN_EXPIRES,
        });

        // const cookieName = role === "Admin" ? "Admin_Token" : role === "SuperAdmin" ? "SuperAdmin_Token" : "User_Token";
        // Set token in a cookie
        res.status(201)
            // .cookie(cookieName, token, {
            //     expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            //     httpOnly: true,
            // })
            .json({
                success: true,
                message: "Account Created Successfully",
                user
            });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export const login = catchAsyncError(async (req, res, next) => {
    try {
        const { phone, password } = req.body;


        if (!phone || !password) {
            return next(new ErrorHandler("Please provide phone number and password", 400));
        }

        const user = await userModel.findOne({ phone });
        if (!user) {
            return next(new ErrorHandler("Invalid phone number or password", 401));
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid phone number or password", 401));
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_TOKEN_EXPIRES,
        });

        const cookieName = user.role === "Admin" ? "Admin_Token" : user.role === "SuperAdmin" ? "SuperAdmin_Token" : "User_Token";

        res.status(200)
            .cookie(cookieName, token, {
                expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
                httpOnly: true,
            })
            .json({
                success: true,
                message: `Logged in successfully`,
                user
            });
    } catch (error) {
        console.log("Login Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
})


export const fetchAdmins = catchAsyncError(async (req, res, next) => {
    try {
        const admins = await userModel.find({ role: "Admin", managedAccounts: req.user._id })
        res.status(200).json({
            success: true,
            message: "Admins fetched successfully",
            adminCount: admins.length,
            admins,
        });

    } catch (error) {
        console.log("Fetch admins Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
})

// update admin status active or not active
export const isAdminActiveInActive = catchAsyncError(async (req, res, next) => {
    try {
        const { adminId, status } = req.body;

        if (!adminId || !status) {
            return next(new ErrorHandler("Admin ID and status are required", 400));
        }

        // validate status
        if (!["Yes", "No"].includes(status)) {
            return next(new ErrorHandler("Invalid status. Only 'Yes' or 'No' are allowed", 400));
        }

        // convert yes and no to boolean
        const isActive = status === "Yes" ? true : false;

        // check admin by id , role and , managedAccounts
        const admin = await userModel.findOne({
            _id: adminId,
            role: "Admin",
            managedAccounts: req.user._id
        });

        if (!admin) {
            return next(new ErrorHandler("Admin not found or not authorized to update status", 401));
        }

        // update admin status
        admin.isActive = isActive;
        await admin.save();

        res.status(200).json({
            success: true,
            message: `Admin status updated successfully to ${isActive ? "Active" : "Inactive"}`,
            admin,
        });
    } catch (error) {
        console.log("Error while updating", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
})



// getProfile
export const getUsersProfile = catchAsyncError(async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        return res.status(200).json({
            success: true,
            message: `${req.user?.firstName} Welcome`,
            user,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});


export const logout = catchAsyncError(async (req, res, next) => {
    try {
        res.status(200)
            .cookie("SuperAdmin_Token", "", {
                expires: new Date(Date.now()),
                httpOnly: true,
            })
            .cookie("Admin_Token", "", {
                expires: new Date(Date.now()),
                httpOnly: true,
            })
            .cookie("User_Token", "", {
                expires: new Date(Date.now()),
                httpOnly: true,
            })
            .json({
                success: true,
                message: "Logged out successfully",
            });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
})

// admin profiles details 
export const getAdminProfile = catchAsyncError(async (req, res, next) => {

    const { adminId } = req.params;

    if (!adminId) {
        return next(new ErrorHandler("Admin ID is required", 400));
    }

    const admin = await userModel.findById(adminId);

    if (!admin) {
        return next(new ErrorHandler("Admin not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Admin profile fetched successfully",
        admin,
    });

})

//update admin data
export const UpdateAdminProfile = catchAsyncError(async (req, res, next) => {

    const { adminId } = req.params;
    if (!adminId) {
        return next(new ErrorHandler("Admin ID is required and should be a valid ID", 400));
    }

    // console.log(adminId);

    const admin = await userModel.findById(adminId);
    if (!admin || admin.role !== 'Admin') {
        return next(new ErrorHandler("Admin not found or unauthorized!", 401));
    }

    // Extract fields from the request
    const { firstName, middleName, lastName, email, phone, address, partyName, subscriptionModel, isVerified } = req.body;

    // Define fields to update (including password without hashing)
    const updatedFields = { firstName, middleName, lastName, email, phone, address, partyName, subscriptionModel, isVerified };

    // Update the admin details
    const updatedAdmin = await userModel.findByIdAndUpdate(adminId, updatedFields, { new: true });

    res.status(200).json({
        success: true,
        message: "Admin profile updated successfully",
        updatedAdmin
    });
});
