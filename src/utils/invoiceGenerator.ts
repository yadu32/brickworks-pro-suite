import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  brickTypeName: string;
  quantity: number;
  ratePerBrick: number;
  totalAmount: number;
  amountReceived: number;
  balanceDue: number;
  paymentStatus: string;
}

export const generateInvoicePDF = async (data: InvoiceData): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(22);
  doc.setTextColor(255, 107, 0); // Orange
  doc.text('BRICKWORKS MANAGER', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Professional Brick Manufacturing & Sales Management', 105, 28, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(255, 107, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Invoice Details
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE', 20, 45);
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.invoiceNumber}`, 20, 52);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-IN')}`, 20, 58);
  
  // Bill To Section
  doc.setFontSize(12);
  doc.text('BILL TO:', 20, 70);
  
  doc.setFontSize(10);
  doc.text(data.customerName, 20, 77);
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 20, 83);
  }
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, 92, 190, 92);
  
  // Items Table Header
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 100, 170, 8, 'F');
  
  doc.text('Description', 25, 105);
  doc.text('Quantity', 90, 105);
  doc.text('Rate', 125, 105);
  doc.text('Amount', 160, 105);
  
  // Items Table Content
  doc.setFontSize(10);
  doc.text(data.brickTypeName, 25, 115);
  doc.text(data.quantity.toLocaleString(), 90, 115);
  doc.text(`₹${data.ratePerBrick.toFixed(2)}`, 125, 115);
  doc.text(`₹${data.totalAmount.toLocaleString('en-IN')}`, 160, 115);
  
  // Line separator
  doc.line(20, 120, 190, 120);
  
  // Totals Section
  const totalsY = 130;
  doc.setFontSize(11);
  
  doc.text('Total Amount:', 120, totalsY);
  doc.text(`₹${data.totalAmount.toLocaleString('en-IN')}`, 160, totalsY);
  
  doc.text('Amount Received:', 120, totalsY + 7);
  doc.setTextColor(40, 167, 69); // Green
  doc.text(`₹${data.amountReceived.toLocaleString('en-IN')}`, 160, totalsY + 7);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Balance Due:', 120, totalsY + 15);
  
  if (data.balanceDue > 0) {
    doc.setTextColor(255, 193, 7); // Yellow/Warning
  } else {
    doc.setTextColor(40, 167, 69); // Green
  }
  doc.text(`₹${data.balanceDue.toLocaleString('en-IN')}`, 160, totalsY + 15);
  
  // Payment Status
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Status:', 20, totalsY + 15);
  
  // Status badge color
  if (data.paymentStatus === 'Paid') {
    doc.setTextColor(40, 167, 69);
  } else if (data.paymentStatus === 'Partial') {
    doc.setTextColor(255, 193, 7);
  } else {
    doc.setTextColor(220, 53, 69);
  }
  doc.text(data.paymentStatus, 55, totalsY + 15);
  
  // QR Code for UPI Payment (if balance due exists)
  if (data.balanceDue > 0) {
    try {
      // Generate UPI QR Code (you can customize this with actual UPI details)
      const upiString = `upi://pay?pa=merchant@upi&pn=BrickWorks&am=${data.balanceDue}&cu=INR&tn=Invoice ${data.invoiceNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(upiString, { width: 80 });
      
      doc.addImage(qrCodeDataUrl, 'PNG', 25, totalsY + 25, 40, 40);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Scan to pay via UPI', 25, totalsY + 70);
    } catch (error) {
      console.error('QR code generation failed:', error);
    }
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  doc.text('This is a computer-generated invoice.', 105, 285, { align: 'center' });
  
  return doc.output('blob');
};

export const shareViaWhatsApp = (data: InvoiceData, pdfBlob: Blob) => {
  const message = `*Invoice for ${data.customerName}*
  
Invoice #: ${data.invoiceNumber}
Date: ${new Date(data.date).toLocaleDateString('en-IN')}

Item: ${data.brickTypeName}
Quantity: ${data.quantity.toLocaleString()}
Rate: ₹${data.ratePerBrick.toFixed(2)}

*Total Amount: ₹${data.totalAmount.toLocaleString('en-IN')}*
Amount Received: ₹${data.amountReceived.toLocaleString('en-IN')}
*Balance Due: ₹${data.balanceDue.toLocaleString('en-IN')}*

Payment Status: ${data.paymentStatus}

--- BrickWorks Manager ---`;

  const encodedMessage = encodeURIComponent(message);
  const phoneNumber = data.customerPhone ? data.customerPhone.replace(/\D/g, '') : '';
  
  // Open WhatsApp with the message
  if (phoneNumber && phoneNumber.length >= 10) {
    window.open(`https://wa.me/91${phoneNumber.slice(-10)}?text=${encodedMessage}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }
};

export const shareViaEmail = (data: InvoiceData) => {
  const subject = encodeURIComponent(`Invoice #${data.invoiceNumber} - ${data.customerName}`);
  const body = encodeURIComponent(`Dear ${data.customerName},

Please find your invoice details below:

Invoice #: ${data.invoiceNumber}
Date: ${new Date(data.date).toLocaleDateString('en-IN')}

Item: ${data.brickTypeName}
Quantity: ${data.quantity.toLocaleString()}
Rate: ₹${data.ratePerBrick.toFixed(2)}

Total Amount: ₹${data.totalAmount.toLocaleString('en-IN')}
Amount Received: ₹${data.amountReceived.toLocaleString('en-IN')}
Balance Due: ₹${data.balanceDue.toLocaleString('en-IN')}

Payment Status: ${data.paymentStatus}

Thank you for your business!

--- BrickWorks Manager ---`);

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

export const downloadPDF = (pdfBlob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};
