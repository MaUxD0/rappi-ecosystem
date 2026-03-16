import { Router } from "express";
import { getMyOrders, } from "../controllers/order.controller";

const router = Router();

router.get("/my-orders", getMyOrders);

export default router;