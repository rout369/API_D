import dotenv from "dotenv";
import axios from "axios";
import express from "express";
import cors from "cors";

dotenv.config({ path: "config/.env" });

// --- Debug: Check Loaded Environment Variables ---
console.log("Loaded env vars:", {
  VT_API_KEY: process.env.VT_API_KEY ? "Present" : "Missing",
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY ? "Present" : "Missing",
  ABUSEIPDB_API_KEY: process.env.ABUSEIPDB_API_KEY ? "Present" : "Missing",
});

// --- Preloaded Keys (from .env) ---
const keys = [
  process.env.VT_API_KEY && {
    platform: "VirusTotal",
    key: process.env.VT_API_KEY,
    baseUrl: "https://www.virustotal.com/api/v3",
    testEndpoint: "/ip_addresses/8.8.8.8",
  },
  process.env.OPENWEATHER_API_KEY && {
    platform: "OpenWeatherMap",
    key: process.env.OPENWEATHER_API_KEY,
    baseUrl: "https://api.openweathermap.org/data/2.5",
    testEndpoint: "/weather?q=London&appid={key}",
  },
  process.env.ABUSEIPDB_API_KEY && {
    platform: "AbuseIPDB",
    key: process.env.ABUSEIPDB_API_KEY,
    baseUrl: "https://api.abuseipdb.com/api/v2",
    testEndpoint: "/check?ipAddress=8.8.8.8",
  },
].filter(Boolean);

// --- Debug: Check Loaded Keys ---
console.log(`Loaded ${keys.length} API keys:`, keys.map(k => k.platform));

// --- Startup Message ---
console.log(`[${new Date().toISOString()}] API Health Check Server running on localhost`);

// --- Track API Requests and Historical Data ---
let requestCount = 0; // Counter for API requests
let historicalResults = []; // Store historical health check results

// --- Health Check Logic ---
async function checkKeyStatus(entry) {
  const startTime = performance.now();
  let status, httpStatus, errorMessage;
  try {
    let response;
    switch (entry.platform) {
      case "VirusTotal":
        response = await axios.get(`${entry.baseUrl}${entry.testEndpoint}`, {
          headers: { "x-apikey": entry.key },
        });
        status = "OK";
        httpStatus = response.status;
        break;

      case "OpenWeatherMap":
        response = await axios.get(
          `${entry.baseUrl}${entry.testEndpoint.replace("{key}", entry.key)}`,
          { headers: {} }
        );
        status = "OK";
        httpStatus = response.status;
        break;

      case "AbuseIPDB":
        response = await axios.get(`${entry.baseUrl}${entry.testEndpoint}`, {
          headers: { Key: entry.key, Accept: "application/json" },
        });
        status = "OK";
        httpStatus = response.status;
        break;

      default:
        status = "Unknown Platform";
        httpStatus = null;
    }
  } catch (err) {
    httpStatus = err.response?.status || null;
    if (httpStatus === 401 || httpStatus === 403) {
      status = "Error: Authentication Failed";
      errorMessage = err.response?.data?.error?.message || "Invalid or unauthorized API key";
    } else if (httpStatus === 429) {
      status = "Error: Rate Limit Exceeded";
      errorMessage = err.response?.data?.error?.message || "Too many requests";
    } else {
      status = `Error: Request Failed`;
      errorMessage = err.response?.data?.error?.message || err.message;
    }
  }

  requestCount++; // Increment API request counter
  const responseTime = Math.round(performance.now() - startTime);
  const now = new Date().toISOString();
  const result = {
    platform: entry.platform,
    status,
    httpStatus: httpStatus || "N/A",
    responseTime: responseTime, // Store as number, not string
    errorMessage: errorMessage || null,
    timestamp: now,
  };

  console.log(
    `[${result.timestamp}] ${result.platform}: ${result.status} | HTTP: ${result.httpStatus} | Response Time: ${result.responseTime}ms${
      result.errorMessage ? ` | Error: ${result.errorMessage}` : ""
    }`
  );
  return result;
}

