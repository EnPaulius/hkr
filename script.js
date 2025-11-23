// script.js – Final Version + Progress Bar

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
        
        // Render
        renderNavigation();
        renderFullRoute();
        
        // Setup
        setupResetButton();
        setupResumeButton();
        setupMapModal();
        setupScrollSpy();
        
        // Calculate initial progress
        updateProgressBar(); 

    } catch (error) {
        contentArea.innerHTML = `<h2 style="color:red; text-align:center">Error loading data: ${error.message}</h2>`;
        console.error(error);
    }
}

// ---------------------------------------------------------
// 2. PROGRESS BAR LOGIC (New Feature)
// ---------------------------------------------------------
function updateProgressBar() {
    const allBoxes = document.querySelectorAll('.checkbox');
    const checkedBoxes = document.querySelectorAll('.checkbox:checked');
    
    const total = allBoxes.length;
    const checked = checkedBoxes.length;
    
    if (total === 0) return;

    // Calculate percentage
    const percent = Math.round((checked / total) * 100);
    
    // Elements
    const bar = document.getElementById('progressBar');
    const text = document.getElementById('progressText');
    
    if (!bar || !text) return;

    // Update Width and Text
    bar.style.width = `${percent}%`;
    text.textContent = `${percent}% Completed`;

    // --- COLOR LOGIC ---
    // Remove old classes
    bar.classList.remove('yellow', 'green', 'blue');

    // 1. Check for Blue (100% of Checklist = 112% Game)
    if (percent === 100) {
        bar.classList.add('blue');
        text.textContent = "112% COMPLETE!";
    } 
    // 2. Check for Green (The specific 100% Ending Step)
    else {
        // The specific step ID for 100% normal ending
        const endingStep = document.getElementById('l06s12');
        
        if (endingStep && endingStep.checked) {
            bar.classList.add('green');
        } else {
            bar.classList.add('yellow');
        }
    }
}

// ---------------------------------------------------------
// 3. ADVANCED MAP MODAL (Updated for Mobile Touch)
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

    function updateTransform() {
        img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        if (slider) slider.value = scale;
        if (label) label.textContent = Math.round(scale * 100) + "%";
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
            document.body.style.overflow = "hidden"; // Stop background scrolling
            loadMapState(); 
        });
    }

    function closeMap() {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Restore background scrolling
    }

    if (closeBtn) closeBtn.addEventListener("click", closeMap);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.style.display === "block") closeMap(); });

    if (viewport) {
        // --- MOUSE EVENTS (Desktop) ---
        viewport.addEventListener("mousedown", (e) => {
            e.preventDefault();
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

        // --- TOUCH EVENTS (Mobile) ---
        viewport.addEventListener("touchstart", (e) => {
            // Use the first finger that touched the screen
            if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - pointX;
                startY = e.touches[0].clientY - pointY;
            }
        }, { passive: false });

        window.addEventListener("touchend", () => {
            isDragging = false;
        });

        window.addEventListener("touchmove", (e) => {
            if (!isDragging) return;
            // Prevent the default behavior (scrolling the webpage)
            e.preventDefault(); 
            pointX = e.touches[0].clientX - startX;
            pointY = e.touches[0].clientY - startY;
            updateTransform();
        }, { passive: false });

        // --- ZOOM WHEEL ---
        viewport.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY);
            scale = Math.min(Math.max(0.1, scale + (delta * 0.1)), 3);
            updateTransform();
        });
    }

    // Zoom Controls
    if (slider) slider.addEventListener("input", (e) => { scale = parseFloat(e.target.value); updateTransform(); });
    if (zoomIn) zoomIn.addEventListener("click", () => { scale = Math.min(scale + 0.1, 3); updateTransform(); });
    if (zoomOut) zoomOut.addEventListener("click", () => { scale = Math.max(scale - 0.1, 0.1); updateTransform(); });
}

// ---------------------------------------------------------
// 4. NAVIGATION RENDERING
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
            const targetSection = document.getElementById(part.id);
            if (targetSection) {
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

// ---------------------------------------------------------
// 5. MAIN ROUTE RENDERING
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

    // Checkbox Listeners
    document.querySelectorAll('.checkbox').forEach(cb => {
        cb.addEventListener('change', function () {
            localStorage.setItem(this.id, this.checked);
            this.closest('.checklist-item').classList.toggle('completed', this.checked);
            // UPDATE PROGRESS BAR ON EVERY CLICK
            updateProgressBar(); 
        });
    });
}

// ---------------------------------------------------------
// 6. UTILITIES
// ---------------------------------------------------------
function setupResumeButton() {
    if (resumeButton) resumeButton.addEventListener('click', restoreProgress);
}

function restoreProgress() {
    const checkboxes = Array.from(document.querySelectorAll('.checkbox'));
    if (!checkboxes.some(cb => cb.checked)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    const firstUnchecked = checkboxes.find(cb => !cb.checked);
    if (firstUnchecked) {
        const row = document.getElementById(`row-${firstUnchecked.id}`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.transition = "background 0.5s";
            row.style.backgroundColor = "rgba(240, 192, 90, 0.2)";
            setTimeout(() => { row.style.backgroundColor = "transparent"; }, 1000);
        }
    } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

function setupScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.nav-link').forEach(l => {
                    l.setAttribute('aria-current', 'false');
                    l.classList.remove('active-nav');
                });
                const active = document.querySelector(`a[href="#${entry.target.id}"]`);
                if (active) {
                    active.setAttribute('aria-current', 'page');
                    active.classList.add('active-nav');
                }
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

document.addEventListener('DOMContentLoaded', loadRouteData);
