import cron from 'node-cron'

import { catchAsyncError } from "../middleware/catchAsyncError.js";

export const accountPlanStatus = catchAsyncError(async (req, res, next) => {
    cron.schedule("0 0 * * *", async () => {
        console.log("Account Plan Status activated but not implemented yet");
    })
});