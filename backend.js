// server.js - Complete backend for API Geographic Dashboard

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';


const app = express();
const PORT = process.env.PORT || 5001;
const DATA_FILE = path.join(process.cwd(), 'map.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// In-memory data store
let apis = [];

// Load data from file on startup
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        apis = JSON.parse(data).apis || [];
        console.log(`Loaded ${apis.length} APIs from storage`);
    } catch (error) {
        console.log('No existing data file, starting fresh');
        apis = [];
        await saveData();
    }
}

// Save data to file
async function saveData() {
    try {
        const data = JSON.stringify({ apis }, null, 2);
        await fs.writeFile(DATA_FILE, data);
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Extract domain from URL
function extractDomain(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch {
        return url;
    }
}

// Guess company name from domain
function guessCompanyNameFromDomain(domain) {
    return domain
        .replace('www.', '')
        .replace('api.', '')
        .split('.')[0]
        .replace(/-/g, ' ')
        .replace(/_/g, ' ');
}

// City to coordinates mapping
function cityToCoordinates(city) {
    const cityMap = {
        'san francisco': { lat: 37.7749, lng: -122.4194 },
        'new york': { lat: 40.7128, lng: -74.0060 },
        'london': { lat: 51.5074, lng: -0.1278 },
        'tokyo': { lat: 35.6762, lng: 139.6503 },
        'berlin': { lat: 52.5200, lng: 13.4050 },
        'paris': { lat: 48.8566, lng: 2.3522 },
        'mountain view': { lat: 37.3861, lng: -122.0839 },
        'redmond': { lat: 47.6740, lng: -122.1215 },
        'cupertino': { lat: 37.3230, lng: -122.0322 },
        'seattle': { lat: 47.6062, lng: -122.3321 },
        'austin': { lat: 30.2672, lng: -97.7431 },
        'boston': { lat: 42.3601, lng: -71.0589 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'chicago': { lat: 41.8781, lng: -87.6298 }
    };
    
    return cityMap[city.toLowerCase()] || null;
}

// Search Wikipedia for company information
async function searchWikipedia(query) {
    try {
        const response = await axios.get(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`
        );
        return response.data.query.search;
    } catch (error) {
        console.error('Wikipedia search failed:', error.message);
        return null;
    }
}

// Get Wikipedia page content
async function getWikipediaPage(title) {
    try {
        const response = await axios.get(
            `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&titles=${encodeURIComponent(title)}&format=json&origin=*`
        );
        
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        return pages[pageId].extract;
    } catch (error) {
        console.error('Wikipedia page fetch failed:', error.message);
        return null;
    }
}

// Extract location from Wikipedia content
function extractLocationFromContent(content) {
    if (!content) return null;
    
    const locationPatterns = [
        /headquarters.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})/i,
        /based.*?in.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})/i,
        /located.*?in.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})/i,
        /headquartered.*?in.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})/i
    ];
    
    for (const pattern of locationPatterns) {
        const match = content.match(pattern);
        if (match) {
            const city = match[1];
            const coordinates = cityToCoordinates(city);
            if (coordinates) {
                return {
                    lat: coordinates.lat,
                    lng: coordinates.lng,
                    city: city
                };
            }
        }
    }
    
    return null;
}

// Resolve location using Wikipedia
async function resolveLocationFromWikipedia(baseUrl) {
    try {
        const domain = extractDomain(baseUrl);
        const companyName = guessCompanyNameFromDomain(domain);
        
        console.log(`Attempting to resolve location for: ${companyName}`);
        
        // Search Wikipedia for company information
        const searchResults = await searchWikipedia(companyName);
        
        if (searchResults && searchResults.length > 0) {
            // Get page content for the first result
            const pageContent = await getWikipediaPage(searchResults[0].title);
            
            // Try to extract location from infobox or content
            const location = extractLocationFromContent(pageContent);
            
            if (location) {
                console.log(`Found location via Wikipedia: ${location.city}`);
                return {
                    ...location,
                    resolved: true,
                    method: 'wikipedia',
                    info: `Headquarters location found via Wikipedia: ${searchResults[0].title}`
                };
            }
        }
        
        // Fallback to random location
        console.log('Using random fallback location');
        return generateRandomLocation();
        
    } catch (error) {
        console.error('Wikipedia location resolution failed:', error);
        return generateRandomLocation();
    }
}

// Generate random location as fallback
function generateRandomLocation() {
    const lat = (Math.random() * 160) - 80;
    const lng = (Math.random() * 360) - 180;
    
    return {
        lat: parseFloat(lat.toFixed(4)),
        lng: parseFloat(lng.toFixed(4)),
        resolved: false,
        method: 'random',
        info: 'Location could not be determined automatically'
    };
}

// Test a single API
async function testApi(api) {
    const startTime = Date.now();
    let statusCode;
    let status;
    let errorMessage;

    try {
        const url = `${api.baseUrl}${api.endpoint}`;
        
        // Prepare headers based on API type
        const headers = {
            'User-Agent': 'API-Monitor/1.0'
        };
        
        // Handle different authentication methods
        if (api.baseUrl.includes('virustotal.com')) {
            // VirusTotal uses x-apikey header
            headers['x-apikey'] = api.apiKey;
        } else if (api.baseUrl.includes('newsapi.org')) {
            // NewsAPI can use Authorization header or query parameter
            headers['Authorization'] = `Bearer ${api.apiKey}`;
        } else {
            // Default to standard Authorization header
            headers['Authorization'] = `Bearer ${api.apiKey}`;
        }

        const response = await axios.get(url, {
            headers: headers,
            timeout: 10000,
            validateStatus: function (status) {
                return status >= 200 && status < 600; // Resolve all HTTP status codes
            }
        });

        statusCode = response.status;
        status = response.status === 200 ? 'ok' : 
                 (response.status >= 400 && response.status < 500) ? 'warning' : 'error';
    } catch (error) {
        statusCode = error.response?.status || 0;
        status = 'error';
        errorMessage = error.message;
    }

    const responseTime = Date.now() - startTime;
    
    // Update API history
    const testResult = {
        timestamp: new Date().toISOString(),
        responseTime,
        status,
        statusCode,
        error: errorMessage
    };

    api.history = api.history || [];
    api.history.push(testResult);
    api.lastChecked = testResult.timestamp;
    api.responseTime = responseTime;
    api.status = status;

    return testResult;
}
// API Routes

// Get all APIs
app.get('/api/apis', (req, res) => {
    try {
        // Don't return API keys in the response
        const apisWithoutKeys = apis.map(({ apiKey, ...api }) => api);
        res.json(apisWithoutKeys);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new API
// Add new API with better domain detection
app.post('/api/apis', async (req, res) => {
    try {
        const { name, baseUrl, endpoint, apiKey } = req.body;
        
        if (!name || !baseUrl || !endpoint || !apiKey) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate new ID
        const newId = apis.length > 0 ? Math.max(...apis.map(a => a.id)) + 1 : 1;
        
        // Resolve location using Wikipedia with improved detection
        const location = await resolveLocationFromWikipedia(baseUrl);
        
        const newApi = {
            id: newId,
            name,
            baseUrl,
            endpoint,
            apiKey,
            location,
            history: [],
            lastChecked: null,
            status: 'unknown',
            responseTime: 0,
            // Add API type for better handling
            apiType: detectApiType(baseUrl)
        };
        
        apis.push(newApi);
        await saveData();
        
        // Don't return API key in response
        const { apiKey: _, ...apiWithoutKey } = newApi;
        res.status(201).json(apiWithoutKey);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to detect API type
function detectApiType(baseUrl) {
    const domain = extractDomain(baseUrl);
    
    if (domain.includes('virustotal')) return 'virustotal';
    if (domain.includes('newsapi')) return 'newsapi';
    if (domain.includes('openweathermap')) return 'openweathermap';
    if (domain.includes('abuseipdb')) return 'abuseipdb';
    
    return 'standard';
}

// Test all APIs
app.post('/api/test', async (req, res) => {
    try {
        const results = [];
        
        for (const api of apis) {
            try {
                const result = await testApi(api);
                results.push({
                    apiId: api.id,
                    apiName: api.name,
                    ...result
                });
            } catch (error) {
                results.push({
                    apiId: api.id,
                    apiName: api.name,
                    error: error.message,
                    status: 'error',
                    responseTime: 0
                });
            }
        }
        
        await saveData();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test specific API
app.post('/api/test/:id', async (req, res) => {
    try {
        const apiId = parseInt(req.params.id);
        const api = apis.find(a => a.id === apiId);
        
        if (!api) {
            return res.status(404).json({ error: 'API not found' });
        }

        const result = await testApi(api);
        await saveData();
        
        res.json({
            apiId: api.id,
            apiName: api.name,
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get API statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            totalApis: apis.length,
            operational: apis.filter(a => a.status === 'ok').length,
            degraded: apis.filter(a => a.status === 'warning').length,
            down: apis.filter(a => a.status === 'error').length,
            averageResponseTime: apis.reduce((sum, a) => sum + (a.responseTime || 0), 0) / apis.length || 0
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get API history
app.get('/api/history', (req, res) => {
    try {
        const history = apis.flatMap(api => 
            (api.history || []).map(entry => ({
                apiId: api.id,
                apiName: api.name,
                ...entry
            }))
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete API
app.delete('/api/apis/:id', async (req, res) => {
    try {
        const apiId = parseInt(req.params.id);
        const index = apis.findIndex(api => api.id === apiId);
        
        if (index === -1) {
            return res.status(404).json({ error: 'API not found' });
        }
        
        apis.splice(index, 1);
        await saveData();
        
        res.json({ message: 'API deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    await loadData();
    
    app.listen(PORT, () => {
        console.log(`API Geographic Dashboard backend running on port ${PORT}`);
        console.log(`Access the dashboard at: http://localhost:${PORT}`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Saving data before shutdown...');
    await saveData();
    console.log('Data saved. Shutting down.');
    process.exit(0);
});

// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});