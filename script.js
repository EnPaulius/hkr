// script.js – Final Version: 112% Route + Themes + Mobile Map Fix

let routeData = [];
const contentArea = document.getElementById('route-content');
const navigationContainer = document.getElementById('navigation');
const resetButton = document.getElementById('resetBtn');
const resumeButton = document.getElementById('resumeBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// ---------------------------------------------------------
// 1. INITIALIZATION
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    setupTheme(); // Run immediate theme setup
    loadRouteData();
});

async function loadRouteData() {
    const jsonPath = './route_data.json';

    try {
        const response = await fetch(jsonPath, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const data = await response.json();
        routeData = data.route;
        
        // Render UI
        renderNavigation();
        renderFullRoute();
        
        // Setup Interactive Components
        setupGlobalEventListeners(); // Optimized Event Delegation
        setupResetButton();
        setupResumeButton();
        setupMapModal();
        setupScrollSpy();
        
        // Initial Calc
        updateProgressBar(); 

    } catch (error) {
        contentArea.innerHTML = `<h2 style="color:red; text-align:center">Error loading data: ${error.message}</h2>`;
        console.error(error);
    }
}

// ---------------------------------------------------------
// 7. THEME MANAGER (Icon Version)
// ---------------------------------------------------------
function setupTheme() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    // 1. Load Saved Theme
    const savedTheme = localStorage.getItem('hkTheme') || 'theme-default';
    applyTheme(savedTheme);

    // 2. Add Click Listeners
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const newTheme = btn.getAttribute('data-theme');
            applyTheme(newTheme);
        });
    });

    // Helper Function
    function applyTheme(themeName) {
        // A. Set Body Class
        document.body.className = themeName;
        
        // B. Save to Storage
        localStorage.setItem('hkTheme', themeName);

        // C. Update Active Button State
        themeButtons.forEach(btn => {
            if (btn.getAttribute('data-theme') === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// ---------------------------------------------------------
// 3. RENDER LOGIC
// ---------------------------------------------------------
function renderNavigation() {
    const existingLinks = navigationContainer.querySelector('#dynamic-links');
    if (existingLinks) existingLinks.remove();

    const dynamicLinksDiv = document.createElement('div');
    dynamicLinksDiv.id = 'dynamic-links';

    routeData.forEach(part => {
        const link = document.createElement('a');
        link.href = `#${part.id}`;
        link.textContent = part.title.split(':')[0].trim();
        link.classList.add('nav-link');
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.getElementById(part.id);
            if (targetSection) {
                // Mobile offset adjustment
                const yOffset = window.innerWidth < 1280 ? -110 : -20; 
                const y = targetSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
                history.pushState(null, '', `#${part.id}`);
            }
        });
        dynamicLinksDiv.appendChild(link);
    });

    if (resumeButton) navigationContainer.insertBefore(dynamicLinksDiv, resumeButton);
    else navigationContainer.prepend(dynamicLinksDiv);
}

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
                    // Check localStorage directly during render string generation
                    const isChecked = localStorage.getItem(item.id) === 'true';
                    const completedClass = isChecked ? 'completed' : '';
                    html += `
                        <div class="checklist-item ${completedClass}" id="row-${item.id}">
                            <input type="checkbox" class="checkbox" id="${item.id}" ${isChecked ? 'checked' : ''}>
                            <span class="step-description">${item.text}</span>
                        </div>
                    `;
                } else if (item.type === 'img') {
                    if (item.src.includes('hr.png')) html += `<div class="hr-divider"></div>`;
                    else html += `<div class="image-gallery single-image"><img src="${item.src}" alt="Reference" loading="lazy"></div>`;
                }
            });
            html += `</div></div>`;
        });
        html += `</section>`;
    });

    contentArea.innerHTML = html;
}

// ---------------------------------------------------------
// 4. EVENT DELEGATION (Performance Optimization)
// ---------------------------------------------------------
function setupGlobalEventListeners() {
    // Instead of adding 100+ listeners, we add ONE to the container
    contentArea.addEventListener('change', (e) => {
        if (e.target.classList.contains('checkbox')) {
            const checkbox = e.target;
            const row = checkbox.closest('.checklist-item');
            
            // Save state
            localStorage.setItem(checkbox.id, checkbox.checked);
            
            // Visual update
            if (checkbox.checked) row.classList.add('completed');
            else row.classList.remove('completed');
            
            updateProgressBar();
        }
    });
}

