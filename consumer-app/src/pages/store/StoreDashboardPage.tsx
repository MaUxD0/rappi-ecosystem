import { useEffect, useState } from "react";
import { getStoreByUser, toggleStore, getStoreOrders } from "../../services/storeService";
import { getProductsByStore, createProduct } from "../../services/productService";

interface Store { id: string; name: string; isopen: boolean; }
interface Product { id: string; name: string; price: number; }
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
        const [prods, ords] = await Promise.all([
          getProductsByStore(storeData.id),
          getStoreOrders(storeData.id),
        ]);
        setProducts(prods);
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
      alert("Error actualizando estado");
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

  if (!store)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Cargando...
      </div>
    );

  const pendingOrders = orders.filter((o) => !o.deliveryid).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: 'Nunito, sans-serif' }}>
            rappi
          </h1>
          <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
            {store.name}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-8 mb-6 text-white">
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{store.name}</h2>
          <p className="text-orange-100 text-sm">Panel de administración</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { value: products.length, label: "Productos", color: "text-orange-500" },
            { value: orders.length, label: "Total órdenes", color: "text-orange-500" },
            { value: pendingOrders, label: "Sin repartidor", color: pendingOrders > 0 ? "text-yellow-500" : "text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className={`text-4xl font-black ${stat.color}`} style={{ fontFamily: 'Nunito, sans-serif' }}>{stat.value}</p>
              <p className="text-xs text-gray-400 font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Status toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6 flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${store.isopen ? "bg-green-500 shadow-[0_0_0_4px_rgba(0,200,83,0.2)]" : "bg-gray-300"}`} />
          <div className="flex-1">
            <p className="font-black text-gray-900 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Tienda {store.isopen ? "Abierta" : "Cerrada"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {store.isopen ? "Los clientes pueden hacer pedidos" : "Los clientes no pueden ordenar ahora"}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`font-bold text-sm px-5 py-2 rounded-full transition-all flex-shrink-0 ${
              store.isopen
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200"
            }`}
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {store.isopen ? "Cerrar" : "Abrir"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 w-fit mb-6">
          {(["products", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                tab === t
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {t === "products" ? "Productos" : (
                <span className="flex items-center gap-2">
                  Órdenes
                  {pendingOrders > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingOrders}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div>
            {/* Create product */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
              <p className="font-black text-gray-900 text-sm mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Nuevo producto
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-28 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all"
                />
                <button
                  onClick={handleCreateProduct}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-orange-200 flex-shrink-0"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Crear
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="font-bold text-gray-600">No tienes productos aún</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xl flex-shrink-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="flex-1 font-black text-gray-900 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{p.name}</p>
                    <p className="font-black text-orange-500 text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>${p.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="font-bold text-gray-600">No hay órdenes aún</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm flex-shrink-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {order.productname}
                        <span className="text-gray-400 font-semibold ml-2">x{order.quantity}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{order.orderid.slice(0, 12)}...</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      order.deliveryid ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {order.deliveryid ? "Asignado" : "Pendiente"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}