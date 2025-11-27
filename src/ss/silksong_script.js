// silksong_script.js – Interactive Map Version

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
    // Path to Silksong Data
    const jsonPath = 'src/ss/silksong_data.json'; 

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
        if (localStorage.getItem('ssHideCompleted') === 'true') {
            checkAndCollapseLegs(true);
        }

        // Auto-Jump to progress
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

    let savedTheme = localStorage.getItem('ssTheme');
    if (savedTheme === 'theme-light' || !savedTheme) {
        savedTheme = 'theme-pharloom';
    }
    
    updateThemeUI(savedTheme);

    btnTheme.addEventListener('click', () => {
        const current = document.body.classList.contains('theme-steam') ? 'theme-steam' : 'theme-pharloom';
        const newTheme = (current === 'theme-pharloom') ? 'theme-steam' : 'theme-pharloom';
        updateThemeUI(newTheme);
    });

    function updateThemeUI(themeName) {
        const isHidden = document.body.classList.contains('hide-completed');
        document.body.classList.remove('theme-pharloom', 'theme-light', 'theme-steam');
        document.body.classList.add(themeName);
        if(isHidden) document.body.classList.add('hide-completed');
        localStorage.setItem('ssTheme', themeName);

        if (themeName === 'theme-pharloom') {
            btnTheme.textContent = '🎮'; 
            btnTheme.title = "Switch to Steam Theme";
        } else {
            btnTheme.textContent = '🧶';
            btnTheme.title = "Switch to Pharloom Theme";
        }
    }
}

// 3. Eye Toggle
function setupEyeToggle() {
    const btnEye = document.getElementById('btnEyeToggle');
    if(!btnEye) return;

    const isHidden = localStorage.getItem('ssHideCompleted') === 'true';
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
        
        localStorage.setItem('ssHideCompleted', newState);
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
                } else if (item.type === 'note') {
                    html += `<div class="route-note">${item.text}</div>`;
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

// 7. Interactive Map Modal
function setupMapModal() {
    const modal = document.getElementById("mapModal");
    const openBtn = document.getElementById("btnMapIcon");
    const closeBtn = document.getElementById("closeMapBtn");
    const iframe = document.getElementById("mapIframe");
    
    const MAP_URL = "https://dinglemire.github.io/hk_maps/silksong/";

    if (!modal || !openBtn || !closeBtn) return;

    const openMap = () => {
        modal.style.display = "block";
        document.body.style.overflow = "hidden"; // Prevent background scroll
        // Lazy load: Only set src if it hasn't been set yet
        if (iframe && !iframe.getAttribute('src')) {
            iframe.src = MAP_URL;
        }
    };

    const closeMap = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    };

    openBtn.addEventListener("click", openMap);
    closeBtn.addEventListener("click", closeMap);

    // Close on click outside iframe
    window.addEventListener("click", (e) => {
        if (e.target === modal) closeMap();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "block") {
            closeMap();
        }
    });
}

// 8. Resume
function jumpToProgress() {
    const unchecked = document.querySelector('.checkbox:not(:checked)');
    if (unchecked) {
        const row = unchecked.closest('.checklist-item');
        const leg = row.closest('.leg-section');
        if(leg && leg.classList.contains('collapsed')) leg.classList.remove('collapsed');
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

// 9. Reset Function
function setupResetButton() {
    const btn = document.getElementById('resetBtn');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        if (confirm('Reset ALL Silksong progress? This cannot be undone.')) {
            // 1. Remove settings
            localStorage.removeItem('ssTheme');
            localStorage.removeItem('ssHideCompleted');

            // 2. Remove all checklist items derived from the current JSON
            // (This ensures we don't accidentally delete other site data)
            if (routeData && routeData.length > 0) {
                routeData.forEach(part => {
                    part.legs.forEach(leg => {
                        leg.content.forEach(item => {
                            if (item.type === 'step' && item.id) {
                                localStorage.removeItem(item.id);
                            }
                        });
                    });
                });
            } else {
                // Fallback: Clear keys starting with 'ss_' if routeData isn't loaded
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('ss_')) localStorage.removeItem(key);
                });
            }
            
            location.reload();
        }
    });
}
