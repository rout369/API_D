// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import fetch from "node-fetch";  
// import fs from "fs";
// import path from "path";
// // import os from "os";

// const app = express();
// const PORT = 5000;

// // Put apis.json inside config folder
// const DATA_FILE = path.join(process.cwd(), "config", "apis.json");
// const HISTORY_FILE = path.join(process.cwd(), "config", "api_history.json");

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // ===== Utilities ===== //
// function loadAPIs() {
//   try {
//     // Create directory if it doesn't exist
//     if (!fs.existsSync(path.dirname(DATA_FILE))) {
//       fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
//     }
    
//     // Check if file exists and has content
//     if (!fs.existsSync(DATA_FILE)) {
//       // Create file with empty array if it doesn't exist
//       fs.writeFileSync(DATA_FILE, JSON.stringify([]));
//       return [];
//     }
    
//     // Read file content
//     const data = fs.readFileSync(DATA_FILE, 'utf-8').trim();
    
//     // If file is empty, return empty array
//     if (!data) {
//       return [];
//     }
    
//     // Parse and return the data
//     return JSON.parse(data);
//   } catch (err) {
//     console.error("❌ Error reading APIs file:", err);
//     // Return empty array instead of crashing
//     return [];
//   }
// }

// function loadAPIHistory() {
//   try {
//     // Create directory if it doesn't exist
//     if (!fs.existsSync(path.dirname(HISTORY_FILE))) {
//       fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
//     }
    
//     // Check if file exists and has content
//     if (!fs.existsSync(HISTORY_FILE)) {
//       // Create file with empty object if it doesn't exist
//       fs.writeFileSync(HISTORY_FILE, JSON.stringify({}));
//       return {};
//     }
    
//     // Read file content
//     const data = fs.readFileSync(HISTORY_FILE, 'utf-8').trim();
    
//     // If file is empty, return empty object
//     if (!data) {
//       return {};
//     }
    
//     // Parse and return the data
//     return JSON.parse(data);
//   } catch (err) {
//     console.error("❌ Error reading API history file:", err);
//     // Return empty object instead of crashing
//     return {};
//   }
// }

// function saveAPIs(apis) {
//   try {
//     // Ensure directory exists
//     if (!fs.existsSync(path.dirname(DATA_FILE))) {
//       fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
//     }
    
//     // Write to file
//     fs.writeFileSync(DATA_FILE, JSON.stringify(apis, null, 2));
//     console.log("✅ APIs saved successfully");
//   } catch (err) {
//     console.error("❌ Error saving APIs file:", err);
//     throw err;
//   }
// }

// function saveAPIHistory(history) {
//   try {
//     // Ensure directory exists
//     if (!fs.existsSync(path.dirname(HISTORY_FILE))) {
//       fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
//     }
    
//     // Write to file
//     fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
//     console.log("✅ API history saved successfully");
//   } catch (err) {
//     console.error("❌ Error saving API history file:", err);
//     throw err;
//   }
// }

// function addAPIHistoryEntry(apiId, success, responseTime) {
//   try {
//     const history = loadAPIHistory();
//     const timestamp = new Date().toISOString();
//     const entry = { timestamp, success, responseTime };
    
//     if (!history[apiId]) {
//       history[apiId] = [];
//     }
    
//     // Add new entry and keep only last 100 entries per API
//     history[apiId].push(entry);
//     if (history[apiId].length > 100) {
//       history[apiId] = history[apiId].slice(-100);
//     }
    
//     saveAPIHistory(history);
//     return true;
//   } catch (err) {
//     console.error("❌ Error adding API history entry:", err);
//     return false;
//   }
// }

// function calculateSuccessRate(apiId, hours = 24) {
//   try {
//     const history = loadAPIHistory();
//     const apiHistory = history[apiId] || [];
    
//     if (apiHistory.length === 0) return 0;
    
//     const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
//     const recentChecks = apiHistory.filter(entry => 
//       new Date(entry.timestamp) > cutoffTime
//     );
    
//     if (recentChecks.length === 0) return 0;
    
//     const successfulChecks = recentChecks.filter(entry => entry.success);
//     return (successfulChecks.length / recentChecks.length) * 100;
//   } catch (err) {
//     console.error("❌ Error calculating success rate:", err);
//     return 0;
//   }
// }

// // ===== Routes ===== //

// // ➤ Add new API
// app.post("/api/add", async (req, res) => {
//   const { apiName, apiKey, baseUrl, endpoint } = req.body;

//   if (!apiName || !apiKey || !baseUrl || !endpoint) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     new URL(baseUrl);
//   } catch {
//     return res.status(400).json({ error: "Invalid Base URL" });
//   }

//   let status = "offline";
//   let responseTime = 0;
//   let success = false;

//   try {
//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

//     let finalEndpoint = endpoint.replace("{key}", apiKey);
//     const startTime = Date.now();

