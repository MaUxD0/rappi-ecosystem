import { pool } from "../config/database";
export async function getAvailableOrders() {

  const result = await pool.query(
    `SELECT *
     FROM orders
     WHERE deliveryid IS NULL`
  );

  return result.rows;

}