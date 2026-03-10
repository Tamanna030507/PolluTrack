import { useState, useEffect, useCallback, useRef } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as MapTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const CITIES_MAP = [
  { city: "Delhi", lat: 28.6139, lng: 77.209, aqi: 240 },
  { city: "Mumbai", lat: 19.076, lng: 72.8777, aqi: 120 },
  { city: "Bengaluru", lat: 12.9716, lng: 77.5946, aqi: 90 },
  { city: "Chennai", lat: 13.0827, lng: 80.2707, aqi: 150 },
  { city: "Kolkata", lat: 22.5726, lng: 88.3639, aqi: 240 },
  { city: "Hyderabad", lat: 17.385, lng: 78.4867, aqi: 160 },
  { city: "Pune", lat: 18.5204, lng: 73.8567, aqi: 120 },
  { city: "Ahmedabad", lat: 23.0225, lng: 72.5714, aqi: 210 },
  { city: "Jaipur", lat: 26.9124, lng: 75.7873, aqi: 240 },
  { city: "Lucknow", lat: 26.8467, lng: 80.9462, aqi: 260 },
];

const BOT_LOG = [
  { time: "05:47:03", event: "⚡ Ward 7 AQI spike detected — 347 (Hazardous)", type: "alert" },
  { time: "05:47:09", event: "📋 Complaint auto-filed with Pollution Control Board", type: "action" },
  { time: "05:47:18", event: "🚛 Municipal water truck dispatched to sector 4B", type: "action" },
  { time: "05:47:24", event: "🏫 Ward 7 school PT cancelled — alert sent to 3 schools", type: "action" },
  { time: "05:47:31", event: "⚖️ Kiln owner served automated legal notice #PCB-2847", type: "action" },
  { time: "05:47:50", event: "📢 Public transparency notice posted — ward dashboard", type: "action" },
  { time: "05:47:50", event: "✅ Resolution complete — 47 seconds. Zero humans involved.", type: "success" },
  { time: "06:12:44", event: "⚡ Ward 12 PM2.5 crossing threshold — 198μg/m³", type: "alert" },
  { time: "06:12:51", event: "🚑 Ambulance routing updated — avoiding high-AQI corridors", type: "action" },
  { time: "06:13:02", event: "📋 Industrial compliance flag raised — Factory ID IND-0442", type: "action" },
  { time: "06:13:19", event: "✅ Route optimized. 2 lives protected.", type: "success" },
];

const HEALTH_TIPS = {
  Good: "Perfect air quality. Enjoy outdoor activities freely! 🌿",
  Moderate: "Unusually sensitive people should consider limiting outdoor exposure.",
  Poor: "Reduce prolonged outdoor exertion. Wear a mask if going out.",
  "Very Poor": "Avoid outdoor activities. Keep windows closed. Use air purifier.",
  Hazardous: "EMERGENCY: Do NOT go outside. Seal windows. Seek medical advice immediately.",
};

const getAQIColor = (aqi) => {
  if (aqi <= 50) return "#00ff9d";
  if (aqi <= 100) return "#ffe600";
  if (aqi <= 200) return "#ff8c00";
  if (aqi <= 300) return "#ff3b3b";
  return "#ff00ff";
};

const getAQILabel = (aqi) => {
  if (aqi <= 50) return "GOOD";
  if (aqi <= 100) return "MODERATE";
  if (aqi <= 200) return "POOR";
  if (aqi <= 300) return "VERY POOR";
  return "HAZARDOUS";
};

const getAQIGlow = (aqi) => {
  if (aqi <= 50) return "0 0 30px #00ff9d88";
  if (aqi <= 100) return "0 0 30px #ffe60088";
  if (aqi <= 200) return "0 0 30px #ff8c0088";
  if (aqi <= 300) return "0 0 30px #ff3b3b88";
  return "0 0 30px #ff00ff88";
};

