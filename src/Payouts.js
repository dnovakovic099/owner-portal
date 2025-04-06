import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from './api/api';
import { formatCurrency } from './utils/formatters';
import { prorateReservations } from './utils/prorateReservations';
import './Payouts.css';

import { PayoutsFilters } from './PayoutsFilters';
import { PayoutsPdfViewer } from './PayoutsPdfViewer';
import { PayoutsInstructions } from './PayoutsInstructions';

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
  const [prorationMethod, setProrationMethod] = useState('calendar'); // Default to calendar proration
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
  
  // Reset reservations when filters change
  useEffect(() => {
    // Clear reservations when dates, property or proration method changes
    setReservations([]);
  }, [startDate, endDate, selectedProperty, prorationMethod]);

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
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all reservations that might overlap with the date range
      const result = await api.getReservations({
        listingId: selectedProperty
      });
      
      const allReservations = result?.reservations || [];
      
      // Filter for reservations based on proration method
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Adjust end date to include the entire day
      end.setHours(23, 59, 59, 999);
      
      let filteredReservations = [];
      
      switch (prorationMethod) {
        case 'checkout':
          // Include only reservations that check out on or before end date
          filteredReservations = allReservations.filter(reservation => {
            const checkOut = new Date(reservation.departureDate || reservation.checkOutDate);
            return checkOut <= end;
          });
          break;
          
        case 'checkin':
          // Include only reservations where check-in date is between start and end date (inclusive)
          filteredReservations = allReservations.filter(reservation => {
            const checkIn = new Date(reservation.arrivalDate || reservation.checkInDate);
            return checkIn >= start && checkIn <= end;
          });
          break;
          
        case 'calendar':
        default:
          // Default behavior - prorate based on overlap with date range
          filteredReservations = allReservations.filter(reservation => {
            const checkIn = new Date(reservation.arrivalDate || reservation.checkInDate);
            const checkOut = new Date(reservation.departureDate || reservation.checkOutDate);
            
            // Reservation overlaps with date range if:
            // - Check-in date is before or on end date AND
            // - Check-out date is on or after start date
            return checkIn <= end && checkOut >= start;
          });
          break;
      }
      
      // Process financial data for these reservations
      if (filteredReservations.length > 0) {
        // Get financial data for all reservations without date filtering
        const financialParams = {
          listingMapIds: [selectedProperty],
          // Remove dateType to get all financial data regardless of dates
          // This ensures we get financial data for all reservations
        };
        
        const financialData = await api.getFinancialReport(financialParams);
        
        let processedReservations;
        
        if (prorationMethod === 'calendar') {
          // Prorate reservations based on the date range
          processedReservations = prorateReservations(
            filteredReservations,
            financialData?.result || {},
            start,
            end
          );
        } else {
          // Use full reservation values for checkout and checkin modes
          processedReservations = filteredReservations.map(reservation => {
            // Get financial data for this reservation ID
            const financialInfo = financialData?.result?.[reservation.id] || {};
            
            // If financial info is missing, log for debugging
            if (Object.keys(financialInfo).length === 0) {
              console.log(`Missing financial data for reservation ${reservation.id}`, reservation);
            }
            
            // Ensure we have reasonable defaults for financial values
            return {
              ...reservation,
              ...financialInfo,
              // Ensure all necessary financial fields have at least zero values
              baseRate: financialInfo.baseRate || reservation.baseRate || 0,
              cleaningFee: financialInfo.cleaningFee || reservation.cleaningFee || 0,
              cleaningFeeValue: financialInfo.cleaningFeeValue || reservation.cleaningFeeValue || 0,
              totalTax: financialInfo.totalTax || reservation.totalTax || 0,
              hostChannelFee: financialInfo.hostChannelFee || reservation.hostChannelFee || 0,
              pmCommission: financialInfo.pmCommission || reservation.pmCommission || 0,
              ownerPayout: financialInfo.ownerPayout || reservation.ownerPayout || 0,
              // Calculate nights if not provided
              nights: reservation.nights || 
                     ((new Date(reservation.departureDate || reservation.checkOutDate) - 
                       new Date(reservation.arrivalDate || reservation.checkInDate)) / 
                      (1000 * 60 * 60 * 24))
            };
          });
        }
        
        setReservations(processedReservations);
        return processedReservations;
      } else {
        setReservations([]);
        return [];
      }
      
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF report
  const generateReport = async () => {
    setGeneratingReport(true);
    
    try {
      // Directly get the reservations from the function call
      const fetchedReservations = await fetchReservations();
      
      // Continue only if we have reservations after fetching
      if (!fetchedReservations || fetchedReservations.length === 0) {
        console.log("No reservations found for the selected criteria");
        setGeneratingReport(false);
        return; // No reservations, exit
      }
      
      // Get property details
      const property = properties.find(p => p.id === selectedProperty);
      const propertyName = property?.name || 
                          property?.title || 
                          property?.propertyName || 
                          `Property #${selectedProperty}`;
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Define colors - use direct values instead of arrays
      const primaryColor = { r: 179, g: 145, b: 73 }; // Gold color - #b39149
      const secondaryColor = { r: 242, g: 242, b: 242 }; // Light gray for backgrounds
      
      // Add gradient-like header with better design
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Add decorative element to header
      doc.setFillColor(255, 255, 255, 0.1);
      doc.rect(0, 42, 210, 1, 'F');
      doc.rect(0, 43, 210, 0.5, 'F');
      
      // Add company logo/brand element (simulated with a shape)
      doc.setFillColor(250, 250, 250, 0.2);
      doc.circle(30, 22, 12, 'F');
      
      // Add title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('OWNER STATEMENT', 105, 28, { align: 'center' });
      
      // Add elegant property info section with better design
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(14, 55, 182, 42, 3, 3, 'F');
      
      // Add subtle border
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, 55, 182, 42, 3, 3, 'S');
      
      // Add shadow effect (simulated with multiple lines)
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.2);
      for (let i = 1; i <= 3; i++) {
        doc.roundedRect(14 + i*0.4, 55 + i*0.4, 182, 42, 3, 3, 'S');
      }
      
      // Property info with improved styling
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(12);
      
      // Helper function to truncate text if needed
      const truncateText = (text, maxWidth) => {
        if (!text) return '';
        // First try with the full text
        const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        if (textWidth <= maxWidth) return text;
        
        // If too long, truncate with ellipsis
        let truncated = text;
        while (doc.getStringUnitWidth(truncated + '...') * doc.internal.getFontSize() / doc.internal.scaleFactor > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
      };
      
      const maxPropertyWidth = 100; // Maximum width for property text in mm
      const truncatedPropertyName = truncateText(propertyName, maxPropertyWidth);
      
      // Add subtle heading background
      doc.setFillColor(248, 248, 248);
      doc.rect(14, 55, 182, 10, 'F');
      
      // Add accent color strip
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(14, 55, 5, 42, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text('PROPERTY', 25, 63);
      doc.setFont('helvetica', 'normal');
      doc.text(truncatedPropertyName, 80, 63);
      
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT PERIOD', 25, 78);
      doc.setFont('helvetica', 'normal');
      doc.text(`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 80, 78);
      
      doc.setFont('helvetica', 'bold');
      doc.text('GENERATED', 25, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(`${new Date().toLocaleDateString()}`, 80, 90);
      
      // Owner info with improved design
      const owner = property?.owner || 'Property Owner';
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setLineWidth(0.5);
      doc.line(70, 110, 140, 110);
      
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Prepared for: ${owner}`, 105, 115, { align: 'center' });
      
      // Calculate totals - use fetchedReservations instead of reservations state
      const totalBookings = fetchedReservations.length;
      const totalNights = fetchedReservations.reduce((sum, res) => sum + (res.nights || 0), 0);
      const totalOwnerPayout = fetchedReservations.reduce((sum, res) => sum + (res.ownerPayout || 0), 0);
      const baseRateTotal = fetchedReservations.reduce((sum, res) => sum + (res.baseRate || 0), 0);
      const cleaningFeesTotal = fetchedReservations.reduce((sum, res) => sum + (res.cleaningFeeValue || res.cleaningFee || 0), 0);
      const taxesTotal = fetchedReservations.reduce((sum, res) => sum + (res.totalTax || 0), 0);
      const channelFeesTotal = fetchedReservations.reduce((sum, res) => sum + (res.hostChannelFee || 0), 0);
      const pmFeesTotal = fetchedReservations.reduce((sum, res) => sum + (res.pmCommission || 0), 0);
      
      // Declare tableStartY outside the try block so it's available throughout the code
      let tableStartY = 180; // Default value in case the try block fails
      
      // Financial Summary Section
      try {
        // Add title
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('FINANCIAL SUMMARY', 105, 125, { align: 'center' });
        
        // Draw horizontal decorative line under title
        doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setLineWidth(1);
        doc.line(70, 130, 140, 130);
        
        // Safe currency formatter for summary cards
        const safeCardCurrency = (value) => {
          try {
            if (value === null || value === undefined || isNaN(Number(value))) {
              return '$0.00';
            }
            return formatCurrency(Number(value));
          } catch (e) {
            console.error("Error formatting currency:", e);
            return '$0.00';
          }
        };
        
        // Create financial summary using tables instead of custom cards
        const summaryStartY = 140;
        
        // Create summary data table - more reliable than custom drawn cards
        autoTable(doc, {
          startY: summaryStartY,
          head: [['', '', '']],
          body: [
            [
              { content: 'TOTAL BOOKINGS', styles: { fontStyle: 'bold', halign: 'center' } },
              { content: 'TOTAL NIGHTS', styles: { fontStyle: 'bold', halign: 'center' } },
              { content: 'GROSS REVENUE', styles: { fontStyle: 'bold', halign: 'center' } }
            ],
            [
              { content: totalBookings.toString(), styles: { fontStyle: 'bold', fontSize: 16, halign: 'center' } },
              { content: totalNights.toString(), styles: { fontStyle: 'bold', fontSize: 16, halign: 'center' } },
              { content: safeCardCurrency(baseRateTotal + cleaningFeesTotal), styles: { fontStyle: 'bold', fontSize: 16, halign: 'center' } }
            ],
            [
              { content: 'Reservations', styles: { fontSize: 8, textColor: [120, 120, 120], halign: 'center' } },
              { content: 'Nights Stayed', styles: { fontSize: 8, textColor: [120, 120, 120], halign: 'center' } },
              { content: 'Total Revenue', styles: { fontSize: 8, textColor: [120, 120, 120], halign: 'center' } }
            ]
          ],
          theme: 'plain',
          styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            fontSize: 9,
            cellPadding: 4,
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 60 },
            2: { cellWidth: 60 }
          },
          margin: { left: 15 },
          tableWidth: 'auto',
          didParseCell: function(data) {
            // Add colored header bar to cells in first row
            if (data.row.index === 0) {
              data.cell.styles.fillColor = [primaryColor.r, primaryColor.g, primaryColor.b];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.minCellHeight = 2;
            }
            // Add borders and background to cells
            if (data.row.index === 1 || data.row.index === 2) {
              data.cell.styles.lineWidth = 0.1;
              data.cell.styles.lineColor = [220, 220, 220];
              data.cell.styles.fillColor = [255, 255, 255];
            }
          },
          willDrawCell: function(data) {
            // Only add borders to content cells, not the header bar
            if (data.row.index === 1 || data.row.index === 2) {
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.1);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'S');
            }
          }
        });
        
        // Get the position where the summary table finished
        const summaryEndY = doc.previousAutoTable.finalY + 25;
        
        // Owner payout box using table for more reliable rendering
        autoTable(doc, {
          startY: summaryEndY,
          body: [
            [{ content: 'OWNER PAYOUT', styles: { fontStyle: 'bold', halign: 'center' } }],
            [{ content: safeCardCurrency(totalOwnerPayout), styles: { fontStyle: 'bold', fontSize: 20, halign: 'center', textColor: [34, 139, 34] } }]
          ],
          theme: 'plain',
          styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            fontSize: 12,
            cellPadding: 10,
            fillColor: [245, 252, 245]
          },
          tableWidth: 80,
          margin: { left: 65 },
          didParseCell: function(data) {
            // Add green header bar to first row
            if (data.row.index === 0) {
              data.cell.styles.fillColor = [34, 139, 34];
              data.cell.styles.textColor = [255, 255, 255];
            }
          },
          willDrawCell: function(data) {
            // Add border to the cell
            if (data.row.index === 1) {
              doc.setDrawColor(200, 230, 200);
              doc.setLineWidth(0.5);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'S');
            }
          }
        });
        
        // Get the position where the payout table finished
        const payoutEndY = doc.previousAutoTable.finalY + 25;
        
        // Reservations table title
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('RESERVATION DETAILS', 105, payoutEndY, { align: 'center' });
        
        // Draw horizontal decorative line under title
        doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setLineWidth(1);
        doc.line(70, payoutEndY + 5, 140, payoutEndY + 5);
        
        // Update the tableStartY with actual value
        tableStartY = payoutEndY + 15;
      } catch (e) {
        console.error("Error creating financial summary:", e);
        // Keep the default tableStartY value if an error occurs
      }
      
      // Function to format dates in a more compact way
      const formatCompactDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return 'N/A';
          return `${date.getMonth() + 1}/${date.getDate()}`;
        } catch (e) {
          console.error("Error formatting date:", e);
          return 'N/A';
        }
      };

      // Safe version of formatCurrency to handle invalid inputs
      const safeFormatCurrency = (value) => {
        try {
          if (value === null || value === undefined || isNaN(Number(value))) {
            return '$0.00';
          }
          return formatCurrency(Number(value));
        } catch (e) {
          console.error("Error in safeFormatCurrency:", e);
          return '$0.00';
        }
      };
      
      // Function to normalize channel/source names
      const normalizeSource = (source) => {
        try {
          if (!source) return 'Luxury Lodging';
          const sourceLower = String(source).toLowerCase();
          
          if (sourceLower.includes('airbnb')) return 'Airbnb';
          if (sourceLower.includes('vrbo') || sourceLower.includes('homeaway')) return 'Vrbo';
          if (sourceLower.includes('booking')) return 'Booking.com';
          
          return 'Luxury Lodging';
        } catch (e) {
          console.error("Error normalizing source:", e);
          return 'Luxury Lodging';
        }
      };
      
      // Make a safe copy of reservations with validated data
      const safeReservations = [];
      try {
        for (let i = 0; i < fetchedReservations.length; i++) {
          try {
            const res = fetchedReservations[i];
            const checkinDate = res.checkInDate || res.arrivalDate || null;
            const checkoutDate = res.checkOutDate || res.departureDate || null;
            
            safeReservations.push({
              guestName: res.guestName || 'Guest',
              stayPeriod: `${formatCompactDate(checkinDate)} - ${formatCompactDate(checkoutDate)}`,
              source: normalizeSource(res.channelName || res.source),
              baseRate: safeFormatCurrency(res.baseRate),
              cleaningFee: safeFormatCurrency(res.cleaningFeeValue || res.cleaningFee),
              totalTax: safeFormatCurrency(res.totalTax),
              fees: safeFormatCurrency((res.hostChannelFee || 0) + (res.pmCommission || 0)),
              ownerPayout: safeFormatCurrency(res.ownerPayout)
            });
          } catch (e) {
            console.error(`Error processing reservation at index ${i}:`, e);
            safeReservations.push({
              guestName: 'Guest',
              stayPeriod: 'N/A - N/A',
              source: 'Luxury Lodging',
              baseRate: '$0.00',
              cleaningFee: '$0.00',
              totalTax: '$0.00',
              fees: '$0.00',
              ownerPayout: '$0.00'
            });
          }
        }
      } catch (e) {
        console.error("Error creating safe reservations:", e);
      }
      
      // Use the safe reservations for the table data
      try {
        autoTable(doc, {
          startY: tableStartY,
          head: [['Guest', 'Stay Period', 'Source', 'Base Rate', 'Cleaning Fee', 'Taxes', 'Fees', 'Owner Payout']],
          body: safeReservations.map(res => [
            res.guestName,
            res.stayPeriod,
            res.source,
            res.baseRate,
            res.cleaningFee,
            res.totalTax,
            res.fees,
            res.ownerPayout
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            cellPadding: 5,
            minCellHeight: 14,
            valign: 'middle',
            halign: 'center',
            fontSize: 7 // Smaller font for headers
          },
          styles: {
            fontSize: 8, // Smaller general font size
            cellPadding: 4,
            overflow: 'linebreak', // Changed from 'ellipsize' to 'linebreak'
            cellWidth: 'wrap', // Allow cells to determine their width based on content
            minCellHeight: 10,
            lineColor: [220, 220, 220],
            lineWidth: 0.1
          },
          tableWidth: 'auto', // Changed from fixed 182 to auto
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 'auto', minCellWidth: 30 }, // Guest name needs more space
            1: { cellWidth: 24, maxCellWidth: 26 }, // Reduced width for Stay Period
            2: { halign: 'center', cellWidth: 'auto', minCellWidth: 16 },
            3: { halign: 'right', cellWidth: 'auto', minCellWidth: 18 },
            4: { halign: 'right', cellWidth: 'auto', minCellWidth: 18 },
            5: { halign: 'right', cellWidth: 'auto', minCellWidth: 16 },
            6: { halign: 'right', cellWidth: 'auto', minCellWidth: 16 },
            7: { halign: 'right', fontStyle: 'bold', cellWidth: 'auto', minCellWidth: 20 }
          },
          margin: { left: 14, right: 14 },
          didParseCell: function(data) {
            try {
              // Ensure header rows have proper height and word wrapping
              if (data.section === 'head') {
                data.cell.styles.minCellHeight = 20;
                data.cell.styles.cellPadding = 3;
                
                // Add word breaks for long headers
                if (data.column.index === 4) {
                  data.cell.text = ['Cleaning', 'Fee'];
                }
                if (data.column.index === 7) {
                  data.cell.text = ['Owner', 'Payout'];
                }
                if (data.column.index === 3) {
                  data.cell.text = ['Base', 'Rate'];
                }
                if (data.column.index === 1) {
                  data.cell.text = ['Stay', 'Period'];
                }
              }
              
              // For body rows, don't truncate text - allow full text to display
              if (data.section === 'body') {
                data.cell.styles.overflow = 'linebreak';
                data.cell.styles.cellWidth = 'auto';
                
                // Make sure numeric columns align properly
                if ([3, 4, 5, 6, 7].includes(data.column.index)) {
                  data.cell.styles.halign = 'right';
                }
                
                // Handle guest name column separately
                if (data.column.index === 0 && typeof data.cell.text === 'string') {
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            } catch (e) {
              console.error("Error in didParseCell:", e);
            }
          },
          willDrawCell: function(data) {
            try {
              // Ensure cells have proper internal padding and borders
              if (data.section === 'body') {
                data.cell.styles.lineWidth = 0.1;
                // Extra handling for cells that might be tight on space
                if (data.column.index === 0 && data.cell.text && data.cell.text.length > 15) {
                  data.cell.styles.fontSize = 7; // Smaller font for long guest names
                }
              }
            } catch (e) {
              console.error("Error in willDrawCell:", e);
            }
          },
          didDrawPage: function(data) {
            try {
              // Add header to new pages
              if (data.pageCount > 1) {
                doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
                doc.rect(0, 0, 210, 20, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('OWNER STATEMENT - CONTINUED', 105, 15, { align: 'center' });
              }
            } catch (e) {
              console.error("Error in didDrawPage:", e);
            }
          },
          // Fix for duplicate headers - only show headers once
          showHead: 'firstPage'
        });
      } catch (e) {
        console.error("Error drawing reservations table:", e);
      }
      
      // Footer - decreased footer position to ensure it doesn't overlap content
      try {
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Footer line
          const footerY = doc.internal.pageSize.height - 15;
          doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
          doc.setLineWidth(0.5);
          doc.line(14, footerY, 196, footerY);
          
          // Footer text
          doc.setFontSize(9);
          doc.setTextColor(70, 70, 70);
          doc.setFont('helvetica', 'normal');
          doc.text(`For questions about this statement, please contact support.`, 105, footerY + 7, { align: 'center' });
          
          // Page numbers
          doc.text(`Page ${i} of ${pageCount}`, 196, footerY + 7, { align: 'right' });
        }
      } catch (e) {
        console.error("Error adding footer:", e);
      }
      
      // Generate blob from PDF
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Set PDF URL for display
      setPdfUrl(url);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Owner_Statement_${propertyName}_${startDate}_to_${endDate}.pdf`;
      
      // Trigger download
      link.click();
      
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="payouts-container">
      <div className="page-header">
        <h1 className="page-title">Owner Statements</h1>
      </div>
      
      <PayoutsFilters
        properties={properties}
        selectedProperty={selectedProperty}
        setSelectedProperty={setSelectedProperty}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onGenerateReport={generateReport}
        loading={loading || generatingReport}
        prorationMethod={prorationMethod}
        setProrationMethod={setProrationMethod}
      />
      
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <p>Error: {error.message}</p>
          <button className="retry-button" onClick={fetchReservations}>
            Retry
          </button>
        </div>
      )}
      
      {pdfUrl && (
        <PayoutsPdfViewer 
          pdfUrl={pdfUrl} 
          onClose={() => setPdfUrl(null)}
        />
      )}
      
      {!loading && !error && reservations.length === 0 && !generatingReport && (
        <PayoutsInstructions />
      )}
    </div>
  );
};

export default Payouts;