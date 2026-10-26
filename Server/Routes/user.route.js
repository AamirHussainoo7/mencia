import express from "express"
import { isAuth } from "../Middleware/isAuth.js"
import { getCurrentUser, saveAssistant } from "../Controllers/user.controller.js"
import { updateBookingSettings } from "../Controllers/booking.controller.js"

const userRouter = express.Router()


userRouter.get("/current-user" , isAuth , getCurrentUser)
userRouter.post("/save-assistant" , isAuth , saveAssistant)
userRouter.patch("/booking-settings", isAuth, updateBookingSettings)

export default userRouter