const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const AQI_TOKEN = "f03e7dc97296ee6ab3bee6ecdc5bfc3f3fb06a3e";

/*
AQI HISTORY FORMAT:
{
  Delhi: [
    { time: "...", aqi: 180 },
    { time: "...", aqi: 190 }
  ]
}
*/
const aqiHistory = {};

// ================= HELPER =================
async function fetchAndStoreAQI(city) {
  const url = `https://api.waqi.info/feed/${city}/?token=${AQI_TOKEN}`;
  const response = await axios.get(url);

  if (response.data.status !== "ok") {
    throw new Error("AQI fetch failed");
  }

  const data = response.data.data;
  const aqi = data.aqi;
  const time = new Date().toISOString();

  if (!aqiHistory[city]) {
    aqiHistory[city] = [];
  }

  aqiHistory[city].push({ time, aqi });

  // keep only last 24 readings
  if (aqiHistory[city].length > 24) {
    aqiHistory[city].shift();
  }

  return { data, aqi, time };
}

// ================= REAL‑TIME AQI =================
app.get("/api/city", async (req, res) => {
  const city = req.query.name;
  if (!city) {
    return res.status(400).json({ message: "City name required" });
  }

  try {
    const { data, aqi, time } = await fetchAndStoreAQI(city);

    let status = "Good";
    if (aqi > 300) status = "Hazardous";
    else if (aqi > 200) status = "Very Poor";
    else if (aqi > 150) status = "Poor";
    else if (aqi > 100) status = "Moderate";

    res.json({
      city: data.city.name,
      aqi,
      status,
      dominantPollutant: data.dominentpol || "N/A",

      // 🔥 ALL POLLUTANTS
      pollutants: data.iaqi || {},

      time,
      source: "AQICN (Real-Time)",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching AQI data",
      error: error.message,
    });
  }
});

// ================= 24‑HOUR HISTORY =================
app.get("/api/aqi-history", (req, res) => {
  const city = req.query.name;
  if (!city) {
    return res.status(400).json({ message: "City name required" });
  }

  res.json({
    city,
    history: aqiHistory[city] || [],
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
