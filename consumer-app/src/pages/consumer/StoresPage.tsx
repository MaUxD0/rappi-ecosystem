import { useEffect, useState } from "react";
import { getStores } from "../../services/storeService";
import { useNavigate } from "react-router-dom";

interface Store {
  id: string;
  name: string;
  isopen: boolean;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStores() {
      try {
        const data = await getStores();
        setStores(data);
      } catch {
        console.error("Error loading stores");
      }
    }
    loadStores();
  }, []);

  return (
    <div>
      <h1>Stores</h1>
      {stores.map((store) => (
        <div
          key={store.id}
          style={{ border: "1px solid #ccc", margin: "8px", padding: "8px", cursor: "pointer" }}
          onClick={() => navigate(`/stores/${store.id}/products`)}
        >
          <h3>{store.name}</h3>
          <p>{store.isopen ? "🟢 Abierto" : "🔴 Cerrado"}</p>
        </div>
      ))}
    </div>
  );
}
