# API Health Dashboard

A modern, responsive dashboard for monitoring API health, built with HTML, CSS, and JavaScript. It provides real-time insights into API uptime, response times, and request volumes, featuring a cyberpunk-themed sidebar and dynamic charts.

## Features
- **Real-Time Monitoring**: Displays uptime, average response time, and API request counts.
- **API Status Cards**: Individual cards for APIs (e.g., VirusTotal, OpenWeatherMap, AbuseIPDB) showing status, response time, and last checked timestamp.
- **Response Time Chart**: Visualizes response time trends over the last 24 hours using Chart.js.
- **Cyberpunk Sidebar**: Collapsible sidebar with futuristic styling and navigation links.
- **Configuration Panel**: Allows users to set backend URL and endpoints.
- **Add API Key Modal**: Interface for adding new API keys (simulated).
- **Responsive Design**: Adapts to various screen sizes with media queries.
- **Error Handling**: Displays connection errors and falls back to simulated data.

## Installation

1. **Clone or Download**:
   - Download the `index.html` file or clone the repository containing the dashboard code.

2. **Dependencies**:
   - The dashboard uses external libraries hosted via CDNs:
     - [Font Awesome](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css) for icons.
     - [Chart.js](https://cdn.jsdelivr.net/npm/chart.js) for the response time chart.
     - [Orbitron Font](https://fonts.googleapis.com/css2?family=Orbitron) for the sidebar.
   - No additional installation is required as these are loaded via `<link>` and `<script>` tags.

3. **Setup**:
   - Place the `index.html` file in a web server directory (e.g., XAMPP, Nginx, or a simple HTTP server).
   - Alternatively, open `index.html` directly in a modern web browser for local testing (some features may be limited due to CORS restrictions).

## Usage

1. **Running the Dashboard**:
   - Open `index.html` in a browser or host it on a web server.
   - The dashboard initializes with simulated data if no backend is configured.

2. **Configuring the Backend**:
   - Click the **Settings** button to open the configuration panel.
   - Enter the backend URL (e.g., `http://localhost:3000`), health endpoint (e.g., `/health`), and stats endpoint (e.g., `/stats`).
   - Click **Save** to store the configuration in `localStorage` and fetch data from the backend.

3. **Adding API Keys**:
   - Click the **Add API Key** button to open the modal.
   - Enter the API name and key (currently a simulation; no actual storage).
   - Submit the form to simulate adding a key.

4. **Refreshing Data**:
   - Click the **Refresh Data** button to fetch updated data from the backend or simulate new data if disconnected.

5. **Navigation**:
   - Hover over the sidebar to expand it and access navigation links (Dashboard, API List, Server, Stats, Settings).
   - Note: Linked pages (`ind2.html`, `pages/api-list.html`, etc.) are placeholders and need to be created for full functionality.

## File Structure
- `index.html`: The main dashboard file containing HTML, CSS, and JavaScript.
- `pages/`: Directory for additional pages (not included; create as needed for sidebar links).

## Backend Requirements
- The dashboard expects a backend server with:
  - A `/health` endpoint returning an array of API status objects (e.g., `{ platform, status, httpStatus, responseTime, timestamp }`).
  - A `/stats` endpoint returning aggregated stats (e.g., `{ uptime, avgResponseTime, apiRequests }`).
- If no backend is available, the dashboard uses simulated data with random values.

## Customization
- **Styling**: Modify the CSS in the `<style>` section to change colors, fonts, or layout.
- **APIs**: Update the `simulateData` function or backend integration to monitor different APIs.
- **Chart**: Adjust the `chartData` object and Chart.js options in the `<script>` section to customize the response time chart.
- **Sidebar Links**: Update the `<a href>` paths in the sidebar to point to actual pages.

## Limitations
- **Backend Dependency**: Full functionality requires a compatible backend server. Without it, the dashboard uses simulated data.
- **Local File Access**: Running `index.html` locally may cause CORS issues with external CDNs or backend requests. Use a web server for production.
- **Placeholder Pages**: Sidebar links point to placeholder files that need to be created.
- **API Key Storage**: The "Add API Key" feature is a simulation and does not persist data.

## Troubleshooting
- **No Data Displayed**: Ensure the backend URL and endpoints are correct in the configuration panel. Check the browser console for errors.
- **CORS Issues**: Host the dashboard on a web server or configure the backend to allow cross-origin requests.
- **Chart Not Rendering**: Verify that Chart.js is loaded correctly and the browser supports Canvas.

## License
This project is provided as-is for personal or educational use. No official license is specified.

## Acknowledgments
- Built with [Font Awesome](https://fontawesome.com/) for icons.
- Powered by [Chart.js](https://www.chartjs.org/) for data visualization.
- Styled with a cyberpunk-inspired aesthetic using the [Orbitron](https://fonts.google.com/specimen/Orbitron) font.
