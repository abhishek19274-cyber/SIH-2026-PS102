// Global State
let state = {
    projects: [],
    alerts: [],
    vendors: [],
    projectStats: {},
    alertStats: {}
};

let map;
let markers = [];

// API Config
const API_BASE = 'http://localhost:5000/api';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initMap();
    initModals();
    
    // Fetch data concurrently
    await Promise.all([
        fetchProjects(),
        fetchAlerts(),
        fetchProjectStats(),
        fetchAlertStats()
    ]);
    
    updateKPIs();
    renderAlerts();
    renderProjectsTable();
    initCharts();
});

// --- Navigation ---
function initNavigation() {
    const links = document.querySelectorAll('.nav-links li');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            // Update active state
            links.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Switch views
            const targetId = e.currentTarget.getAttribute('data-target');
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
            document.getElementById(targetId).classList.add('active-view');
            
            // Trigger map resize fix if navigating to dashboard
            if(targetId === 'dashboard-view' && map) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });
}

// --- Data Fetching ---
async function fetchProjects() {
    try {
        const res = await fetch(`${API_BASE}/projects/`);
        state.projects = await res.json();
        plotProjectsOnMap();
    } catch (e) {
        console.error("Failed to fetch projects", e);
    }
}

async function fetchAlerts() {
    try {
        const res = await fetch(`${API_BASE}/alerts/`);
        state.alerts = await res.json();
    } catch (e) {
        console.error("Failed to fetch alerts", e);
    }
}

// --- UI Updates ---
function updateKPIs() {
    // Total Projects
    document.getElementById('kpi-projects').textContent = state.projects.length.toLocaleString();
    
    // Total Disbursed
    const totalDisbursed = state.projects.reduce((sum, p) => sum + (p.disbursed_amount || 0), 0);
    // Format to Crores for readability (1 Crore = 10,000,000)
    const inCrores = (totalDisbursed / 10000000).toFixed(2);
    document.getElementById('kpi-disbursed').textContent = `₹${inCrores} Cr`;
    
    // Critical Alerts
    const criticals = state.alerts.filter(a => a.severity === 'CRITICAL');
    document.getElementById('kpi-alerts').textContent = criticals.length;
    document.getElementById('nav-alert-badge').textContent = state.alerts.length;
    
    // Cartel Rings (approximate from specific alert type)
    const cartels = state.alerts.filter(a => a.alert_type.includes('Cartel'));
    document.getElementById('kpi-cartels').textContent = cartels.length;
}

// --- Map (Leaflet) ---
function initMap() {
    // Initialize centered on India
    map = L.map('map').setView([22.5937, 78.9629], 4);
    
    // Dark matter tiles from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
}

function plotProjectsOnMap() {
    if (!map) return;
    
    // Clear old
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    // Plot up to 500 for performance
    const toPlot = state.projects.slice(0, 500);
    
    toPlot.forEach(p => {
        if (!p.latitude || !p.longitude) return;
        
        // Color based on risk
        let color = '#06b6d4'; // cyan
        if (p.composite_risk_score > 0.8) color = '#ef4444'; // red
        else if (p.composite_risk_score > 0.5) color = '#f59e0b'; // amber
        
        const circle = L.circleMarker([p.latitude, p.longitude], {
            radius: 5,
            fillColor: color,
            color: color,
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6
        }).addTo(map);
        
        circle.bindPopup(`
            <strong>${p.work_category}</strong><br>
            State: ${p.state}<br>
            Amt: ₹${p.sanctioned_amount.toLocaleString()}<br>
            Risk: ${(p.composite_risk_score * 100).toFixed(0)}%
        `);
        
        markers.push(circle);
    });
}

