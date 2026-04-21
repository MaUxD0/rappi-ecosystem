import { Router } from "express";
import { updatePosition } from "./position.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../../middlewares/authMiddleware";

const router = Router();

router.patch(
  "/:orderId/position",
  authenticateToken,
  authorizeRole("delivery"),
  updatePosition
);

export default router;