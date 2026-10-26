import express from "express"
import dotenv from "dotenv"
import connectDB from "./Configs/ConnectDB.js"
import authRouter from "./Routes/auth.route.js"
import cookieParser from "cookie-parser"
dotenv.config()
import cors from "cors"
import userRouter from "./Routes/user.route.js"
import assistantRouter from "./Routes/assistant.route.js"
import bookingRouter from "./Routes/booking.route.js"
import businessRouter from "./Routes/business.route.js"
// import billingRouter from "./Routes/billing.route.js" // Razorpay — disabled for now


const app = express()
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

const privateCors = cors({
  origin: allowedOrigins,
  credentials: true,
});

  const publicCors =
  cors({
    origin: "*",
  });

app.use(express.json())
app.use(cookieParser())



app.get("/" , (req,res)=>{
    res.json("Hello from Server")
})

app.use("/api/auth",privateCors , authRouter)
app.use("/api/user",privateCors , userRouter)
app.use("/api/business", privateCors, businessRouter)
// app.use("/api/billing",privateCors , billingRouter) // Razorpay — disabled for now

app.use("/api/assistant",publicCors , assistantRouter)
app.use("/api/booking", publicCors, bookingRouter)
// Express Application Initialization
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server Started on Port ${PORT}`);
    connectDB();
});