// --- Alerts Feed ---
function renderAlerts() {
    const feed = document.getElementById('alerts-feed');
    feed.innerHTML = '';
    
    if (state.alerts.length === 0) {
        feed.innerHTML = '<p class="text-secondary" style="text-align:center; margin-top:20px;">No alerts detected.</p>';
        return;
    }
    
    // Show top 20
    state.alerts.slice(0, 20).forEach(alert => {
        const div = document.createElement('div');
        div.className = `alert-item severity-${alert.severity}`;
        
        const dateStr = new Date(alert.created_at).toLocaleDateString();
        
        div.innerHTML = `
            <div class="alert-header">
                <span class="alert-type">${alert.alert_type}</span>
                <span class="alert-time">${dateStr}</span>
            </div>
            <div class="alert-summary">
                ${alert.natural_language_summary}
            </div>
        `;
        
        div.addEventListener('click', () => openAlertModal(alert));
        feed.appendChild(div);
    });
}

// --- Projects Table ---
function renderProjectsTable() {
    const tbody = document.querySelector('#projects-table tbody');
    tbody.innerHTML = '';
    
    state.projects.slice(0, 50).forEach(p => {
        const tr = document.createElement('tr');
        
        let riskColor = 'text-cyan';
        if(p.composite_risk_score > 0.8) riskColor = 'text-red';
        else if(p.composite_risk_score > 0.5) riskColor = 'text-amber';
        
        tr.innerHTML = `
            <td>#${p.project_id}</td>
            <td>${p.state} <br><small class="text-secondary">${p.constituency}</small></td>
            <td>${p.work_category}</td>
            <td>₹${(p.sanctioned_amount || 0).toLocaleString()}</td>
            <td><span class="badge bg-cyan-dim text-cyan">${p.project_status}</span></td>
            <td class="${riskColor}"><strong>${(p.composite_risk_score * 100).toFixed(0)}%</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Charts (Chart.js) ---
function initCharts() {
    // 1. Risk Chart (Doughnut)
    const ctxRisk = document.getElementById('riskChart').getContext('2d');
    
    let low = 0, med = 0, high = 0;
    state.projects.forEach(p => {
        if(p.composite_risk_score > 0.8) high++;
        else if(p.composite_risk_score > 0.5) med++;
        else low++;
    });
    
    new Chart(ctxRisk, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [low, med, high],
                backgroundColor: ['#06b6d4', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
        }
    });
    
    // 2. Timeline Chart (Bar) - Fake some timeline data based on projects
    const ctxTime = document.getElementById('timelineChart').getContext('2d');
    
    // Group by year (simplistic for demo)
    const years = {};
    state.projects.forEach(p => {
        if(!p.sanction_date) return;
        const y = p.sanction_date.substring(0, 4);
        years[y] = (years[y] || 0) + 1;
    });
    
    const sortedYears = Object.keys(years).sort();
    
    new Chart(ctxTime, {
        type: 'bar',
        data: {
            labels: sortedYears,
            datasets: [{
                label: 'Projects Sanctioned',
                data: sortedYears.map(y => years[y]),
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- Modals ---
function initModals() {
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('modal-close-footer').addEventListener('click', closeModal);
}

function openAlertModal(alert) {
    document.getElementById('modal-title').textContent = alert.alert_type;
    document.getElementById('modal-summary').textContent = alert.natural_language_summary;
    
    const shapContainer = document.getElementById('modal-shap');
    shapContainer.innerHTML = '';
    
    if (alert.shap_explanation && alert.shap_explanation.attributions) {
        alert.shap_explanation.attributions.forEach(attr => {
            // calc width %
            const impact = Math.abs(attr.impact);
            const maxImpact = Math.max(...alert.shap_explanation.attributions.map(a => Math.abs(a.impact)));
            const width = Math.max(10, (impact / maxImpact) * 100);
            
            let colorClass = attr.impact > 0 ? 'bg-red' : 'bg-green';
            
            shapContainer.innerHTML += `
                <div class="shap-bar">
                    <div class="shap-label" title="${attr.description}">${attr.feature.replace(/_/g, ' ')}</div>
                    <div class="shap-track">
                        <div class="shap-fill ${colorClass}" style="width: ${width}%"></div>
                    </div>
                    <div class="shap-val">${attr.impact > 0 ? '+' : ''}${attr.impact.toFixed(2)}</div>
                </div>
            `;
        });
    } else {
        shapContainer.innerHTML = '<p class="text-secondary">No granular AI explanation available.</p>';
    }
    
    document.getElementById('alert-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('alert-modal').classList.remove('active');
}