// --- Run Checks at Interval ---
let lastCheckTime = null;
let healthResults = [];
// async function runChecks() {
//   const currentTime = performance.now();
//   const intervalSinceLastCheck = lastCheckTime ? Math.round(currentTime - lastCheckTime) : "Initial";
//   lastCheckTime = currentTime;

//   console.log(`\n=== Checking API Keys (Interval: ${intervalSinceLastCheck}ms) ===`);
//   const cycleStartTime = performance.now();
//   const results = await Promise.all(keys.map(checkKeyStatus));
//   healthResults = results; // Store latest results for /health endpoint
//   historicalResults.push(...results); // Store in historical data
//   // Trim historical data to last 30 days (optional, to manage memory)
//   const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//   historicalResults = historicalResults.filter(r => new Date(r.timestamp) >= thirtyDaysAgo);
//   const cycleTime = Math.round(performance.now() - cycleStartTime);

//   console.log(`API Health Check completed in ${cycleTime}ms`);
// }


async function runChecks() {
  const currentTime = performance.now();
  const intervalSinceLastCheck = lastCheckTime ? Math.round(currentTime - lastCheckTime) : "Initial";
  lastCheckTime = currentTime;

  console.log(`\n=== Checking API Keys (Interval: ${intervalSinceLastCheck}ms) ===`);
  const cycleStartTime = performance.now();
  const results = await Promise.all(keys.map(checkKeyStatus));
  healthResults = results; // Store latest results for /health endpoint
  historicalResults.push(...results); // Store in historical data

  // Trim to last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  historicalResults = historicalResults.filter(r => new Date(r.timestamp) >= thirtyDaysAgo);

  const cycleTime = Math.round(performance.now() - cycleStartTime);
  console.log(`API Health Check completed in ${cycleTime}ms`);

  // 🔥 Aggregated stats logging here
  const avgResponseTime = healthResults.length > 0
    ? Math.round(healthResults.reduce((sum, r) => sum + r.responseTime, 0) / healthResults.length)
    : 0;

  const totalChecks = historicalResults.length;
  const successfulChecks = historicalResults.filter(r => r.status === "OK").length;
  const uptime = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(2) : 0;

  const apiRequests = requestCount;

  console.log("\n--- Aggregated API Stats ---");
  console.log(`Uptime: ${uptime}%`);
  console.log(`Average Response Time: ${avgResponseTime} ms`);
  console.log(`Total API Checks Today: ${apiRequests}`);
  console.log("----------------------------");
}


// --- Express Server ---
const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  // Convert responseTime back to string format for frontend compatibility
  const formattedResults = healthResults.map(result => ({
    ...result,
    responseTime: `${result.responseTime}ms`
  }));
  res.json(formattedResults);
});

// Stats endpoint for average response time, uptime, and API requests
app.get('/stats', (req, res) => {
  // Calculate average response time (using numeric values)
  const avgResponseTime = healthResults.length > 0
    ? Math.round(
        healthResults.reduce((sum, r) => sum + r.responseTime, 0) / healthResults.length
      )
    : 0;

  // Calculate uptime (percentage of successful checks in historical data)
  const totalChecks = historicalResults.length;
  const successfulChecks = historicalResults.filter(r => r.status === "OK").length;
  const uptime = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(2) : 0;

  // Get API request count
  const apiRequests = requestCount;
  res.json({
    avgResponseTime, // Return as number
    uptime: parseFloat(uptime), // Return as number
    apiRequests, // Return as number
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const interval = setInterval(runChecks, 40000); // Every 40 seconds
runChecks(); // Run immediately on start

// Optional: Graceful shutdown
process.on("SIGINT", () => {
  console.log("Stopping API checks...");
  clearInterval(interval);
  process.exit(0);
});