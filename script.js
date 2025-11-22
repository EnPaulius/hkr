// script.js – Manual Resume Only

let routeData = [];
const contentArea = document.getElementById('route-content');
const navigationContainer = document.getElementById('navigation');
const resetButton = document.getElementById('resetBtn');
const resumeButton = document.getElementById('resumeBtn'); // Get reference

// 1. Load Route Data
async function loadRouteData() {
    const jsonPath = './route_data.json';

    try {
        const response = await fetch(jsonPath, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const data = await response.json();
        routeData = data.route;
        
        // Initialize UI
        renderNavigation();
        renderFullRoute();
        setupResetButton();
        setupResumeButton(); // Activate the Resume button
        setupScrollSpy();

        // NOTE: Automatic scroll is REMOVED. 
        // Page will always start at the top.

    } catch (error) {
        contentArea.innerHTML = `<h2 style="color:red; text-align:center">Error loading data: ${error.message}</h2>`;
        console.error(error);
    }
}

// 2. Setup "Resume Run" Button
function setupResumeButton() {
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            restoreProgress();
        });
    }
}

// 3. Logic to find position and scroll
function restoreProgress() {
    // Get all checkboxes
    const checkboxes = Array.from(document.querySelectorAll('.checkbox'));
    
    // Check if run has started
    const hasAnyProgress = checkboxes.some(cb => cb.checked);

    if (!hasAnyProgress) {
        // Run hasn't started? Just scroll to top.
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Find the first UNCHECKED box
    const firstUnchecked = checkboxes.find(cb => !cb.checked);

    if (firstUnchecked) {
        // Scroll the ROW into view, centered
        const row = document.getElementById(`row-${firstUnchecked.id}`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // visual flash effect
            row.style.transition = "background 0.5s";
            row.style.backgroundColor = "rgba(240, 192, 90, 0.2)";
            setTimeout(() => {
                row.style.backgroundColor = "transparent";
            }, 1000);
        }
    } else {
        // Everything checked? Scroll to bottom
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

// 4. Render Navigation (Sidebar)
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
                // Fix offset for sticky header on mobile vs desktop
                const yOffset = window.innerWidth < 1500 ? -160 : -20; 
                const y = targetSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
                history.pushState(null, '', `#${targetId}`);
            }
        });
        
        dynamicLinksDiv.appendChild(link);
    });

    // Insert links before the Resume button
    navigationContainer.insertBefore(dynamicLinksDiv, resumeButton);
}

// 5. Render Full Route
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
                    // Add ID to the row div for easier scrolling
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

    document.querySelectorAll('.checkbox').forEach(cb => {
        cb.addEventListener('change', function () {
            localStorage.setItem(this.id, this.checked);
            this.closest('.checklist-item').classList.toggle('completed', this.checked);
        });
    });
}

// 6. Scroll Spy
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

// 7. Reset Button
function setupResetButton() {
    resetButton.addEventListener('click', () => {
        if (confirm('Reset ALL 112% progress?')) {
            localStorage.clear();
            location.reload();
        }
    });
}

document.addEventListener('DOMContentLoaded', loadRouteData);