//     const resp = await fetch(`${baseUrl}${finalEndpoint}`, {
//       method: "GET",
//       headers: { Authorization: `Bearer ${apiKey}` },
//       signal: controller.signal,
//     });

//     responseTime = Date.now() - startTime;
//     clearTimeout(timeout);

//     if (resp.ok) {
//       status = "online";
//       success = true;
//     } else {
//       status = "degraded";
//       success = false;
//     }
//   } catch (error) {
//     status = "offline";
//     success = false;
//     console.error("API check error:", error);
//   }

//   try {
//     const apis = loadAPIs();
//     const newApi = {
//       id: Date.now(),
//       name: apiName,
//       key: apiKey,
//       baseUrl,
//       endpoint,
//       status,
//       addedAt: new Date().toISOString(),
//       maintenanceMode: false // Add maintenance mode flag
//     };

//     apis.push(newApi);
//     saveAPIs(apis);

//     // Add to history
//     addAPIHistoryEntry(newApi.id, success, responseTime);

//     return res.json({ 
//       success: true, 
//       api: newApi,
//       initialCheck: { success, responseTime }
//     });
//   } catch (error) {
//     console.error("❌ Error saving API:", error);
//     return res.status(500).json({ error: "Failed to save API" });
//   }
// });

// // ➤ Get all APIs with success rates
// app.get("/api/list", (req, res) => {
//   try {
//     const apis = loadAPIs();
    
//     // Enhance each API with success rate
//     const apisWithStats = apis.map(api => ({
//       ...api,
//       successRate: calculateSuccessRate(api.id, 24), // 24-hour success rate
//     }));
    
//     res.json(apisWithStats);
//   } catch (error) {
//     console.error("❌ Error loading APIs:", error);
//     res.status(500).json({ error: "Failed to load APIs" });
//   }
// });

// // ➤ Get API details
// app.get("/api/details/:id", (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const apis = loadAPIs();
//     const history = loadAPIHistory();
    
//     const api = apis.find(a => a.id.toString() === id);
    
//     if (!api) {
//       return res.status(404).json({ error: "API not found" });
//     }
    
//     // Get API history - return last 50 entries for charts
//     const apiHistory = history[id] || [];
    
//     // Format timestamps for frontend display (convert to local time)
//     const formattedHistory = apiHistory.map(entry => ({
//       ...entry,
//       // Convert to local time string for display
//       localTime: new Date(entry.timestamp).toLocaleTimeString(),
//       timestamp: entry.timestamp // Keep ISO format for calculations
//     }));
    
//     // Calculate success rate
//     const successRate = calculateSuccessRate(id, 24);
    
//     // Find last check time and response time
//     const lastCheck = apiHistory.length > 0 ? apiHistory[apiHistory.length - 1] : null;
    
//     res.json({
//       ...api,
//       history: formattedHistory, // Send formatted history with local time
//       successRate,
//       lastChecked: lastCheck ? lastCheck.timestamp : null,
//       responseTime: lastCheck ? lastCheck.responseTime : null
//     });
    
//   } catch (error) {
//     console.error("❌ Error loading API details:", error);
//     res.status(500).json({ error: "Failed to load API details" });
//   }
// });

// // ➤ Check health of a specific API
// app.post("/api/check/:id", async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const apis = loadAPIs();
//     const api = apis.find(a => a.id.toString() === id);
    
//     if (!api) {
//       return res.status(404).json({ error: "API not found" });
//     }
    
//     // Skip check if in maintenance mode
//     if (api.maintenanceMode) {
//       return res.json({
//         success: false,
//         apiName: api.name,
//         status: "maintenance",
//         responseTime: 0,
//         successRate: calculateSuccessRate(api.id, 24),
//         error: "API is in maintenance mode",
//         timestamp: new Date().toISOString()
//       });
//     }
    
//     let status = "offline";
//     let responseTime = 0;
//     let success = false;
//     let errorMessage = null;

//     try {
//       const controller = new AbortController();
//       const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

//       let finalEndpoint = api.endpoint.replace("{key}", api.key);
//       const startTime = Date.now();

//       const resp = await fetch(`${api.baseUrl}${finalEndpoint}`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${api.key}` },
//         signal: controller.signal,
//       });

//       responseTime = Date.now() - startTime;
//       clearTimeout(timeout);

//       if (resp.ok) {
//         status = "online";
//         success = true;
//       } else {
//         status = "degraded";
//         success = false;
//         errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
//       }
//     } catch (error) {
//       status = "offline";
//       success = false;
//       errorMessage = error.message;
//       console.error("Health check error:", error);
//     }
    
//     // Update API status
//     api.status = status;
//     api.lastChecked = new Date().toISOString();
//     saveAPIs(apis);
    
//     // Add to history
//     addAPIHistoryEntry(api.id, success, responseTime);
    
//     // Calculate updated success rate
//     const successRate = calculateSuccessRate(api.id, 24);
    
