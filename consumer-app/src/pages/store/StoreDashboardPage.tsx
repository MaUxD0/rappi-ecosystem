import { useEffect, useState } from "react";
import { getStoreByUser, toggleStore, getStoreOrders } from "../../services/storeService";
import { getProductsByStore, createProduct } from "../../services/productService";

interface Store {
  id: string;
  name: string;
  isopen: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Order {
  orderid: string;
  consumerid: string;
  productname: string;
  quantity: number;
  deliveryid: string | null;
}

export default function StoreDashboardPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const storeData = await getStoreByUser();
        setStore(storeData);
        const prods = await getProductsByStore(storeData.id);
        setProducts(prods);
        const ords = await getStoreOrders(storeData.id);
        setOrders(ords);
      } catch {
        console.error("Error loading store data");
      }
    }
    loadData();
  }, []);

  async function handleToggle() {
    if (!store) return;
    try {
      const updated = await toggleStore(store.id, !store.isopen);
      setStore(updated);
    } catch {
      alert("Error actualizando estado de la tienda");
    }
  }

  async function handleCreateProduct() {
    if (!store || !productName || !productPrice) {
      alert("Llena todos los campos");
      return;
    }
    try {
      const product = await createProduct(productName, parseFloat(productPrice), store.id);
      setProducts((prev) => [...prev, product]);
      setProductName("");
      setProductPrice("");
    } catch {
      alert("Error creando producto");
    }
  }

  if (!store) return <p>Cargando tienda...</p>;

  return (
    <div>
      <h1>{store.name}</h1>
      <p>Estado: <strong>{store.isopen ? "🟢 Abierto" : "🔴 Cerrado"}</strong></p>
      <button onClick={handleToggle}>
        {store.isopen ? "Cerrar tienda" : "Abrir tienda"}
      </button>

      <hr />

      <button
        onClick={() => setTab("products")}
        style={{ fontWeight: tab === "products" ? "bold" : "normal", marginRight: 8 }}
      >
        Productos
      </button>
      <button
        onClick={() => setTab("orders")}
        style={{ fontWeight: tab === "orders" ? "bold" : "normal" }}
      >
        Órdenes entrantes
      </button>

      <hr />

      {tab === "products" && (
        <div>
          <h2>Crear Producto</h2>
          <input
            type="text"
            placeholder="Nombre del producto"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Precio"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
          />
          <button onClick={handleCreateProduct}>Crear</button>

          <h2>Mis Productos</h2>
          {products.length === 0 ? (
            <p>No tienes productos aún</p>
          ) : (
            products.map((p) => (
              <div key={p.id} style={{ border: "1px solid #ccc", margin: "8px", padding: "8px" }}>
                <p>{p.name} — ${p.price}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "orders" && (
        <div>
          <h2>Órdenes Entrantes</h2>
          {orders.length === 0 ? (
            <p>No hay órdenes aún</p>
          ) : (
            orders.map((order, i) => (
              <div key={i} style={{ border: "1px solid #ccc", margin: "8px", padding: "8px" }}>
                <p>Orden: {order.orderid}</p>
                <p>Producto: {order.productname} x{order.quantity}</p>
                <p>Delivery: {order.deliveryid ? "Asignado" : "Pendiente"}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}