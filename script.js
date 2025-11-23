// script.js – Final Version

let routeData = [];
const contentArea = document.getElementById('route-content');
const navigationContainer = document.getElementById('navigation');
const resetButton = document.getElementById('resetBtn');
const resumeButton = document.getElementById('resumeBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// 1. Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    loadRouteData();
});

async function loadRouteData() {
    try {
        const response = await fetch('./route_data.json', { cache: "no-cache" });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();
        routeData = data.route;
        
        renderNavigation();
        renderFullRoute();
        
        setupGlobalEventListeners();
        setupResetButton();
        setupResumeButton();
        setupMapModal();
        setupScrollSpy();
        updateProgressBar(); 
    } catch (error) {
        contentArea.innerHTML = `<h2 style="color:red; text-align:center">Error: ${error.message}</h2>`;
    }
}

// 2. Theme Manager (Fixed Checkbox Colors)
function setupTheme() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('hkTheme') || 'theme-default';
    applyTheme(savedTheme);

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme')));
    });

    function applyTheme(themeName) {
        document.body.className = themeName;
        localStorage.setItem('hkTheme', themeName);
        themeButtons.forEach(btn => {
            if (btn.getAttribute('data-theme') === themeName) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }
}

// 3. Navigation Render (Fixed Mobile Grid & Position)
function renderNavigation() {
    const existingLinks = document.getElementById('dynamic-links');
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
            const target = document.getElementById(part.id);
            if (target) {
                // Adjust offset based on mobile/desktop
                const offset = window.innerWidth < 1280 ? -180 : -20;
                const y = target.getBoundingClientRect().top + window.pageYOffset + offset;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        });
        dynamicLinksDiv.appendChild(link);
    });

    // Insert Links BEFORE the buttons (.nav-actions)
    const actionsContainer = document.querySelector('.nav-actions');
    if (actionsContainer && actionsContainer.parentNode === navigationContainer) {
        navigationContainer.insertBefore(dynamicLinksDiv, actionsContainer);
    } else {
        navigationContainer.prepend(dynamicLinksDiv);
    }
}

// 4. Content Render (Checklist)
function renderFullRoute() {
    let html = '';
    routeData.forEach(part => {
        html += `<section id="${part.id}" class="route-part-section">`;
        html += `<h1 class="part-title">${part.title}</h1>`;
        part.legs.forEach(leg => {
            html += `<div class="leg-section"><h3>${leg.title}</h3><div class="checklist">`;
            leg.content.forEach(item => {
                if (item.type === 'step') {
                    const isChecked = localStorage.getItem(item.id) === 'true';
                    html += `
                        <div class="checklist-item ${isChecked ? 'completed' : ''}" id="row-${item.id}">
                            <input type="checkbox" class="checkbox" id="${item.id}" ${isChecked ? 'checked' : ''}>
                            <span class="step-description">${item.text}</span>
                        </div>
                    `;
                } else if (item.type === 'img') {
                    if (item.src.includes('hr.png')) html += `<div class="hr-divider"></div>`;
                    else html += `<div class="image-gallery"><img src="${item.src}" loading="lazy"></div>`;
                }
            });
            html += `</div></div>`;
        });
        html += `</section>`;
    });
    contentArea.innerHTML = html;
}

// 5. Event Listeners & Progress
function setupGlobalEventListeners() {
    contentArea.addEventListener('change', (e) => {
        if (e.target.classList.contains('checkbox')) {
            const cb = e.target;
            const row = cb.closest('.checklist-item');
            localStorage.setItem(cb.id, cb.checked);
            
            if (cb.checked) row.classList.add('completed');
            else row.classList.remove('completed');
            
            updateProgressBar();
        }
    });
}

function updateProgressBar() {
    const all = document.querySelectorAll('.checkbox');
    const checked = document.querySelectorAll('.checkbox:checked');
    if (all.length === 0) return;
    
    const percent = Math.round((checked.length / all.length) * 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}% Completed`;
}

// 6. Map Modal (Fixed z-index & Mobile Pinch)
function setupMapModal() {
    const modal = document.getElementById("mapModal");
    const openBtn = document.getElementById("mapBtn");
    const closeBtn = document.getElementById("closeMapBtn");
    const viewport = document.getElementById("mapViewport");
    const img = document.getElementById("mapImage");
    const slider = document.getElementById("zoomSlider");
    const zoomLabel = document.getElementById("zoomLabel");
    const zoomIn = document.getElementById("zoomInBtn");
    const zoomOut = document.getElementById("zoomOutBtn");

    if (!modal || !img) return;

    let scale = 0.5, pointX = 0, pointY = 0;
    let isDragging = false, startX = 0, startY = 0;
    let startPinchDist = 0, startScale = 0;

    function updateTransform() {
        scale = Math.min(Math.max(0.1, scale), 3);
        img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        if(slider) slider.value = scale;
        if(zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + "%";
    }

    if (openBtn) openBtn.addEventListener("click", () => {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
        updateTransform();
    });

    const closeMap = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    };

    if (closeBtn) closeBtn.addEventListener("click", closeMap);

    // Mouse & Touch Logic
    if (viewport) {
        // Mouse
        viewport.addEventListener("mousedown", (e) => {
            e.preventDefault(); isDragging = true;
            startX = e.clientX - pointX; startY = e.clientY - pointY;
            viewport.style.cursor = "grabbing";
        });
        window.addEventListener("mouseup", () => {
            isDragging = false; if(viewport) viewport.style.cursor = "grab";
        });
        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return; e.preventDefault();
            pointX = e.clientX - startX; pointY = e.clientY - startY;
            updateTransform();
        });

        // Touch
        viewport.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
                e.preventDefault(); isDragging = false;
                startPinchDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                startScale = scale;
            } else if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - pointX; startY = e.touches[0].clientY - pointY;
            }
        }, { passive: false });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                scale = startScale * (dist / startPinchDist);
                updateTransform();
            } else if (isDragging && e.touches.length === 1) {
                e.preventDefault();
                pointX = e.touches[0].clientX - startX; pointY = e.touches[0].clientY - startY;
                updateTransform();
            }
        }, { passive: false });

        window.addEventListener("touchend", () => isDragging = false);
    }

    if(slider) slider.addEventListener("input", (e) => { scale = parseFloat(e.target.value); updateTransform(); });
    if(zoomIn) zoomIn.addEventListener("click", () => { scale += 0.1; updateTransform(); });
    if(zoomOut) zoomOut.addEventListener("click", () => { scale -= 0.1; updateTransform(); });
}

function setupResumeButton() {
    if (!resumeButton) return;
    resumeButton.addEventListener('click', () => {
        const unchecked = document.querySelector('.checkbox:not(:checked)');
        if (unchecked) {
            unchecked.closest('.checklist-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    if (!resetButton) return;
    resetButton.addEventListener('click', () => {
        if (confirm('Reset ALL progress?')) {
            localStorage.clear();
            location.reload();
        }
    });
}
