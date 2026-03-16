import { Router } from "express";
import { getAvailable, } from "../controllers/delivery.controller";

const router = Router();

router.get("/available", getAvailable);

export default router;