//     res.json({
//       success: success,
//       apiName: api.name,
//       status,
//       responseTime,
//       successRate,
//       error: errorMessage,
//       timestamp: new Date().toISOString()
//     });
    
//   } catch (error) {
//     console.error("❌ Error checking API health:", error);
//     res.status(500).json({ error: "Failed to check API health" });
//   }
// });

// // ➤ Toggle maintenance mode for API
// app.post("/api/maintenance/:id", (req, res) => {
//   const { id } = req.params;
//   const { maintenance } = req.body;
  
//   try {
//     const apis = loadAPIs();
//     const api = apis.find(a => a.id.toString() === id);
    
//     if (!api) {
//       return res.status(404).json({ error: "API not found" });
//     }
    
//     // Toggle maintenance mode
//     api.maintenanceMode = maintenance !== undefined ? maintenance : !api.maintenanceMode;
    
//     // If putting into maintenance, set status accordingly
//     if (api.maintenanceMode) {
//       api.status = "maintenance";
//     }
    
//     saveAPIs(apis);
    
//     res.json({ 
//       success: true, 
//       message: `Maintenance mode ${api.maintenanceMode ? "enabled" : "disabled"}`,
//       maintenanceMode: api.maintenanceMode
//     });
    
//   } catch (error) {
//     console.error("❌ Error toggling maintenance mode:", error);
//     res.status(500).json({ error: "Failed to toggle maintenance mode" });
//   }
// });

// // ➤ Restart API monitoring (simulated)
// app.post("/api/restart/:id", (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const apis = loadAPIs();
//     const api = apis.find(a => a.id.toString() === id);
    
//     if (!api) {
//       return res.status(404).json({ error: "API not found" });
//     }
    
//     // Simulate restart by clearing error state and doing a fresh check
//     if (api.status === "offline" || api.status === "degraded") {
//       api.status = "checking";
//       saveAPIs(apis);
      
//       // Simulate restart delay
//       setTimeout(() => {
//         // This would trigger an actual check in a real implementation
//         console.log(`Simulated restart for API: ${api.name}`);
//       }, 2000);
//     }
    
//     res.json({ 
//       success: true, 
//       message: "API restart initiated",
//       status: "checking"
//     });
    
//   } catch (error) {
//     console.error("❌ Error restarting API:", error);
//     res.status(500).json({ error: "Failed to restart API" });
//   }
// });

// // ➤ Delete API endpoint
// app.delete("/api/delete/:id", (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const apis = loadAPIs();
//     const history = loadAPIHistory();
    
//     // Find API index
//     const apiIndex = apis.findIndex(a => a.id.toString() === id);
    
//     if (apiIndex === -1) {
//       return res.status(404).json({ error: "API not found" });
//     }
    
//     // Remove API from list
//     const deletedApi = apis.splice(apiIndex, 1)[0];
//     saveAPIs(apis);
    
//     // Remove API from history
//     if (history[id]) {
//       delete history[id];
//       saveAPIHistory(history);
//     }
    
//     res.json({ 
//       success: true, 
//       message: "API deleted successfully",
//       deletedApi 
//     });
    
//   } catch (error) {
//     console.error("❌ Error deleting API:", error);
//     res.status(500).json({ error: "Failed to delete API" });
//   }
// });

// // ➤ Health check endpoint
// app.get("/health", (req, res) => {
//   res.json({ 
//     status: "OK", 
//     message: "Server is running",
//     uptime: process.uptime()
//   });
// });

// // Add this endpoint to server.js (after the existing endpoints)

// // ➤ Get server stats for dashboard
// app.get("/api/server/stats", (req, res) => {
//   try {
//     const apis = loadAPIs();
//     const history = loadAPIHistory();
    
//     // Calculate overall API health stats
//     const online = apis.filter(api => api.status === "online" && !api.maintenanceMode).length;
//     const degraded = apis.filter(api => api.status === "degraded" && !api.maintenanceMode).length;
//     const offline = apis.filter(api => api.status === "offline" && !api.maintenanceMode).length;
//     const maintenance = apis.filter(api => api.maintenanceMode).length;
    
//     // Calculate average response time from recent history
//     let totalResponseTime = 0;
//     let responseTimeCount = 0;
    
//     Object.values(history).forEach(apiHistory => {
//       if (apiHistory.length > 0) {
//         const lastEntry = apiHistory[apiHistory.length - 1];
//         totalResponseTime += lastEntry.responseTime;
//         responseTimeCount++;
//       }
//     });
    
//     const avgResponseTime = responseTimeCount > 0 ? 
//       Math.round(totalResponseTime / responseTimeCount) : 0;
    
//     res.json({
//       status: "OK",
//       uptime: process.uptime(),
//       apiStats: {
//         total: apis.length,
//         online,
//         degraded,
//         offline,
//         maintenance
//       },
//       responseTime: avgResponseTime,
//       lastUpdated: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error("❌ Error loading server stats:", error);
//     res.status(500).json({ error: "Failed to load server stats" });
//   }
// });

