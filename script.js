document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Logic ---
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const themeToggle = document.getElementById('theme-toggle');

    function toggleSidebar() {
        const isOpen = sidebar.classList.toggle('open');
        menuButton.classList.toggle('open', isOpen);
        overlay.classList.toggle('hidden', !isOpen);
    }
    menuButton.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
    
    themeToggle.addEventListener('change', () => {
        // Placeholder for theme change logic
        alert("Light theme coming soon!");
        themeToggle.checked = false; // Revert toggle state
    });

    // --- Core Tool Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const previewText = document.getElementById('preview-text');
    const splitButton = document.getElementById('split-button');
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const formatSelect = document.getElementById('format');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    const downloadZipButton = document.getElementById('download-zip-button');

    let originalImage = null;
    let originalFileName = '';

    // --- Event Listeners & Core Functions (Mostly unchanged) ---
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
    splitButton.addEventListener('click', splitImage);
    downloadZipButton.addEventListener('click', downloadAllAsZip);

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file (JPG, PNG, WEBP).');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.onload = () => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
                previewText.classList.add('hidden');
                splitButton.disabled = false;
                resultsSection.classList.add('hidden');
                resultsGrid.innerHTML = '';
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
        originalFileName = file.name.split('.').slice(0, -1).join('.');
    }

    function splitImage() {
        if (!originalImage) return;
        const rows = parseInt(rowsInput.value, 10), cols = parseInt(colsInput.value, 10), format = formatSelect.value;
        if (rows < 1 || cols < 1) return;

        resultsGrid.innerHTML = '';
        const pieceWidth = Math.floor(originalImage.width / cols);
        const pieceHeight = Math.floor(originalImage.height / rows);
        let pieceCount = 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth; canvas.height = pieceHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(originalImage, c * pieceWidth, r * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);
                
                const dataUrl = canvas.toDataURL(`image/${format}`);
                const fileName = `${originalFileName}_${r+1}x${c+1}.${format}`;
                
                const container = document.createElement('div');
                container.className = "result-item relative overflow-hidden rounded-md border border-cyan-500/20";
                container.style.animationDelay = `${pieceCount * 50}ms`; // Staggered animation
                container.innerHTML = `
                    <img src="${dataUrl}" class="w-full h-full object-cover" data-file-name="${fileName}">
                    <a href="${dataUrl}" download="${fileName}" class="absolute inset-0 bg-black/70 flex items-center justify-center text-2xl text-white opacity-0 hover:opacity-100 transition-opacity">
                        <i class="fas fa-download"></i>
                    </a>`;
                resultsGrid.appendChild(container);
                pieceCount++;
            }
        }
        resultsSection.classList.remove('hidden');
    }

    async function downloadAllAsZip() { /* Unchanged from previous version */ }
});
