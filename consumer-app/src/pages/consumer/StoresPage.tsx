// consumer-app/src/pages/StoresPage.tsx
import { useEffect, useState } from "react";
import { getStores } from "../../services/storeService";
import { useNavigate } from "react-router-dom";

interface Store {
  id: string;
  name: string;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStores() {
      try {
        const data = await getStores();
        setStores(data);
      } catch (error) {
        console.error("Error loading stores", error);
      }
    }
    loadStores();
  }, []);

  return (
    <div>
      <h1>Stores</h1>
      {stores.map((store) => (
        <div key={store.id} onClick={() => navigate(`/stores/${store.id}/products`)} style={{ cursor: "pointer", border: "1px solid #ccc", margin: "8px", padding: "12px" }}>
          <h3>{store.name}</h3>
        </div>
      ))}
    </div>
  );
}