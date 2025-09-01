import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [hubs, setHubs] = useState({});
  const [hubId, setHubId] = useState("");
  const [hubName, setHubName] = useState("");
  const [connectA, setConnectA] = useState("");
  const [connectB, setConnectB] = useState("");
  const [src, setSrc] = useState("");
  const [dest, setDest] = useState("");
  const [path, setPath] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHubs();
  }, []);

  async function fetchHubs() {
    const res = await fetch(`${API}/hubs`);
    const data = await res.json();
    setHubs(data);
  }

  async function addHub() {
    setError("");
    if (!hubId || !hubName) return setError("Enter hub ID and name");
    const res = await fetch(`${API}/add_hub`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hubId, name: hubName }),
    });
    const json = await res.json();
    if (json.error) return setError(json.error);
    setHubId("");
    setHubName("");
    fetchHubs();
  }

  async function connectHubs() {
    setError("");
    if (!connectA || !connectB) return setError("Select hubs to connect");
    if (connectA === connectB) return setError("Cant connect same hub");
    const res = await fetch(`${API}/connect_hubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hubA: connectA, hubB: connectB }),
    });
    const json = await res.json();
    if (json.error) return setError(json.error);
    setConnectA("");
    setConnectB("");
    fetchHubs();
  }

  async function findPath() {
    setError("");
    if (!src || !dest) return setError("Select source and destination");
    const res = await fetch(`${API}/shortest_path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: src, dest: dest }),
    });
    const json = await res.json();
    if (json.error) return setError(json.error);
    setPath(json.path || []);
  }

  return (
    <div className="container">
      <h2>Hub Network Visualizer</h2>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div>
        <h3>Add Hub</h3>
        <input
          placeholder="Hub ID"
          value={hubId}
          onChange={(e) => setHubId(e.target.value)}
        />
        <input
          placeholder="Hub Name"
          value={hubName}
          onChange={(e) => setHubName(e.target.value)}
        />
        <button onClick={addHub}>Add Hub</button>
      </div>

      <div>
        <h3>Connect Hubs</h3>
        <select value={connectA} onChange={(e) => setConnectA(e.target.value)}>
          <option value="">Select Hub A</option>
          {Object.keys(hubs).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <select value={connectB} onChange={(e) => setConnectB(e.target.value)}>
          <option value="">Select Hub B</option>
          {Object.keys(hubs).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button onClick={connectHubs}>Connect</button>
      </div>

      <div>
        <h3>Find Shortest Path</h3>
        <select value={src} onChange={(e) => setSrc(e.target.value)}>
          <option value="">Source Hub</option>
          {Object.keys(hubs).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <select value={dest} onChange={(e) => setDest(e.target.value)}>
          <option value="">Destination Hub</option>
          {Object.keys(hubs).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button onClick={findPath}>Find Path</button>
      </div>

      <div>
        <h3>Shortest Path:</h3>
        {path.length ? path.join(" → ") : "-"}
      </div>

      <div>
        <h3>Network</h3>
        <ul>
          {Object.entries(hubs).map(([id, hub]) => (
            <li key={id}>
              {hub.name} ({id}) connected to:{" "}
              {hub.connections.join(", ") || "None"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
