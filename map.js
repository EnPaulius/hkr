// map.js
const mapWrapper = document.getElementById('map-container-wrapper');
const mapContainer = document.getElementById('map-container');
const zoomInfo = document.getElementById('zoom-info');

let scale = 1; // Current zoom level (1 = 100%)
let panning = false;
let pointX = 0;
let pointY = 0;
let startX = 0;
let startY = 0;

// Apply the current transformation state
function setTransform() {
    mapContainer.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    zoomInfo.textContent = `Zoom: ${Math.round(scale * 100)}%`;
}

// Mouse/Touch Down handler
function onStart(e) {
    e.preventDefault();
    panning = true;
    // Use the first touch point or mouse coordinates
    startX = e.clientX || e.touches[0].clientX;
    startY = e.clientY || e.touches[0].clientY;
    mapWrapper.style.cursor = 'grabbing';
}

// Mouse/Touch Move handler
function onMove(e) {
    e.preventDefault();
    if (!panning) return;
    
    // Get current touch/mouse position
    const currentX = e.clientX || e.touches[0].clientX;
    const currentY = e.clientY || e.touches[0].clientY;

    // Calculate difference and update position
    pointX = pointX + (currentX - startX);
    pointY = pointY + (currentY - startY);
    
    // Update start position for the next move event
    startX = currentX;
    startY = currentY;

    setTransform();
}

// Mouse/Touch Up handler
function onEnd() {
    panning = false;
    mapWrapper.style.cursor = 'grab';
}

// Mouse Wheel handler for Zoom
mapWrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    let delta = e.deltaY * -0.01; // Invert and scale delta
    
    // Calculate new scale
    const newScale = Math.min(Math.max(1, scale + delta * zoomIntensity * scale), 5); // Limit zoom to 1x-5x

    // Only proceed if scale actually changes
    if (newScale === scale) return;

    // Calculate mouse position relative to the map container wrapper
    const rect = mapWrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate how much the map container content has been translated/scaled
    const mapContentX = mouseX - pointX;
    const mapContentY = mouseY - pointY;

    // Calculate the new X and Y translation to keep the zoom centered on the mouse
    pointX = mouseX - (mapContentX * (newScale / scale));
    pointY = mouseY - (mapContentY * (newScale / scale));
    
    scale = newScale;
    setTransform();
});

// Event listeners for mouse
mapWrapper.addEventListener('mousedown', onStart);
document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onEnd);

// Event listeners for touch (mobile)
mapWrapper.addEventListener('touchstart', onStart, { passive: false });
document.addEventListener('touchmove', onMove, { passive: false });
document.addEventListener('touchend', onEnd);

// Initialize the map position
setTransform();
