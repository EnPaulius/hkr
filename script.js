// script.js – Final Version: Single Page, Resume Button, Advanced Map

let routeData = [];
const contentArea = document.getElementById('route-content');
const navigationContainer = document.getElementById('navigation');
const resetButton = document.getElementById('resetBtn');
const resumeButton = document.getElementById('resumeBtn');

// ---------------------------------------------------------
// 1. INITIALIZATION
// ---------------------------------------------------------
async function loadRouteData() {
    const jsonPath = './route_data.json';

    try {
        const response = await fetch(jsonPath, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const data = await response.json();
        routeData = data.route;
        
        // Render Interface
        renderNavigation();
        renderFullRoute();
        
        // Setup Logic
        setupResetButton();
        setupResumeButton();
        setupMapModal();     // <--- New Advanced Map Logic
        setupScrollSpy();

    } catch (error) {
        contentArea.innerHTML = `<h2 style="color:red; text-align:center">Error loading data: ${error.message}</h2>`;
        console.error(error);
    }
}

// ---------------------------------------------------------
// 2. ADVANCED MAP MODAL (Pan, Zoom, Save)
// ---------------------------------------------------------
function setupMapModal() {
    const modal = document.getElementById("mapModal");
    const openBtn = document.getElementById("mapBtn");      // Sidebar button
    const closeBtn = document.getElementById("closeMapBtn"); // Back button
    
    const viewport = document.getElementById("mapViewport");
    const img = document.getElementById("mapImage");
    
    const slider = document.getElementById("zoomSlider");
    const label = document.getElementById("zoomLabel");
    const zoomIn = document.getElementById("zoomInBtn");
    const zoomOut = document.getElementById("zoomOutBtn");

    if (!modal || !img) return;

    // State Variables
    let scale = 0.5; // Default 50%
    let pointX = 0;
    let pointY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // A. Apply CSS Transforms & Save State
    function updateTransform() {
        img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        
        // Update Controls
        if (slider) slider.value = scale;
        if (label) label.textContent = Math.round(scale * 100) + "%";
        
        // Save to LocalStorage
        const mapState = { scale, pointX, pointY };
        localStorage.setItem("hkMapState", JSON.stringify(mapState));
    }

    // B. Load Saved State
    function loadMapState() {
        const saved = localStorage.getItem("hkMapState");
        if (saved) {
            try {
                const state = JSON.parse(saved);
                scale = state.scale || 0.5;
                pointX = state.pointX || 0;
                pointY = state.pointY || 0;
            } catch (e) { console.error("Map state parse error", e); }
        } else {
            // Defaults if no save found
            scale = 0.5;
            pointX = 0;
            pointY = 0;
        }
        updateTransform();
    }

    // C. Open/Close Logic
    if (openBtn) {
        openBtn.addEventListener("click", () => {
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; // Freeze background scroll
            loadMapState(); 
        });
    }

    function closeMap() {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Unfreeze background scroll
    }

    if (closeBtn) closeBtn.addEventListener("click", closeMap);
    
    // Close on Escape Key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "block") closeMap();
    });

    // D. Panning Logic (Mouse Drag)
    if (viewport) {
        viewport.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.clientX - pointX;
            startY = e.clientY - pointY;
            viewport.style.cursor = "grabbing";
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
            if (viewport) viewport.style.cursor = "grab";
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            e.preventDefault();
            pointX = e.clientX - startX;
            pointY = e.clientY - startY;
            updateTransform();
        });

        // E. Zoom Logic (Mouse Wheel)
        viewport.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY);
            const step = 0.1;
            
            let newScale = scale + (delta * step);
            // Clamp zoom between 0.1x and 3.0x
            newScale = Math.min(Math.max(0.1, newScale), 3); 
            
            scale = newScale;
            updateTransform();
        });
    }

    // F. Zoom Controls (Slider & Buttons)
    if (slider) {
        slider.addEventListener("input", (e) => {
            scale = parseFloat(e.target.value);
            updateTransform();
        });
    }

    if (zoomIn) {
        zoomIn.addEventListener("click", () => {
            scale = Math.min(scale + 0.1, 3);
            updateTransform();
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener("click", () => {
            scale = Math.max(scale - 0.1, 0.1);
            updateTransform();
        });
    }
}

// ---------------------------------------------------------
// 3. RENDER NAVIGATION (Sidebar)
// ---------------------------------------------------------
function renderNavigation() {
    if (navigationContainer.querySelector('#dynamic-links')) {
        navigationContainer.querySelector('#dynamic-links').remove();
    }

    const dynamicLinksDiv = document.createElement('div');
    dynamicLinksDiv.id = 'dynamic-links';

    routeData.forEach(part => {
        const link = document.createElement('a');
        link.href = `#${part.id}`;
        link.textContent = part.title.split(':')[0].trim();
        link.classList.add('nav-link');
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = part.id;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                // Adjust for sticky header on mobile/laptops
                const yOffset = window.innerWidth < 1280 ? -110 : -20; 
                const y = targetSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
                history.pushState(null, '', `#${targetId}`);
            }
        });
        
        dynamicLinksDiv.appendChild(link);
    });

    // Insert links before the Resume button
    if (resumeButton) {
        navigationContainer.insertBefore(dynamicLinksDiv, resumeButton);
    } else {
        navigationContainer.prepend(dynamicLinksDiv);
    }
}

