import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { userModel } from "../model/userModel.js";

export const fetchAdminDetails = catchAsyncError(async (req, res, next) => {
    try {
        const admin = await userModel.findById(req.user._id)
        if (!admin) {
            return next(new ErrorHandler("Admin not found", 404));
        }
        res.status(200).json({
            message: "Account status fetched successfully",
            admin,
        })

    } catch (error) {
        console.log("error while fetchMyAccountStatus", error);
        next(new ErrorHandler("Something went wrong", 500));
    }
})