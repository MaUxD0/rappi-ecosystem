import { Router } from "express";
import { getStores } from "../services/store.service";

const router = Router();

router.get("/", getStores);

export default router;