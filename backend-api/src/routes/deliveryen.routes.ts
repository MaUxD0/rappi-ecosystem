import { Router } from "express";
import { getMyDeliveries, } from "../controllers/deliveryen.controller";

const router = Router();

router.get("/my-deliveries", getMyDeliveries);

export default router;