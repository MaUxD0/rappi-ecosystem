import { Request, Response } from "express";
import { getProductsByStore } from "../services/product.service";

export async function getProducts(req: Request, res: Response) {

  try {

    const { storeId } = req.params;

    if (typeof storeId !== "string") {
      return res.status(400).json({ error: "Invalid storeId parameter" });
    }

    const products = await getProductsByStore(storeId);

    res.json(products);

  } catch (error) {

    res.status(500).json({
      error: "Error fetching products"
    });

  }

}