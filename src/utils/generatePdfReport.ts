import { jsPDF } from 'jspdf';
import { FullAnalysisResult } from '../types';

export function generateClinicalAuditPdf(result: FullAnalysisResult, practitionerName?: string, facilityName?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('STEWARDSHIP.AI // CLINICAL ANTIMICROBIAL & DRUG SAFETY AUDIT REPORT', margin, 8);
    doc.text(`ID: ${result.id}`, pageWidth - margin, 8, { align: 'right' });
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, 10, pageWidth - margin, 10);
  };

  // --- 1. COVER / HEADER BLOCK ---
  // Dark header banner
  doc.setFillColor(43, 43, 43); // #2b2b2b
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CLINICAL ANTIMICROBIAL USAGE & SAFETY AUDIT REPORT', margin + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 95, 61); // Accent coral
  doc.text('WHO AWaRe 2026 PROTOCOL  •  EXPLAINABLE AI SURVEILLANCE ENGINE', margin + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 220, 220);
  doc.text(`Generated: ${new Date(result.timestamp).toLocaleString()}  |  Zero-Defect Audit: ${result.id}`, margin + 4, y + 20);

  y += 28;

  // --- 2. EXECUTIVE SUMMARY & METRIC SCORE CARDS ---
  // Overall Status Banner
  const statusColorMap: Record<string, [number, number, number]> = {
    CRITICAL: [255, 95, 61],   // Red-coral
    WARNING: [235, 160, 20],   // Amber
    INFO: [59, 130, 246],      // Blue
    COMPLIANT: [34, 197, 94],  // Green
  };
  const [sr, sg, sb] = statusColorMap[result.overallStatus] || [43, 43, 43];

  doc.setFillColor(250, 250, 245);
  doc.setDrawColor(43, 43, 43);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, 26, 'FD');

  // Status Badge inside card
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(margin + 3, y + 3, 56, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`STATUS: ${result.overallStatus}`, margin + 6, y + 7.5);

  // Metrics on right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(43, 43, 43);
  doc.text(`WHO AWaRe: ${result.stage4.whoAWaReComplianceScore}%`, margin + 66, y + 8);
  doc.text(`AMR Index: ${result.stage3.amrPressureScore}/10`, margin + 112, y + 8);
  doc.text(`AI Confidence: ${result.stage4.auditTrail.overallConfidence}%`, margin + 150, y + 8);

  // Summary Text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(result.stage4.explainableSummary, contentWidth - 8);
  doc.text(summaryLines.slice(0, 2), margin + 4, y + 16);

  y += 30;

  // --- 3. PATIENT & CLINICAL CONTEXT ---
  checkPageBreak(35);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 43, 43);
  doc.text('1. PATIENT DEMOGRAPHICS & CLINICAL INDICATION', margin + 3, y + 4.2);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  const p = result.prescription.patient;
  const col1 = [
    `Patient Domain: ${p.type === 'veterinary' ? 'Veterinary Medicine' : 'Human Medicine'}`,
    `Species: ${p.species || 'Unspecified'}`,
    `Age: ${p.ageYears !== undefined ? `${p.ageYears} years` : 'N/A'}  |  Weight: ${p.weightKg !== undefined ? `${p.weightKg} kg` : 'N/A'}`,
    `Gender: ${p.gender || 'Unknown'}`,
  ];
  const col2 = [
    `Renal Clearance: ${p.renalFunction || 'Normal'}`,
    `Hepatic Status: ${p.hepaticFunction || 'Normal'}`,
    `Pregnancy / Lactation: ${p.pregnancyOrLactation ? 'Yes (Active Caution)' : 'No'}`,
    `Primary Diagnosis: ${p.diagnosis}`,
  ];

  col1.forEach((t, i) => {
    doc.text(t, margin + 4, y + i * 4.5);
  });
  col2.forEach((t, i) => {
    doc.text(t, margin + contentWidth / 2, y + i * 4.5);
  });
  y += col1.length * 4.5 + 2;

  if (p.clinicalContext) {
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Notes:', margin + 4, y);
    doc.setFont('helvetica', 'normal');
    const ctx = doc.splitTextToSize(p.clinicalContext, contentWidth - 30);
    doc.text(ctx, margin + 26, y);
    y += ctx.length * 4 + 2;
  }

  y += 2;

  // --- 4. PRESCRIBED MEDICATIONS MANIFEST ---
  checkPageBreak(40);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 43, 43);
  doc.text('2. PRESCRIBED MEDICATIONS & REGIMEN MANIFEST', margin + 3, y + 4.2);
  y += 8;

  // Table header
  doc.setFillColor(43, 43, 43);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DRUG NAME', margin + 3, y + 3.8);
  doc.text('DOSAGE', margin + 55, y + 3.8);
  doc.text('ROUTE', margin + 85, y + 3.8);
  doc.text('FREQUENCY', margin + 115, y + 3.8);
  doc.text('DURATION', margin + 155, y + 3.8);
  y += 6;

  result.prescription.medications.forEach((med, idx) => {
    checkPageBreak(8);
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(43, 43, 43);
    doc.text(med.drugName || 'Antimicrobial', margin + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.text(med.dosage || 'Standard', margin + 55, y + 4.2);
    doc.text(med.route || 'Oral', margin + 85, y + 4.2);
    doc.text(med.frequency || 'Daily', margin + 115, y + 4.2);
    doc.text(`${med.durationDays} days`, margin + 155, y + 4.2);
    y += 6.5;
  });

  y += 3;

  // --- 5. STAGE 1: WHO AWaRe 2026 CLASSIFICATION ---
  checkPageBreak(35);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 43, 43);
  doc.text(`3. WHO AWaRe 2026 CLASSIFICATION (Confidence: ${result.stage4.auditTrail.stage1Confidence}%)`, margin + 3, y + 4.2);
  y += 8;

  result.stage1.antimicrobialsFound.forEach((a) => {
    checkPageBreak(12);
    let awareBg: [number, number, number] = [220, 252, 231]; // Access light green
    let awareText: [number, number, number] = [22, 101, 52];
    if (a.whoAWaReGroup === 'WATCH') {
      awareBg = [254, 243, 199];
      awareText = [146, 64, 14];
    } else if (a.whoAWaReGroup === 'RESERVE') {
      awareBg = [254, 226, 226];
      awareText = [153, 27, 27];
    }

    doc.setFillColor(...awareBg);
    doc.roundedRect(margin + 2, y, 28, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...awareText);
    doc.text(`WHO ${a.whoAWaReGroup}`, margin + 4, y + 3.6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(43, 43, 43);
    doc.text(a.drugName, margin + 34, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Class: ${a.antimicrobialClass}  |  ATC: ${a.atcCode}  |  Spectrum: ${a.spectrum}`, margin + 34, y + 7.8);
    y += 9.5;
  });

  y += 2;

  // --- 6. STAGE 2: DOSAGE & PHARMACOKINETICS ---
  checkPageBreak(35);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 43, 43);
  doc.text(`4. DOSAGE & PHARMACOKINETIC CLEARANCE VERIFICATION (${result.stage2.overallDosageStatus})`, margin + 3, y + 4.2);
  y += 8;

  result.stage2.dosageChecks.forEach((dc) => {
    checkPageBreak(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(43, 43, 43);
    doc.text(`• ${dc.drugName}:`, margin + 3, y);

    const isAlert = dc.status !== 'OPTIMAL';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isAlert ? 220 : 22, isAlert ? 38 : 101, isAlert ? 38 : 52);
    doc.text(`[${dc.status}]`, margin + 35, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7.5);
    doc.text(`Prescribed: ${dc.prescribedDosePerDayMg || '—'} mg/day (${dc.prescribedMgPerKg || '—'} mg/kg) | Frequency Appropriate: ${dc.frequencyAppropriate ? 'Yes' : 'No'} | Duration OK: ${dc.durationAppropriate ? 'Yes' : 'No'}`, margin + 65, y);
    y += 4.5;

    if (dc.renalAdjustmentNeeded || dc.adjustedRecommendation) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(180, 50, 20);
      const adj = doc.splitTextToSize(`Renal Adjustment Notice: ${dc.adjustedRecommendation || 'Clearance adjustment required.'}`, contentWidth - 10);
      doc.text(adj, margin + 8, y);
      y += adj.length * 3.8;
    }
    y += 2;
  });

  y += 2;

  // --- 7. STAGE 3: DRUG-DRUG INTERACTIONS & SAFETY ---
  checkPageBreak(35);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 43, 43);
  doc.text(`5. DRUG INTERACTIONS, CONTRAINDICATIONS & AMR PRESSURE (Score: ${result.stage3.amrPressureScore}/10)`, margin + 3, y + 4.2);
  y += 8;

  if (result.stage3.interactions.length === 0 && result.stage3.safetyRisks.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(34, 150, 60);
    doc.text('No major contraindications or severe drug-drug interactions detected.', margin + 4, y);
    y += 6;
  } else {
    result.stage3.interactions.forEach((inter) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠ INTERACTION: ${inter.drugA} + ${inter.drugB} [Severity: ${inter.severity}]`, margin + 3, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);
      const eff = doc.splitTextToSize(`Effect: ${inter.clinicalEffect}  |  Management: ${inter.management}`, contentWidth - 8);
      doc.text(eff, margin + 6, y);
      y += eff.length * 3.8 + 2;
    });

    result.stage3.safetyRisks.forEach((risk) => {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(200, 80, 20);
      doc.text(`⚠ RISK [${risk.type}]: ${risk.title}`, margin + 3, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);
      const desc = doc.splitTextToSize(risk.description, contentWidth - 8);
      doc.text(desc, margin + 6, y);
      y += desc.length * 3.8 + 2;
    });
  }

  y += 2;

  // --- 8. STAGE 4: REGULATORY ALERTS & EXPLAINABLE REASONING ---
  checkPageBreak(40);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 43, 43);
  doc.text(`6. REGULATORY SURVEILLANCE & EXPLAINABLE AUDIT TRAIL`, margin + 3, y + 4.2);
  y += 8;

  if (result.stage4.regulatoryAlerts.length > 0) {
    result.stage4.regulatoryAlerts.forEach((alert) => {
      checkPageBreak(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text(`[${alert.authority}] ${alert.title} (${alert.severity})`, margin + 3, y);
      y += 4.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);
      const act = doc.splitTextToSize(`Action: ${alert.recommendedAction} | Details: ${alert.details}`, contentWidth - 8);
      doc.text(act, margin + 6, y);
      y += act.length * 3.8 + 2;
    });
  }

  // Citations
  if (result.stage4.auditTrail.guidelineCitations.length > 0) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(43, 43, 43);
    doc.text('Regulatory Guideline Citations:', margin + 3, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    result.stage4.auditTrail.guidelineCitations.forEach((cite) => {
      doc.text(`• ${cite.source} (${cite.versionOrYear}): ${cite.title} - ${cite.relevance}`, margin + 6, y);
      y += 4;
    });
  }

  // --- 9. CLINICAL SIGN-OFF STAMP ---
  checkPageBreak(30);
  y += 4;
  doc.setDrawColor(43, 43, 43);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 80, y);
  doc.line(margin + contentWidth - 80, y, margin + contentWidth, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(43, 43, 43);
  doc.text('Attending Clinician / Reviewing Pharmacist', margin, y + 4.5);
  doc.text('Surveillance Audit Seal & Timestamp', margin + contentWidth - 80, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(practitionerName || 'Certified Antimicrobial Stewardship Officer', margin, y + 8.5);
  doc.text(facilityName || 'Global AMR Surveillance Network', margin, y + 12.5);

  doc.text(`Digital Verification Hash: ${result.id}`, margin + contentWidth - 80, y + 8.5);
  doc.text(`Verified at: ${new Date().toISOString()}`, margin + contentWidth - 80, y + 12.5);

  // --- PAGE NUMBERS ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Page ${i} of ${totalPages}  •  Remix AMU Guardian AI  •  Confidential Medical Documentation`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const cleanId = result.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`AMU_Clinical_Audit_Report_${cleanId}.pdf`);
}
