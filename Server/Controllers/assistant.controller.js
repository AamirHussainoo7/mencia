import { processAssistantMessage } from "../Services/booking.ai.js"
import User from "../Models/user.model.js"


export const getAssistantConfig = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId).select("-geminiApiKey -groqApiKey")
        if (!user) {
            return res.status(404).json({ message: "failed to get user" })
        }

        return res.status(200).json({ message: "Assistant Config data ", user })

    } catch (error) {
        return res.status(500).json({ message: `Assistant Config failed ${error}` })
    }
}


export const askAssistant = async (req, res) => {
    try {
        const { message, userId } = req.body

        if (!message || !userId) {
            return res.status(400).json({ message: "Message and UserId are required" })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ message: "User is not found" })
        }

        const apiKey = user.groqApiKey || process.env.GROQ_API_KEY || user.geminiApiKey;
        if (!apiKey) {
            return res.status(400).json({
                message: "AI provider API key is not configured. Please configure GROQ_API_KEY on the server or add an assistant API key."
            });
        }

        if (user.plan === "free"
            && user.totalMessages >= user.requestLimit) {
            return res.status(400).json({ message: "Free limit reached" })
        }

        if (user.plan === "pro" && new Date(user.proExpiresAt) < new Date()) {
            user.plan = "free"; // Fix BUG-001: assignment instead of comparison

            await user.save();

            return res.status(400).json({ message: "Pro plan expired" });
        }

        const { currentPath, history } = req.body;
        const result = await processAssistantMessage({
            user,
            message,
            currentPath,
            history,
        });

        // Do not charge free users if the provider experienced an outage/unavailability
        if (user.plan === "free" && !result.isUnavailable) {
            user.totalMessages += 1;
            await user.save();
        }

        return res.json({
            success: true,
            aiResponse: result.aiResponse,
            action: result.action,
            path: result.path,
            toolResult: result.toolResult,
            isUnavailable: Boolean(result.isUnavailable),
        });

    } catch (error) {
        const safeMessage =
            error.userFriendlyMessage ||
            "Our assistant is temporarily experiencing high demand. Please try again shortly.";
        console.error("Assistant Error:", safeMessage);
        return res.status(error.status && error.status >= 400 && error.status < 500 ? error.status : 503).json({
            success: false,
            message: safeMessage,
            aiResponse: safeMessage,
            isUnavailable: true,
        });
    }
}