// // ===== Start Server ===== //
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log(`📁 Data file: ${DATA_FILE}`);
//   console.log(`📊 History file: ${HISTORY_FILE}`);
  
//   // Initialize the data files on server start
//   try {
//     const apis = loadAPIs();
//     const history = loadAPIHistory();
    
//     console.log(`📊 Loaded ${apis.length} APIs`);
//     console.log(`📈 Tracking history for ${Object.keys(history).length} APIs`);
//   } catch (error) {
//     console.error("❌ Failed to initialize data files:", error);
//   }
// });


import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fetch from "node-fetch";  
import fs from "fs";
import path from "path";

const app = express();
const PORT = 5000;

// Put apis.json inside config folder
const DATA_FILE = path.join(process.cwd(), "config", "apis.json");
const HISTORY_FILE = path.join(process.cwd(), "config", "api_history.json");

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ===== API Type Detection ===== //
function detectApiType(baseUrl, apiName) {
  const domain = baseUrl.toLowerCase();
  const name = apiName.toLowerCase();
  
  if (domain.includes('virustotal') || name.includes('virustotal')) {
    return 'virustotal';
  }
  if (domain.includes('newsapi') || name.includes('newsapi')) {
    return 'newsapi';
  }
  if (domain.includes('openweathermap') || name.includes('openweathermap') || name.includes('weather')) {
    return 'openweathermap';
  }
  if (domain.includes('abuseipdb') || name.includes('abuseipdb')) {
    return 'abuseipdb';
  }
  if (domain.includes('twitter') || name.includes('twitter')) {
    return 'twitter';
  }
  if (domain.includes('github') || name.includes('github')) {
    return 'github';
  }
  
  return 'standard';
}

// ===== API-Specific Request Configuration ===== //
function getApiRequestConfig(apiType, apiKey, baseUrl, endpoint) {
  const config = {
    method: "GET",
    headers: {},
    timeout: 10000
  };

  let finalEndpoint = endpoint;

  switch (apiType) {
    case 'virustotal':
      // VirusTotal uses x-apikey header
      config.headers['x-apikey'] = apiKey;
      break;
      
    case 'newsapi':
      // NewsAPI can use Authorization header or query parameter
      // config.headers['Authorization'] = `Bearer ${apiKey}`;
      if (endpoint.includes('?')) {
        finalEndpoint = `${endpoint}&apiKey=${apiKey}`;
      } else {
        finalEndpoint = `${endpoint}?apiKey=${apiKey}`;
      }
      // Also set Authorization header as backup
      config.headers['Authorization'] = `Bearer ${apiKey}`;
      config.headers['User-Agent'] = 'API-Health-Dashboard/1.0';
      break;
      
    case 'openweathermap':
      // OpenWeatherMap uses query parameter
      finalEndpoint = endpoint.includes('?') ? 
        `${endpoint}&appid=${apiKey}` : 
        `${endpoint}?appid=${apiKey}`;
      break;
      
    case 'abuseipdb':
      // AbuseIPDB uses key in header
      config.headers['Key'] = apiKey;
      config.headers['Accept'] = 'application/json';
      break;
      
    case 'twitter':
      // Twitter API v2 uses Bearer token
      config.headers['Authorization'] = `Bearer ${apiKey}`;
      break;
      
    case 'github':
      // GitHub uses token authentication
      config.headers['Authorization'] = `token ${apiKey}`;
      config.headers['Accept'] = 'application/vnd.github.v3+json';
      break;
      
    default:
      // Standard API key in Authorization header
      config.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return {
    ...config,
    url: `${baseUrl}${finalEndpoint}`
  };
}

// ===== API-Specific Response Validation ===== //
function validateApiResponse(apiType, response) {
  switch (apiType) {
    case 'virustotal':
      // VirusTotal returns 200 even for errors, check data property
      return response.status === 200;
      
    case 'newsapi':
      // NewsAPI returns 200 for success, 401/429 for errors
      // return response.status === 200;
       if (response.status === 200) {
        return true;
      } else if (response.status === 401) {
        console.log('NewsAPI: Invalid API key');
        return false;
      } else if (response.status === 429) {
        console.log('NewsAPI: Rate limit exceeded');
        return false;
      } else {
        console.log(`NewsAPI: Unexpected status ${response.status}`);
        return false;
      }
      
    case 'openweathermap':
      // OpenWeatherMap returns 200 for success, 401/404 for errors
      return response.status === 200;
      
    case 'abuseipdb':
      // AbuseIPDB returns 200 for success, 401/429 for errors
      return response.status === 200;
      
    default:
      // Standard validation: 2xx status codes are successful
      return response.status >= 200 && response.status < 300;
  }
}

// ===== API-Specific Error Messages ===== //
function getApiErrorMessage(apiType, response) {
  switch (apiType) {
    case 'virustotal':
      return 'VirusTotal API error - check your API key and permissions';
      
    case 'newsapi':
      if (response.status === 401) return 'NewsAPI: Invalid API key';
      if (response.status === 429) return 'NewsAPI: Rate limit exceeded';
      return 'NewsAPI error';
      
    case 'openweathermap':
      if (response.status === 401) return 'OpenWeatherMap: Invalid API key';
      if (response.status === 404) return 'OpenWeatherMap: City not found';
      return 'OpenWeatherMap error';
      
    case 'abuseipdb':
      if (response.status === 401) return 'AbuseIPDB: Invalid API key';
      if (response.status === 429) return 'AbuseIPDB: Rate limit exceeded';
      return 'AbuseIPDB error';
      
    default:
      return `HTTP ${response.status}: ${response.statusText}`;
  }
}

// ===== Utilities ===== //
function loadAPIs() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    
    // Check if file exists and has content
    if (!fs.existsSync(DATA_FILE)) {
      // Create file with empty array if it doesn't exist
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
      return [];
    }
    
    // Read file content
    const data = fs.readFileSync(DATA_FILE, 'utf-8').trim();
    
    // If file is empty, return empty array
    if (!data) {
      return [];
    }
    
    // Parse and return the data
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Error reading APIs file:", err);
    // Return empty array instead of crashing
    return [];
  }
}

