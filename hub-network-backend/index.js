// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Create Express app
const app = express();
app.use(cors()); // Enable CORS to allow frontend connections
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB (adjust the URI if needed)
const mongoURI = "mongodb://localhost:27017/hub_network";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((e) => console.error("MongoDB connection error:", e));

// Define Mongoose schema and model for a Hub
const hubSchema = new mongoose.Schema({
  hubId: { type: String, unique: true, required: true }, // Unique identifier
  name: { type: String, required: true }, // Hub name
  connections: [{ type: String }], // Array of connected hubIds (strings)
});
const Hub = mongoose.model("Hub", hubSchema);

// API route: Add a new hub
app.post("/api/add_hub", async (req, res) => {
  try {
    const { hubId, name } = req.body;
    if (!hubId || !name)
      return res.status(400).json({ error: "hubId and name required" });

    // Check if Hub already exists
    if (await Hub.findOne({ hubId }))
      return res.status(400).json({ error: "Hub exists" });

    // Create and save new Hub
    const hub = new Hub({ hubId, name, connections: [] });
    await hub.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// API route: Connect two hubs bidirectionally
app.post("/api/connect_hubs", async (req, res) => {
  try {
    const { hubA, hubB } = req.body;
    if (!hubA || !hubB)
      return res.status(400).json({ error: "hubA and hubB required" });
    if (hubA === hubB)
      return res.status(400).json({ error: "Cannot connect same hub" });

    const h1 = await Hub.findOne({ hubId: hubA });
    const h2 = await Hub.findOne({ hubId: hubB });
    if (!h1 || !h2) return res.status(400).json({ error: "Hub not found" });

    // Add connections if not exist
    if (!h1.connections.includes(hubB)) {
      h1.connections.push(hubB);
      await h1.save();
    }
    if (!h2.connections.includes(hubA)) {
      h2.connections.push(hubA);
      await h2.save();
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// API route: Get all hubs
app.get("/api/hubs", async (req, res) => {
  try {
    const hubs = await Hub.find();
    const out = {};
    hubs.forEach((h) => {
      out[h.hubId] = { name: h.name, connections: h.connections };
    });
    res.json(out);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// API route: Find the shortest path between two hubs using BFS
app.post("/api/shortest_path", async (req, res) => {
  try {
    const { source, dest } = req.body;
    if (!source || !dest)
      return res.status(400).json({ error: "source and dest required" });

    // Build adjacency list graph from DB
    const hubs = await Hub.find();
    const graph = {};
    hubs.forEach((h) => {
      graph[h.hubId] = h.connections;
    });

    if (!(source in graph) || !(dest in graph)) {
      return res.status(400).json({ error: "Hub not found" });
    }

    // BFS algorithm to find shortest path
    const queue = [[source, [source]]];
    const visited = new Set([source]);

    while (queue.length) {
      const [current, path] = queue.shift();
      if (current === dest) return res.json({ path });

      for (const neighbor of graph[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
    // No path found
    res.json({ path: [] });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Start backend server at port 5000
const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
