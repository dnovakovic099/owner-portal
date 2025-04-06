import React, { useState } from 'react';

export const PayoutsPdfViewer = ({ pdfUrl, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(prevZoom => prevZoom + 25);
    }
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(prevZoom => prevZoom - 25);
    }
  };
  
  // Handle page navigation
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };
  
  // Handle iframe load event to detect total pages (simulated for now)
  const handleIframeLoad = () => {
    // In a real implementation, you'd need to use PDF.js or similar to get the actual page count
    setTotalPages(3); // Simulating 3 pages for demo
  };

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-viewer-header">
        <h2 className="section-title">Owner Statement Preview</h2>
        <button 
          onClick={onClose} 
          className="close-pdf-btn"
          aria-label="Close PDF Viewer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="pdf-controls">
        <a 
          href={pdfUrl} 
          download="OwnerStatement.pdf"
          className="download-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download PDF
        </a>
        <a 
          href={pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="open-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Open in New Tab
        </a>
      </div>
      
      <div className="pdf-viewer" style={{ transform: `scale(${zoomLevel/100})`, transformOrigin: 'center top' }}>
        <iframe 
          src={pdfUrl} 
          title="Owner Statement Preview"
          frameBorder="0"
          onLoad={handleIframeLoad}
        />
        
        {/* Zoom Controls */}
        <div className="pdf-zoom-controls">
          <button 
            className="zoom-btn" 
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            aria-label="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <div className="zoom-level">{zoomLevel}%</div>
          <button 
            className="zoom-btn" 
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            aria-label="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>
        
        {/* Page Navigation */}
        <div className="pdf-pagination">
          <button 
            className="page-btn" 
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="page-number">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            className="page-btn" 
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayoutsPdfViewer;