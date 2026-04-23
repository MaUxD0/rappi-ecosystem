import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductsByStore } from "../../services/productService";
import { createOrder, addProductToOrder } from "../../services/orderService";
import DestinationMap from "../../components/DestinationMap";

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

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
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1)
        return prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      return prev.filter((i) => i.product.id !== productId);
    });
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  async function handleOrder() {
    if (cart.length === 0) { alert("El carrito está vacío"); return; }
    if (!destination) { alert("Por favor selecciona un punto de entrega en el mapa"); return; }

    setLoading(true);
    try {
      const order = await createOrder(storeId!, destination.lat, destination.lng);
      for (const item of cart) {
        await addProductToOrder(order.id, item.product.id, item.quantity);
      }
      alert("¡Orden creada exitosamente!");
      setCart([]);
      window.location.href = "/my-orders";
    } catch (error) {
      console.error(error);
      alert("Error creando la orden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: 'Nunito, sans-serif' }}>
            rappi
          </h1>
          <a href="/stores">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-4 py-2 rounded-full transition-all" style={{ fontFamily: 'Nunito, sans-serif' }}>
              ← Tiendas
            </button>
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-6 items-start">
          {/* Products */}
          <div className="flex-1">
            <h2 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Menu</h2>
            <p className="text-gray-400 text-sm mb-6">Agrega lo que quieras al carrito</p>

            {products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="font-bold">No hay productos disponibles</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map((product) => {
                  const inCart = cart.find((i) => i.product.id === product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xl flex-shrink-0">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-sm">{product.name}</p>
                        <p className="text-orange-500 font-black text-base">${product.price.toFixed(2)}</p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-lg text-gray-600">−</button>
                          <span className="w-6 text-center font-black text-orange-500">{inCart.quantity}</span>
                          <button onClick={() => addToCart(product)} className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center font-black text-lg text-white">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-full transition-all">
                          Agregar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="w-72 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-20 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-black text-gray-900 text-lg">Tu carrito</h3>
              {cartCount > 0 && (
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Agrega productos para comenzar</p>
            ) : (
              <>
                <div className="flex flex-col divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center py-3 text-sm">
                      <span className="font-semibold text-gray-700 truncate mr-2">{item.product.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">x{item.quantity}</span>
                        <span className="font-black text-orange-500">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-100 mb-4">
                  <span className="font-black text-gray-800">Total</span>
                  <span className="font-black text-orange-500 text-xl">${cartTotal.toFixed(2)}</span>
                </div>

                {/* Mapa de destino */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className={`w-full font-bold text-sm py-2 rounded-xl border-2 transition-all mb-2 ${
                      destination
                        ? "border-green-500 text-green-600 bg-green-50"
                        : "border-orange-300 text-orange-500 hover:bg-orange-50"
                    }`}
                  >
                    {destination ? "✓ Destino seleccionado" : "📍 Seleccionar destino"}
                  </button>
                  {showMap && (
                    <DestinationMap
                      onSelectLocation={(lat, lng) => {
                        setDestination({ lat, lng });
                        setShowMap(false);
                      }}
                    />
                  )}
                </div>

                <button
                  onClick={handleOrder}
                  disabled={loading || !destination}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-orange-200"
                >
                  {loading ? "Procesando..." : "Hacer pedido"}
                </button>
                {!destination && (
                  <p className="text-xs text-red-400 text-center mt-2">Selecciona un destino para continuar</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}