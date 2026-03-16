
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductsByStore } from "../../services/productService";
import { createOrder, addProductToOrder } from "../../services/orderService";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ProductsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const addToCart = (product: Product) => {
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
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    setLoading(true);
    try {
      const token = localStorage.getItem("token")!;
      const order = await createOrder(storeId!, token);
      for (const item of cart) {
        await addProductToOrder(order.id, item.product.id, item.quantity, token);
      }
      alert("Order created successfully!");
      setCart([]);
      navigate("/my-orders");
    } catch (error) {
      console.error(error);
      alert("Error creating order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Products</h1>
      {products.map((product) => (
        <div key={product.id} style={{ border: "1px solid #ccc", margin: "8px", padding: "12px" }}>
          <p>{product.name} - ${product.price}</p>
          <button onClick={() => addToCart(product)}>Add to cart</button>
        </div>
      ))}

      <h2>Cart</h2>
      {cart.length === 0 ? <p>Empty cart</p> : (
        <>
          {cart.map((item) => (
            <p key={item.product.id}>{item.product.name} x{item.quantity}</p>
          ))}
          <button onClick={handleCreateOrder} disabled={loading}>
            {loading ? "Creating..." : "Create Order"}
          </button>
        </>
      )}
    </div>
  );
}