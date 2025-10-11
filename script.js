document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Logic ---
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    function toggleSidebar() {
        const isOpen = sidebar.classList.toggle('open');
        menuButton.classList.toggle('open', isOpen);
        overlay.classList.toggle('hidden', !isOpen);
    }
    menuButton.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // --- Core Tool Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const imageList = document.getElementById('image-list');
    const previewText = document.getElementById('preview-text');
    const splitButton = document.getElementById('split-button');
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const formatSelect = document.getElementById('format');
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const masterZipButton = document.getElementById('download-master-zip');

    let uploadedFiles = []; // Store file objects

    // --- Event Listeners ---
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });

    splitButton.addEventListener('click', processAllImages);
    masterZipButton.addEventListener('click', () => downloadMasterZip());

    function handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                uploadedFiles.push(file);
            }
        }
        updateImageList();
    }

    function updateImageList() {
        if (uploadedFiles.length === 0) {
            previewText.classList.remove('hidden');
            splitButton.disabled = true;
            imageList.innerHTML = '';
            return;
        }

        previewText.classList.add('hidden');
        splitButton.disabled = false;
        imageList.innerHTML = '';

        uploadedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'image-list-item';
            item.innerHTML = `
                <span class="text-sm truncate">${file.name}</span>
                <button class="remove-btn" data-index="${index}"><i class="fas fa-times-circle"></i></button>
            `;
            imageList.appendChild(item);
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.currentTarget.dataset.index, 10);
                uploadedFiles.splice(indexToRemove, 1);
                updateImageList();
            });
        });
    }

    async function processAllImages() {
        if (uploadedFiles.length === 0) return;

        splitButton.disabled = true;
        splitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>PROCESSING...';
        resultsContainer.innerHTML = '';

        for (const file of uploadedFiles) {
            await processSingleImage(file);
        }

        resultsSection.classList.remove('hidden');
        splitButton.disabled = false;
        splitButton.innerHTML = '<i class="fas fa-project-diagram mr-2"></i>INITIATE SPLIT';
    }

    function processSingleImage(file) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const group = createResultGroup(file.name, img);
                    resultsContainer.appendChild(group);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function createResultGroup(fileName, img) {
        const originalFileName = fileName.split('.').slice(0, -1).join('.');
        const groupContainer = document.createElement('details');
        groupContainer.className = 'result-group';
        groupContainer.open = true;

        const summary = document.createElement('summary');
        summary.className = 'flex justify-between items-center cursor-pointer';
        summary.innerHTML = `
            <span class="font-bold truncate">${fileName}</span>
            <button class="futuristic-button-green text-xs !w-auto individual-zip-btn"><i class="fas fa-download mr-1"></i>Download .zip</button>
        `;

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 mt-4';
        
        // Splitting logic
        const rows = parseInt(rowsInput.value, 10), cols = parseInt(colsInput.value, 10), format = formatSelect.value;
        const pieceWidth = Math.floor(img.width / cols), pieceHeight = Math.floor(img.height / rows);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth; canvas.height = pieceHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, c * pieceWidth, r * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);
                const dataUrl = canvas.toDataURL(`image/${format}`);
                const pieceFileName = `${originalFileName}_${r+1}x${c+1}.${format}`;
                
                const piece = document.createElement('div');
                piece.className = "relative overflow-hidden rounded-md border border-cyan-500/20";
                piece.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover" data-file-name="${pieceFileName}"><a href="${dataUrl}" download="${pieceFileName}" class="absolute inset-0 bg-black/70 flex items-center justify-center text-xl text-white opacity-0 hover:opacity-100 transition-opacity"><i class="fas fa-download"></i></a>`;
                grid.appendChild(piece);
            }
        }

        groupContainer.appendChild(summary);
        groupContainer.appendChild(grid);
        
        summary.querySelector('.individual-zip-btn').addEventListener('click', (e) => {
            e.preventDefault();
            downloadZip(grid, `${originalFileName}_split.zip`);
        });

        return groupContainer;
    }
    
    async function downloadZip(gridContainer, zipFileName) {
        const zip = new JSZip();
        const imageElements = gridContainer.querySelectorAll('img');
        for (const img of imageElements) {
            const fileName = img.dataset.fileName;
            const blob = await fetch(img.src).then(res => res.blob());
            zip.file(fileName, blob);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = zipFileName;
        link.click();
    }

    async function downloadMasterZip() {
        downloadZip(resultsContainer, 'nexus_splitter_master_bundle.zip');
    }
});
