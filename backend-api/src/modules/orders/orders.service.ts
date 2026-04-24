import { pool } from "../../config/database";
import { OrderStatus } from "../../types/orderStatus";

export async function createOrder(
  userId: string,
  storeId: string,
  destinationLat: number,
  destinationLng: number
) {
  const result = await pool.query(
    `INSERT INTO orders (consumerid, storeid, deliveryid, status, destination)
     VALUES ($1, $2, NULL, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
     RETURNING id, consumerid, storeid, status`,
    [userId, storeId, OrderStatus.CREATED, destinationLng, destinationLat]
  );
  return result.rows[0];
}

export async function addProductToOrder(
  orderId: string,
  productId: string,
  quantity: number
) {
  const result = await pool.query(
    `INSERT INTO order_items (orderid, productid, quantity)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [orderId, productId, quantity]
  );
  return result.rows[0];
}

export async function getOrdersByUser(userId: string) {
  const result = await pool.query(
    `SELECT 
        o.id as orderid,
        o.storeid,
        o.status,
        p.name as productname,
        oi.quantity
     FROM orders o
     JOIN order_items oi ON o.id = oi.orderid
     JOIN products p ON p.id = oi.productid
     WHERE o.consumerid = $1`,
    [userId]
  );
  return result.rows;
}