//  let backendConfig = {
//         url: 'http://localhost:3000',
//         healthEndpoint: '/health',
//         statsEndpoint: '/stats'
//     };
    
//     // Dummy data for dashboard card simulation
//     let isBackendConnected = false;
//     const dummyData = {
//         uptime: 99.95,
//         responseTime: 248,
//         apiRequests: 12482
//     };
//     let dummyHealth = [
//         { platform: "VirusTotal", status: "OK", httpStatus: 200, responseTime: "300ms", timestamp: new Date().toISOString() },
//         { platform: "OpenWeatherMap", status: "OK", httpStatus: 200, responseTime: "180ms", timestamp: new Date().toISOString() },
//         { platform: "AbuseIPDB", status: "OK", httpStatus: 200, responseTime: "500ms", timestamp: new Date().toISOString() },
//     ];

    
//     // Chart data storage
//     const chartData = {
//         labels: [],
//         datasets: [
//             {
//                 label: 'VirusTotal',
//                 data: [],
//                 borderColor: '#7c3aed',
//                 backgroundColor: 'rgba(124, 58, 237, 0.1)',
//                 tension: 0.4,
//                 fill: true
//             },
//             {
//                 label: 'OpenWeatherMap',
//                 data: [],
//                 borderColor: '#3b82f6',
//                 backgroundColor: 'rgba(59, 130, 246, 0.1)',
//                 tension: 0.4,
//                 fill: true
//             },
//             {
//                 label: 'AbuseIPDB',
//                 data: [],
//                 borderColor: '#F52427',
//                 backgroundColor: 'rgba(252, 73, 73, 0.1)',
//                 tension: 0.4,
//                 fill: true
//             }
//         ]
//     };
    
