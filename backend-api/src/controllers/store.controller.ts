import { Request, Response } from "express";
import { getStores } from "../services/store.service";

export async function getAllStores(req: Request, res: Response) {

  try {

    const stores = await getStores();

    res.json(stores);

  } catch (error) {

    res.status(500).json({
      error: "Error fetching stores"
    });

  }

}