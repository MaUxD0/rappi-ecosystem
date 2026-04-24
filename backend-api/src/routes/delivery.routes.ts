import { Router } from "express";
import {
  getAvailable,
  handleAcceptOrder,
  getDeliveries,
  updatePosition,     
} from "../controllers/delivery.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/available", authenticateToken, getAvailable);
router.get("/my-deliveries", authenticateToken, getDeliveries);
router.patch("/:id/accept", authenticateToken, handleAcceptOrder);
router.patch("/:id/position", authenticateToken, updatePosition);

export default router;