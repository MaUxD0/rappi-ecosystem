import { Router } from "express";
import * as orderController from "./orders.controller";
import { authenticateToken, authorizeRole } from "../../middlewares/authMiddleware";

const router = Router();


router.post(
  "/",
  authenticateToken,
  authorizeRole("consumer"),
  orderController.createOrder
);


router.post(
  "/add-product",
  authenticateToken,
  authorizeRole("consumer"),
  orderController.addProduct
);


router.get(
  "/my-orders",
  authenticateToken,
  orderController.getMyOrders
);

router.get(
  "/:id",
  authenticateToken,
  orderController.getOrderDetailController
);

export default router;
