import app from "./app";
import dotenv from "dotenv";
import storeRoutes from "./routes/store.routes";
dotenv.config();
app.use("/stores", storeRoutes);
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});