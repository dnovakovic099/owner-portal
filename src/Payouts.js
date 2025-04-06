import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from './api/api';
import { formatCurrency } from './utils/formatters';
import { prorateReservations } from './utils/prorateReservations';
import './Payouts.css';

export const Payouts = () => {
  // State variables
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const pdfViewerRef = useRef(null);

  // Get today and first day of current month for default dates
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Set default dates on component mount
  useEffect(() => {
    setStartDate(firstDayOfMonth);
    setEndDate(today);
  }, []);

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch properties function
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getListings();
      const propertiesList = Array.isArray(data) ? data : [];
      
      setProperties(propertiesList);
      
      // Set first property as default if available
      if (propertiesList.length > 0 && !selectedProperty) {
        setSelectedProperty(propertiesList[0].id);
      }
      
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reservations based on selected property and date range
  const fetchReservations = async () => {
    if (!selectedProperty || !startDate || !endDate) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all reservations that might overlap with the date range
      const result = await api.getReservations({
        listingId: selectedProperty
      });
      
      const allReservations = result?.reservations || [];
      
      // Filter for reservations that overlap with the date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Adjust end date to include the entire day
      end.setHours(23, 59, 59, 999);
      
      const overlappingReservations = allReservations.filter(reservation => {
        const checkIn = new Date(reservation.arrivalDate || reservation.checkInDate);
        const checkOut = new Date(reservation.departureDate || reservation.checkOutDate);
        
        // Reservation overlaps with date range if:
        // - Check-in date is before or on end date AND
        // - Check-out date is on or after start date
        return checkIn <= end && checkOut >= start;
      });
      
      // Process financial data for these reservations
      if (overlappingReservations.length > 0) {
        // Get financial data
        const financialParams = {
          listingMapIds: [selectedProperty],
        //   fromDate: startDate,
        //   toDate: endDate,
          dateType: 'arrivalDate'
        };
        
        const financialData = await api.getFinancialReport(financialParams);
        
        // Prorate reservations based on the date range
        const proratedReservations = prorateReservations(
          overlappingReservations,
          financialData?.result || {},
          start,
          end
        );
        
        setReservations(proratedReservations);
      } else {
        setReservations([]);
      }
      
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF report
  const generateReport = async () => {
    if (reservations.length === 0) {
      return;
    }
    
    setGeneratingReport(true);
    
    try {
      // Get property details
      const property = properties.find(p => p.id === selectedProperty);
      const propertyName = property?.name || 
                          property?.title || 
                          property?.propertyName || 
                          `Property #${selectedProperty}`;
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Owner Payout Report', 105, 20, { align: 'center' });
      
      // Add property and date range info
      doc.setFontSize(12);
      doc.text(`Property: ${propertyName}`, 14, 35);
      doc.text(`Report Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 14, 42);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 49);
      
      // Add owner info
      const owner = property?.owner || 'Property Owner';
      doc.text(`Owner: ${owner}`, 14, 60);
      
      // Calculate totals
      const totalOwnerPayout = reservations.reduce((sum, res) => sum + (res.ownerPayout || 0), 0);
      const totalBookings = reservations.length;
      const totalNights = reservations.reduce((sum, res) => sum + (res.nights || 0), 0);
      
      // Add summary
      doc.setFontSize(14);
      doc.text('Summary', 14, 75);
      
      // Summary table
      doc.setFontSize(10);
      
      // First table - Summary
      let yPos = 80;
      autoTable(doc, {
        startY: yPos,
        head: [['Total Bookings', 'Total Nights', 'Total Owner Payout']],
        body: [[
          totalBookings, 
          totalNights, 
          formatCurrency(totalOwnerPayout)
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: [179, 145, 73], // Gold color
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [40, 40, 40],
          halign: 'center'
        },
        columnStyles: {
          2: { 
            halign: 'right',
            fontStyle: 'bold'
          }
        }
      });
      
      // Get the Y position after the summary table
      yPos = doc.lastAutoTable.finalY + 20;
      
      // Reservations table header
      doc.setFontSize(14);
      doc.text('Reservation Details', 14, yPos);
      yPos += 10;
      
      // Format data for the table
      const tableData = reservations.map(res => {
        return [
          res.guestName || 'Guest',
          new Date(res.checkInDate).toLocaleDateString(),
          new Date(res.checkOutDate).toLocaleDateString(),
          res.nights || 0,
          res.channelName || res.source || 'Direct',
          formatCurrency(res.baseRate || 0),
          formatCurrency(res.cleaningFeeValue || res.cleaningFee || 0),
          formatCurrency(res.totalTax || 0),
          formatCurrency(res.hostChannelFee || 0),
          formatCurrency(res.pmCommission || 0),
          formatCurrency(res.ownerPayout || 0)
        ];
      });
      
      // Second table - Reservation details
      autoTable(doc, {
        startY: yPos,
        head: [['Guest Name', 'Check-in', 'Check-out', 'Nights', 'Source', 'Base Rate', 'Cleaning Fee', 'Taxes', 'Channel Fee', 'PM Fee', 'Owner Payout']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [179, 145, 73],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [40, 40, 40]
        },
        columnStyles: {
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right' },
          9: { halign: 'right' },
          10: { halign: 'right', fontStyle: 'bold' }
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        }
      });
      
      // Total row
      const totalRow = [
        '',
        '',
        '',
        totalNights,
        '',
        formatCurrency(reservations.reduce((sum, res) => sum + (res.baseRate || 0), 0)),
        formatCurrency(reservations.reduce((sum, res) => sum + (res.cleaningFeeValue || res.cleaningFee || 0), 0)),
        formatCurrency(reservations.reduce((sum, res) => sum + (res.totalTax || 0), 0)),
        formatCurrency(reservations.reduce((sum, res) => sum + (res.hostChannelFee || 0), 0)),
        formatCurrency(reservations.reduce((sum, res) => sum + (res.pmCommission || 0), 0)),
        formatCurrency(totalOwnerPayout)
      ];
      
      // Third table - Totals row
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY,
        body: [totalRow],
        theme: 'grid',
        bodyStyles: {
          textColor: [40, 40, 40],
          fontStyle: 'bold'
        },
        columnStyles: {
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right' },
          9: { halign: 'right' },
          10: { 
            halign: 'right', 
            fontStyle: 'bold',
            fillColor: [240, 240, 240]
          }
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        }
      });
      
      // Add footer
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.text('This is an automatically generated report. For questions, please contact support.', 105, finalY, { align: 'center' });
      
      // Generate blob from PDF
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Set PDF URL for display
      setPdfUrl(url);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payout_Report_${propertyName}_${startDate}_to_${endDate}.pdf`;
      
      // Trigger download
      link.click();
      
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Handle property change
  const handlePropertyChange = (e) => {
    setSelectedProperty(e.target.value);
    // Reset PDF when property changes
    setPdfUrl(null);
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    // Reset PDF when date changes
    setPdfUrl(null);
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    // Reset PDF when date changes
    setPdfUrl(null);
  };

  // Determine if form is valid for fetching data
  const isFormValid = selectedProperty && startDate && endDate;

  // Handle the "Generate Report" button click
  const handleGenerateReportClick = async () => {
    // First fetch the data
    await fetchReservations();
    // Then generate the report
    generateReport();
  };

  return (
    <div className="payouts-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Owner Payouts</h1>
      </div>
      
      {/* Filters and Controls */}
      <div className="payouts-controls">
        <div className="filter-row">
          <div className="filter-item">
            <label htmlFor="property-select">Select Property</label>
            <select
              id="property-select"
              value={selectedProperty}
              onChange={handlePropertyChange}
              className="filter-input"
              disabled={loading}
            >
              <option value="">Select a property</option>
              {properties.map(property => {
                const propertyName = property.name || 
                                   property.title || 
                                   property.propertyName || 
                                   `Property #${property.id}`;
                return (
                  <option key={property.id} value={property.id}>
                    {propertyName}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={handleStartDateChange}
              className="filter-input"
              disabled={loading}
            />
          </div>
          
          <div className="filter-item">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={handleEndDateChange}
              className="filter-input"
              disabled={loading}
              min={startDate}
            />
          </div>
          
          <div className="filter-actions">
            <button
              className={`generate-report-btn ${!isFormValid ? 'disabled' : ''}`}
              onClick={handleGenerateReportClick}
              disabled={!isFormValid || loading || generatingReport}
            >
              {generatingReport ? 'Generating...' : 'Generate Report'}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="error-container">
          <p>Error: {error.message}</p>
          <button className="retry-button" onClick={fetchReservations}>
            Retry
          </button>
        </div>
      )}
      
      {/* PDF Viewer */}
      {pdfUrl && (
        <div className="pdf-viewer-container">
          <h2 className="section-title">Report Preview</h2>
          <div className="pdf-controls">
            <a 
              href={pdfUrl} 
              download={`Payout_Report_${selectedProperty}_${startDate}_to_${endDate}.pdf`}
              className="download-btn"
            >
              Download PDF
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </a>
          </div>
          <div className="pdf-viewer" ref={pdfViewerRef}>
            <iframe 
              src={pdfUrl} 
              title="Payout Report" 
              width="100%" 
              height="600px"
            />
          </div>
        </div>
      )}
      
      {/* No Data State */}
      {!loading && !error && reservations.length === 0 && !pdfUrl && isFormValid && (
        <div className="no-data-container">
          <p>No reservations found for the selected period. Try a different date range.</p>
        </div>
      )}
      
      {/* Instructions State */}
      {!loading && !error && !pdfUrl && !isFormValid && (
        <div className="instructions-container">
          <h2>Generate Owner Payout Reports</h2>
          <p>Select a property and date range, then click "Generate Report" to create a PDF report of owner payouts.</p>
          <ul>
            <li>Reports include all reservations within the selected date range</li>
            <li>Reservations that span across months are prorated based on the number of days in each period</li>
            <li>Download or view the report directly in your browser</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Payouts;