function loadAPIHistory() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(path.dirname(HISTORY_FILE))) {
      fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    }
    
    // Check if file exists and has content
    if (!fs.existsSync(HISTORY_FILE)) {
      // Create file with empty object if it doesn't exist
      fs.writeFileSync(HISTORY_FILE, JSON.stringify({}));
      return {};
    }
    
    // Read file content
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8').trim();
    
    // If file is empty, return empty object
    if (!data) {
      return {};
    }
    
    // Parse and return the data
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Error reading API history file:", err);
    // Return empty object instead of crashing
    return {};
  }
}

function saveAPIs(apis) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(apis, null, 2));
    console.log("✅ APIs saved successfully");
  } catch (err) {
    console.error("❌ Error saving APIs file:", err);
    throw err;
  }
}

function saveAPIHistory(history) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(HISTORY_FILE))) {
      fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log("✅ API history saved successfully");
  } catch (err) {
    console.error("❌ Error saving API history file:", err);
    throw err;
  }
}

function addAPIHistoryEntry(apiId, success, responseTime) {
  try {
    const history = loadAPIHistory();
    const timestamp = new Date().toISOString();
    const entry = { timestamp, success, responseTime };
    
    if (!history[apiId]) {
      history[apiId] = [];
    }
    
    // Add new entry and keep only last 100 entries per API
    history[apiId].push(entry);
    if (history[apiId].length > 100) {
      history[apiId] = history[apiId].slice(-100);
    }
    
    saveAPIHistory(history);
    return true;
  } catch (err) {
    console.error("❌ Error adding API history entry:", err);
    return false;
  }
}

function calculateSuccessRate(apiId, hours = 24) {
  try {
    const history = loadAPIHistory();
    const apiHistory = history[apiId] || [];
    
    if (apiHistory.length === 0) return 0;
    
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const recentChecks = apiHistory.filter(entry => 
      new Date(entry.timestamp) > cutoffTime
    );
    
    if (recentChecks.length === 0) return 0;
    
    const successfulChecks = recentChecks.filter(entry => entry.success);
    return (successfulChecks.length / recentChecks.length) * 100;
  } catch (err) {
    console.error("❌ Error calculating success rate:", err);
    return 0;
  }
}

async function testApiConnection(apiType, apiKey, baseUrl, endpoint) {
  let status = "offline";
  let responseTime = 0;
  let success = false;
  let errorMessage = null;
  let statusCode = null;

  try {
    const apiConfig = getApiRequestConfig(apiType, apiKey, baseUrl, endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const startTime = Date.now();
    const resp = await fetch(apiConfig.url, {
      method: apiConfig.method,
      headers: apiConfig.headers,
      signal: controller.signal,
    });

    responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    statusCode = resp.status;
    
    // API-specific response validation
    success = validateApiResponse(apiType, resp);
    
    if (success) {
      status = "online";
      
      // For NewsAPI, let's also validate the response structure
      if (apiType === 'newsapi') {
        try {
          const data = await resp.json();
          if (data.status && data.status === 'error') {
            success = false;
            status = "degraded";
            errorMessage = data.message || 'NewsAPI returned error status';
            console.log('NewsAPI error response:', data);
          }
        } catch (parseError) {
          console.log('Failed to parse NewsAPI response:', parseError);
        }
      }
    } else {
      status = "degraded";
      errorMessage = getApiErrorMessage(apiType, resp);
      
      // Try to get more detailed error information
      try {
        const errorData = await resp.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        console.log(`API error details (${apiType}):`, errorData);
      } catch (e) {
        // If we can't parse JSON error, use default message
      }
    }
  } catch (error) {
    status = "offline";
    success = false;
    errorMessage = error.name === 'AbortError' ? 'Request timeout (10s)' : error.message;
    console.error(`${apiType} API check error:`, errorMessage);
  }

  return {
    status,
    responseTime,
    success,
    errorMessage,
    statusCode
  };
}

// ===== Routes ===== //

// ➤ Add new API
// app.post("/api/add", async (req, res) => {
//   const { apiName, apiKey, baseUrl, endpoint } = req.body;

//   if (!apiName || !apiKey || !baseUrl || !endpoint) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     new URL(baseUrl);
//   } catch {
//     return res.status(400).json({ error: "Invalid Base URL" });
//   }

//   let status = "offline";
//   let responseTime = 0;
//   let success = false;
//   let errorMessage = null;

//   try {
//     // Detect API type
//     const apiType = detectApiType(baseUrl, apiName);
//     console.log(`🔍 Detected API type: ${apiType} for ${apiName}`);
    
//     // Get API-specific configuration
//     const { url, method, headers, timeout } = getApiRequestConfig(apiType, apiKey, baseUrl, endpoint);
    
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), timeout);

