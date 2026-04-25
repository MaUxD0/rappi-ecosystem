import { pool } from "../config/database";
import { OrderStatus } from "../types/orderStatus";

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
    // ST_MakePoint(lng, lat) — PostGIS convention
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
     WHERE o.consumerid = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// Devuelve posición del repartidor y destino para tracking en tiempo real
export async function getOrderDetail(orderId: string) {
  const result = await pool.query(
    `SELECT
       o.id,
       o.status,
       ST_Y(o.delivery_position::geometry) AS delivery_lat,
       ST_X(o.delivery_position::geometry) AS delivery_lng,
       ST_Y(o.destination::geometry)       AS destination_lat,
       ST_X(o.destination::geometry)       AS destination_lng
     FROM orders o
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] ?? null;
}