# 🇮🇳 BreatheSmart — Autonomous Civic Air Intelligence

> *"Not a monitoring tool. The first autonomous civic intelligence system that sees, predicts, acts — and speaks every Indian's language."*

## What is BreatheSmart?

BreatheSmart is  autonomous civic AI system for air quality. It doesn't just show you AQI — it automatically files complaints, dispatches trucks, alerts schools, and serves legal notices in **47 seconds. Zero humans involved.**

---

## Features

### Citizen Mode
- Real-time AQI of selected city
- Pollution status — Good / Moderate / Poor / Hazardous
- Dominant pollutant display
- Pollutant breakdown — PM2.5, PM10, NO2, SO2, O3, CO
- Full 24-hour AQI trend graph with rush hour patterns
- Health Impact Calculator — "Today = smoking 3 cigarettes"
- Lifetime Breathe Score
- India-wide pollution heatmap

### Authority Mode
- City-wise pollution ranking with severity badges
- High-risk zones highlighted with Action Required indicators
- Auto-generated policy recommendations
- Industrial Compliance Watchdog — flags repeat offender factories
- Ambulance routing advisor — avoids high-AQI corridors

### PollutionBot — World's First Autonomous Civic AI Agent
- Ward spike detected → complaint filed → truck dispatched → school alerted → legal notice served
- **47 seconds. Zero humans. Zero delay. Zero excuse.**
- Every action logged, timestamped, publicly visible

### Multilingual Voice Assistant
- Speak in Hindi, Marathi, Gujarati, Tamil, Telugu & more
- Ask: "Aaj bahar jaana safe hai kya?" — get instant answer in same language
- Powered by Claude AI Web Speech API

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Chart.js, React-Leaflet |
| Backend | Node.js, Express.js |
| AQI Data | AQICN Real-Time API |
| Maps | OpenStreetMap + CartoDB Dark |
| Voice | Web Speech API + Claude AI |

---

## Setup & Installation

### Backend
```bash
cd Backend
npm install
node server.js
```
Runs on `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm start
```
Runs on `http://localhost:3000`

---

## Project Structure
```
BreatheSmart/
├── Backend/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── README.md
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/city?name=Delhi` | Real-time AQI for a city |
| `GET /api/aqi-history?name=Delhi` | Last 24 AQI readings |

---

*BreatheSmart © 2025 — Every breath counted. Every second matters.*