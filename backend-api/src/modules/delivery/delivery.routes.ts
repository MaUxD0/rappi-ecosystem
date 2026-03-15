import { Router } from "express";

import {
  availableOrders,
  accept,
  myDeliveries
} from "./delivery.controller";

import {
  authenticateToken,
  authorizeRole
} from "../../middlewares/authMiddleware";

const router = Router();

router.get(
  "/orders",
  authenticateToken,
  authorizeRole("delivery"),
  availableOrders
);

router.post(
  "/accept",
  authenticateToken,
  authorizeRole("delivery"),
  accept
);

router.get(
  "/my-deliveries",
  authenticateToken,
  authorizeRole("delivery"),
  myDeliveries
);

export default router;