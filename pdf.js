export async function generatePdf(mainSummary, scheduleCSummary){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt', format:'letter' });

  const title = "DIG Intelligent Tax System (Lab)";
  const sub   = "Simulated Form 1040 Summary – " + mainSummary.year;

  doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text(title, 300, 60, { align:'center' });

  doc.setFontSize(12); doc.setFont('helvetica','normal');
  doc.text(sub, 300, 80, { align:'center' });

  let y = 120;
  const lines = [
    `Filing Status: ${mainSummary.filingStatus.toUpperCase()}`,
    `Total Income: $${mainSummary.totalIncome.toLocaleString()}`,
    `Standard Deduction: $${mainSummary.stdDed.toLocaleString()}`,
    `Taxable Income: $${mainSummary.taxable.toLocaleString()}`,
    `Estimated Tax (${mainSummary.year}): $${mainSummary.tax.toLocaleString()}`,
    `Withholding: $${mainSummary.withholding.toLocaleString()}`,
    mainSummary.refund>0 ? `Estimated Refund: $${mainSummary.refund.toLocaleString()}` :
                           `Amount Owed: $${mainSummary.due.toLocaleString()}`
  ];
  lines.forEach(l=>{ doc.text(l,72,y); y+=20; });

  if(scheduleCSummary){
    y+=20;
    doc.setFont('helvetica','bold'); doc.text("Schedule C Summary",72,y); y+=16;
    doc.setFont('helvetica','normal');
    [
      `Gross Income: $${scheduleCSummary.gross.toLocaleString()}`,
      `COGS: $${scheduleCSummary.cogs.toLocaleString()}`,
      `Total Expenses: $${scheduleCSummary.expenses.toLocaleString()}`,
      `Net Profit/Loss: $${scheduleCSummary.net.toLocaleString()}`
    ].forEach(l=>{ doc.text(l,72,y); y+=18; });
  }

  doc.setFontSize(9);
  doc.text("This PDF is for educational simulation only. No data was sent to the IRS.", 72, 760);

  doc.save("DIG_TaxLab_Summary.pdf");
}
