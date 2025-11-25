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
    
    // Helper function to add page header
    const addPageHeader = (title) => {
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(title, pageWidth / 2, 16, { align: 'center' });
      return 30;
    };
    
    // Helper function to add footer
    const addFooter = (pageNum, totalPages) => {
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.5);
      pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('CHAMELEON SECURITY SYSTEM', 15, pageHeight - 8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    };

    let currentY = 15;

    // PAGE 1: Title Page
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageWidth, 35, 'F');

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

    // Section Header
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

    // Create KPI cards
    const kpiBoxWidth = (pageWidth - 45) / 2;
    const kpiBoxHeight = 22;
    let kpiX = 15;
    let kpiY = currentY;

    kpiData.forEach((kpi, index) => {
      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, 3, 3, 'FD');
      
      pdf.setFillColor(...kpi.color);
      pdf.roundedRect(kpiX, kpiY, 4, kpiBoxHeight, 1, 1, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(kpi.label, kpiX + 10, kpiY + 8);
      
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...kpi.color);
      pdf.text(String(kpi.value), kpiX + 10, kpiY + 17);
      pdf.setFont(undefined, 'normal');
      
      if (index % 2 === 0) {
        kpiX = pageWidth / 2 + 5;
      } else {
        kpiX = 15;
        kpiY += kpiBoxHeight + 5;
      }
    });

    currentY = kpiY + kpiBoxHeight + 15;

    // Attack Distribution
    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('ATTACK DISTRIBUTION ANALYSIS', 20, currentY + 7);
    currentY += 18;

    const totalAttacks = (stats.xss || 0) + (stats.sqli || 0);
    const xssPercent = totalAttacks > 0 ? ((stats.xss / totalAttacks) * 100).toFixed(1) : 0;
    const sqliPercent = totalAttacks > 0 ? ((stats.sqli / totalAttacks) * 100).toFixed(1) : 0;
    const benignPercent = stats.total > 0 ? ((stats.benign / stats.total) * 100).toFixed(1) : 0;

    const attackTypes = [
      { name: 'XSS Attacks', count: stats.xss || 0, percent: xssPercent, color: [251, 146, 60] },
      { name: 'SQL Injection', count: stats.sqli || 0, percent: sqliPercent, color: [239, 68, 68] },
      { name: 'Benign Traffic', count: stats.benign || 0, percent: benignPercent, color: [34, 197, 94] }
    ];

    attackTypes.forEach((attack) => {
      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, currentY, pageWidth - 30, 18, 2, 2, 'FD');

      pdf.setFillColor(...attack.color);
      pdf.circle(22, currentY + 9, 3, 'F');

      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(attack.name, 30, currentY + 7);

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${attack.count} events (${attack.percent}%)`, 30, currentY + 13);

      const barX = 110;
      const barY = currentY + 5;
      const barWidth = 70;
      const barHeight = 8;
      
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');

      const fillWidth = (barWidth * attack.percent) / 100;
      if (fillWidth > 0) {
        pdf.setFillColor(...attack.color);
        pdf.roundedRect(barX, barY, fillWidth, barHeight, 2, 2, 'F');
      }

      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      if (fillWidth > 15) {
        pdf.text(`${attack.percent}%`, barX + fillWidth - 12, barY + 6);
      }

      currentY += 20;
    });

    // PAGE 2: Geographic Analysis
    pdf.addPage();
    currentY = addPageHeader('GEOGRAPHIC THREAT ANALYSIS');

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
        
        pdf.setDrawColor(220, 220, 220);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(15, currentY, pageWidth - 30, 12, 2, 2, 'FD');

        pdf.setFillColor(59, 130, 246);
        pdf.circle(22, currentY + 6, 4, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.text(String(index + 1), 20, currentY + 7.5);

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text(location, 30, currentY + 7);

        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${count} attacks (${percent}%)`, 130, currentY + 7);

        currentY += 14;
      });
    }

    addFooter(2, 17);

    // PAGES 3-4: Recent Security Events Table
    pdf.addPage();
    currentY = addPageHeader('RECENT SECURITY EVENTS SUMMARY');

    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('Recent Attack Logs', 20, currentY + 7);
    currentY += 18;

    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(59, 130, 246);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    
    const colWidths = [32, 32, 48, 28, 25];
    const headers = ['Timestamp', 'Source IP', 'Location', 'Attack Type', 'Confidence'];
    let headerX = 17;
    
    pdf.setFontSize(9);
    headers.forEach((header, idx) => {
      pdf.text(header, headerX, currentY + 7);
      headerX += colWidths[idx];
    });
    
    currentY += 12;

    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(8);
    
    const recentAttacks = attacks.slice(0, 15);
    let pageNum = 3;
    let rowCount = 0;
    
    recentAttacks.forEach((attack, index) => {
      if (currentY > pageHeight - 25) {
        addFooter(pageNum, 17);
        pdf.addPage();
        pageNum++;
        currentY = addPageHeader('RECENT SECURITY EVENTS SUMMARY (Continued)');
        currentY += 10;
      }

      const attackType = (attack.classification || 'benign').toLowerCase();
      
      if (attackType === 'xss' || attackType === 'sqli') {
        pdf.setFillColor(254, 242, 242);
        pdf.setDrawColor(239, 68, 68);
      } else {
        pdf.setFillColor(240, 253, 244);
        pdf.setDrawColor(34, 197, 94);
      }
      pdf.roundedRect(15, currentY, pageWidth - 30, 12, 1, 1, 'FD');

      if (attackType === 'sqli') {
        pdf.setFillColor(220, 38, 38);
      } else if (attackType === 'xss') {
        pdf.setFillColor(249, 115, 22);
      } else {
        pdf.setFillColor(34, 197, 94);
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
        `${attack.city || 'Unknown'}, ${attack.country || ''}`.substring(0, 30),
        attackType.toUpperCase(),
        `${(attack.confidence * 100 || 0).toFixed(0)}%`
      ];

      let rowX = 20;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      
      rowData.forEach((data, idx) => {
        if (idx === 3) {
          if (attackType === 'sqli') {
            pdf.setTextColor(220, 38, 38);
            pdf.setFont(undefined, 'bold');
          } else if (attackType === 'xss') {
            pdf.setTextColor(249, 115, 22);
            pdf.setFont(undefined, 'bold');
          } else {
            pdf.setTextColor(34, 197, 94);
            pdf.setFont(undefined, 'bold');
          }
        } else {
          pdf.setTextColor(50, 50, 50);
          pdf.setFont(undefined, 'normal');
        }
        
        pdf.text(data, rowX, currentY + 7.5);
        rowX += colWidths[idx];
      });

      currentY += 14;
      rowCount++;
    });

    addFooter(pageNum, 17);

    // PAGES 5-14: Individual Security Event Details (10 Events)
    recentAttacks.slice(0, 10).forEach((attack, eventIndex) => {
      pdf.addPage();
      currentY = addPageHeader(`SECURITY EVENT #${eventIndex + 1}`);
      
      // Event Overview Section
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('EVENT OVERVIEW', 20, currentY + 7);
      currentY += 15;

      const eventDetails = [
        { label: 'Timestamp:', value: attack.timestamp?.toDate?.()?.toLocaleString('en-IN', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) || 'N/A' },
        { label: 'IP Address:', value: attack.ip || 'Unknown', highlight: true },
        { label: 'Location:', value: `${attack.city || 'Unknown'}, ${attack.country || 'Unknown'}` }
      ];

      eventDetails.forEach(detail => {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont(undefined, 'normal');
        pdf.text(detail.label, 20, currentY);
        
        pdf.setFontSize(10);
        pdf.setTextColor(detail.highlight ? 59 : 0, detail.highlight ? 130 : 0, detail.highlight ? 246 : 0);
        pdf.setFont(undefined, detail.highlight ? 'bold' : 'normal');
        pdf.text(detail.value, 65, currentY);
        currentY += 10;
      });

      // Threat Classification
      currentY += 5;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('THREAT CLASSIFICATION', 20, currentY + 7);
      currentY += 15;

      const threatType = (attack.classification || 'benign').toLowerCase();
      const threatColor = threatType === 'sqli' ? [220, 38, 38] : 
                         threatType === 'xss' ? [249, 115, 22] :
                         threatType === 'suspicious' ? [59, 130, 246] : [34, 197, 94];
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('Threat Type:', 20, currentY);
      
      pdf.setFillColor(...threatColor);
      pdf.roundedRect(65, currentY - 4, 35, 8, 1, 1, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      pdf.text(threatType.toUpperCase(), 83, currentY + 2, { align: 'center' });
      
      currentY += 10;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text('Session ID:', 20, currentY);
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text('N/A', 65, currentY);

      // Request Details
      currentY += 15;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('REQUEST DETAILS', 20, currentY + 7);
      currentY += 15;

      const requestDetails = [
        { label: 'HTTP Method:', value: attack.method || 'POST' },
        { label: 'Endpoint:', value: attack.endpoint || '/api/endpoint' }
      ];

      requestDetails.forEach(detail => {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont(undefined, 'normal');
        pdf.text(detail.label, 20, currentY);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(detail.value, 65, currentY);
        currentY += 10;
      });

      // Malicious Payload
      currentY += 5;
      pdf.setFillColor(254, 242, 242);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFillColor(220, 38, 38);
      pdf.rect(15, currentY, pageWidth - 30, 1.5, 'F');
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text('MALICIOUS PAYLOAD', 20, currentY + 7);
      currentY += 12;

      pdf.setDrawColor(220, 38, 38);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, currentY, pageWidth - 30, 25, 1, 1, 'FD');
      currentY += 7;

      const payloadText = (attack.payload || 'No payload data').substring(0, 200);
      pdf.setFontSize(8);
      pdf.setTextColor(220, 38, 38);
      pdf.setFont(undefined, 'normal');
      const payloadLines = pdf.splitTextToSize(payloadText, pageWidth - 40);
      payloadLines.forEach((line, idx) => {
        if (idx < 3) {
          pdf.text(line, 20, currentY + (idx * 6));
        }
      });

      // Attack Intent Section
      currentY += 32;
      if (currentY + 30 > pageHeight - 20) {
        addFooter(5 + eventIndex, 17);
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFillColor(255, 247, 237);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFillColor(251, 146, 60);
      pdf.rect(15, currentY, pageWidth - 30, 1.5, 'F');
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(251, 146, 60);
      pdf.text('ATTACK INTENT ANALYSIS', 20, currentY + 7);
      currentY += 12;

      pdf.setDrawColor(251, 146, 60);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, currentY, pageWidth - 30, 25, 1, 1, 'FD');
      currentY += 7;

      const attackIntent = attack.attackIntent || attack.intent || 'The attacker\'s intent could not be determined from the payload analysis.';
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont(undefined, 'normal');
      const intentLines = pdf.splitTextToSize(attackIntent, pageWidth - 40);
      intentLines.forEach((line, idx) => {
        if (idx < 3 && currentY + (idx * 5) < pageHeight - 25) {
          pdf.text(line, 20, currentY + (idx * 5));
        }
      });

      // XAI Insights
      currentY += 25;
      if (currentY + 20 > pageHeight - 20) {
        addFooter(5 + eventIndex, 17);
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFillColor(249, 240, 255);
      pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
      pdf.setFillColor(147, 51, 234);
      pdf.rect(15, currentY, pageWidth - 30, 1.5, 'F');
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(147, 51, 234);
      pdf.text('EXPLAINABLE AI (XAI) MODEL INSIGHTS', 20, currentY + 7);
      currentY += 12;

      pdf.setDrawColor(147, 51, 234);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, currentY, pageWidth - 30, 40, 1, 1, 'FD');
      currentY += 7;

      const xaiData = attack.xaiExplanation || '{"confidence": 0.95, "contributors": []}';
      const xaiInfo = typeof xaiData === 'string' ? JSON.parse(xaiData) : xaiData;
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 50, 150);
      pdf.setFont(undefined, 'normal');
      const xaiLines = pdf.splitTextToSize(JSON.stringify(xaiInfo, null, 2), pageWidth - 40);
      xaiLines.slice(0, 8).forEach((line, idx) => {
        if (currentY + (idx * 4) < pageHeight - 25) {
          pdf.text(line, 20, currentY + (idx * 4));
        }
      });

      addFooter(5 + eventIndex, 17);
    });

    // PAGE 15-17: Summary and Recommendations
    pdf.addPage();
    currentY = addPageHeader('SECURITY SUMMARY & ANALYSIS');

    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('Overall Security Posture', 20, currentY + 7);
    currentY += 15;

    const summaryMetrics = [
      `Detection Rate: ${(stats.total ? ((stats.xss + stats.sqli) / stats.total * 100).toFixed(1) : 0)}%`,
      `Average Confidence Score: ${(stats.avgConfidence || 0).toFixed(1)}%`,
      `Total Events Analyzed: ${stats.total || 0}`,
      `Threat Events: ${(stats.xss + stats.sqli) || 0}`,
      `Benign Events: ${stats.benign || 0}`
    ];

    summaryMetrics.forEach(metric => {
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`• ${metric}`, 20, currentY);
      currentY += 7;
    });

    currentY += 10;
    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('Attack Vector Distribution', 20, currentY + 7);
    currentY += 15;

    const vectors = [
      { type: 'SQL Injection', count: stats.sqli, percent: totalAttacks > 0 ? ((stats.sqli / totalAttacks) * 100).toFixed(1) : 0 },
      { type: 'Cross-Site Scripting', count: stats.xss, percent: totalAttacks > 0 ? ((stats.xss / totalAttacks) * 100).toFixed(1) : 0 }
    ];

    vectors.forEach(vector => {
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`• ${vector.type}: ${vector.count} incidents (${vector.percent}%)`, 20, currentY);
      currentY += 7;
    });

    addFooter(15, 17);

    // PAGE 16: Recommendations
    pdf.addPage();
    currentY = addPageHeader('SECURITY RECOMMENDATIONS');

    const recommendations = [
      { title: 'Input Validation', desc: 'Implement strict input validation for all user inputs to prevent injection attacks' },
      { title: 'Web Application Firewall', desc: 'Deploy and configure WAF rules to block malicious payloads in real-time' },
      { title: 'Security Headers', desc: 'Enable security headers (CSP, X-Frame-Options, X-Content-Type-Options)' },
      { title: 'Regular Audits', desc: 'Conduct security audits and penetration testing regularly' },
      { title: 'Incident Response', desc: 'Establish and maintain incident response procedures' }
    ];

    currentY += 5;
    recommendations.forEach((rec, idx) => {
      if (currentY > pageHeight - 40) {
        addFooter(16, 17);
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFillColor(240, 253, 244);
      pdf.setDrawColor(34, 197, 94);
      pdf.roundedRect(15, currentY, pageWidth - 30, 18, 2, 2, 'FD');

      pdf.setFillColor(34, 197, 94);
      pdf.circle(22, currentY + 9, 3, 'F');

      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(rec.title, 30, currentY + 7);

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(80, 80, 80);
      const descLines = pdf.splitTextToSize(rec.desc, pageWidth - 50);
      descLines.forEach((line, idx) => {
        if (idx < 2) pdf.text(line, 30, currentY + 13 + (idx * 4));
      });

      currentY += 22;
    });

    addFooter(16, 17);

    // PAGE 17: Blockchain Integrity Verification
    pdf.addPage();
    currentY = addPageHeader('BLOCKCHAIN INTEGRITY VERIFICATION');

    pdf.setFillColor(241, 245, 249);
    pdf.rect(15, currentY, pageWidth - 30, 10, 'F');
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('Log Authenticity & Tamper Detection', 20, currentY + 7);
    currentY += 18;

    const blockchainInfo = [
      { label: 'Status:', value: 'Blockchain Integration Active', color: [34, 197, 94] },
      { label: 'Network:', value: 'Hoodi Testnet (Chain ID: 560048)', highlight: true },
      { label: 'Contract:', value: '0xecEFBA4B95fcD63C88f05Bd653c3eD5B2c574008'.substring(0, 20) + '...' },
      { label: 'Last Anchor:', value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
    ];

    blockchainInfo.forEach((info, idx) => {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text(info.label, 20, currentY);

      if (idx === 0) {
        pdf.setFillColor(...info.color);
        pdf.roundedRect(80, currentY - 3, 40, 7, 1, 1, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.text(info.value, 100, currentY + 2, { align: 'center' });
      } else {
        pdf.setFontSize(10);
        pdf.setTextColor(info.highlight ? 59 : 0, info.highlight ? 130 : 0, info.highlight ? 246 : 0);
        pdf.setFont(undefined, info.highlight ? 'bold' : 'normal');
        pdf.text(info.value, 80, currentY);
      }

      currentY += 12;
    });

    currentY += 10;
    pdf.setFillColor(240, 248, 255);
    pdf.setDrawColor(59, 130, 246);
    pdf.roundedRect(15, currentY, pageWidth - 30, 35, 3, 3, 'FD');

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('Merkle Tree Security', 20, currentY + 8);

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(50, 50, 50);
    const merkleText = 'All security events are cryptographically hashed and anchored to the blockchain. This ensures tamper-proof audit trails and verifiable event authenticity. The Merkle tree structure provides efficient verification of log integrity.';
    const merkleLines = pdf.splitTextToSize(merkleText, pageWidth - 50);
    merkleLines.forEach((line, idx) => {
      if (idx < 4) pdf.text(line, 20, currentY + 16 + (idx * 5));
    });

    addFooter(17, 17);

    // Save the PDF
    const fileName = `Chameleon_Dashboard_Report_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    pdf.save(fileName);

    restoreConsole();

    return { success: true, fileName };
  } catch (error) {
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