//     // Initialize response time chart
//     let responseTimeChart;
//     function initChart() {
//         const ctx = document.getElementById('responseTimeChart').getContext('2d');
//         responseTimeChart = new Chart(ctx, {
//             type: 'line',
//             data: chartData,
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     legend: {
//                         position: 'top',
//                         labels: {
//                             color: '#e2e8f0'
//                         }
//                     }
//                 },
//                 scales: {
//                     y: {
//                         beginAtZero: true,
//                         grid: {
//                             color: 'rgba(255, 255, 255, 0.1)'
//                         },
//                         ticks: {
//                             color: '#e2e8f0'
//                         }
//                     },
//                     x: {
//                         grid: {
//                             color: 'rgba(255, 255, 255, 0.1)'
//                         },
//                         ticks: {
//                             color: '#e2e8f0'
//                         }
//                     }
//                 }
//             }
//         });
//     }

//     // Load configuration from localStorage if available
//     function loadConfig() {
//         const savedConfig = localStorage.getItem('apiDashboardConfig');
//         if (savedConfig) {
//             try {
//                 backendConfig = JSON.parse(savedConfig);
//                 document.getElementById('backendUrl').value = backendConfig.url;
//                 document.getElementById('healthEndpoint').value = backendConfig.healthEndpoint;
//                 document.getElementById('statsEndpoint').value = backendConfig.statsEndpoint || '/stats';
//             } catch (e) {
//                 console.error('Error loading config:', e);
//             }
//         }
//     }
    
//     // Save configuration to localStorage
//     function saveConfig() {
//         backendConfig.url = document.getElementById('backendUrl').value || 'http://localhost:3000';
//         backendConfig.healthEndpoint = document.getElementById('healthEndpoint').value || '/health';
//         backendConfig.statsEndpoint = document.getElementById('statsEndpoint').value || '/stats';
//         localStorage.setItem('apiDashboardConfig', JSON.stringify(backendConfig));
//         alert('Configuration saved!');
//         fetchData(); // Try to fetch data with new configuration
//     }

//     // Function to fetch data from backend
//     async function fetchData() {
//         showLoading();
//         hideError();
        
//         try {
//             // Fetch health data
//             const healthResponse = await fetch(`${backendConfig.url}${backendConfig.healthEndpoint}`);
//             if (!healthResponse.ok) {
//                 throw new Error(`Health endpoint error! status: ${healthResponse.status}`);
//             }
//             const healthData = await healthResponse.json();

//             // Fetch stats data
//             let statsData = null;
//             try {
//                 const statsResponse = await fetch(`${backendConfig.url}${backendConfig.statsEndpoint}`);
//                 if (statsResponse.ok) {
//                     statsData = await statsResponse.json();
//                 }
//             } catch (statsError) {
//                 console.warn('Stats endpoint not available, using health data for stats');
//                 // Calculate stats from health data as fallback
//                 const totalResponseTime = healthData.reduce((sum, api) => sum + (parseInt(api.responseTime) || 0), 0);
//                 const avgResponseTime = healthData.length > 0 ? Math.round(totalResponseTime / healthData.length) : 0;
//                 const uptime = healthData.length > 0 ? 
//                     (healthData.filter(api => api.status === 'OK').length / healthData.length * 100).toFixed(2) : 0;
                
//                 statsData = {
//                     avgResponseTime: avgResponseTime,
//                     uptime: parseFloat(uptime),
//                     apiRequests: Math.floor(Math.random() * 1000) + 10000 // Random number for demo
//                 };
//             }

//             isBackendConnected = true;
//             updateDashboard(healthData, statsData);
//             hideLoading();
//         } catch (error) {
//             console.error('Error fetching data:', error);
//             isBackendConnected = false;
//             showError(`Failed to connect to backend: ${error.message}. Make sure your backend is running on ${backendConfig.url}`);
//             hideLoading();
            
//             // Fallback to simulated data if backend is not available
//             simulateData();
//         }
//     }

//     // Function to update dashboard with real or simulated data
//     function updateDashboard(healthData, statsData) {
//         if (!healthData || !Array.isArray(healthData)) {
//             console.error('Invalid health data format received from backend');
//             showError('Invalid health data format received from backend');
//             return;
//         }
        
//         // Process each API's health data
//         healthData.forEach(apiData => {
//             updateApiCard(apiData);
//         });
        
//         // Update chart with health data
//         updateChart(healthData);
        
//         // Add to history table
//         addToHistory(healthData);
        
//         // Update dashboard cards with stats data
//         if (isBackendConnected && statsData) {
//             updateDashboardCards({
//                 uptime: statsData.uptime || 0,
//                 responseTime: statsData.avgResponseTime || 0,
//                 apiRequests: statsData.apiRequests || 0,
//                 statusText: (statsData.uptime || 0) >= 99.5 ? 'All Systems Operational' : 'Partial Outage'
//             });
//         } else if (!isBackendConnected) {
//             // Use simulated data for dashboard cards when backend is not connected
//             updateDashboardCards({
//                 uptime: dummyData.uptime,
//                 responseTime: dummyData.responseTime,
//                 apiRequests: dummyData.apiRequests,
//                 statusText: dummyData.uptime >= 99.5 ? 'All Systems Operational' : 'Partial Outage'
//             });
//         }
//     }
    
//     // Update dashboard cards with data
//     function updateDashboardCards(data) {
//         document.getElementById('uptimeValue').textContent = `${data.uptime}%`;
//         document.getElementById('responseTimeValue').textContent = `${data.responseTime}ms`;
//         document.getElementById('apiRequestsValue').textContent = data.apiRequests.toLocaleString();
//         document.getElementById('uptimeStatusText').textContent = data.statusText;
//     }



//     // Add this function to determine status based on response time
// function determineStatus(responseTime, platform) {
//     // Different thresholds for different APIs if needed
//     const thresholds = {
//         'VirusTotal': { good: 500, warning: 1000 },
//         'OpenWeatherMap': { good: 400, warning: 800 },
//         'AbuseIPDB': { good: 600, warning: 1200 }
//     };
    
//     const threshold = thresholds[platform] || { good: 500, warning: 1000 };
    
//     if (responseTime === null || responseTime === undefined) {
//         return { status: 'Error', class: 'error', text: 'Offline' };
//     }
    
//     if (responseTime <= threshold.good) {
//         return { status: 'OK', class: 'ok', text: 'Online' };
//     } else if (responseTime <= threshold.warning) {
//         return { status: 'Slow Response', class: 'warning', text: 'Degraded' };
//     } else {
//         return { status: 'Error', class: 'error', text: 'Offline' };
//     }
// }

    
//     // function updateApiCard(apiData) {
//     //     const platform = apiData.platform;
//     //     const cardId = `${platform.toLowerCase().replace(/\s+/g, '-')}-card`;
//     //     const card = document.getElementById(cardId);

//     //     if (!card) {
//     //         console.warn(`Card not found for platform: ${platform}`);
//     //         return;
//     //     }

//     //     // Determine status
//     //     const isOk = apiData.status === 'OK';
//     //     const isError = apiData.status.includes('Error');
//     //     const statusClass = isOk ? 'status-ok' : isError ? 'status-error' : 'status-warning';
//     //     const statusText = isOk ? 'Online' : isError ? 'Error' : 'Degraded';

//     //     // Update status indicator
//     //     const statusDot = card.querySelector('.status-dot');
//     //     const statusTextEl = card.querySelector('.status-indicator span:last-child');
//     //     if (statusDot) statusDot.className = 'status-dot ' + statusClass;
//     //     if (statusTextEl) statusTextEl.textContent = statusText;

//     //     // Update status badge
//     //     const badge = card.querySelector('.api-stat:nth-child(1) span:last-child');
//     //     if (badge) {
//     //         badge.textContent = apiData.status;
//     //         badge.className = 'badge ' +
//     //             (isOk ? 'badge-success' : isError ? 'badge-error' : 'badge-warning');
//     //     }

//     //     // Update response time
//     //     const responseTime = apiData.responseTime || 'N/A';
//     //     const responseTimeEl = card.querySelector('.api-stat:nth-child(2) span:last-child');
//     //     if (responseTimeEl) responseTimeEl.textContent = responseTime;

//     //     // Update last checked
//     //     const lastCheckedEl = card.querySelector('.api-stat:nth-child(3) span:last-child');
//     //     if (lastCheckedEl) lastCheckedEl.textContent = new Date().toLocaleTimeString();
//     // }

//     // Update the updateApiCard function to use the new status determination

//    function updateApiCard(apiData) {
//     const platform = apiData.platform;
//     const platformId = platform.toLowerCase().replace(/\s+/g, '-');
    
//     // Extract numeric value from responseTime (e.g., "320ms" -> 320)
//     let responseTimeValue;
//     if (typeof apiData.responseTime === 'string') {
//         responseTimeValue = parseInt(apiData.responseTime.replace('ms', '')) || null;
//     } else {
//         responseTimeValue = apiData.responseTime;
//     }
    
//     // Determine status based on response time
//     const statusInfo = determineStatus(responseTimeValue, platform);
    
//     // Update status indicator
//     const statusDot = document.getElementById(`${platformId}-status-dot`);
//     const statusTextEl = document.getElementById(`${platformId}-status-text`);
//     if (statusDot) {
//         statusDot.className = 'status-dot status-' + statusInfo.class;
//     }
//     if (statusTextEl) {
//         statusTextEl.textContent = isBackendConnected ? statusInfo.text : statusInfo.text;
//     }

//     // Update status badge
//     const badge = document.getElementById(`${platformId}-status-badge`);
//     if (badge) {
//         badge.textContent = isBackendConnected ? statusInfo.status : statusInfo.status;
//         badge.className = 'badge badge-' + 
//             (statusInfo.class === 'ok' ? 'success' : 
//              statusInfo.class === 'warning' ? 'warning' : 'error');
//     }

//     // Update response time
//     const responseTimeEl = document.getElementById(`${platformId}-response-time`);
//     if (responseTimeEl) {
//         responseTimeEl.textContent = responseTimeValue ? `${responseTimeValue}ms` : 'N/A';
//     }

//     // Update last checked
//     const lastCheckedEl = document.getElementById(`${platformId}-last-checked`);
//     if (lastCheckedEl) {
//         lastCheckedEl.textContent = new Date().toLocaleTimeString();
//     }
// }

    
//     // Update chart with new data
//     // function updateChart(data) {
//     //     const now = new Date();
//     //     const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
        
//     //     // Add new time label
//     //     chartData.labels.push(timeLabel);
//     //     if (chartData.labels.length > 15) {
//     //         chartData.labels.shift();
//     //     }
        
//     //     // Add data for each API
//     //     data.forEach(apiData => {
//     //         let datasetIndex = -1;
//     //         if (apiData.platform === 'VirusTotal') datasetIndex = 0;
//     //         else if (apiData.platform === 'OpenWeatherMap') datasetIndex = 1;
//     //         else if (apiData.platform === 'AbuseIPDB') datasetIndex = 2;
            
//     //         if (datasetIndex >= 0) {
//     //             // Extract numeric value from responseTime string (e.g., "320ms" -> 320)
//     //             const responseTimeValue = parseInt(apiData.responseTime) || 0;
//     //             chartData.datasets[datasetIndex].data.push(responseTimeValue);
                
//     //             // Keep only the last 15 data points
//     //             if (chartData.datasets[datasetIndex].data.length > 15) {
//     //                 chartData.datasets[datasetIndex].data.shift();
//     //             }
//     //         }
//     //     });
        
//     //     // Update the chart
//     //     if (responseTimeChart) {
//     //         responseTimeChart.update();
//     //     }
//     // }

//     function updateChart(data) {
//     const now = new Date();
//     const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    
//     // Add new time label
//     chartData.labels.push(timeLabel);
//     if (chartData.labels.length > 15) {
//         chartData.labels.shift();
//     }
    
//     // Add data for each API
//     data.forEach(apiData => {
//         let datasetIndex = -1;
//         if (apiData.platform === 'VirusTotal') datasetIndex = 0;
//         else if (apiData.platform === 'OpenWeatherMap') datasetIndex = 1;
//         else if (apiData.platform === 'AbuseIPDB') datasetIndex = 2;
        
//         if (datasetIndex >= 0) {
//             // Use responseTime value directly (it should be a number now)
//             const responseTimeValue = apiData.responseTime || 0;
//             chartData.datasets[datasetIndex].data.push(responseTimeValue);
            
//             // Keep only the last 15 data points
//             if (chartData.datasets[datasetIndex].data.length > 15) {
//                 chartData.datasets[datasetIndex].data.shift();
//             }
//         }
//     });
    
//     // Update the chart
//     if (responseTimeChart) {
//         responseTimeChart.update();
//     }
// }


    
//     // function addToHistory(data) {
//     //     const historyBody = document.getElementById('historyBody');
//     //     if (!historyBody) return;
        
//     //     const now = new Date();

//     //     data.forEach(apiData => {
//     //         const newRow = document.createElement('tr');

//     //         const isOk = apiData.status === 'OK';
//     //         const isError = apiData.status.includes('Error');
//     //         const badgeClass = isOk ? 'badge-success' : isError ? 'badge-error' : 'badge-warning';

//     //         newRow.innerHTML = `
//     //             <td>${apiData.platform}</td>
//     //             <td>${now.toLocaleString()}</td>
//     //             <td><span class="badge ${badgeClass}">${apiData.status}</span></td>
//     //             <td>${apiData.httpStatus || 'N/A'}</td>
//     //             <td>${apiData.responseTime || 'N/A'}</td>
//     //         `;

//     //         historyBody.prepend(newRow);
//     //     });

//     //     // Keep only the last 15 history entries
//     //     while (historyBody.children.length > 15) {
//     //         historyBody.removeChild(historyBody.lastChild);
//     //     }
//     // }

//     function addToHistory(data) {
//         const historyBody = document.getElementById('historyBody');
//         if (!historyBody) return;
        
//         const now = new Date();

//         data.forEach(apiData => {
//             const newRow = document.createElement('tr');
            
//             // Extract numeric value from responseTime (e.g., "320ms" -> 320)
//             const responseTimeValue = parseInt(apiData.responseTime) || null;
            
//             // Determine status based on response time
//             const statusInfo = determineStatus(responseTimeValue, apiData.platform);
            
//             const badgeClass = statusInfo.class === 'ok' ? 'badge-success' : 
//                             statusInfo.class === 'warning' ? 'badge-warning' : 'badge-error';

//             newRow.innerHTML = `
//                 <td>${apiData.platform}</td>
//                 <td>${now.toLocaleString()}</td>
//                 <td><span class="badge ${badgeClass}">${statusInfo.status}</span></td>
//                 <td>${apiData.httpStatus || 'N/A'}</td>
//                 <td>${responseTimeValue ? responseTimeValue + 'ms' : 'N/A'}</td>
//             `;

//             historyBody.prepend(newRow);
//         });

//         // Keep only the last 15 history entries
//         while (historyBody.children.length > 15) {
//             historyBody.removeChild(historyBody.lastChild);
//         }
//     }
    
//     // Simulate data if backend is not available

//     // Update the simulateData function to include proper status handling
//    function simulateData() {
//     // Generate simulated data with all required fields
//     const simulatedData = [
//         {
//             platform: 'VirusTotal',
//             status: 'OK',
//             httpStatus: 200,
//             responseTime: Math.floor(Math.random() * 100) + 250, // Just the number, not a string
//             timestamp: new Date().toISOString()
//         },
//         {
//             platform: 'OpenWeatherMap',
//             status: 'OK',
//             httpStatus: 200,
//             responseTime: Math.floor(Math.random() * 100) + 150, // Just the number, not a string
//             timestamp: new Date().toISOString()
//         },
//         {
//             platform: 'AbuseIPDB',
//             status: Math.random() > 0.7 ? 'Error: Rate Limit Exceeded' : 'OK',
//             httpStatus: Math.random() > 0.7 ? 429 : 200,
//             responseTime: Math.floor(Math.random() * 400) + 400, // Just the number, not a string
//             timestamp: new Date().toISOString()
//         }
//     ];
    
//     // Simulate dashboard card data
//     dummyData.uptime = (99 + Math.random()).toFixed(2);
//     dummyData.responseTime = Math.floor(200 + Math.random() * 100);
//     dummyData.apiRequests += Math.floor(Math.random() * 100);
    
//     // Update dashboard cards with simulated data
//     updateDashboardCards({
//         uptime: dummyData.uptime,
//         responseTime: dummyData.responseTime,
//         apiRequests: dummyData.apiRequests,
//         statusText: dummyData.uptime >= 99.5 ? 'All Systems Operational' : 'Partial Outage'
//     });
    
//     // Update API cards, chart, and history table with simulated data
//     simulatedData.forEach(apiData => {
//         updateApiCard(apiData);
//     });
    
//     // Update chart with simulated data
//     updateChart(simulatedData);
    
//     // Add simulated data to history
//     addToHistory(simulatedData);
// }


//     // function simulateData() {
//     //     // Generate simulated data with all required fields
//     //     const simulatedData = [
//     //         {
//     //             platform: 'VirusTotal',
//     //             status: 'OK',
//     //             httpStatus: 200,
//     //             responseTime: `${Math.floor(Math.random() * 100) + 250}ms`,
//     //             timestamp: new Date().toISOString()
//     //         },
//     //         {
//     //             platform: 'OpenWeatherMap',
//     //             status: 'OK',
//     //             httpStatus: 200,
//     //             responseTime: `${Math.floor(Math.random() * 100) + 150}ms`,
//     //             timestamp: new Date().toISOString()
//     //         },
//     //         {
//     //             platform: 'AbuseIPDB',
//     //             status: Math.random() > 0.7 ? 'Error: Rate Limit Exceeded' : 'OK',
//     //             httpStatus: Math.random() > 0.7 ? 429 : 200,
//     //             responseTime: `${Math.floor(Math.random() * 400) + 400}ms`,
//     //             timestamp: new Date().toISOString()
//     //         }
//     //     ];
        
//     //     // Simulate dashboard card data
//     //     dummyData.uptime = (99 + Math.random()).toFixed(2);
//     //     dummyData.responseTime = Math.floor(200 + Math.random() * 100);
//     //     dummyData.apiRequests += Math.floor(Math.random() * 100);
        
//     //     // Update dashboard cards with simulated data
//     //     updateDashboardCards({
//     //         uptime: dummyData.uptime,
//     //         responseTime: dummyData.responseTime,
//     //         apiRequests: dummyData.apiRequests,
//     //         statusText: dummyData.uptime >= 99.5 ? 'All Systems Operational' : 'Partial Outage'
//     //     });
        
//     //     // Update API cards, chart, and history table with simulated data
//     //     simulatedData.forEach(apiData => {
//     //         updateApiCard(apiData);
//     //     });
        
//     //     // Update chart with simulated data
//     //     updateChart(simulatedData);
        
//     //     // Add simulated data to history
//     //     addToHistory(simulatedData);
//     // }
    
//     // UI helper functions
//     function showLoading() {
//         const loadingIndicator = document.getElementById('loadingIndicator');
//         const dashboardContent = document.getElementById('dashboardContent');
//         if (loadingIndicator) loadingIndicator.style.display = 'flex';
//         if (dashboardContent) dashboardContent.style.opacity = '0.5';
//     }
    
//     function hideLoading() {
//         const loadingIndicator = document.getElementById('loadingIndicator');
//         const dashboardContent = document.getElementById('dashboardContent');
//         if (loadingIndicator) loadingIndicator.style.display = 'none';
//         if (dashboardContent) dashboardContent.style.opacity = '1';
//     }
    
//     function showError(message) {
//         const errorText = document.getElementById('errorText');
//         const errorContainer = document.getElementById('errorContainer');
//         if (errorText) errorText.textContent = message;
//         if (errorContainer) errorContainer.style.display = 'flex';
//     }
    
//     function hideError() {
//         const errorContainer = document.getElementById('errorContainer');
//         if (errorContainer) errorContainer.style.display = 'none';
//     }
    
//     function toggleConfigPanel() {
//         const panel = document.getElementById('configPanel');
//         if (panel) {
//             panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
//         }
//     }

//     // Initialize on page load
//     document.addEventListener('DOMContentLoaded', function() {
//         // Initialize chart
//         initChart();
        
//         // Load saved configuration
//         loadConfig();
        
//         // Fetch real data from your backend
//         fetchData();
        
//         // Set up periodic updates (every 40 seconds to match your backend)
//         setInterval(() => {
//             if (isBackendConnected) {
//                 fetchData();
//             } else {
//                 simulateData();
//             }
//         }, 40000);
        
//         // Add click event to refresh button
//         const refreshBtn = document.getElementById('refreshBtn');
//         if (refreshBtn) {
//             refreshBtn.addEventListener('click', function() {
//                 if (isBackendConnected) {
//                     fetchData();
//                 } else {
//                     simulateData();
//                 }
//             });
//         }
        
//         // Add click event to settings button
//         const settingsBtn = document.getElementById('settingsBtn');
//         if (settingsBtn) {
//             settingsBtn.addEventListener('click', function() {
//                 toggleConfigPanel();
//             });
//         }
        
//         // Add click event to save config button
//         const saveConfigBtn = document.getElementById('saveConfigBtn');
//         if (saveConfigBtn) {
//             saveConfigBtn.addEventListener('click', function() {
//                 saveConfig();
//             });
//         }
//     });



// FileName: MultipleFiles/script.js
let backendConfig = {
    url: 'http://localhost:3000',
    healthEndpoint: '/health',
    statsEndpoint: '/stats'
};

// Dummy data for dashboard card simulation
let isBackendConnected = false;
const dummyData = {
    uptime: 99.95,
    responseTime: 248,
    apiRequests: 12482
};
let dummyHealth = [
    { platform: "VirusTotal", status: "OK", httpStatus: 200, responseTime: "300ms", timestamp: new Date().toISOString() },
    { platform: "OpenWeatherMap", status: "OK", httpStatus: 200, responseTime: "180ms", timestamp: new Date().toISOString() },
    { platform: "AbuseIPDB", status: "OK", httpStatus: 200, responseTime: "500ms", timestamp: new Date().toISOString() },
];


// Chart data storage
const chartData = {
    labels: [],
    datasets: [
        {
            label: 'VirusTotal',
            data: [],
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            tension: 0.4,
            fill: true
        },
        {
            label: 'OpenWeatherMap',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
        },
        {
            label: 'AbuseIPDB',
            data: [],
            borderColor: '#F52427',
            backgroundColor: 'rgba(252, 73, 73, 0.1)',
            tension: 0.4,
            fill: true
        }
    ]
};

// Initialize response time chart

 let responseTimeChart;
    function initChart() {
        const ctx = document.getElementById('responseTimeChart').getContext('2d');
        responseTimeChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e2e8f0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });
    }

