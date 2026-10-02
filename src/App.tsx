import { useState } from "react";
import TaiwanMap from "./components/TaiwanMap";
import { useTaiwanGeo } from "./hooks/useTaiwanGeo";
import "./App.css";

function App() {
    const { data, error, loading } = useTaiwanGeo();
    const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

    return (
        <div className="app">
            <header className="app__header">
                <h1>台灣章魚燒價格指數</h1>
                <p className="app__subtitle">
                    用一張地圖，看看全台章魚燒哪裡買最划算。
                </p>
            </header>

            <main className="app__main">
                <section className="map-panel">
                    {loading && (
                        <p className="map-panel__status">地圖載入中…</p>
                    )}
                    {error && (
                        <p className="map-panel__status map-panel__status--error">
                            {error}
                        </p>
                    )}
                    {data && (
                        <TaiwanMap
                            geo={data}
                            selectedCounty={selectedCounty}
                            onSelectCounty={setSelectedCounty}
                        />
                    )}
                </section>

                <aside className="info-panel">
                    <h2>縣市</h2>
                    <p>
                        {selectedCounty
                            ? `已選取：${selectedCounty}`
                            : "點擊地圖上的縣市開始探索。"}
                    </p>
                </aside>
            </main>
        </div>
    );
}

export default App;
