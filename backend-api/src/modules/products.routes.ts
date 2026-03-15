import { Router } from "express";
import * as productController from "../modules/products/products.controller";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware";

const router = Router();


router.post(
  "/",
  authenticateToken,
  authorizeRole("store"),
  productController.createProduct
);


router.get(
  "/store/:storeId",
  productController.getProductsByStore
);

export default router;