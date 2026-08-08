const API_URL = "http://127.0.0.1:8000/api/inspect-batch";

let selectedFiles = [];
let resultsMap = {};
let imageMap = {};

const dropzone = document.getElementById('dropzone');
const folderInput = document.getElementById('folderInput');
const btnRun = document.getElementById('btnRun');
const dropText = document.getElementById('dropText');

// 1. File Upload Listeners
dropzone.addEventListener('click', () => folderInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
    }
});

folderInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
    }
});

function handleFiles(files) {
    selectedFiles = files.filter(f => f.type.startsWith('image/')).slice(0, 50);

    if (selectedFiles.length > 0) {
        dropText.innerHTML = `<strong>${selectedFiles.length} photo(s)</strong> ready for AI inspection.`;
        btnRun.disabled = false;
    }
}

// 2. Batch Processing Request
btnRun.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    btnRun.disabled = true;
    btnRun.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Running AI Analysis...`;

    const formData = new FormData();
    imageMap = {};

    const loadPromises = selectedFiles.map(file => {
        return new Promise((resolve) => {
            formData.append('files', file);
            const img = new Image();
            img.onload = () => {
                imageMap[file.name] = img;
                resolve();
            };
            img.src = URL.createObjectURL(file);
        });
    });

    await Promise.all(loadPromises);

    try {
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await response.json();

        if (data.status === 'success') {
            document.getElementById('emptyState').classList.add('hidden');
            document.getElementById('workspace').classList.remove('hidden');
            document.getElementById('queueContainer').classList.remove('hidden');

            renderQueueSidebar(data.results);
            renderCanvasInspection(data.results[0].filename);
        }
    } catch (err) {
        alert("Could not reach backend API! Make sure 'python -m uvicorn backend.API.main:app --reload' is running.");
        console.error(err);
    } finally {
        btnRun.disabled = false;
        btnRun.innerHTML = `<i class="fa-solid fa-bolt"></i> Run Batch AI Inspection`;
    }
});

// 3. Render Queue Sidebar
function renderQueueSidebar(results) {
    const list = document.getElementById('fileList');
    document.getElementById('queueCount').innerText = results.length;
    list.innerHTML = '';

    results.forEach((res, index) => {
        resultsMap[res.filename] = res;

        const item = document.createElement('div');
        item.className = `queue-item ${index === 0 ? 'active' : ''}`;
        item.innerHTML = `
            <span>${res.filename}</span>
            <span style="color:${res.metrics.color}; font-weight:bold;">${res.metrics.defects_found} Defect(s)</span>
        `;

        item.onclick = () => {
            document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            renderCanvasInspection(res.filename);
        };

        list.appendChild(item);
    });
}

// Relative & Ultra-Clean Canvas Renderer
function renderCanvasInspection(filename) {
    const data = resultsMap[filename];
    const img = imageMap[filename];

    if (!data || !img) return;

    // Update UI Metrics
    document.getElementById('activeFilename').innerText = filename;
    document.getElementById('activeDefects').innerText = data.metrics.defects_found;
    document.getElementById('activeSeverity').innerText = data.metrics.severity;
    document.getElementById('activeSeverity').style.color = data.metrics.color;
    document.getElementById('activePriority').innerText = data.metrics.priority;

    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');

    // Lock canvas native size to image dimensions
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // 1. Draw raw original photo
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const boxes = data.bounding_boxes || [];
    const count = boxes.length;

    if (count > 0) {
        // DYNAMIC RELATIVE SCALING:
        // As the number of potholes increases or the box size shrinks, make lines & text thinner!
        const baseThickness = Math.max(1, Math.min(2, Math.round(canvas.width / 400))); 
        const fontSize = count > 3 ? Math.max(10, Math.round(canvas.height / 35)) : Math.max(12, Math.round(canvas.height / 28));

        boxes.forEach((box) => {
            // A. Ultra-Thin Green Outline (1px - 2px)
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = baseThickness;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            // B. Short & Clean Pill Label (Only Percentage to save space: e.g., "98%")
            // If few boxes exist, show "Pothole 98%", if many exist, show "98%"
            const labelText = count > 2 ? box.confidence : box.label;

            // Calculate exact text dimensions so the background pill is tiny and non-blocking
            ctx.font = `bold ${fontSize}px Arial`;
            const textWidth = ctx.measureText(labelText).width;
            const padding = 4;
            const pillWidth = textWidth + (padding * 2);
            const pillHeight = fontSize + 4;

            // Position label pill cleanly inside top-left corner or directly above the box
            const pillX = box.x;
            const pillY = box.y > pillHeight ? box.y - pillHeight : box.y;

            // Semi-transparent dark background for label pill (Zero solid bright green blocking!)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(pillX, pillY, pillWidth, pillHeight);

            // Thin Green Accent Border around the tiny pill tag
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 1;
            ctx.strokeRect(pillX, pillY, pillWidth, pillHeight);

            // Crisp Green Text
            ctx.fillStyle = '#00FF00';
            ctx.fillText(labelText, pillX + padding, pillY + fontSize - 1);
        });
    }
}