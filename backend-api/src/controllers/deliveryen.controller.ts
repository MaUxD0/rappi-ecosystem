import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getDeliveries } from "../services/deliveryen.service";
export async function getMyDeliveries(req: AuthRequest, res: Response) {

  try {

    const deliveryId = req.user.id;

    const orders = await getDeliveries(deliveryId);

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      error: "Error fetching deliveries"
    });

  }

}