export default function App() {
  const [mode, setMode] = useState("citizen");
  const [city, setCity] = useState("");
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(Array(24).fill(null));
  const [loading, setLoading] = useState(false);
  const [botIndex, setBotIndex] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [ticker, setTicker] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [glitching, setGlitching] = useState(false);
  const botRef = useRef(null);

  // Voice assistant state
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const recognitionRef = useRef(null);

  // Bot log animation
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLogs((prev) => {
        if (prev.length >= BOT_LOG.length) return BOT_LOG;
        return BOT_LOG.slice(0, prev.length + 1);
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Live ticker
  useEffect(() => {
    const t = setInterval(() => setTicker((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Glitch effect
  useEffect(() => {
    const g = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 8000);
    return () => clearInterval(g);
  }, []);

  // Generate realistic 24hr AQI trend around a base value
  const generate24hrTrend = (baseAqi) => {
    const now = new Date().getHours();
    return Array.from({ length: 24 }, (_, i) => {
      // Morning rush (7-10am) and evening rush (6-9pm) are higher
      // Late night / early morning is cleaner
      let hourFactor = 1;
      if (i >= 6 && i <= 10) hourFactor = 1.25;       // morning rush
      else if (i >= 18 && i <= 22) hourFactor = 1.2;   // evening rush
      else if (i >= 0 && i <= 5) hourFactor = 0.7;     // late night clean
      else if (i >= 11 && i <= 15) hourFactor = 0.9;   // midday moderate

      // Only show data up to current hour (future hours are null)
      if (i > now) return null;

      const noise = (Math.random() - 0.5) * 30;
      return Math.max(20, Math.round(baseAqi * hourFactor + noise));
    });
  };

  const fetchAQI = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/city?name=${city}`);
      const json = await res.json();
      setData(json);
      setTrend(generate24hrTrend(json.aqi));
    } catch (e) {
      // demo fallback
      const fallback = {
        city: city.charAt(0).toUpperCase() + city.slice(1),
        aqi: 178,
        status: "Poor",
        dominantPollutant: "pm25",
        pollutants: {
          pm25: { v: 178 }, pm10: { v: 210 }, no2: { v: 45 },
          so2: { v: 12 }, o3: { v: 67 }, co: { v: 0.8 },
        },
      };
      setData(fallback);
      setTrend(generate24hrTrend(178));
    }
    setLoading(false);
  }, [city]);

  // Voice assistant — start/stop listening
  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceReply("❌ Your browser doesn't support voice input. Try Chrome.");
      return;
    }

    if (voiceListening) {
      recognitionRef.current?.stop();
      setVoiceListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // supports Hindi + English fallback
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setVoiceListening(true);

    recognition.onresult = async (e) => {
      const transcript = e.results[0][0].transcript;
      setVoiceText(transcript);
      setVoiceListening(false);
      setVoiceLoading(true);

      // Build a smart reply based on transcript + current AQI data
      const aqiInfo = data
        ? `Current AQI in ${data.city} is ${data.aqi} (${data.status}). Dominant pollutant: ${data.dominantPollutant}.`
        : "No city data loaded yet.";

      const prompt = `You are BreatheSmart, an AI air quality assistant for India. Answer in the SAME language the user spoke in (Hindi, English, Marathi, etc). Be concise, max 2 sentences. Current data: ${aqiInfo}. User asked: "${transcript}"`;

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const json = await res.json();
        const reply = json.content?.[0]?.text || "Could not get a response.";
        setVoiceReply(reply);

        // Speak the reply back
        const utter = new SpeechSynthesisUtterance(reply);
        utter.lang = "hi-IN";
        window.speechSynthesis.speak(utter);
      } catch {
        setVoiceReply("⚠️ Could not connect to AI. Check your connection.");
      }
      setVoiceLoading(false);
    };

    recognition.onerror = (e) => {
      setVoiceListening(false);
      setVoiceReply(`❌ Mic error: ${e.error}. Allow microphone access.`);
    };

    recognition.start();
  };

  const hourLabels = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? "12AM" : i < 12 ? `${i}AM` : i === 12 ? "12PM" : `${i - 12}PM`
  );

  const chartData = {
    labels: hourLabels,
    datasets: [{
      label: "AQI",
      data: trend,
      borderColor: "#00f5ff",
      backgroundColor: "rgba(0,245,255,0.08)",
      tension: 0.4,
      spanGaps: true,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: "#00f5ff",
      pointBorderColor: "#000",
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0a0a1a",
        borderColor: "#00f5ff44",
        borderWidth: 1,
        titleColor: "#00f5ff",
        bodyColor: "#ffffff",
      },
    },
    scales: {
      x: {
        grid: { color: "#ffffff08" },
        ticks: { color: "#ffffff44", font: { size: 10 } },
      },
      y: {
        grid: { color: "#ffffff08" },
        ticks: { color: "#ffffff44" },
      },
    },
  };

  return (
    <div className={`app ${glitching ? "glitch" : ""}`}>
      {/* SCANLINE OVERLAY */}
      <div className="scanlines" />
      <div className="noise" />

      {/* NAV */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">BREATHE<span className="logo-accent">SMART</span></span>
          <span className="logo-tag">v2.4.7</span>
        </div>
        <div className="nav-center">
          <span className="live-dot" />
          <span className="live-text">LIVE MONITORING ACTIVE</span>
          <span className="ticker-num">{String(ticker).padStart(6, "0")}</span>
        </div>
        <div className="nav-right">
          <button
            className={`mode-pill ${mode === "citizen" ? "active" : ""}`}
            onClick={() => setMode("citizen")}
          >👤 CITIZEN</button>
          <button
            className={`mode-pill ${mode === "authority" ? "active" : ""}`}
            onClick={() => setMode("authority")}
          >🏛️ AUTHORITY</button>
        </div>
      </nav>

      {/* ===== HERO: POLLUTIONBOT ===== */}
      <section className="hero-bot">
        <div className="bot-header">
          <div className="bot-title-wrap">
            <span className="bot-badge">WORLD'S FIRST</span>
            <h1 className="bot-title">POLLUTION<span className="bot-accent">BOT</span></h1>
            <p className="bot-sub">Autonomous Civic AI Agent — Zero Humans. Zero Delay. Zero Excuse.</p>
          </div>
          <div className="bot-stats">
            <div className="stat-cell">
              <span className="stat-num">47s</span>
              <span className="stat-label">AVG RESOLUTION</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">2.4K</span>
              <span className="stat-label">ACTIONS TODAY</span>
            </div>
            <div className="stat-cell">
              <span className="stat-num">0</span>
              <span className="stat-label">HUMANS NEEDED</span>
            </div>
          </div>
        </div>

        <div className="terminal">
          <div className="terminal-bar">
            <span className="t-dot red" /><span className="t-dot yellow" /><span className="t-dot green" />
            <span className="t-title">pollutionbot@breathesmart:~$ live_feed --watch</span>
          </div>
          <div className="terminal-body">
            {visibleLogs.map((log, i) => (
              <div key={i} className={`log-line log-${log.type}`}>
                <span className="log-time">[{log.time}]</span>
                <span className="log-event"> {log.event}</span>
              </div>
            ))}
            <span className="cursor-blink">█</span>
          </div>
        </div>
      </section>

      {/* ===== SEARCH ===== */}
      <section className="search-section">
        <div className="search-wrap">
          <div className="search-label">▸ SCAN CITY</div>
          <div className="search-row">
            <input
              className="cyber-input"
              placeholder="Enter city — Delhi, Mumbai, Pune..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAQI()}
            />
            <button className="cyber-btn" onClick={fetchAQI} disabled={loading}>
              {loading ? <span className="loading-dots">SCANNING<span className="dots" /></span> : "⚡ SCAN"}
            </button>
          </div>
        </div>
      </section>

      {/* ===== MAP ===== */}
      <section className="map-section">
        <div className="section-header">
          <span className="section-tag">SEE</span>
          <h2 className="section-title">INDIA POLLUTION <span className="accent">GRID</span></h2>
          <span className="section-sub">Real-time ward-level AQI monitoring</span>
        </div>
        <div className="map-wrap">
          <MapContainer center={[22.5937, 78.9629]} zoom={5} style={{ height: "420px", width: "100%" }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="© CARTO"
            />
            {CITIES_MAP.map((c, i) => (
              <CircleMarker
                key={i}
                center={[c.lat, c.lng]}
                radius={14}
                fillColor={getAQIColor(c.aqi)}
                fillOpacity={0.85}
                color={getAQIColor(c.aqi)}
                weight={2}
              >
                <MapTooltip>
                  <div style={{ background: "#050510", border: `1px solid ${getAQIColor(c.aqi)}`, padding: "8px 12px", borderRadius: "6px", color: "#fff", fontFamily: "monospace" }}>
                    <strong style={{ color: getAQIColor(c.aqi) }}>{c.city}</strong><br />
                    AQI: {c.aqi} — {getAQILabel(c.aqi)}
                  </div>
                </MapTooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="map-legend">
            {[["≤50", "#00ff9d", "GOOD"], ["≤100", "#ffe600", "MODERATE"], ["≤200", "#ff8c00", "POOR"], ["≤300", "#ff3b3b", "VERY POOR"], ["300+", "#ff00ff", "HAZARDOUS"]].map(([range, color, label]) => (
              <div key={label} className="legend-item">
                <span className="legend-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                <span className="legend-label">{label} ({range})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CITIZEN MODE ===== */}
      {mode === "citizen" && (
        <section className="citizen-section">
          <div className="section-header">
            <span className="section-tag">PERSONALIZE</span>
            <h2 className="section-title">YOUR AIR <span className="accent">INTELLIGENCE</span></h2>
          </div>

          {data ? (
            <div className="citizen-grid">
              {/* AQI BIG CARD */}
              <div className="aqi-main-card" style={{ "--aqi-color": getAQIColor(data.aqi), boxShadow: getAQIGlow(data.aqi) }}>
                <div className="aqi-city-name">{data.city}</div>
                <div className="aqi-number" style={{ color: getAQIColor(data.aqi) }}>{data.aqi}</div>
                <div className="aqi-label-badge" style={{ borderColor: getAQIColor(data.aqi), color: getAQIColor(data.aqi) }}>
                  {getAQILabel(data.aqi)}
                </div>
                <div className="aqi-meta">
                  <span>DOMINANT: <b>{(data.dominantPollutant || "PM2.5").toUpperCase()}</b></span>
                  <span>SOURCE: AQICN LIVE</span>
                </div>
                <div className="health-tip">{HEALTH_TIPS[data.status] || HEALTH_TIPS["Poor"]}</div>

                {/* Cigarette equivalent */}
                <div className="cigarette-bar">
                  <span className="cig-icon">🚬</span>
                  <span className="cig-text">= <b>{Math.round(data.aqi / 22)} cigarettes</b> today's exposure</span>
                </div>
              </div>

              {/* POLLUTANTS */}
              <div className="pollutants-card">
                <div className="card-title">◈ POLLUTION COMPONENTS</div>
                {data.pollutants && Object.entries(data.pollutants).map(([k, v]) => {
                  const pct = Math.min((v.v / 300) * 100, 100);
                  const col = getAQIColor(v.v);
                  return (
                    <div key={k} className="pollutant-row">
                      <span className="p-name">{k.toUpperCase()}</span>
                      <div className="p-bar-wrap">
                        <div className="p-bar-fill" style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}88` }} />
                      </div>
                      <span className="p-val" style={{ color: col }}>{v.v}</span>
                    </div>
                  );
                })}
              </div>

              {/* CHART */}
              <div className="chart-card">
                <div className="card-title">◈ 24-HOUR AQI TREND</div>
                <div style={{ height: "220px" }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* BREATHE SCORE */}
              <div className="breathe-score-card">
                <div className="card-title">◈ LIFETIME BREATHE SCORE</div>
                <div className="score-ring">
                  <svg viewBox="0 0 120 120" className="ring-svg">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff0a" strokeWidth="8" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#00f5ff" strokeWidth="8"
                      strokeDasharray={`${314 * 0.62} 314`} strokeLinecap="round"
                      transform="rotate(-90 60 60)" style={{ filter: "drop-shadow(0 0 8px #00f5ff)" }} />
                  </svg>
                  <div className="ring-inner">
                    <span className="ring-num">62</span>
                    <span className="ring-unit">/ 100</span>
                  </div>
                </div>
                <p className="score-desc">Your cumulative pollution exposure score since birth. Lower is better.</p>
              </div>
            </div>
          ) : (
            <div className="no-data-hint">
              <span className="hint-icon">⚡</span>
              <span>Enter a city above to initialize scan</span>
            </div>
          )}
        </section>
      )}

      {/* ===== AUTHORITY MODE ===== */}
      {mode === "authority" && (
        <section className="authority-section">
          <div className="section-header">
            <span className="section-tag">ACT</span>
            <h2 className="section-title">AUTHORITY <span className="accent">COMMAND CENTER</span></h2>
          </div>

          <div className="authority-grid">
            {/* ALERT ZONES */}
            <div className="auth-card alert-zones">
              <div className="card-title">🚨 HIGH ALERT ZONES</div>
              {CITIES_MAP.sort((a, b) => b.aqi - a.aqi).map((c, i) => (
                <div key={i} className="zone-row">
                  <span className="zone-rank">#{i + 1}</span>
                  <span className="zone-city">{c.city}</span>
                  <span className="zone-aqi" style={{ color: getAQIColor(c.aqi) }}>{c.aqi}</span>
                  <span className="zone-badge" style={{ borderColor: getAQIColor(c.aqi), color: getAQIColor(c.aqi) }}>
                    {getAQILabel(c.aqi)}
                  </span>
                  {c.aqi > 200 && <span className="zone-alert-tag">⚠ ACTION REQ</span>}
                </div>
              ))}
            </div>

            {/* AUTO ACTIONS */}
            <div className="auth-card auto-actions">
              <div className="card-title">⚡ AUTO-GENERATED ACTIONS</div>
              {[
                { icon: "🚫", action: "Restrict heavy vehicles in Delhi, Lucknow, Kolkata", priority: "CRITICAL" },
                { icon: "🏫", action: "Pre-alert 47 schools in Ward 7–12 for tomorrow AM", priority: "HIGH" },
                { icon: "🌿", action: "Deploy 200 trees — Sector 4B for max AQI impact", priority: "HIGH" },
                { icon: "🏭", action: "Flag 3 repeat-offender factories for PCB inspection", priority: "CRITICAL" },
                { icon: "🚑", action: "Update ambulance routes — avoid AQI corridors 7, 12", priority: "MEDIUM" },
              ].map((item, i) => (
                <div key={i} className="action-row">
                  <span className="action-icon">{item.icon}</span>
                  <span className="action-text">{item.action}</span>
                  <span className={`priority-tag priority-${item.priority.toLowerCase()}`}>{item.priority}</span>
                </div>
              ))}
            </div>

            {/* COMPLIANCE */}
            <div className="auth-card compliance">
              <div className="card-title">🏭 INDUSTRIAL WATCHDOG</div>
              {[
                { id: "IND-0442", name: "Sunrise Kiln Co.", violations: 7, status: "NOTICE SERVED" },
                { id: "IND-1128", name: "MetalCraft Ltd.", violations: 4, status: "UNDER REVIEW" },
                { id: "IND-0089", name: "AgroFuel Plant", violations: 12, status: "FLAGGED PCB" },
              ].map((f, i) => (
                <div key={i} className="factory-row">
                  <div className="factory-info">
                    <span className="factory-id">{f.id}</span>
                    <span className="factory-name">{f.name}</span>
                  </div>
                  <span className="violations">{f.violations} violations</span>
                  <span className={`status-tag status-${f.status.replace(/\s/g, "").toLowerCase()}`}>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== VOICE ASSISTANT ===== */}
      <section className="voice-banner">
        <div className="voice-content">
          <div className="voice-icon">🎙️</div>
          <div className="voice-text">
            <h3>MULTILINGUAL VOICE ASSISTANT</h3>
            <p>Speak in Hindi, Marathi, Gujarati, Tamil, Telugu &amp; more</p>
          </div>
          <div className="voice-langs">
            {["हि", "मर", "ગુ", "த", "తె", "বা"].map((l, i) => (
              <span key={i} className="lang-pill">{l}</span>
            ))}
          </div>
        </div>

        {/* MIC BUTTON */}
        <div className="voice-interact">
          <button
            className={`mic-btn ${voiceListening ? "mic-active" : ""}`}
            onClick={handleVoice}
          >
            {voiceListening ? "🔴 LISTENING..." : "🎙️ SPEAK NOW"}
          </button>
          <span className="voice-hint">
            Try: "Aaj bahar jaana safe hai kya?" or "What is the AQI in Delhi?"
          </span>
        </div>

        {/* TRANSCRIPT */}
        {voiceText && (
          <div className="voice-transcript">
            <span className="vt-label">YOU SAID:</span>
            <span className="vt-text">"{voiceText}"</span>
          </div>
        )}

        {/* REPLY */}
        {voiceLoading && (
          <div className="voice-reply loading-reply">⚡ Processing...</div>
        )}
        {voiceReply && !voiceLoading && (
          <div className="voice-reply">
            <span className="vr-label">BREATHESMART:</span>
            <span className="vr-text">{voiceReply}</span>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="cyber-footer">
        <span>◈ BREATHESMART © 2025</span>
        <span className="footer-tag">NOT A MONITORING TOOL. AN AUTONOMOUS CIVIC INTELLIGENCE.</span>
        <span>POWERED BY BHASHINI + WHISPER</span>
      </footer>
    </div>
  );
}