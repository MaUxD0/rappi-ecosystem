import { Router } from "express";
import {
  getAllStores,
  getMyStore,
  toggleStoreStatus,
  getStoreOrders,
} from "../controllers/store.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";

const router = Router();

router.get("/", getAllStores);

router.get(
  "/my-store/:userId",
  authenticateToken,
  authorizeRole("store"),
  getMyStore
);

router.patch(
  "/:storeId/toggle",
  authenticateToken,
  authorizeRole("store"),
  toggleStoreStatus
);

router.get(
  "/:storeId/orders",
  authenticateToken,
  authorizeRole("store"),
  getStoreOrders
);

export default router;