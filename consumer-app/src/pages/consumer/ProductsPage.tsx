import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductsByStore } from "../../services/productService";
import { createOrder, addProductToOrder } from "../../services/orderService";

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProductsByStore(storeId!);
        setProducts(data);
      } catch (error) {
        console.error("Error loading products", error);
      }
    }
    loadProducts();
  }, [storeId]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  async function handleOrder() {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    try {
      const order = await createOrder(storeId!);
      for (const item of cart) {
        await addProductToOrder(order.id, item.product.id, item.quantity);
      }
      alert("Orden creada exitosamente");
      setCart([]);
      window.location.href = "/my-orders";
    } catch (error) {
      console.error(error);
      alert("Error creando la orden");
    }
  }

  return (
    <div>
      <h1>Products</h1>
      {products.map((product) => (
        <div
          key={product.id}
          style={{ border: "1px solid #ccc", margin: "8px", padding: "8px" }}
        >
          <p>{product.name} — ${product.price}</p>
          <button onClick={() => addToCart(product)}>Agregar al carrito</button>
        </div>
      ))}

      <hr />
      <h2>Carrito</h2>
      {cart.length === 0 ? (
        <p>Vacío</p>
      ) : (
        cart.map((item) => (
          <div key={item.product.id}>
            <p>{item.product.name} x{item.quantity}</p>
          </div>
        ))
      )}
      <button onClick={handleOrder}>Hacer pedido</button>
      <br />
      <a href="/stores">← Volver a tiendas</a>
    </div>
  );
}