import { Request, Response } from "express";
import * as orderService from "./orders.service";
import { AuthRequest } from "../../middlewares/authMiddleware";


export async function createOrder(req: AuthRequest, res: Response) {

  try {

    const userId = req.user.id;
    const { storeId } = req.body;

    const order = await orderService.createOrder(
      userId,
      storeId
    );

    res.json(order);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error creating order",
      detail: error
    });

  }

}


export async function addProduct(req: Request, res: Response) {

  try {

    const { orderId, productId, quantity } = req.body;

    const item = await orderService.addProductToOrder(
      orderId,
      productId,
      quantity
    );

    res.json(item);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error adding product to order"
    });

  }

}


export async function getMyOrders(req: AuthRequest, res: Response) {

  try {

    const userId = req.user.id;

    const orders = await orderService.getOrdersByUser(userId);

    res.json(orders);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error fetching orders"
    });

  }

}