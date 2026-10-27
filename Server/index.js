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


import path from "path"
import { fileURLToPath } from "url"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : [];

const privateCors = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    let hostname = "";
    try {
      hostname = new URL(origin).hostname;
    } catch {}

    if (
      configuredOrigins.includes(origin) ||
      hostname.endsWith(".vercel.app") ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy blocked access from origin ${origin}`));
  },
  credentials: true,
});

const publicCors = cors({
  origin: "*",
});

app.use(express.json())
app.use(cookieParser())

// Serve assistant widget script and styles statically so embedding from server also works
app.use(express.static(path.join(__dirname, "../Client/public")))

app.get("/", (req, res) => {
  res.json({ status: "healthy", message: "Arin AI Server is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

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