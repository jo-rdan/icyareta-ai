import { Router } from "express";
import { handleNavigation } from "../controllers/ussd.navigation.controller";

const router = Router();

// Africa's Talking hits this endpoint
router.post("/ussd", handleNavigation);

export default router;
