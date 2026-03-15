
import { pool } from "../../config/database";

export async function createProduct(
  name: string,
  price: number,
  storeId: string
) {

  const result = await pool.query(
    `INSERT INTO products (name, price, storeid)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, price, storeId]
  );

  return result.rows[0];
}


export async function getProductsByStore(storeId: string) {

  const result = await pool.query(
    `SELECT * FROM products WHERE storeid = $1`,
    [storeId]
  );

  return result.rows;

}