import { Request, Response } from "express";
import * as productService from "./products.service";

export async function createProduct(req: Request, res: Response) {

  try {

    const { name, price, storeId } = req.body;

    const product = await productService.createProduct(
      name,
      price,
      storeId
    );

    res.json(product);

  } catch (error) {

  console.error(error);

  res.status(500).json({
    error: "Error creating product",
    detail: error
  });

}
}


export async function getProductsByStore(req: Request, res: Response) {

  try {

    const storeId = req.params.storeId as string;

    const products = await productService.getProductsByStore(storeId);

    res.json(products);

  } catch (error) {

  console.error(error);

  res.status(500).json({
    error: "Error fetching products",
    detail: error
  });

}

}