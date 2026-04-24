import { Router } from "express";
import { getMyOrders, getOrderDetail } from "../controllers/order.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Mis órdenes como consumidor
router.get("/my-orders", authenticateToken, getMyOrders);


router.get("/:id", authenticateToken, getOrderDetail);

export default router;