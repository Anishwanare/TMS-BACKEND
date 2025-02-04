import express from 'express'
import { config } from "dotenv"
import cors from 'cors'
import bodyparser from "body-parser"
import cookieParser from 'cookie-parser'
import { dbConnection } from './database/db.js'
import { errorMiddleware } from './middleware/error.js'
import superAdminRouter from "./router/superAdminRoute.js"
import adminRouter from "./router/adminRoute.js"
import fileUpload from 'express-fileupload'
import { accountPlanStatus } from './automation/accountActiveCron.js'

const app = express()

config({ path: "./config/config.env" })


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true  // ✅ Allow cookies to be sent
}));
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './tmp/',
}));


// middleware

app.use('/api/v1/users', superAdminRouter)
app.use('/api/v2/users', adminRouter)

// connection to database
dbConnection()

accountPlanStatus()


app.use(errorMiddleware)
export default app;