// let responseTimeChart;
// function initChart() {
//     const ctx = document.getElementById('responseTimeChart').getContext('2d');
//     responseTimeChart = new Chart(ctx, {
//         type: 'line',
//         data: chartData,
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     position: 'top',
//                     labels: {
//                         color: '#e2e8f0'
//                     }
//                 }
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     grid: {
//                         color: 'rgba(255, 255, 255, 0.1)'
//                     },
//                     ticks: {
//                         color: '#e2e8f0'
//                     }
//                 },
//                 x: {
//                     grid: {
//                         color: 'rgba(255, 255, 255, 0.1)'
//                     },
//                     ticks: {
//                         color: '#e2e8f0'
//                     }
//                 }
//             }
//         });
// }

// Load configuration from localStorage if available
function loadConfig() {
    const savedConfig = localStorage.getItem('apiDashboardConfig');
    if (savedConfig) {
        try {
            backendConfig = JSON.parse(savedConfig);
            document.getElementById('backendUrl').value = backendConfig.url;
            document.getElementById('healthEndpoint').value = backendConfig.healthEndpoint;
            document.getElementById('statsEndpoint').value = backendConfig.statsEndpoint || '/stats';
        } catch (e) {
            console.error('Error loading config:', e);
        }
    }
}

// Save configuration to localStorage
function saveConfig() {
    backendConfig.url = document.getElementById('backendUrl').value || 'http://localhost:3000';
    backendConfig.healthEndpoint = document.getElementById('healthEndpoint').value || '/health';
    backendConfig.statsEndpoint = document.getElementById('statsEndpoint').value || '/stats';
    localStorage.setItem('apiDashboardConfig', JSON.stringify(backendConfig));
    alert('Configuration saved!');
    fetchData(); // Try to fetch data with new configuration
}

// Function to fetch data from backend
async function fetchData() {
    showLoading();
    hideError();

    try {
        // Fetch health data
        const healthResponse = await fetch(`${backendConfig.url}${backendConfig.healthEndpoint}`);
        if (!healthResponse.ok) {
            throw new Error(`Health endpoint error! status: ${healthResponse.status}`);
        }
        const healthData = await healthResponse.json();

        // Fetch stats data
        let statsData = null;
        try {
            const statsResponse = await fetch(`${backendConfig.url}${backendConfig.statsEndpoint}`);
            if (statsResponse.ok) {
                statsData = await statsResponse.json();
            }
        } catch (statsError) {
            console.warn('Stats endpoint not available, using health data for stats');
            // Calculate stats from health data as fallback
            const totalResponseTime = healthData.reduce((sum, api) => sum + (parseInt(api.responseTime) || 0), 0);
            const avgResponseTime = healthData.length > 0 ? Math.round(totalResponseTime / healthData.length) : 0;
            const uptime = healthData.length > 0 ?
                (healthData.filter(api => api.status === 'OK').length / healthData.length * 100).toFixed(2) : 0;

            statsData = {
                avgResponseTime: avgResponseTime,
                uptime: parseFloat(uptime),
                apiRequests: Math.floor(Math.random() * 1000) + 10000 // Random number for demo
            };
        }

        isBackendConnected = true;
        updateDashboard(healthData, statsData);
        hideLoading();
    } catch (error) {
        console.error('Error fetching data:', error);
        isBackendConnected = false;
        showError(`Failed to connect to backend: ${error.message}. Make sure your backend is running on ${backendConfig.url}`);
        hideLoading();

        // Fallback to simulated data if backend is not available
        simulateData();
    }
}

// Function to update dashboard with real or simulated data
function updateDashboard(healthData, statsData) {
    if (!healthData || !Array.isArray(healthData)) {
        console.error('Invalid health data format received from backend');
        showError('Invalid health data format received from backend');
        return;
    }

    // Process each API's health data
    healthData.forEach(apiData => {
        updateApiCard(apiData);
    });

    // Update chart with health data
    updateChart(healthData);

    // Add to history table
    addToHistory(healthData);

    // Update dashboard cards with stats data
    if (isBackendConnected && statsData) {
        updateDashboardCards({
            uptime: statsData.uptime || 0,
            responseTime: statsData.avgResponseTime || 0,
            apiRequests: statsData.apiRequests || 0,
            statusText: (statsData.uptime || 0) >= 99.5 ? 'All Systems Operational' : 'Partial Outage'
        });
    } else if (!isBackendConnected) {
        // Use simulated data for dashboard cards when backend is not connected
        updateDashboardCards({
            uptime: dummyData.uptime,
            responseTime: dummyData.responseTime,
            apiRequests: dummyData.apiRequests,
            statusText: dummyData.uptime >= 99.5 ? 'All Systems Operational' : 'Partial Outage'
        });
    }
}

// Update dashboard cards with data
function updateDashboardCards(data) {
    document.getElementById('uptimeValue').textContent = `${data.uptime}%`;
    document.getElementById('responseTimeValue').textContent = `${data.responseTime}ms`;
    document.getElementById('apiRequestsValue').textContent = data.apiRequests.toLocaleString();
    document.getElementById('uptimeStatusText').textContent = data.statusText;
}


// Add this function to determine status based on response time
function determineStatus(responseTime, platform) {
    // Different thresholds for different APIs if needed
    const thresholds = {
        'VirusTotal': { good: 500, warning: 1000 },
        'OpenWeatherMap': { good: 400, warning: 800 },
        'AbuseIPDB': { good: 600, warning: 1200 }
    };

    const threshold = thresholds[platform] || { good: 500, warning: 1000 };

    // *** IMPORTANT CHANGE HERE ***
    // If responseTime is null or undefined, it means the API is offline/unreachable
    if (responseTime === null || responseTime === undefined) {
        return { status: 'Error', class: 'error', text: 'Offline' };
    }

    if (responseTime <= threshold.good) {
        return { status: 'OK', class: 'ok', text: 'Online' };
    } else if (responseTime <= threshold.warning) {
        return { status: 'Slow Response', class: 'warning', text: 'Degraded' };
    } else {
        return { status: 'Error', class: 'error', text: 'Offline' };
    }
}

// Update the updateApiCard function to use the new status determination
function updateApiCard(apiData) {
    const platform = apiData.platform;
    const platformId = platform.toLowerCase().replace(/\s+/g, '-');

    // Extract numeric value from responseTime (e.g., "320ms" -> 320)
    // This part is crucial for handling both string and number inputs for responseTime
    let responseTimeValue;
    if (typeof apiData.responseTime === 'string') {
        responseTimeValue = parseInt(apiData.responseTime.replace('ms', '')) || null;
    } else {
        responseTimeValue = apiData.responseTime; // Assume it's already a number or null/undefined
    }

    // Determine status based on response time
    const statusInfo = determineStatus(responseTimeValue, platform);

    // Update status indicator
    const statusDot = document.getElementById(`${platformId}-status-dot`);
    const statusTextEl = document.getElementById(`${platformId}-status-text`);
    if (statusDot) {
        statusDot.className = 'status-dot status-' + statusInfo.class;
    }
    if (statusTextEl) {
        // *** SIMPLIFIED THIS LINE ***
        statusTextEl.textContent = statusInfo.text;
    }

    // Update status badge
    const badge = document.getElementById(`${platformId}-status-badge`);
    if (badge) {
        // *** SIMPLIFIED THIS LINE ***
        badge.textContent = statusInfo.status;
        badge.className = 'badge badge-' +
            (statusInfo.class === 'ok' ? 'success' :
                statusInfo.class === 'warning' ? 'warning' : 'error');
    }

    // Update response time
    const responseTimeEl = document.getElementById(`${platformId}-response-time`);
    if (responseTimeEl) {
        responseTimeEl.textContent = responseTimeValue !== null ? `${responseTimeValue}ms` : 'N/A';
    }

    // Update last checked
    const lastCheckedEl = document.getElementById(`${platformId}-last-checked`);
    if (lastCheckedEl) {
        lastCheckedEl.textContent = new Date().toLocaleTimeString();
    }
}


// Update chart with new data
function updateChart(data) {
    const now = new Date();
    const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');

    // Add new time label
    chartData.labels.push(timeLabel);
    if (chartData.labels.length > 15) {
        chartData.labels.shift();
    }

    // Add data for each API
    data.forEach(apiData => {
        let datasetIndex = -1;
        if (apiData.platform === 'VirusTotal') datasetIndex = 0;
        else if (apiData.platform === 'OpenWeatherMap') datasetIndex = 1;
        else if (apiData.platform === 'AbuseIPDB') datasetIndex = 2;

        if (datasetIndex >= 0) {
            // Use responseTime value directly (it should be a number now)
            // If responseTime is null/undefined (offline), use 0 for chart
            const responseTimeValue = apiData.responseTime || 0;
            chartData.datasets[datasetIndex].data.push(responseTimeValue);

            // Keep only the last 15 data points
            if (chartData.datasets[datasetIndex].data.length > 15) {
                chartData.datasets[datasetIndex].data.shift();
            }
        }
    });

    // Update the chart
    if (responseTimeChart) {
        responseTimeChart.update();
    }
}


function addToHistory(data) {
    const historyBody = document.getElementById('historyBody');
    if (!historyBody) return;

    const now = new Date();

    data.forEach(apiData => {
        const newRow = document.createElement('tr');

        // Extract numeric value from responseTime (e.g., "320ms" -> 320)
        const responseTimeValue = parseInt(apiData.responseTime) || null;

        // Determine status based on response time
        const statusInfo = determineStatus(responseTimeValue, apiData.platform);

        const badgeClass = statusInfo.class === 'ok' ? 'badge-success' :
            statusInfo.class === 'warning' ? 'badge-warning' : 'badge-error';

        newRow.innerHTML = `
            <td>${apiData.platform}</td>
            <td>${now.toLocaleString()}</td>
            <td><span class="badge ${badgeClass}">${statusInfo.status}</span></td>
            <td>${apiData.httpStatus || 'N/A'}</td>
            <td>${responseTimeValue !== null ? responseTimeValue + 'ms' : 'N/A'}</td>
        `;

        historyBody.prepend(newRow);
    });

    // Keep only the last 15 history entries
    while (historyBody.children.length > 15) {
        historyBody.removeChild(historyBody.lastChild);
    }
}

// Simulate data if backend is not available
function simulateData() {
    // Generate simulated data with all required fields
    const simulatedData = [
        {
            platform: 'VirusTotal',
            // status: 'OK', // Removed, determined by responseTime
            httpStatus: 200,
            responseTime: Math.floor(Math.random() * 100) + 250, // Just the number
            timestamp: new Date().toISOString()
        },
        {
            platform: 'OpenWeatherMap',
            // status: 'OK', // Removed
            httpStatus: 200,
            responseTime: Math.floor(Math.random() * 100) + 150, // Just the number
            timestamp: new Date().toISOString()
        },
        {
            platform: 'AbuseIPDB',
            // status: Math.random() > 0.7 ? 'Error: Rate Limit Exceeded' : 'OK', // Removed
            httpStatus: Math.random() > 0.7 ? 429 : 200,
            responseTime: Math.floor(Math.random() * 400) + 400, // Just the number
            timestamp: new Date().toISOString()
        }
    ];

    // Simulate dashboard card data
    dummyData.uptime = (99 + Math.random()).toFixed(2);
    dummyData.responseTime = Math.floor(200 + Math.random() * 100);
    dummyData.apiRequests += Math.floor(Math.random() * 100);

    // Update dashboard cards with simulated data
    updateDashboardCards({
        uptime: dummyData.uptime,
        responseTime: dummyData.responseTime,
        apiRequests: dummyData.apiRequests,
        statusText: dummyData.uptime >= 99.5 ? 'All Systems Operational' : 'Partial Outage'
    });

    // Update API cards, chart, and history table with simulated data
    simulatedData.forEach(apiData => {
        updateApiCard(apiData);
    });

    // Update chart with simulated data
    updateChart(simulatedData);

    // Add simulated data to history
    addToHistory(simulatedData);
}


// UI helper functions
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const dashboardContent = document.getElementById('dashboardContent');
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (dashboardContent) dashboardContent.style.opacity = '0.5';
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const dashboardContent = document.getElementById('dashboardContent');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (dashboardContent) dashboardContent.style.opacity = '1';
}

function showError(message) {
    const errorText = document.getElementById('errorText');
    const errorContainer = document.getElementById('errorContainer');
    if (errorText) errorText.textContent = message;
    if (errorContainer) errorContainer.style.display = 'flex';
}

function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) errorContainer.style.display = 'none';
}

function toggleConfigPanel() {
    const panel = document.getElementById('configPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize chart
    initChart();

    // Load saved configuration
    loadConfig();

    // Fetch real data from your backend
    fetchData();

    // Set up periodic updates (every 40 seconds to match your backend)
    setInterval(() => {
        if (isBackendConnected) {
            fetchData();
        } else {
            simulateData();
        }
    }, 40000);

    // Add click event to refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            if (isBackendConnected) {
                fetchData();
            } else {
                simulateData();
            }
        });
    }

    // Add click event to settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function () {
            toggleConfigPanel();
        });
    }

    // Add click event to save config button
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', function () {
            saveConfig();
        });
    }
});