//     const startTime = Date.now();
//     const resp = await fetch(url, {
//       method,
//       headers,
//       signal: controller.signal,
//     });

//     responseTime = Date.now() - startTime;
//     clearTimeout(timeoutId);

//     // API-specific response validation
//     success = validateApiResponse(apiType, resp);
    
//     if (success) {
//       status = "online";
//     } else {
//       status = "degraded";
//       errorMessage = getApiErrorMessage(apiType, resp);
//       console.error(`API Error (${apiType}):`, errorMessage);
//     }
//   } catch (error) {
//     status = "offline";
//     success = false;
//     errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message;
//     console.error("API check error:", errorMessage);
//   }

//   try {
//     const apis = loadAPIs();
//     const newApi = {
//       id: Date.now(),
//       name: apiName,
//       key: apiKey,
//       baseUrl,
//       endpoint,
//       status,
//       addedAt: new Date().toISOString(),
//       maintenanceMode: false,
//       apiType: detectApiType(baseUrl, apiName) // Store API type for future reference
//     };

//     apis.push(newApi);
//     saveAPIs(apis);

//     // Add to history
//     addAPIHistoryEntry(newApi.id, success, responseTime);

//     return res.json({ 
//       success: true, 
//       api: newApi,
//       initialCheck: { success, responseTime, error: errorMessage }
//     });
//   } catch (error) {
//     console.error("❌ Error saving API:", error);
//     return res.status(500).json({ error: "Failed to save API" });
//   }
// });

app.post("/api/add", async (req, res) => {
  const { apiName, apiKey, baseUrl, endpoint } = req.body;

  if (!apiName || !apiKey || !baseUrl || !endpoint) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    new URL(baseUrl);
  } catch {
    return res.status(400).json({ error: "Invalid Base URL" });
  }

  // Detect API type
  const apiType = detectApiType(baseUrl, apiName);
  console.log(`🔍 Detected API type: ${apiType} for ${apiName}`);
  
  // Test the API connection
  const testResult = await testApiConnection(apiType, apiKey, baseUrl, endpoint);

  try {
    const apis = loadAPIs();
    const newApi = {
      id: Date.now(),
      name: apiName,
      key: apiKey,
      baseUrl,
      endpoint,
      status: testResult.status,
      addedAt: new Date().toISOString(),
      maintenanceMode: false,
      apiType: apiType
    };

    apis.push(newApi);
    saveAPIs(apis);

    // Add to history
    addAPIHistoryEntry(newApi.id, testResult.success, testResult.responseTime);

    return res.json({ 
      success: true, 
      api: newApi,
      initialCheck: { 
        success: testResult.success, 
        responseTime: testResult.responseTime,
        error: testResult.errorMessage,
        statusCode: testResult.statusCode
      }
    });
  } catch (error) {
    console.error("❌ Error saving API:", error);
    return res.status(500).json({ error: "Failed to save API" });
  }
});

// ➤ Check health of a specific API
// app.post("/api/check/:id", async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const apis = loadAPIs();
//     const api = apis.find(a => a.id.toString() === id);
    
//     if (!api) {
//       return res.status(404).json({ error: "API not found" });
//     }
    
//     // Skip check if in maintenance mode
//     if (api.maintenanceMode) {
//       return res.json({
//         success: false,
//         apiName: api.name,
//         status: "maintenance",
//         responseTime: 0,
//         successRate: calculateSuccessRate(api.id, 24),
//         error: "API is in maintenance mode",
//         timestamp: new Date().toISOString()
//       });
//     }
    
//     let status = "offline";
//     let responseTime = 0;
//     let success = false;
//     let errorMessage = null;

