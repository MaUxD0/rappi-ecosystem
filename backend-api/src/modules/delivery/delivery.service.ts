import { pool } from "../../config/database";

export async function getAvailableOrders() {

  const result = await pool.query(
    `SELECT * FROM orders
     WHERE deliveryid IS NULL`
  );

  return result.rows;
}


export async function acceptOrder(
  orderId: string,
  deliveryId: string
) {

  const result = await pool.query(
    `UPDATE orders
     SET deliveryid = $1
     WHERE id = $2
     RETURNING *`,
    [deliveryId, orderId]
  );

  return result.rows[0];
}


export async function getMyDeliveries(deliveryId: string) {

  const result = await pool.query(
    `SELECT * FROM orders
     WHERE deliveryid = $1`,
    [deliveryId]
  );

  return result.rows;
}