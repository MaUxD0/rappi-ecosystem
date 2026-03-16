import { Request, Response } from "express";
import {
  getStores,
  getStoreByUserId,
  updateStoreStatus,
  getOrdersByStore,
} from "../services/store.service";

export async function getAllStores(req: Request, res: Response) {
  try {
    const stores = await getStores();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: "Error fetching stores" });
  }
}

export async function getMyStore(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;
    const store = await getStoreByUserId(userId);
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: "Error fetching store" });
  }
}

export async function toggleStoreStatus(req: Request, res: Response) {
  try {
    const storeId = req.params.storeId as string;
    const { isOpen } = req.body;
    const store = await updateStoreStatus(storeId, isOpen);
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: "Error updating store status" });
  }
}

export async function getStoreOrders(req: Request, res: Response) {
  try {
    const storeId = req.params.storeId as string;
    const orders = await getOrdersByStore(storeId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Error fetching store orders" });
  }
}