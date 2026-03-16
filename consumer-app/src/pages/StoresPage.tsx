import { useEffect, useState } from "react";
import { getStores } from "../services/storeService";

interface Store {
  id: string;
  name: string;
 
}

export default function StoresPage() {

  const [stores, setStores] = useState<Store[]>([]);

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

        <div key={store.id}>

          <h3>{store.name}</h3>

        </div>

      ))}

    </div>

  );

}