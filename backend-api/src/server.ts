import app from "./app";
import dotenv from "dotenv";
import authRoutes from "./features/auth/auth.routes";
import storeRoutes from "./routes/store.routes";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import deliveryRoutes from "./routes/delivery.routes";
dotenv.config();
app.use("/stores", storeRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/deliveries", deliveryRoutes);
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});