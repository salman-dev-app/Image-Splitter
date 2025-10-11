document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // --- Event Listeners ---

    // File selection via button
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    });

    // Split Button
    splitButton.addEventListener('click', splitImage);

    // Download ZIP Button
    downloadZipButton.addEventListener('click', downloadAllAsZip);

    // --- Functions ---

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
        if (!originalImage) {
            alert('Please upload an image first.');
            return;
        }

        const rows = parseInt(rowsInput.value, 10);
        const cols = parseInt(colsInput.value, 10);
        const format = formatSelect.value;
        const mimeType = `image/${format}`;

        if (rows < 1 || cols < 1) {
            alert('Rows and columns must be at least 1.');
            return;
        }

        resultsGrid.innerHTML = ''; // Clear previous results
        resultsGrid.style.gridTemplateColumns = `repeat(${cols > 8 ? 8 : cols}, 1fr)`; // Adjust grid layout for many columns

        const pieceWidth = Math.floor(originalImage.width / cols);
        const pieceHeight = Math.floor(originalImage.height / rows);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;
                const ctx = canvas.getContext('2d');

                // Draw the portion of the image onto the canvas
                ctx.drawImage(
                    originalImage,
                    c * pieceWidth,   // Source X
                    r * pieceHeight,  // Source Y
                    pieceWidth,       // Source Width
                    pieceHeight,      // Source Height
                    0,                // Destination X
                    0,                // Destination Y
                    pieceWidth,       // Destination Width
                    pieceHeight       // Destination Height
                );
                
                const dataUrl = canvas.toDataURL(mimeType);
                const fileName = `${originalFileName}_r${r+1}_c${c+1}.${format}`;

                // Create and append the result item to the grid
                const container = document.createElement('div');
                container.className = 'result-image-container';
                
                const imgElement = document.createElement('img');
                imgElement.src = dataUrl;
                imgElement.className = 'result-image';
                imgElement.dataset.fileName = fileName; // Store filename for zipping
                
                const overlay = document.createElement('div');
                overlay.className = 'download-overlay';
                
                const downloadLink = document.createElement('a');
                downloadLink.href = dataUrl;
                downloadLink.download = fileName;
                downloadLink.className = 'download-link';
                downloadLink.innerHTML = '<i class="fas fa-download"></i>';
                downloadLink.title = `Download ${fileName}`;

                overlay.appendChild(downloadLink);
                container.appendChild(imgElement);
                container.appendChild(overlay);
                resultsGrid.appendChild(container);
            }
        }

        resultsSection.classList.remove('hidden');
    }

    async function downloadAllAsZip() {
        const zip = new JSZip();
        const imageElements = resultsGrid.querySelectorAll('.result-image');

        if (imageElements.length === 0) {
            alert('No images to download. Please split an image first.');
            return;
        }
        
        // Show loading state
        downloadZipButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Zipping...';
        downloadZipButton.disabled = true;

        for (const img of imageElements) {
            const fileName = img.dataset.fileName;
            const dataUrl = img.src;
            const blob = await fetch(dataUrl).then(res => res.blob());
            zip.file(fileName, blob);
        }

        zip.generateAsync({ type: 'blob' })
            .then(function(content) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `${originalFileName}_split.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Restore button state
                downloadZipButton.innerHTML = '<i class="fas fa-file-archive mr-2"></i>Download All (.zip)';
                downloadZipButton.disabled = false;
            });
    }
});
