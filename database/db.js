import mongoose from "mongoose";

export const dbConnection = async () => {
  await mongoose
    .connect(process.env.MONGODB_URL, { dbName: "TMS" })
    .then(() => {
      console.log("connected to TMS");
    })
    .catch((err) => console.log("Error while connecting to db", err));
};