//     try {
//       // Use stored API type or detect it
//       const apiType = api.apiType || detectApiType(api.baseUrl, api.name);
//       console.log(`🔍 Checking ${apiType} API: ${api.name}`);
      
//       // Get API-specific configuration
//       const { url, method, headers, timeout } = getApiRequestConfig(apiType, api.key, api.baseUrl, api.endpoint);
      
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), timeout);

//       const startTime = Date.now();
//       const resp = await fetch(url, {
//         method,
//         headers,
//         signal: controller.signal,
//       });

//       responseTime = Date.now() - startTime;
//       clearTimeout(timeoutId);

//       // API-specific response validation
//       success = validateApiResponse(apiType, resp);
      
//       if (success) {
//         status = "online";
//       } else {
//         status = "degraded";
//         errorMessage = getApiErrorMessage(apiType, resp);
//         console.error(`API Error (${apiType}):`, errorMessage);
//       }
//     } catch (error) {
//       status = "offline";
//       success = false;
//       errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message;
//       console.error("Health check error:", errorMessage);
//     }
    
//     // Update API status
//     api.status = status;
//     api.lastChecked = new Date().toISOString();
//     saveAPIs(apis);
    
//     // Add to history
//     addAPIHistoryEntry(api.id, success, responseTime);
    
//     // Calculate updated success rate
//     const successRate = calculateSuccessRate(api.id, 24);
    
//     res.json({
//       success: success,
//       apiName: api.name,
//       status,
//       responseTime,
//       successRate,
//       error: errorMessage,
//       timestamp: new Date().toISOString()
//     });
    
//   } catch (error) {
//     console.error("❌ Error checking API health:", error);
//     res.status(500).json({ error: "Failed to check API health" });
//   }
// });

app.post("/api/check/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const apis = loadAPIs();
    const api = apis.find(a => a.id.toString() === id);
    
    if (!api) {
      return res.status(404).json({ error: "API not found" });
    }
    
    // Skip check if in maintenance mode
    if (api.maintenanceMode) {
      return res.json({
        success: false,
        apiName: api.name,
        status: "maintenance",
        responseTime: 0,
        successRate: calculateSuccessRate(api.id, 24),
        error: "API is in maintenance mode",
        timestamp: new Date().toISOString()
      });
    }
    
    // Use stored API type or detect it
    const apiType = api.apiType || detectApiType(api.baseUrl, api.name);
    console.log(`🔍 Checking ${apiType} API: ${api.name}`);
    
    // Test the API connection
    const testResult = await testApiConnection(apiType, api.key, api.baseUrl, api.endpoint);
    
    // Update API status
    api.status = testResult.status;
    api.lastChecked = new Date().toISOString();
    saveAPIs(apis);
    
    // Add to history
    addAPIHistoryEntry(api.id, testResult.success, testResult.responseTime);
    
    // Calculate updated success rate
    const successRate = calculateSuccessRate(api.id, 24);
    
    res.json({
      success: testResult.success,
      apiName: api.name,
      status: testResult.status,
      responseTime: testResult.responseTime,
      successRate,
      error: testResult.errorMessage,
      statusCode: testResult.statusCode,
      timestamp: new Date().toISOString()
    });


    
  } catch (error) {
    console.error("❌ Error checking API health:", error);
    res.status(500).json({ error: "Failed to check API health" });
  }
});


// ===== KEEP ALL OTHER ROUTES EXACTLY THE SAME ===== //

// ➤ Get all APIs with success rates
app.get("/api/list", (req, res) => {
  try {
    const apis = loadAPIs();
    
    // Enhance each API with success rate
    const apisWithStats = apis.map(api => ({
      ...api,
      successRate: calculateSuccessRate(api.id, 24), // 24-hour success rate
    }));
    
    res.json(apisWithStats);
  } catch (error) {
    console.error("❌ Error loading APIs:", error);
    res.status(500).json({ error: "Failed to load APIs" });
  }
});

// ➤ Get API details
app.get("/api/details/:id", (req, res) => {
  const { id } = req.params;
  
  try {
    const apis = loadAPIs();
    const history = loadAPIHistory();
    
    const api = apis.find(a => a.id.toString() === id);
    
    if (!api) {
      return res.status(404).json({ error: "API not found" });
    }
    
    // Get API history - return last 50 entries for charts
    const apiHistory = history[id] || [];
    
    // Format timestamps for frontend display (convert to local time)
    const formattedHistory = apiHistory.map(entry => ({
      ...entry,
      // Convert to local time string for display
      localTime: new Date(entry.timestamp).toLocaleTimeString(),
      timestamp: entry.timestamp // Keep ISO format for calculations
    }));
    
    // Calculate success rate
    const successRate = calculateSuccessRate(id, 24);
    
    // Find last check time and response time
    const lastCheck = apiHistory.length > 0 ? apiHistory[apiHistory.length - 1] : null;
    
    res.json({
      ...api,
      history: formattedHistory, // Send formatted history with local time
      successRate,
      lastChecked: lastCheck ? lastCheck.timestamp : null,
      responseTime: lastCheck ? lastCheck.responseTime : null
    });
    
  } catch (error) {
    console.error("❌ Error loading API details:", error);
    res.status(500).json({ error: "Failed to load API details" });
  }
});