// ---------------------------------------------------------
// 5. PROGRESS BAR
// ---------------------------------------------------------
function updateProgressBar() {
    const allBoxes = document.querySelectorAll('.checkbox');
    const checkedBoxes = document.querySelectorAll('.checkbox:checked');
    
    if (allBoxes.length === 0) return;

    const percent = Math.round((checkedBoxes.length / allBoxes.length) * 100);
    
    if (!progressBar || !progressText) return;

    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}% Completed`;

    // Color Logic
    progressBar.classList.remove('yellow', 'green', 'blue');

    if (percent === 100) {
        progressBar.classList.add('blue');
        progressText.textContent = "112% COMPLETE!";
    } else {
        // Check specifically for 100% ending step
        const endingStep = document.getElementById('l06s12');
        if (endingStep && endingStep.checked) {
            progressBar.classList.add('green');
        } else {
            progressBar.classList.add('yellow');
        }
    }
}

// ---------------------------------------------------------
// 6. MAP MODAL (Optimized for Mobile)
// ---------------------------------------------------------
function setupMapModal() {
    const modal = document.getElementById("mapModal");
    const openBtn = document.getElementById("mapBtn");
    const closeBtn = document.getElementById("closeMapBtn");
    const viewport = document.getElementById("mapViewport");
    const img = document.getElementById("mapImage");
    const slider = document.getElementById("zoomSlider");
    const label = document.getElementById("zoomLabel");
    const zoomIn = document.getElementById("zoomInBtn");
    const zoomOut = document.getElementById("zoomOutBtn");

    if (!modal || !img) return;

    let scale = 0.5, pointX = 0, pointY = 0;
    let isDragging = false, startX = 0, startY = 0;
    let startPinchDist = 0, startScale = 0;

    function getDistance(touches) {
        return Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
        );
    }

    function updateTransform() {
        scale = Math.min(Math.max(0.1, scale), 3);
        img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        if (slider) slider.value = scale;
        if (label) label.textContent = Math.round(scale * 100) + "%";
        // Note: We removed localStorage saving from here for performance
    }

    function saveMapState() {
        localStorage.setItem("hkMapState", JSON.stringify({ scale, pointX, pointY }));
    }

    function loadMapState() {
        const saved = localStorage.getItem("hkMapState");
        if (saved) {
            try {
                const state = JSON.parse(saved);
                scale = state.scale || 0.5; 
                pointX = state.pointX || 0; 
                pointY = state.pointY || 0;
            } catch (e) {}
        }
        updateTransform();
    }

    if (openBtn) {
        openBtn.addEventListener("click", () => {
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; 
            loadMapState(); 
        });
    }

    function closeMap() {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; 
    }

    if (closeBtn) closeBtn.addEventListener("click", closeMap);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.style.display === "block") closeMap(); });

    if (viewport) {
        // --- MOUSE ---
        viewport.addEventListener("mousedown", (e) => {
            e.preventDefault(); isDragging = true; 
            startX = e.clientX - pointX; startY = e.clientY - pointY; 
            viewport.style.cursor = "grabbing";
        });
        window.addEventListener("mouseup", () => { 
            if(isDragging) { isDragging = false; saveMapState(); } // Save on release
            if (viewport) viewport.style.cursor = "grab"; 
        });
        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return; e.preventDefault();
            pointX = e.clientX - startX; pointY = e.clientY - startY; 
            updateTransform();
        });

        // --- TOUCH ---
        viewport.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) { // Pinch
                e.preventDefault(); isDragging = false;
                startPinchDist = getDistance(e.touches); startScale = scale;
            } else if (e.touches.length === 1) { // Drag
                isDragging = true;
                startX = e.touches[0].clientX - pointX; startY = e.touches[0].clientY - pointY;
            }
        }, { passive: false });

        window.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) startPinchDist = 0;
            if (e.touches.length === 0 && isDragging) { 
                isDragging = false; 
                saveMapState(); // Save on release
            }
        });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2 && startPinchDist > 0) { // Pinching
                e.preventDefault();
                const zoomFactor = getDistance(e.touches) / startPinchDist;
                scale = startScale * zoomFactor;
                updateTransform();
            } else if (isDragging && e.touches.length === 1) { // Dragging
                e.preventDefault(); 
                pointX = e.touches[0].clientX - startX; pointY = e.touches[0].clientY - startY;
                updateTransform();
            }
        }, { passive: false });

        // --- WHEEL ---
        viewport.addEventListener("wheel", (e) => {
            e.preventDefault();
            scale = Math.min(Math.max(0.1, scale + (-Math.sign(e.deltaY) * 0.1)), 3);
            updateTransform();
            // Debounce saving map state could be added here, but wheel is less frequent than drag
            clearTimeout(window.mapSaveTimeout);
            window.mapSaveTimeout = setTimeout(saveMapState, 500);
        });
    }

    // Controls
    if (slider) slider.addEventListener("input", (e) => { scale = parseFloat(e.target.value); updateTransform(); saveMapState(); });
    if (zoomIn) zoomIn.addEventListener("click", () => { scale = Math.min(scale + 0.1, 3); updateTransform(); saveMapState(); });
    if (zoomOut) zoomOut.addEventListener("click", () => { scale = Math.max(scale - 0.1, 0.1); updateTransform(); saveMapState(); });
}

// ---------------------------------------------------------
// 7. UTILITIES
// ---------------------------------------------------------
function setupResumeButton() {
    if (resumeButton) resumeButton.addEventListener('click', () => {
        const firstUnchecked = document.querySelector('.checkbox:not(:checked)');
        if (firstUnchecked) {
            const row = firstUnchecked.closest('.checklist-item');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.transition = "background 0.5s";
            row.style.backgroundColor = "rgba(240, 192, 90, 0.3)";
            setTimeout(() => { row.style.backgroundColor = "transparent"; }, 1000);
        } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    });
}

function setupScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active-nav'));
                const active = document.querySelector(`a[href="#${entry.target.id}"]`);
                if (active) active.classList.add('active-nav');
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('section.route-part-section').forEach(s => observer.observe(s));
}

function setupResetButton() {
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Reset ALL 112% progress?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
}
