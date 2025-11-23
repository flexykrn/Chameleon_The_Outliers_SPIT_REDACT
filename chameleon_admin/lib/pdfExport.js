import jsPDF from 'jspdf';

/**
 * Note: html2canvas removed - PDF now uses data-driven visualizations
 * This provides better reliability and avoids color parsing errors
 */
function suppressColorErrors() {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const shouldSuppress = (message) => {
    const msg = String(message || '');
    return msg.includes('Attempting to parse an unsupported color') || 
           msg.includes('color function') ||
           msg.includes('lab') ||
           msg.includes('lch') ||
           msg.includes('oklch') ||
           msg.includes('oklab') ||
           msg.includes('parseColor') ||
           msg.includes('parseBackgroundColor');
  };
  
  const suppressedError = (...args) => {
    if (shouldSuppress(args[0])) return;
    originalError.apply(console, args);
  };
  
  const suppressedWarn = (...args) => {
    if (shouldSuppress(args[0])) return;
    originalWarn.apply(console, args);
  };
  
  console.error = suppressedError;
  console.warn = suppressedWarn;
  
  return () => { 
    console.error = originalError;
    console.warn = originalWarn;
  };
}

/**
 * Generate a comprehensive PDF report of the dashboard
 * @param {Object} stats - Dashboard statistics (total, sqli, xss, bruteforce, avgConfidence)
 * @param {Array} attacks - Recent attacks data
 * @returns {Promise<void>}
 */
