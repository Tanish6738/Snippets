import React, { useState, useRef, forwardRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import axios from '../../Config/Axios';
import 'react-resizable/css/styles.css';

// Create a forwarded ref component for the draggable content
const DraggableContent = forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} className="absolute" {...props}>
        {children}
    </div>
));

DraggableContent.displayName = 'DraggableContent';

const Pdf = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloadLink, setDownloadLink] = useState('');
    const [previews, setPreviews] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [editorMode, setEditorMode] = useState(false);
    const editorRef = useRef(null);
    const [pageImages, setPageImages] = useState([]);
    const [pages, setPages] = useState([{ id: 1, images: [] }]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedImage, setSelectedImage] = useState(null);
    const [usedImages, setUsedImages] = useState(new Set());
    const [selectedLayout, setSelectedLayout] = useState(null);
    const [gridCells, setGridCells] = useState([]);
    const [pageLayouts, setPageLayouts] = useState({
        1: { layout: null, usedImages: new Set() }
    });

    // Add new state for storing file data
    const [uploadedFiles, setUploadedFiles] = useState({
        files: [],
        previews: [],
        lastModified: Date.now()
    });

    const [customGrid, setCustomGrid] = useState({ rows: 1, cols: 1 });
    const [showGridCustomizer, setShowGridCustomizer] = useState(false);

    const [selectedCell, setSelectedCell] = useState(null);
    const [showSectionDivider, setShowSectionDivider] = useState(false);
    const [divisionType, setDivisionType] = useState({ rows: 1, cols: 1 });
    const [isDivideMode, setIsDivideMode] = useState(false);

    const layouts = {
        single: { rows: 1, cols: 1 },
        twoVertical: { rows: 2, cols: 1 },
        twoHorizontal: { rows: 1, cols: 2 },
        fourGrid: { rows: 2, cols: 2 },
        sixGrid: { rows: 3, cols: 2 },
        custom: { rows: customGrid.rows, cols: customGrid.cols }
    };

    // Add new state for storing page-specific grid layouts
    const [pageGrids, setPageGrids] = useState({
        1: { layout: null, customGrid: { rows: 1, cols: 1 } }
    });

    const createGridCells = (layout) => {
        const config = layout === 'custom'
            ? pageGrids[currentPage]?.customGrid || customGrid
            : layouts[layout];

        const { rows, cols } = config;
        const cellWidth = 595 / cols;
        const cellHeight = 842 / rows;
        const cells = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                cells.push({
                    id: `${r}-${c}`,
                    x: c * cellWidth,
                    y: r * cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                    imageId: null
                });
            }
        }
        return cells;
    };

    const handleLayoutSelect = (layoutName) => {
        setSelectedLayout(layoutName);
        const currentGridConfig = layoutName === 'custom'
            ? customGrid
            : layouts[layoutName];

        setGridCells(createGridCells(layoutName));

        // Update page-specific grid layout
        setPageGrids(prev => ({
            ...prev,
            [currentPage]: {
                layout: layoutName,
                customGrid: currentGridConfig
            }
        }));

        // Update page layout without clearing other pages
        setPageLayouts(prev => ({
            ...prev,
            [currentPage]: {
                layout: layoutName,
                usedImages: new Set()
            }
        }));

        // Only clear current page images
        setPages(prevPages => prevPages.map(page =>
            page.id === currentPage ? { ...page, images: [] } : page
        ));
    };

    const createCustomGrid = () => {
        setSelectedLayout('custom');
        setGridCells(createGridCells('custom'));

        // Store custom grid for current page
        setPageGrids(prev => ({
            ...prev,
            [currentPage]: {
                layout: 'custom',
                customGrid: { ...customGrid }
            }
        }));

        setShowGridCustomizer(false);
    };

    // Add Custom Grid Controls JSX after Layout Controls
    const renderGridCustomizer = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96">
                <h3 className="text-xl mb-4">Custom Grid Layout</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2">Rows (1-7)</label>
                        <input
                            type="number"
                            min="1"
                            max="7"
                            value={customGrid.rows}
                            onChange={(e) => setCustomGrid(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Columns (1-4)</label>
                        <input
                            type="number"
                            min="1"
                            max="4"
                            value={customGrid.cols}
                            onChange={(e) => setCustomGrid(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowGridCustomizer(false)} className="px-4 py-2 bg-gray-600 rounded">
                            Cancel
                        </button>
                        <button onClick={createCustomGrid} className="px-4 py-2 bg-[#3D2998] rounded">
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Create refs at the top level
    const refs = Array(50).fill(0).map(() => React.createRef());

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));

        // Store files and previews in persistent state
        setUploadedFiles({
            files: selectedFiles,
            previews: newPreviews,
            lastModified: Date.now()
        });

        setFiles(selectedFiles);
        setPreviews(newPreviews);
        setPageImages(selectedFiles.map((file, index) => ({
            id: index,
            url: newPreviews[index],
            position: { x: 40, y: 40 },
            size: { width: 200, height: 200 },
            rotation: 0
        })));

        setEditorMode(true);
    };

    // Add useEffect to restore files when switching pages
    React.useEffect(() => {
        if (uploadedFiles.files.length > 0) {
            setFiles(uploadedFiles.files);
            setPreviews(uploadedFiles.previews);
        }
    }, [currentPage]);

    const handleImageDrag = (id, data) => {
        setPageImages(prev => prev.map(img =>
            img.id === id ? { ...img, position: { x: data.x, y: data.y } } : img
        ));
    };

    const handleImageResize = (id, size) => {
        setPageImages(prev => prev.map(img =>
            img.id === id ? { ...img, size } : img
        ));
    };

    const addPage = () => {
        const newPageId = pages.length + 1;
        setPages([...pages, { id: newPageId, images: [] }]);

        // Initialize layout for new page
        setPageLayouts(prev => ({
            ...prev,
            [newPageId]: { layout: null, usedImages: new Set() }
        }));

        // Initialize grid layout for new page
        setPageGrids(prev => ({
            ...prev,
            [newPageId]: {
                layout: null,
                customGrid: { rows: 1, cols: 1 }
            }
        }));

        setCurrentPage(newPageId);
    };

    const handleImageDrop = (imageId, cellId) => {
        const currentPageLayout = pageLayouts[currentPage];

        if (currentPageLayout.usedImages.has(imageId)) {
            setError('This image is already used on this page');
            return;
        }

        const cell = gridCells.find(c => c.id === cellId);
        if (!cell) return;

        // Update cell's imageId
        setGridCells(prev => prev.map(c =>
            c.id === cellId ? { ...c, imageId: imageId } : c
        ));

        // Update page images
        setPages(prevPages => prevPages.map(page => {
            if (page.id === currentPage) {
                return {
                    ...page,
                    images: [...page.images, {
                        id: imageId,
                        position: { x: cell.x, y: cell.y },
                        size: { width: cell.width, height: cell.height },
                        rotation: 0,
                        cellId: cell.id
                    }]
                };
            }
            return page;
        }));

        setPageLayouts(prev => ({
            ...prev,
            [currentPage]: {
                ...prev[currentPage],
                usedImages: new Set([...prev[currentPage].usedImages, imageId])
            }
        }));
    };

    // Add function to handle image bounds
    const validateImageBounds = (position, size) => {
        return {
            x: Math.max(0, Math.min(position.x, 595 - size.width)),
            y: Math.max(0, Math.min(position.y, 842 - size.height))
        };
    };

    const handleDragStop = (pageId, imageIndex, position) => {
        setPages(prevPages => prevPages.map(page => {
            if (page.id === pageId) {
                const updatedImages = page.images.map((img, idx) => {
                    if (idx === imageIndex) {
                        const boundedPosition = validateImageBounds(position, img.size);
                        return { ...img, position: boundedPosition };
                    }
                    return img;
                });
                return { ...page, images: updatedImages };
            }
            return page;
        }));
    };

    const removeImage = (pageId, imageIndex) => {
        const page = pages.find(p => p.id === pageId);
        if (!page) return;

        const image = page.images[imageIndex];

        // Clear the cell's imageId
        setGridCells(prev => prev.map(cell =>
            cell.id === image.cellId ? { ...cell, imageId: null } : cell
        ));

        // Rest of removeImage function
        setPages(prevPages => prevPages.map(page => {
            if (page.id === pageId) {
                const updatedImages = page.images.filter((_, idx) => idx !== imageIndex);
                setPageLayouts(prev => ({
                    ...prev,
                    [pageId]: {
                        ...prev[pageId],
                        usedImages: new Set(
                            [...prev[pageId].usedImages].filter(id => id !== image.id)
                        )
                    }
                }));
                return { ...page, images: updatedImages };
            }
            return page;
        }));
    };

    const handleQuickPDF = async () => {
        setLoading(true);
        setIsProcessing(true);
        setError('');
        setDownloadLink('');
        setProgress(0);

        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append('images', file);
        });
        formData.append('quickGenerate', 'true');

        try {
            const response = await axios.post('/api/pdf/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            setError('Failed to create PDF');
        } finally {
            setLoading(false);
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setIsProcessing(true);
        setError('');
        setDownloadLink('');
        setProgress(0);

        const formData = new FormData();

        try {
            // Add files to formData with explicit types
            files.forEach((file, index) => {
                formData.append('images', file, file.name);
            });

            // Create clean pages data
            const cleanPages = pages.map(page => ({
                id: page.id,
                images: page.images.map(img => ({
                    id: img.id,
                    position: {
                        x: Math.round(img.position.x),
                        y: Math.round(img.position.y)
                    },
                    size: {
                        width: Math.round(img.size.width),
                        height: Math.round(img.size.height)
                    },
                    rotation: img.rotation || 0,
                    fitMode: fitMode,
                    cellId: img.cellId
                }))
            }));

            formData.append('pages', JSON.stringify(cleanPages));

            const response = await axios.post('/api/pdf/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
                timeout: 300000 // 5 minutes timeout
            });

            if (!response.data || response.data.size === 0) {
                throw new Error('Generated PDF is empty');
            }

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setDownloadLink(url);
            setProgress(100);

        } catch (error) {
            console.error('PDF creation error:', error);
            
            // Handle different types of errors
            let errorMessage = 'Failed to create PDF';
            if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.response) {
                // Try to read error message from blob
                if (error.response.data instanceof Blob) {
                    try {
                        const textContent = await error.response.data.text();
                        const errorData = JSON.parse(textContent);
                        errorMessage = errorData.message || errorData.details || errorMessage;
                    } catch (e) {
                        errorMessage = 'Server error occurred';
                    }
                } else {
                    errorMessage = error.response.data?.message || 'Server error occurred';
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
            setIsProcessing(false);
        }
    };

    // Add function to check if image is used in any page
    const isImageUsedAnywhere = (imageId) => {
        return Object.values(pageLayouts).some(page =>
            page.usedImages.has(imageId)
        );
    };

    // Modify page switching to preserve layout and images
    const switchPage = (pageId) => {
        setCurrentPage(pageId);
        const pageGrid = pageGrids[pageId];

        if (pageGrid?.layout) {
            setSelectedLayout(pageGrid.layout);

            // Restore custom grid settings if it was a custom layout
            if (pageGrid.layout === 'custom') {
                setCustomGrid(pageGrid.customGrid);
            }

            // Create grid cells using the page-specific layout
            const layoutConfig = pageGrid.layout === 'custom'
                ? pageGrid.customGrid
                : layouts[pageGrid.layout];

            setGridCells(createGridCells(pageGrid.layout));
        }

        // Restore files and previews
        if (uploadedFiles.files.length > 0) {
            setFiles(uploadedFiles.files);
            setPreviews(uploadedFiles.previews);
        }
    };

    // Update page button click handler
    const renderPageButtons = () => (
        <div className="flex gap-2">
            {pages.map(page => (
                <button
                    key={page.id}
                    onClick={() => switchPage(page.id)}
                    className={`px-4 py-2 rounded ${currentPage === page.id ? 'bg-[#3D2998]' : 'bg-gray-700'
                        }`}
                >
                    <div className="flex flex-col items-center">
                        <span>Page {page.id}</span>
                        {pageGrids[page.id]?.layout && (
                            <span className="text-xs opacity-75">
                                {pageGrids[page.id].layout === 'custom'
                                    ? `${pageGrids[page.id].customGrid.rows}x${pageGrids[page.id].customGrid.cols}`
                                    : pageGrids[page.id].layout
                                }
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );

    // Clean up URLs when component unmounts
    React.useEffect(() => {
        return () => {
            uploadedFiles.previews.forEach(URL.revokeObjectURL);
        };
    }, []);

    const subdivideCell = (cellId, divisions) => {
        const parentCell = gridCells.find(cell => cell.id === cellId);
        if (!parentCell) return;

        const newCells = [];
        const subCellWidth = parentCell.width / divisions.cols;
        const subCellHeight = parentCell.height / divisions.rows;

        for (let r = 0; r < divisions.rows; r++) {
            for (let c = 0; c < divisions.cols; c++) {
                newCells.push({
                    id: `${cellId}-${r}-${c}`,
                    x: parentCell.x + (c * subCellWidth),
                    y: parentCell.y + (r * subCellHeight),
                    width: subCellWidth,
                    height: subCellHeight,
                    imageId: null,
                    parentId: cellId
                });
            }
        }

        setGridCells(prev => [
            ...prev.filter(cell => cell.id !== cellId),
            ...newCells
        ]);
    };

    const renderSectionDivider = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96">
                <h3 className="text-xl mb-4">Divide Section</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2">Rows (1-7)</label>
                        <input
                            type="number"
                            min="1"
                            max="7"
                            value={divisionType.rows}
                            onChange={(e) => setDivisionType(prev => ({
                                ...prev,
                                rows: Math.min(7, parseInt(e.target.value) || 1)
                            }))}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Columns (1-4)</label>
                        <input
                            type="number"
                            min="1"
                            max="4"
                            value={divisionType.cols}
                            onChange={(e) => setDivisionType(prev => ({
                                ...prev,
                                cols: Math.min(4, parseInt(e.target.value) || 1)
                            }))}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowSectionDivider(false)}
                            className="px-4 py-2 bg-gray-600 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                subdivideCell(selectedCell, divisionType);
                                setShowSectionDivider(false);
                            }}
                            className="px-4 py-2 bg-[#3D2998] rounded"
                        >
                            Divide
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const handleCellClick = (cell) => {
        if (!isDivideMode || cell.imageId !== null) return;
        setSelectedCell(cell.id);
        setShowSectionDivider(true);
    };

    const toggleDivideMode = () => {
        setIsDivideMode(!isDivideMode);
        if (isDivideMode) {
            setSelectedCell(null);
            setShowSectionDivider(false);
        }
    };

    // Add these new state variables after other state declarations
    const [isResizing, setIsResizing] = useState(false);
    const [fitMode, setFitMode] = useState('contain'); // 'contain', 'cover', or 'stretch'

    // Add this new component for the resize handles
    const ResizeHandle = ({ position, onResize }) => (
        <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer"
            style={{
                ...position,
                zIndex: 20
            }}
            onMouseDown={onResize}
        />
    );

    // Add this useEffect to handle page scaling
    const pageRef = useRef(null);

    useEffect(() => {
        const updatePageScale = () => {
            if (pageRef.current) {
                const container = pageRef.current.parentElement;
                const containerWidth = container.offsetWidth;
                const pageWidth = 595; // A4 width in pixels
                const scale = Math.min(1, (containerWidth - 32) / pageWidth);
                document.documentElement.style.setProperty('--page-scale', scale);
            }
        };

        updatePageScale();
        window.addEventListener('resize', updatePageScale);
        return () => window.removeEventListener('resize', updatePageScale);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
            {/* Main container with improved padding */}
            <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12 max-w-[1440px]">
                {/* Header section with better spacing */}
                <div className="mb-6 sm:mb-8 md:mb-10">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">Dev</h2>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"> PDF</h2>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-center sm:justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || files.length === 0}
                                className="min-w-[120px] px-4 py-2.5 bg-[#3D2998] hover:bg-[#4e35b5] rounded-lg 
                                transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create PDF'}
                            </button>
                            {downloadLink && !isProcessing && (
                                <a
                                    href={downloadLink}
                                    className="min-w-[120px] px-4 py-2.5 btn-animate text-center text-white 
                                    rounded-lg font-medium hover:opacity-90"
                                    download
                                >
                                    Download PDF
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    {isProcessing && (
                        <div className="mt-6">
                            <div className="w-full bg-gray-800 rounded-full h-4">
                                <div
                                    className="bg-[#3D2998] h-4 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-center mt-2 text-gray-400">
                                Processing: {progress}%
                            </p>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mt-6 p-4 glass-card bg-red-900/50 rounded-lg">
                            <p className="text-red-200">{error}</p>
                        </div>
                    )}
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left sidebar */}
                    <div className="lg:col-span-1">
                        <div className="glass-card p-4 sm:p-6 rounded-xl border border-[#3D2998]/30 h-full">
                            {/* File upload area */}
                            <div className="mb-6">
                                {uploadedFiles.files.length === 0 ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-full h-40 border-2 border-dashed border-[#3D2998]/50 
                                        rounded-lg flex items-center justify-center mb-4 hover:border-[#3D2998] 
                                        transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer text-center p-4">
                                                <svg className="w-10 h-10 mx-auto mb-3 text-[#3D2998]" fill="none" 
                                                stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <span className="text-sm text-gray-400">Click or drag images here</span>
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-300">{uploadedFiles.files.length} images uploaded</span>
                                        <button
                                            onClick={() => {
                                                setUploadedFiles({ files: [], previews: [], lastModified: Date.now() });
                                                setFiles([]);
                                                setPreviews([]);
                                                setPages([{ id: 1, images: [] }]);
                                                setCurrentPage(1);
                                                setPageLayouts({ 1: { layout: null, usedImages: new Set() } });
                                            }}
                                            className="text-red-500 hover:text-red-400 transition-colors text-sm"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Quick generate button */}
                            <button
                                onClick={handleQuickPDF}
                                className="w-full p-3 bg-[#3D2998] hover:bg-[#4e35b5] rounded-lg 
                                transition-colors text-white font-medium mb-6"
                            >
                                Quick Generate PDF
                            </button>

                            {/* Image gallery */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4 
                            max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                                {previews.map((preview, index) => (
                                    <div
                                        key={index}
                                        className={`relative rounded-lg overflow-hidden ${isImageUsedAnywhere(index) ? 'opacity-50' : 'hover:ring-2 hover:ring-[#3D2998]'
                                            } transition-all`}
                                        draggable={!isImageUsedAnywhere(index)}
                                        onDragStart={(e) => {
                                            if (!isImageUsedAnywhere(index)) {
                                                e.dataTransfer.setData('imageId', index);
                                                setSelectedImage(index);
                                            }
                                        }}
                                    >
                                        <img
                                            src={preview}
                                            alt={`Image ${index + 1}`}
                                            className="w-full h-32 object-cover"
                                        />
                                        {isImageUsedAnywhere(index) && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">Used</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right content area */}
                    <div className="lg:col-span-3">
                        <div className="glass-card p-4 sm:p-6 rounded-xl border border-[#3D2998]/30">
                            {/* Page controls with better spacing */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="flex flex-wrap gap-2 flex-1">
                                    {renderPageButtons()}
                                    <button
                                        onClick={addPage}
                                        className="px-4 py-2 bg-[#3D2998] hover:bg-[#4e35b5] rounded-lg 
                                        transition-colors flex items-center gap-2"
                                        disabled={uploadedFiles.files.length === 0}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Page
                                    </button>
                                </div>
                                
                                {/* Grid division toggle */}
                                <button
                                    onClick={toggleDivideMode}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        isDivideMode ? 'bg-[#3D2998] text-white' : 'bg-gray-800 text-gray-300'
                                    }`}
                                >
                                    {isDivideMode ? 'Disable Grid Division' : 'Enable Grid Division'}
                                </button>
                            </div>

                            {/* Layout controls grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                                <button
                                    onClick={() => handleLayoutSelect('single')}
                                    className={`px-4 py-2 rounded ${selectedLayout === 'single' ? 'bg-[#3D2998]' : 'bg-gray-700'}`}
                                >
                                    Single
                                </button>
                                <button
                                    onClick={() => handleLayoutSelect('twoVertical')}
                                    className={`px-4 py-2 rounded ${selectedLayout === 'twoVertical' ? 'bg-[#3D2998]' : 'bg-gray-700'}`}
                                >
                                    2 Vertical
                                </button>
                                <button
                                    onClick={() => handleLayoutSelect('twoHorizontal')}
                                    className={`px-4 py-2 rounded ${selectedLayout === 'twoHorizontal' ? 'bg-[#3D2998]' : 'bg-gray-700'}`}
                                >
                                    2 Horizontal
                                </button>
                                <button
                                    onClick={() => handleLayoutSelect('fourGrid')}
                                    className={`px-4 py-2 rounded ${selectedLayout === 'fourGrid' ? 'bg-[#3D2998]' : 'bg-gray-700'}`}
                                >
                                    4 Grid
                                </button>
                                <button
                                    onClick={() => handleLayoutSelect('sixGrid')}
                                    className={`px-4 py-2 rounded ${selectedLayout === 'sixGrid' ? 'bg-[#3D2998]' : 'bg-gray-700'}`}
                                >
                                    6 Grid
                                </button>
                                <button
                                    onClick={() => setShowGridCustomizer(true)}
                                    className={`px-4 py-2 rounded ${selectedLayout === 'custom' ? 'bg-[#3D2998]' : 'bg-gray-700'}`}
                                >
                                    Custom Grid
                                </button>
                            </div>

                            {/* PDF preview area with responsive scaling */}
                            <div className="overflow-x-auto overflow-y-hidden">
                                <div className="min-w-[595px] max-w-full mx-auto">
                                    <div
                                        className="relative bg-white shadow-xl mx-auto"
                                        style={{
                                            width: '595px',
                                            height: '842px',
                                            transform: 'scale(var(--page-scale))',
                                            transformOrigin: 'top center'
                                        }}
                                        ref={pageRef}
                                    >
                                        {/* Grid Layout */}
                                        {gridCells.map(cell => {
                                            const image = pages.find(p => p.id === currentPage)?.images.find(img => img.cellId === cell.id);
                                            return (
                                                <div
                                                    key={cell.id}
                                                    className={`absolute border border-gray-200 ${!image ? 'hover:bg-gray-100' : ''
                                                        } ${isDivideMode && !image ? 'cursor-pointer' : ''}`}
                                                    style={{
                                                        left: cell.x,
                                                        top: cell.y,
                                                        width: cell.width,
                                                        height: cell.height,
                                                        position: 'absolute'
                                                    }}
                                                    onClick={() => handleCellClick(cell)}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        if (!isDivideMode && !image) {
                                                            const imageId = e.dataTransfer.getData('imageId');
                                                            handleImageDrop(Number(imageId), cell.id);
                                                        }
                                                    }}
                                                    onDragOver={(e) => !isDivideMode && !image && e.preventDefault()}
                                                >
                                                    {image && (
                                                        <div className="relative w-full h-full group">
                                                            <img
                                                                src={previews[image.id]}
                                                                alt={`Cell ${cell.id}`}
                                                                className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' :
                                                                        fitMode === 'cover' ? 'object-cover' : 'object-fill'
                                                                    }`}
                                                            />
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                                <select
                                                                    value={fitMode}
                                                                    onChange={(e) => setFitMode(e.target.value)}
                                                                    className="bg-white text-black text-sm rounded px-2 py-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <option value="contain">Contain</option>
                                                                    <option value="cover">Cover</option>
                                                                    <option value="stretch">Stretch</option>
                                                                </select>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeImage(currentPage, pages[currentPage - 1].images.indexOf(image));
                                                                    }}
                                                                    className="bg-red-500 rounded-full p-1"
                                                                >
                                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                                {/* Resize handles */}
                                                                <ResizeHandle
                                                                    position={{ right: -4, bottom: -4 }}
                                                                    onResize={(e) => {
                                                                        e.stopPropagation();
                                                                        setIsResizing(true);
                                                                        const startX = e.clientX;
                                                                        const startY = e.clientY;
                                                                        const startWidth = cell.width;
                                                                        const startHeight = cell.height;

                                                                        const handleMouseMove = (e) => {
                                                                            const deltaX = e.clientX - startX;
                                                                            const deltaY = e.clientY - startY;
                                                                            const newWidth = Math.max(50, startWidth + deltaX);
                                                                            const newHeight = Math.max(50, startHeight + deltaY);

                                                                            setGridCells(prev => prev.map(c =>
                                                                                c.id === cell.id
                                                                                    ? { ...c, width: newWidth, height: newHeight }
                                                                                    : c
                                                                            ));
                                                                        };

                                                                        const handleMouseUp = () => {
                                                                            setIsResizing(false);
                                                                            document.removeEventListener('mousemove', handleMouseMove);
                                                                            document.removeEventListener('mouseup', handleMouseUp);
                                                                        };

                                                                        document.addEventListener('mousemove', handleMouseMove);
                                                                        document.addEventListener('mouseup', handleMouseUp);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {showSectionDivider && renderSectionDivider()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal dialogs */}
            {showGridCustomizer && renderGridCustomizer()}
            {showSectionDivider && renderSectionDivider()}
        </div>
    );
};

export default Pdf;
