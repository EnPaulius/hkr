// script.js – Enhanced Error Handling + User Experience

let routeData = [];
const contentArea = document.getElementById('route-content');
const navigationContainer = document.getElementById('navigation');
const resetButton = document.getElementById('resetBtn');

// 1. Load Route Data with Detailed Error Feedback
async function loadRouteData() {
    const jsonPath = './route_data.json';

    try {
        console.log('Attempting to load:', jsonPath);
        const response = await fetch(jsonPath, { cache: "no-cache" }); // Prevent caching issues

        // Network or HTTP errors
        if (!response.ok) {
            const isLocal = location.protocol === 'file:';
            throw new Error(`
                <strong>Failed to load route_data.json</strong><br><br>
                Status: ${response.status} ${response.statusText}<br><br>
                ${response.status === 404 
                    ? `File not found at: <code>${jsonPath}</code><br><br>
                       Make sure <strong>route_data.json</strong> is in the same folder as index.html<br>
                       and that the filename is spelled exactly right (case-sensitive!).`
                    : `Server error. Try refreshing the page.`}
                ${isLocal 
                    ? `<br><br><strong>Warning:</strong> You're opening the site directly from a file (file://).<br>
                       Use a local server instead (e.g. Live Server in VS Code, or Python http.server).`
                    : ''}
            `);
        }

        // Try to parse JSON (catches syntax errors)
        const data = await response.json();

        if (!data || !Array.isArray(data.route)) {
            throw new Error(`
                <strong>Invalid JSON structure</strong><br><br>
                Expected a JSON object with a "route" array at the top level.<br>
                Current structure: <code>${JSON.stringify(data).slice(0, 200)}...</code>
            `);
        }

        routeData = data.route; // Important: your actual data is under .route[]
        console.log('Route data loaded successfully:', routeData.length, 'parts');
        initializeApp();

    } catch (error) {
        // Distinguish between network errors and JSON parse errors
        const isParseError = error instanceof SyntaxError;

        contentArea.innerHTML = `
            <div style="padding: 2rem; text-align: center; background: #2a1a1a; border-radius: 12px; border: 2px solid #d9534f; margin: 2rem;">
                <h1 style="color: #d9534f; margin-bottom: 1rem;">Error Loading Route Data</h1>
                <div style="font-size: 1.1rem; line-height: 1.7; color: #eee;">
                    ${error.message || error}
                </div>
                <hr style="margin: 1.5rem 0; border-color: #555;">
                <p style="font-size: 0.95rem; opacity: 0.8;">
                    <strong>Troubleshooting Tips:</strong><br>
                    • Make sure <code>route_data.json</code> is in the same folder as this page<br>
                    • Check for typos in the filename (GitHub is case-sensitive)<br>
                    • Validate your JSON at <a href="https://jsonlint.com" target="_blank" style="color:#f0c05a">jsonlint.com</a><br>
                    • If testing locally: don't open index.html directly — use a server!
                </p>
            </div>
        `;

        console.error('Failed to load route data:', error);
    }
}

// 2. Core Rendering Functions (unchanged except one fix below)
function renderNavigation() {
    if (navigationContainer.querySelector('#dynamic-links')) {
        navigationContainer.querySelector('#dynamic-links').remove();
    }

    const dynamicLinksDiv = document.createElement('div');
    dynamicLinksDiv.id = 'dynamic-links';

    const homeLink = document.createElement('a');
    homeLink.href = '#home';
    homeLink.textContent = 'Home';
    homeLink.classList.add('nav-link');
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderHome();
        history.pushState(null, '', '#home');
    });
    dynamicLinksDiv.appendChild(homeLink);

    routeData.forEach(part => {
        const link = document.createElement('a');
        link.href = `#${part.id}`;
        link.textContent = part.title.split(':')[0].trim();
        link.classList.add('nav-link');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            renderPart(part.id);
            history.pushState(null, '', `#${part.id}`);
        });
        dynamicLinksDiv.appendChild(link);
    });

    // Insert before the map button
    const mapLink = navigationContainer.querySelector('a[href="map.html"]');
    navigationContainer.insertBefore(dynamicLinksDiv, mapLink);
}

function renderHome() {
    contentArea.innerHTML = `
        <h1 style="text-align:center; margin-bottom: 1rem;">Hollow Knight 112% Route</h1>
        <p style="text-align:center; font-size: 1.2rem; opacity: 0.9;">
            Select a part from the navigation to begin tracking your run.
        </p>
    `;
    updateActiveNav(null);
}

function renderPart(partId) {
    const part = routeData.find(p => p.id === partId);
    if (!part) {
        contentArea.innerHTML = `<h2 style="color:#d9534f; text-align:center;">Part not found: ${partId}</h2>`;
        return;
    }

    let html = `<h1>${part.title}</h1>`;

    part.legs.forEach(leg => {
        html += `
            <div class="leg-section">
                <h3>${leg.title}</h3>
                <ul class="checklist">
        `;

        leg.steps.forEach(step => {
            const isChecked = localStorage.getItem(step.id) === 'true';
            const completedClass = isChecked ? 'completed' : '';
            html += `
                <li class="checklist-item ${completedClass}">
                    <input type="checkbox" class="checkbox" id="${step.id}" ${isChecked ? 'checked' : ''}>
                    <span class="step-description">${step.description}</span>
                </li>
            `;
        });

        html += `</ul>`;

        if (leg.images && leg.images.length > 0) {
            html += `<div class="image-gallery">`;
            leg.images.forEach(src => {
                if (src.includes('hr.png')) {
                    html += `<img src="${src}" alt="divider" class="hr-image">`;
                } else {
                    html += `<img src="${src}" alt="${leg.title} reference" loading="lazy">`;
                }
            });
            html += `</div>`;
        }

        html += `</div>`;
    });

    contentArea.innerHTML = html;
    updateActiveNav(partId);

    // Re-attach checkbox listeners (since we used innerHTML)
    document.querySelectorAll('.checkbox').forEach(cb => {
        cb.addEventListener('change', function () {
            const id = this.id;
            const checked = this.checked;
            localStorage.setItem(id, checked);
            this.closest('.checklist-item').classList.toggle('completed', checked);
        });
    });
}

function updateActiveNav(activeId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const isActive = activeId === null 
            ? link.href.includes('#home')
            : link.href.includes(`#${activeId}`);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
}

// 3. LocalStorage & Reset
window.toggleChecklistItem = null; // Removed — we now use event delegation (better!)

function setupResetButton() {
    resetButton.addEventListener('click', () => {
        if (confirm('Reset ALL 112% progress? This cannot be undone!')) {
            localStorage.clear();
            alert('Progress reset! Reloading current section...');
            const hash = location.hash.slice(1);
            if (hash && routeData.some(p => p.id === hash)) {
                renderPart(hash);
            } else {
                renderHome();
            }
        }
    });
}

// 4. Start App
function initializeApp() {
    renderNavigation();
    setupResetButton();

    const hash = location.hash.slice(1);
    if (hash && routeData.some(p => p.id === hash)) {
        renderPart(hash);
    } else {
        renderHome();
    }
}

// Handle browser back/forward buttons
window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    if (!hash || hash === 'home') {
        renderHome();
    } else if (routeData.some(p => p.id === hash)) {
        renderPart(hash);
    }
});

// Start everything
document.addEventListener('DOMContentLoaded', loadRouteData);
