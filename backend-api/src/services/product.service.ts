import { pool } from "../config/database";

export async function getProductsByStore(storeId: string) {

  const result = await pool.query(
    `SELECT id, name, price, storeid
     FROM products
     WHERE storeid = $1`,
    [storeId]
  );

  return result.rows;

}