import { Router, Request, Response } from "express";
import { parseBuyerRequest, parseSellerProfile } from "./services/gemini.service";

const router = Router();

router.post("/api/parse-request", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing 'text' in request body." });
    }

    const parsedJson = await parseBuyerRequest(text);

    res.status(200).json(parsedJson);
  } catch (error) {
    console.error("Route error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse request.";
    res.status(500).json({ error: message });
  }
});

router.post("/api/parse-profile", async (req: Request, res: Response) => {
  try {
    const { text, userId } = req.body;
    if (!text || !userId) {
      return res.status(400).json({ error: "Missing 'text' or 'userId'." });
    }

    const parsedJson = await parseSellerProfile(text, userId);
    res.status(200).json(parsedJson);
  } catch (error) {
    console.error("Profile route error:", error);
    res.status(500).json({ error: "Failed to parse profile." });
  }
});

export default router;
