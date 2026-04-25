import { Router } from "express";
import {
  createOrder,
  addProduct,
  getMyOrders,
} from "../modules/orders/orders.controller";
import { getOrderDetail } from "../controllers/order.controller";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware";

const router = Router();

// POST /orders — crear orden (consumer)
router.post(
  "/",
  authenticateToken,
  authorizeRole("consumer"),
  createOrder
);

// POST /orders/add-product — agregar producto a orden (consumer)
router.post(
  "/add-product",
  authenticateToken,
  authorizeRole("consumer"),
  addProduct
);

// GET /orders/my-orders — mis órdenes como consumidor
// IMPORTANTE: debe ir ANTES de /:id para no capturarse como ID
router.get(
  "/my-orders",
  authenticateToken,
  getMyOrders
);

// GET /orders/:id — detalle de una orden (posición delivery + destino)
router.get(
  "/:id",
  authenticateToken,
  getOrderDetail
);

export default router;

