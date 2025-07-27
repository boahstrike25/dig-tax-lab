export async function generatePdf(summary){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt', format:'letter' });

  const title = "DIG Intelligent Tax System (Lab)";
  const sub   = "Simulated Form 1040 Summary – 2024";

  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.text(title, 300, 60, { align:'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica','normal');
  doc.text(sub, 300, 80, { align:'center' });

  const lines = [
    `Filing Status: ${summary.filingStatus.toUpperCase()}`,
    `Total Income: $${summary.totalIncome.toLocaleString()}`,
    `Standard Deduction: $${summary.stdDed.toLocaleString()}`,
    `Taxable Income: $${summary.taxable.toLocaleString()}`,
    `Estimated Tax (2024): $${summary.tax.toLocaleString()}`,
    `Withholding: $${summary.withholding.toLocaleString()}`,
    summary.refund > 0
      ? `Estimated Refund: $${summary.refund.toLocaleString()}`
      : `Amount Owed: $${summary.due.toLocaleString()}`
  ];

  let y = 120;
  lines.forEach(l => { doc.text(l, 72, y); y += 22; });

  doc.setFontSize(9);
  doc.text("This PDF is for educational simulation only. No data was sent to the IRS.", 72, 760);

  doc.save("DIG_TaxLab_1040_Summary.pdf");
}
