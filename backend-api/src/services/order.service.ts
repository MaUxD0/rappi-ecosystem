import { pool } from "../config/database";

export async function getOrdersByConsumer(consumerId: string) {
  const result = await pool.query(
    `SELECT 
       o.id         AS orderid,
       o.storeid,
       o.status,
       p.name       AS productname,
       oi.quantity
     FROM orders o
     JOIN order_items oi ON oi.orderid = o.id
     JOIN products p     ON p.id = oi.productid
     WHERE o.consumerid = $1
     ORDER BY o.created_at DESC`,
    [consumerId]
  );
  return result.rows;
}

export async function getOrderById(orderId: string) {
  const result = await pool.query(
    `SELECT
       o.id,
       o.status,
       ST_Y(o.delivery_position::geometry) AS delivery_lat,
       ST_X(o.delivery_position::geometry) AS delivery_lng,
       ST_Y(o.destination::geometry)        AS destination_lat,
       ST_X(o.destination::geometry)        AS destination_lng
     FROM orders o
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0]; // null si no existe
}