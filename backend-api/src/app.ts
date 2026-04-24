import express from "express";
import cors from "cors";
import authRoutes from "./features/auth/auth.routes";
import { authenticateToken } from "./middlewares/authMiddleware";
import { authorizeRole } from "./middlewares/authMiddleware";
import productRoutes from "./modules/products.routes";
import orderRoutes from "./modules/orders/orders.routes";
import deliveryRoutes from "./modules/delivery/delivery.routes";
import storeRoutes from "./routes/store.routes";
import positionRoutes from "./features/positions/position.routes";

const app = express();

app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/stores", storeRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/delivery", positionRoutes);
app.use("/auth", authRoutes);

app.get("/store-only", authenticateToken, authorizeRole("store"), (req, res) => {
  res.json({ message: "Store access granted" });
});

app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "Access granted" });
});

export default app;