// ---------------------------------------------------------
// 4. RENDER FULL ROUTE (Main Content)
// ---------------------------------------------------------
function renderFullRoute() {
    let html = '';

    routeData.forEach(part => {
        html += `<section id="${part.id}" class="route-part-section">`;
        html += `<h1 class="part-title">${part.title}</h1>`;

        part.legs.forEach(leg => {
            html += `
                <div class="leg-section">
                    <h3>${leg.title}</h3>
                    <div class="checklist">
            `;

            leg.content.forEach(item => {
                if (item.type === 'step') {
                    const isChecked = localStorage.getItem(item.id) === 'true';
                    const completedClass = isChecked ? 'completed' : '';
                    // We add ID="row-..." to the DIV so we can scroll to it easily
                    html += `
                        <div class="checklist-item ${completedClass}" id="row-${item.id}">
                            <input type="checkbox" class="checkbox" id="${item.id}" ${isChecked ? 'checked' : ''}>
                            <span class="step-description">${item.text}</span>
                        </div>
                    `;
                } else if (item.type === 'img') {
                    if (item.src.includes('hr.png')) {
                        html += `<div class="hr-divider"></div>`;
                    } else {
                        html += `
                            <div class="image-gallery single-image">
                                <img src="${item.src}" alt="Route reference" loading="lazy">
                            </div>
                        `;
                    }
                }
            });

            html += `   </div>
                </div>`;
        });

        html += `</section>`;
    });

    contentArea.innerHTML = html;

    // Attach Checkbox Listeners
    document.querySelectorAll('.checkbox').forEach(cb => {
        cb.addEventListener('change', function () {
            localStorage.setItem(this.id, this.checked);
            this.closest('.checklist-item').classList.toggle('completed', this.checked);
        });
    });
}

// ---------------------------------------------------------
// 5. RESUME BUTTON LOGIC
// ---------------------------------------------------------
function setupResumeButton() {
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            restoreProgress();
        });
    }
}

function restoreProgress() {
    const checkboxes = Array.from(document.querySelectorAll('.checkbox'));
    const hasAnyProgress = checkboxes.some(cb => cb.checked);

    if (!hasAnyProgress) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const firstUnchecked = checkboxes.find(cb => !cb.checked);

    if (firstUnchecked) {
        const row = document.getElementById(`row-${firstUnchecked.id}`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Visual Flash
            row.style.transition = "background 0.5s";
            row.style.backgroundColor = "rgba(240, 192, 90, 0.2)";
            setTimeout(() => {
                row.style.backgroundColor = "transparent";
            }, 1000);
        }
    } else {
        // All checked? Scroll to bottom
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

// ---------------------------------------------------------
// 6. SCROLL SPY (Highlights Sidebar)
// ---------------------------------------------------------
function setupScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.setAttribute('aria-current', 'false');
                    link.classList.remove('active-nav');
                });
                const activeLink = document.querySelector(`a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.setAttribute('aria-current', 'page');
                    activeLink.classList.add('active-nav');
                }
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px' });

    document.querySelectorAll('section.route-part-section').forEach(section => {
        observer.observe(section);
    });
}

// ---------------------------------------------------------
// 7. RESET BUTTON
// ---------------------------------------------------------
function setupResetButton() {
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Reset ALL 112% progress? This cannot be undone!')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
}

// Start App
document.addEventListener('DOMContentLoaded', loadRouteData);
