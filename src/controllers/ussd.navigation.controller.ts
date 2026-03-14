// src/controllers/ussd.navigation.controller.ts
import { Request, Response } from "express";
import { UssdNavigationService } from "../services/ussd.navigation.service";

export const handleNavigation = async (req: Request, res: Response) => {
  const { sessionId, phoneNumber, text } = req.body;

  try {
    // Controller doesn't care about menu logic.
    // It just asks the service to process the input string.
    const response = await UssdNavigationService.processInput(
      sessionId,
      phoneNumber,
      text,
    );

    res.set("Content-Type", "text/plain");
    res.send(response);
  } catch (error) {
    console.error("Navigation Error:", error);
    res.send("END An error occurred. Please try again.");
  }
};
