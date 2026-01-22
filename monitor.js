const express = require("express");
const axios = require("axios");
const cron = require("node-cron");

const app = express();
const PORT = 5000;

// In-memory storage (bare minimum)
let logs = [];

// Check network endpoint
async function checkDevice() {
  const start = Date.now();
  try {
    await axios.get("https://google.com");
    const latency = Date.now() - start;

    logs.push({
      status: "UP",
      latency,
      time: new Date().toLocaleTimeString()
    });

    console.log("UP -", latency, "ms");
  } catch {
    logs.push({
      status: "DOWN",
      latency: null,
      time: new Date().toLocaleTimeString()
    });

    console.log("ALERT: Device is DOWN");
  }

  logs = logs.slice(-10); // keep last 10 records
}

// Run every minute
cron.schedule("*/1 * * * *", checkDevice);

// API endpoint
app.get("/metrics", (req, res) => {
  res.json(logs);
});

// Dashboard UI
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Network Health Monitor</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h2>Network Health Monitoring Dashboard</h2>
  <canvas id="chart"></canvas>

  <script>
    async function loadData() {
      const res = await fetch("/metrics");
      const data = await res.json();

      const labels = data.map(d => d.time);
      const latency = data.map(d => d.latency);

      new Chart(document.getElementById("chart"), {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Latency (ms)",
            data: latency,
            borderColor: "blue"
          }]
        }
      });
    }
    loadData();
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
