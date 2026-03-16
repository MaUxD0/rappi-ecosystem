import { pool } from "../config/database";
export async function getDeliveries(deliveryId: string) {

  const result = await pool.query(
    `SELECT *
     FROM orders
     WHERE deliveryid = $1`,
    [deliveryId]
  );

  return result.rows;

}