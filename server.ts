import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// In-memory Database for Demo/Preview persistence
const users = new Map<string, { email: string; name: string; password?: string; createdAt: number; usageCount: number }>();
// Pre-populate reference user from image "Ella D"
users.set("daniocheat1@gmail.com", {
  email: "daniocheat1@gmail.com",
  name: "Ella D",
  createdAt: Date.now(),
  usageCount: 4,
});

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Chatbot will run in simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST APIs
// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// 2. Authentication
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const existing = users.get(email.toLowerCase());
  if (existing) {
    return res.json({
      success: true,
      user: {
        email: existing.email,
        name: existing.name,
        createdAt: existing.createdAt,
        usageCount: existing.usageCount,
      },
    });
  }

  // Auto-register for easier UX in the playground
  const name = email.split("@")[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  const newUser = {
    email: email.toLowerCase(),
    name: formattedName,
    createdAt: Date.now(),
    usageCount: 0,
  };
  users.set(email.toLowerCase(), newUser);

  return res.json({
    success: true,
    user: newUser,
  });
});

// 3. User stats & Rate limit checks
app.get("/api/user/status", (req, res) => {
  const email = req.query.email as string;
  if (!email) {
    return res.json({ limitExceeded: false, timeLeftSeconds: 7200, usageCount: 0 });
  }

  const user = users.get(email.toLowerCase());
  if (!user) {
    return res.json({ limitExceeded: false, timeLeftSeconds: 7200, usageCount: 0 });
  }

  // Calculate 2-hour limits (7200 seconds)
  const elapsedSeconds = Math.floor((Date.now() - user.createdAt) / 1000);
  const timeLeftSeconds = Math.max(0, 7200 - elapsedSeconds);
  const limitExceeded = timeLeftSeconds <= 0 || user.usageCount >= 50;

  res.json({
    limitExceeded,
    timeLeftSeconds,
    usageCount: user.usageCount,
    maxUsage: 50,
  });
});

// Reset limits (useful for testing)
app.post("/api/user/reset", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const user = users.get(email.toLowerCase());
  if (user) {
    user.createdAt = Date.now();
    user.usageCount = 0;
    return res.json({ success: true, message: "Limits reset successfully!" });
  }
  res.status(404).json({ error: "User not found" });
});

// 4. Chat endpoints powering Gemini LLM Interaction
app.post("/api/chat", async (req, res) => {
  const { messages, email, image } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // Apply rate limiting guard
  if (email) {
    const user = users.get(email.toLowerCase());
    if (user) {
      const elapsedSeconds = Math.floor((Date.now() - user.createdAt) / 1000);
      const timeLeftSeconds = Math.max(0, 7200 - elapsedSeconds);
      if (timeLeftSeconds <= 0) {
        return res.status(429).json({
          error: "Your 2-hour free tier chat allocation has ended. Reset your limits in settings to resume chatting!",
        });
      }
      if (user.usageCount >= 50) {
        return res.status(429).json({
          error: "You have reached the maximum of 50 messages allowed for your free tier. Reset your limits in settings to resume!",
        });
      }
      // Increment count
      user.usageCount += 1;
    }
  }

  const promptMessage = messages[messages.length - 1];
  const queryText = promptMessage.content;

  // If we don't have an API key, fallback to a smart offline simulation
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    // Dynamic simulated response simulating an advanced AI bot
    setTimeout(() => {
      let advice = "";
      if (queryText.toLowerCase().includes("africa")) {
        advice = "The history of Africa is rich and diverse, stretching back to the dawn of humanity. Key milestones include ancient empires like Egypt, Carthage, Mali, and Songhai, the impacts of the trans-Saharan and transatlantic trade, and the triumphant 20th-century movements toward national independence and modern resurgence.";
      } else if (queryText.toLowerCase().includes("book")) {
        advice = "Writing a book is a rewarding marathon! It begins with standard stages: finding a compelling core concept, creating a detailed system outline, blocking off solid writing sessions (e.g. 500 words/day), and editing later without interrupting your initial draft's momentum.";
      } else {
        advice = `This is a high-fidelity local response from Dx GPT simulating the model. Since server environment credentials may still be settling, I can help you outline essays, brainstorm ideas, or review logic! You queried: "${queryText}". Let's get to writing!`;
      }
      return res.json({
        text: `### Simulated Dx GPT Response\n\n${advice}\n\n*(Note: To enable live Gemini brainpower, add your valid API key in AI Studio under Settings > Secrets.)*`,
      });
    }, 1200);
    return;
  }

  try {
    const client = getGeminiClient();

    // Map message history cleanly into Gemini's Roles Format
    // Format must be user or model roles. Filter empty or system messages.
    const contentsPayload = messages.map((msg, index) => {
      const isUser = msg.role === "user";
      const partsArr: any[] = [];

      // If there is an image uploaded for the latest message, add it as a part
      if (isUser && index === messages.length - 1 && image) {
        // Strip out base64 payload prefix if present e.g. "data:image/png;base64,"
        const base64Data = image.data.replace(/^data:image\/\w+;base64,/, "");
        partsArr.push({
          inlineData: {
            mimeType: image.type,
            data: base64Data,
          },
        });
      }

      partsArr.push({ text: msg.content });

      return {
        role: isUser ? "user" : "model",
        parts: partsArr,
      };
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: "You are Dx GPT, an elegant, ultra-professional, and highly competent AI assistant. Your visual interface uses deep purple highlights and is exceptionally clean. Keep responses clear, authoritative, structured with beautiful markdown, and helpful.",
      },
    });

    const replyText = response.text || "I was unable to formulate a response.";
    res.json({ text: replyText });
  } catch (err: any) {
    console.error("Gemini API Error during generation: ", err);
    res.status(500).json({
      error: `Gemini API Error: ${err.message || "An unexpected error occurred during message processing."}`,
    });
  }
});

// Configure Vite middleware or static files depending on the environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dx GPT server is active at http://localhost:${PORT}`);
  });
}

startServer();
