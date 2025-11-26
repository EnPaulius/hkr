// script.js – Final Version (Src Folder Path)

let routeData = [];
const contentArea = document.getElementById('route-content');
const navigationContainer = document.getElementById('navigation');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// 1. Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupEyeToggle();
    loadRouteData();
});

async function loadRouteData() {
    // CHANGED: Path now points to src folder relative to index.html
    const jsonPath = 'src/hk/route_data.json'; 

    try {
        const response = await fetch(jsonPath, { cache: "no-cache" });
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
        
        // Apply collapse state on load
        if (localStorage.getItem('hideCompleted') === 'true') {
            checkAndCollapseLegs(true);
        }

        // Auto-Jump
        setTimeout(() => {
            jumpToProgress();
        }, 100);

    } catch (error) {
        contentArea.innerHTML = `<h2 style="color:red; text-align:center">Error: ${error.message}</h2>`;
    }
}

// 2. Theme Manager
function setupTheme() {
    const btnTheme = document.getElementById('btnThemeToggle');
    if(!btnTheme) return;

    const savedTheme = localStorage.getItem('hkTheme') || 'theme-default';
    updateThemeUI(savedTheme);

    btnTheme.addEventListener('click', () => {
        const current = document.body.classList.contains('theme-steam') ? 'theme-steam' : 'theme-default';
        const newTheme = (current === 'theme-default') ? 'theme-steam' : 'theme-default';
        updateThemeUI(newTheme);
    });

    function updateThemeUI(themeName) {
        const isHidden = document.body.classList.contains('hide-completed');
        document.body.className = themeName;
        if(isHidden) document.body.classList.add('hide-completed');

        localStorage.setItem('hkTheme', themeName);

        if (themeName === 'theme-default') {
            btnTheme.textContent = '🎮'; 
            btnTheme.title = "Switch to Steam Guide Theme";
        } else {
            btnTheme.textContent = '🌑';
            btnTheme.title = "Switch to Default Theme";
        }
    }
}

// 3. Eye Toggle
function setupEyeToggle() {
    const btnEye = document.getElementById('btnEyeToggle');
    if(!btnEye) return;

    const isHidden = localStorage.getItem('hideCompleted') === 'true';
    if(isHidden) document.body.classList.add('hide-completed');
    updateEyeIcon(isHidden);

    btnEye.addEventListener('click', () => {
        const currentlyHidden = document.body.classList.contains('hide-completed');
        const newState = !currentlyHidden;
        
        if(newState) {
            document.body.classList.add('hide-completed');
            checkAndCollapseLegs(true);
        } else {
            document.body.classList.remove('hide-completed');
            checkAndCollapseLegs(false);
        }
        
        localStorage.setItem('hideCompleted', newState);
        updateEyeIcon(newState);
    });

    function updateEyeIcon(hidden) {
        btnEye.textContent = hidden ? '🔒' : '👁️';
        btnEye.title = hidden ? "Auto-Collapse is ON" : "Auto-Collapse is OFF";
    }
}

function checkAndCollapseLegs(shouldCollapse) {
    const legs = document.querySelectorAll('.leg-section');
    legs.forEach(leg => {
        if (!shouldCollapse) {
            leg.classList.remove('collapsed');
            return;
        }
        const allBoxes = leg.querySelectorAll('.checkbox');
        const checkedBoxes = leg.querySelectorAll('.checkbox:checked');
        if (allBoxes.length > 0 && allBoxes.length === checkedBoxes.length) {
            leg.classList.add('collapsed');
        }
    });
}

// 4. Navigation Render
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
                const offset = window.innerWidth < 1280 ? -180 : -20;
                const y = target.getBoundingClientRect().top + window.pageYOffset + offset;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        });
        dynamicLinksDiv.appendChild(link);
    });

    const actionsContainer = document.querySelector('.nav-actions');
    if (actionsContainer && actionsContainer.parentNode === navigationContainer) {
        navigationContainer.insertBefore(dynamicLinksDiv, actionsContainer);
    } else {
        navigationContainer.prepend(dynamicLinksDiv);
    }
}

// 5. Content Render
function renderFullRoute() {
    let html = '';
    routeData.forEach(part => {
        html += `<section id="${part.id}" class="route-part-section">`;
        html += `<h1 class="part-title">${part.title}</h1>`;
        part.legs.forEach(leg => {
            html += `<div class="leg-section">
                        <h3 onclick="this.parentElement.classList.toggle('collapsed')">${leg.title}</h3>
                        <div class="checklist">`;
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

// 6. Event Listeners
function setupGlobalEventListeners() {
    contentArea.addEventListener('change', (e) => {
        if (e.target.classList.contains('checkbox')) {
            const cb = e.target;
            const row = cb.closest('.checklist-item');
            localStorage.setItem(cb.id, cb.checked);
            
            if (cb.checked) row.classList.add('completed');
            else row.classList.remove('completed');
            
            updateProgressBar();

            if (document.body.classList.contains('hide-completed')) {
                const leg = row.closest('.leg-section');
                if(leg) {
                    const all = leg.querySelectorAll('.checkbox');
                    const checked = leg.querySelectorAll('.checkbox:checked');
                    if (all.length === checked.length) leg.classList.add('collapsed');
                }
            }
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

// 7. Map Modal
function setupMapModal() {
    const modal = document.getElementById("mapModal");
    const openBtn = document.getElementById("btnMapIcon");
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

    if (viewport) {
        viewport.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY) * 0.2;
            scale = Math.min(Math.max(0.1, scale + delta), 3);
            updateTransform();
        }, { passive: false });

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

// 8. Resume
function jumpToProgress() {
    const unchecked = document.querySelector('.checkbox:not(:checked)');
    if (unchecked) {
        const row = unchecked.closest('.checklist-item');
        const leg = row.closest('.leg-section');
        
        if(leg && leg.classList.contains('collapsed')) {
            leg.classList.remove('collapsed');
        }
        
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.remove('row-highlight');
        void row.offsetWidth; 
        row.classList.add('row-highlight');
    }
}

function setupResumeButton() {
    const btn = document.getElementById('resumeBtn');
    if (!btn) return;
    btn.addEventListener('click', jumpToProgress);
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
    const btn = document.getElementById('resetBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (confirm('Reset ALL progress?')) {
            localStorage.clear();
            location.reload();
        }
    });
}