export async function generateDashboardPDF(stats, attacks) {
  // Suppress color parsing errors during PDF generation
  const restoreConsole = suppressColorErrors();
  
  try {
    // Create new PDF document (A4 size)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 15;

    // Add decorative header background
    pdf.setFillColor(59, 130, 246); // Primary blue color
    pdf.rect(0, 0, pageWidth, 35, 'F');

    // Add header title (no emojis)
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('CHAMELEON', pageWidth / 2, 22, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text('Security Dashboard Report', pageWidth / 2, 30, { align: 'center' });

    currentY = 45;
    
    // Report metadata box
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, currentY, pageWidth - 30, 20, 3, 3, 'FD');
    
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Report Generated:', 20, currentY + 7);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text(new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'long',
      timeStyle: 'medium'
    }), 20, currentY + 13);
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Report Type:', 130, currentY + 7);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text('Comprehensive Analysis', 130, currentY + 13);
    pdf.setFont(undefined, 'normal');

    currentY += 28;

    // Section Header (no emojis)
    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('SECURITY METRICS OVERVIEW', 20, currentY + 7);
    currentY += 15;

    pdf.setFont(undefined, 'normal');
    
    const kpiData = [
      { label: 'Total Threats Detected', value: stats.total || 0, color: [239, 68, 68] },
      { label: 'Average Detection Confidence', value: `${(stats.avgConfidence || 0).toFixed(1)}%`, color: [34, 197, 94] },
      { label: 'XSS Attacks', value: stats.xss || 0, color: [251, 146, 60] },
      { label: 'SQL Injection Attacks', value: stats.sqli || 0, color: [239, 68, 68] },
      { label: 'Benign Requests', value: stats.benign || 0, color: [34, 197, 94] }
    ];

    // Create enhanced KPI cards
    const kpiBoxWidth = (pageWidth - 45) / 2;
    const kpiBoxHeight = 22;
    let kpiX = 15;
    let kpiY = currentY;

    kpiData.forEach((kpi, index) => {
      // Draw card with shadow effect
      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, 3, 3, 'FD');
      
      // Add colored accent bar on left
      pdf.setFillColor(...kpi.color);
      pdf.roundedRect(kpiX, kpiY, 4, kpiBoxHeight, 1, 1, 'F');
      
      // Add label (no icons)
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(kpi.label, kpiX + 10, kpiY + 8);
      
      // Add value
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...kpi.color);
      pdf.text(String(kpi.value), kpiX + 10, kpiY + 17);
      pdf.setFont(undefined, 'normal');
      
      // Move to next position
      if (index % 2 === 0) {
        kpiX = pageWidth / 2 + 5;
      } else {
        kpiX = 15;
        kpiY += kpiBoxHeight + 5;
      }
    });

    currentY = kpiY + kpiBoxHeight + 15;

    // Attack Distribution Summary (replacing graph screenshots)
    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('ATTACK DISTRIBUTION ANALYSIS', 20, currentY + 7);
    currentY += 18;

    // Calculate percentages
    const totalAttacks = (stats.xss || 0) + (stats.sqli || 0);
    const xssPercent = totalAttacks > 0 ? ((stats.xss / totalAttacks) * 100).toFixed(1) : 0;
    const sqliPercent = totalAttacks > 0 ? ((stats.sqli / totalAttacks) * 100).toFixed(1) : 0;
    const benignPercent = stats.total > 0 ? ((stats.benign / stats.total) * 100).toFixed(1) : 0;

    // Draw attack type breakdown with visual bars
    const attackTypes = [
      { name: 'XSS Attacks', count: stats.xss || 0, percent: xssPercent, color: [251, 146, 60] },
      { name: 'SQL Injection', count: stats.sqli || 0, percent: sqliPercent, color: [239, 68, 68] },
      { name: 'Benign Traffic', count: stats.benign || 0, percent: benignPercent, color: [34, 197, 94] }
    ];

    attackTypes.forEach((attack) => {
      // Card background
      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, currentY, pageWidth - 30, 18, 2, 2, 'FD');

      // Colored indicator
      pdf.setFillColor(...attack.color);
      pdf.circle(22, currentY + 9, 3, 'F');

      // Attack name
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(attack.name, 30, currentY + 7);

      // Count and percentage
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${attack.count} events (${attack.percent}%)`, 30, currentY + 13);

      // Progress bar background
      const barX = 110;
      const barY = currentY + 5;
      const barWidth = 70;
      const barHeight = 8;
      
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');

      // Progress bar fill
      const fillWidth = (barWidth * attack.percent) / 100;
      if (fillWidth > 0) {
        pdf.setFillColor(...attack.color);
        pdf.roundedRect(barX, barY, fillWidth, barHeight, 2, 2, 'F');
      }

      // Percentage text on bar
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      if (fillWidth > 15) {
        pdf.text(`${attack.percent}%`, barX + fillWidth - 12, barY + 6);
      }

      currentY += 20;
    });

    currentY += 5;

    // Geographic Distribution Summary (replacing map screenshot)
    if (currentY + 60 > pageHeight - 20) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('GEOGRAPHIC THREAT ANALYSIS', 20, currentY + 7);
    currentY += 18;

    // Get top locations
    const locationMap = {};
    attacks.forEach(attack => {
      const location = `${attack.city || 'Unknown'}, ${attack.country || 'Unknown'}`;
      locationMap[location] = (locationMap[location] || 0) + 1;
    });

    const topLocations = Object.entries(locationMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (topLocations.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Top 5 Attack Sources', 20, currentY);
      currentY += 8;

      topLocations.forEach(([location, count], index) => {
        const percent = ((count / attacks.length) * 100).toFixed(1);
        
        // Location card
        pdf.setDrawColor(220, 220, 220);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(15, currentY, pageWidth - 30, 12, 2, 2, 'FD');

        // Rank badge
        pdf.setFillColor(59, 130, 246);
        pdf.circle(22, currentY + 6, 4, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.text(String(index + 1), 20, currentY + 7.5);

        // Location name
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text(location, 30, currentY + 7);

        // Attack count
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${count} attacks (${percent}%)`, 130, currentY + 7);

        currentY += 14;
      });
    } else {
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text('No geographic data available', 20, currentY);
      currentY += 15;
    }

    // Screenshots removed - replaced with data visualizations above

    // Add Recent Attacks Summary Table
    pdf.addPage();
    currentY = 15;
    
    // Section header
    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 12, 'F');
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('RECENT SECURITY EVENTS SUMMARY', 20, currentY + 8);
    currentY += 20;

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Summary table of ${Math.min(20, attacks.length)} most recent attack events`, 15, currentY);
    currentY += 10;

    // Enhanced table headers (removed confidence column)
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(59, 130, 246);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    
    const colWidths = [38, 35, 55, 35];
    const headers = ['Timestamp', 'Source IP', 'Location', 'Attack Type'];
    let headerX = 17;
    
    pdf.setFontSize(9);
    headers.forEach((header, idx) => {
      pdf.text(header, headerX, currentY + 7);
      headerX += colWidths[idx];
    });
    
    currentY += 12;

    // Table rows (show up to 20 recent attacks in summary)
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(8);
    
    const summaryAttacks = attacks.slice(0, 20);
    
    summaryAttacks.forEach((attack, index) => {
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }

      const attackType = (attack.classification || 'benign').toLowerCase();
      
      // Colored card background based on threat type
      if (attackType === 'xss' || attackType === 'sqli') {
        pdf.setFillColor(254, 242, 242); // Red tint for threats
        pdf.setDrawColor(239, 68, 68);
      } else {
        pdf.setFillColor(240, 253, 244); // Green tint for benign
        pdf.setDrawColor(34, 197, 94);
      }
      pdf.roundedRect(15, currentY, pageWidth - 30, 12, 1, 1, 'FD');

      // Colored left accent bar
      if (attackType === 'sqli') {
        pdf.setFillColor(220, 38, 38); // Red
      } else if (attackType === 'xss') {
        pdf.setFillColor(249, 115, 22); // Orange
      } else {
        pdf.setFillColor(34, 197, 94); // Green
      }
      pdf.rect(15, currentY, 3, 12, 'F');

      const rowData = [
        attack.timestamp?.toDate?.()?.toLocaleString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: 'short'
        }) || 'N/A',
        attack.ip || 'Unknown',
        `${attack.city || 'Unknown'}, ${attack.country || ''}`.substring(0, 35),
        attackType.toUpperCase()
      ];

      // Render text with proper coloring
      let rowX = 20; // Start after accent bar
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      
      rowData.forEach((data, idx) => {
        // Color the attack type column based on threat
        if (idx === 3) { // Attack Type column
          if (attackType === 'sqli') {
            pdf.setTextColor(220, 38, 38); // Red
            pdf.setFont(undefined, 'bold');
          } else if (attackType === 'xss') {
            pdf.setTextColor(249, 115, 22); // Orange
            pdf.setFont(undefined, 'bold');
          } else {
            pdf.setTextColor(34, 197, 94); // Green
            pdf.setFont(undefined, 'bold');
          }
        } else {
          pdf.setTextColor(50, 50, 50);
          pdf.setFont(undefined, 'normal');
        }
        
        pdf.text(data, rowX, currentY + 7.5);
        rowX += colWidths[idx];
      });

      currentY += 14; // Increased spacing between cards
    });

    // Add Detailed Security Events (each attack gets a full page with all details)
    const recentAttacks = attacks.slice(0, 10); // Show top 10 attacks in detail
    
    recentAttacks.forEach((attack, index) => {
      // Start each detailed attack on a new page
      pdf.addPage();
      currentY = 15;

      const attackType = (attack.classification || 'benign').toLowerCase();
      
      // Page header with attack number
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`SECURITY EVENT #${index + 1}`, pageWidth / 2, 16, { align: 'center' });
      
      currentY = 35;

      // EVENT OVERVIEW SECTION
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('EVENT OVERVIEW', 20, currentY + 7);
      currentY += 15;

      // Timestamp
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('Timestamp:', 20, currentY);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text(
        attack.timestamp?.toDate?.()?.toLocaleString('en-IN', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }) || 'N/A',
        55, currentY
      );
      currentY += 10;

      // IP Address
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('IP Address:', 20, currentY);
      pdf.setFontSize(10);
      pdf.setTextColor(59, 130, 246);
      pdf.setFont(undefined, 'bold');
      pdf.text(attack.ip || 'Unknown', 55, currentY);
      currentY += 10;

      // Location
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('Location:', 20, currentY);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${attack.city || 'Unknown'}, ${attack.country || 'Unknown'}`, 55, currentY);
      currentY += 15;

      // CLASSIFICATION SECTION
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('THREAT CLASSIFICATION', 20, currentY + 7);
      currentY += 15;

      // Threat Type with color coding
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('Threat Type:', 20, currentY);
      
      // Color-coded badge for threat type
      if (attackType === 'sqli') {
        pdf.setFillColor(220, 38, 38);
        pdf.setTextColor(255, 255, 255);
      } else if (attackType === 'xss') {
        pdf.setFillColor(249, 115, 22);
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setFillColor(34, 197, 94);
        pdf.setTextColor(255, 255, 255);
      }
      pdf.roundedRect(55, currentY - 5, 35, 8, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text(attackType.toUpperCase(), 72.5, currentY + 0.5, { align: 'center' });
      currentY += 10;

      // Session ID
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('Session ID:', 20, currentY);
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      const sessionId = attack.sessionId || 'N/A';
      pdf.text(sessionId, 55, currentY);
      currentY += 15;

      // REQUEST DETAILS SECTION
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('REQUEST DETAILS', 20, currentY + 7);
      currentY += 15;

      // HTTP Method
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('HTTP Method:', 20, currentY);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text(attack.httpMethod || 'N/A', 55, currentY);
      currentY += 10;

      // Endpoint
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('Endpoint:', 20, currentY);
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      const endpoint = attack.endpoint || 'N/A';
      const endpointLines = pdf.splitTextToSize(endpoint, pageWidth - 65);
      pdf.text(endpointLines, 55, currentY);
      currentY += (endpointLines.length * 5) + 10;

      // ATTACK INTENTION SECTION
      if (attack.attackIntent) {
        if (currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFillColor(255, 243, 224);
        pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text('ATTACK INTENTION ANALYSIS', 20, currentY + 7);
        currentY += 15;

        pdf.setDrawColor(234, 88, 12);
        pdf.setFillColor(255, 247, 237);
        
        pdf.setFontSize(9);
        pdf.setTextColor(124, 45, 18);
        pdf.setFont(undefined, 'normal');
        const intentText = attack.attackIntent;
        const intentLines = pdf.splitTextToSize(intentText, pageWidth - 40);
        const maxIntentLines = 18;
        const displayIntentLines = intentLines.slice(0, maxIntentLines);
        
        pdf.roundedRect(15, currentY, pageWidth - 30, (displayIntentLines.length * 5) + 8, 2, 2, 'FD');
        pdf.text(displayIntentLines, 20, currentY + 6);
        currentY += (displayIntentLines.length * 5) + 15;
      }

      // MALICIOUS PAYLOAD SECTION
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFillColor(254, 242, 242);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text('MALICIOUS PAYLOAD', 20, currentY + 7);
      currentY += 15;

      pdf.setDrawColor(220, 38, 38);
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(15, currentY, pageWidth - 30, 0, 2, 2, 'D');
      
      pdf.setFontSize(8);
      pdf.setTextColor(220, 38, 38);
      pdf.setFont(undefined, 'normal');
      const payloadText = attack.input || 'No payload data';
      const payloadLines = pdf.splitTextToSize(payloadText, pageWidth - 40);
      const maxPayloadLines = 12;
      const displayPayloadLines = payloadLines.slice(0, maxPayloadLines);
      
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(15, currentY, pageWidth - 30, (displayPayloadLines.length * 4) + 8, 2, 2, 'FD');
      pdf.text(displayPayloadLines, 20, currentY + 6);
      currentY += (displayPayloadLines.length * 4) + 15;

      // AI ANALYSIS SECTION
      if (attack.attackIntent) {
        if (currentY > pageHeight - 60) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFillColor(239, 246, 255);
        pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('AI-POWERED ATTACK ANALYSIS (GEMINI)', 20, currentY + 7);
        currentY += 15;

        pdf.setDrawColor(59, 130, 246);
        pdf.setFillColor(239, 246, 255);
        
        pdf.setFontSize(9);
        pdf.setTextColor(30, 58, 138);
        pdf.setFont(undefined, 'normal');
        const analysisText = attack.attackIntent;
        const analysisLines = pdf.splitTextToSize(analysisText, pageWidth - 40);
        const maxAnalysisLines = 15;
        const displayAnalysisLines = analysisLines.slice(0, maxAnalysisLines);
        
        pdf.roundedRect(15, currentY, pageWidth - 30, (displayAnalysisLines.length * 5) + 8, 2, 2, 'FD');
        pdf.text(displayAnalysisLines, 20, currentY + 6);
        currentY += (displayAnalysisLines.length * 5) + 15;
      }

      // XAI EXPLANATION SECTION
      if (attack.xaiExplanation) {
        if (currentY > pageHeight - 60) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFillColor(250, 245, 255);
        pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(147, 51, 234);
        pdf.text('EXPLAINABLE AI (XAI) MODEL INSIGHTS', 20, currentY + 7);
        currentY += 15;

        pdf.setDrawColor(147, 51, 234);
        pdf.setFillColor(250, 245, 255);
        
        pdf.setFontSize(8);
        pdf.setTextColor(88, 28, 135);
        pdf.setFont(undefined, 'normal');
        
        let xaiText = attack.xaiExplanation;
        if (typeof xaiText === 'object') {
          xaiText = JSON.stringify(xaiText, null, 2);
        }
        
        const xaiLines = pdf.splitTextToSize(xaiText, pageWidth - 40);
        const maxXaiLines = 20;
        const displayXaiLines = xaiLines.slice(0, maxXaiLines);
        
        pdf.roundedRect(15, currentY, pageWidth - 30, (displayXaiLines.length * 4) + 8, 2, 2, 'FD');
        pdf.text(displayXaiLines, 20, currentY + 6);
        currentY += (displayXaiLines.length * 4) + 15;
      }
    });

    // Add professional footer with page numbers
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.5);
      pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      
      // Footer text (no emojis)
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('CHAMELEON SECURITY SYSTEM', 15, pageHeight - 8);
      
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 15,
        pageHeight - 8,
        { align: 'right' }
      );
    }

    // Save the PDF
    const fileName = `Chameleon_Dashboard_Report_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    pdf.save(fileName);

    // Restore console.error
    restoreConsole();

    return { success: true, fileName };
  } catch (error) {
    // Restore console.error
    restoreConsole();
    
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Capture a specific dashboard section as image
 * @param {string} elementId - DOM element ID to capture
 * @returns {Promise<string>} - Base64 encoded image data
 */
export async function captureSection(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  return canvas.toDataURL('image/png');
}