// ➤ Toggle maintenance mode for API
app.post("/api/maintenance/:id", (req, res) => {
  const { id } = req.params;
  const { maintenance } = req.body;
  
  try {
    const apis = loadAPIs();
    const api = apis.find(a => a.id.toString() === id);
    
    if (!api) {
      return res.status(404).json({ error: "API not found" });
    }
    
    // Toggle maintenance mode
    api.maintenanceMode = maintenance !== undefined ? maintenance : !api.maintenanceMode;
    
    // If putting into maintenance, set status accordingly
    if (api.maintenanceMode) {
      api.status = "maintenance";
    }
    
    saveAPIs(apis);
    
    res.json({ 
      success: true, 
      message: `Maintenance mode ${api.maintenanceMode ? "enabled" : "disabled"}`,
      maintenanceMode: api.maintenanceMode
    });
    
  } catch (error) {
    console.error("❌ Error toggling maintenance mode:", error);
    res.status(500).json({ error: "Failed to toggle maintenance mode" });
  }
});

// ➤ Restart API monitoring (simulated)
app.post("/api/restart/:id", (req, res) => {
  const { id } = req.params;
  
  try {
    const apis = loadAPIs();
    const api = apis.find(a => a.id.toString() === id);
    
    if (!api) {
      return res.status(404).json({ error: "API not found" });
    }
    
    // Simulate restart by clearing error state and doing a fresh check
    if (api.status === "offline" || api.status === "degraded") {
      api.status = "checking";
      saveAPIs(apis);
      
      // Simulate restart delay
      setTimeout(() => {
        // This would trigger an actual check in a real implementation
        console.log(`Simulated restart for API: ${api.name}`);
      }, 2000);
    }
    
    res.json({ 
      success: true, 
      message: "API restart initiated",
      status: "checking"
    });
    
  } catch (error) {
    console.error("❌ Error restarting API:", error);
    res.status(500).json({ error: "Failed to restart API" });
  }
});

// ➤ Delete API endpoint
app.delete("/api/delete/:id", (req, res) => {
  const { id } = req.params;
  
  try {
    const apis = loadAPIs();
    const history = loadAPIHistory();
    
    // Find API index
    const apiIndex = apis.findIndex(a => a.id.toString() === id);
    
    if (apiIndex === -1) {
      return res.status(404).json({ error: "API not found" });
    }
    
    // Remove API from list
    const deletedApi = apis.splice(apiIndex, 1)[0];
    saveAPIs(apis);
    
    // Remove API from history
    if (history[id]) {
      delete history[id];
      saveAPIHistory(history);
    }
    
    res.json({ 
      success: true, 
      message: "API deleted successfully",
      deletedApi 
    });
    
  } catch (error) {
    console.error("❌ Error deleting API:", error);
    res.status(500).json({ error: "Failed to delete API" });
  }
});

// ➤ Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    uptime: process.uptime()
  });
});

// ➤ Get server stats for dashboard
app.get("/api/server/stats", (req, res) => {
  try {
    const apis = loadAPIs();
    const history = loadAPIHistory();
    
    // Calculate overall API health stats
    const online = apis.filter(api => api.status === "online" && !api.maintenanceMode).length;
    const degraded = apis.filter(api => api.status === "degraded" && !api.maintenanceMode).length;
    const offline = apis.filter(api => api.status === "offline" && !api.maintenanceMode).length;
    const maintenance = apis.filter(api => api.maintenanceMode).length;
    
    // Calculate average response time from recent history
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    Object.values(history).forEach(apiHistory => {
      if (apiHistory.length > 0) {
        const lastEntry = apiHistory[apiHistory.length - 1];
        totalResponseTime += lastEntry.responseTime;
        responseTimeCount++;
      }
    });
    
    const avgResponseTime = responseTimeCount > 0 ? 
      Math.round(totalResponseTime / responseTimeCount) : 0;
    
    res.json({
      status: "OK",
      uptime: process.uptime(),
      apiStats: {
        total: apis.length,
        online,
        degraded,
        offline,
        maintenance
      },
      responseTime: avgResponseTime,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error loading server stats:", error);
    res.status(500).json({ error: "Failed to load server stats" });
  }
});

// ===== Start Server ===== //
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}`);
  console.log(`📊 History file: ${HISTORY_FILE}`);
  
  // Initialize the data files on server start
  try {
    const apis = loadAPIs();
    const history = loadAPIHistory();
    
    console.log(`📊 Loaded ${apis.length} APIs`);
    console.log(`📈 Tracking history for ${Object.keys(history).length} APIs`);
  } catch (error) {
    console.error("❌ Failed to initialize data files:", error);
  }
});