import PDFDocument from 'pdfkit';
import { IOrderDocument } from '../@types';

export const generateInvoicePDF = (order: IOrderDocument): PDFKit.PDFDocument => {
  const doc = new PDFDocument({ margin: 50 });

  // ──── Header ────
  doc
    .fillColor('#4f46e5')
    .fontSize(24)
    .text('LogiCore', { align: 'center' })
    .fillColor('#64748b')
    .fontSize(12)
    .text('Official Delivery Invoice', { align: 'center' })
    .moveDown(2);

  // ──── Order Details ────
  doc
    .fillColor('#0f172a')
    .fontSize(14)
    .text(`Order ID: ${order._id}`)
    .fontSize(12)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
    .text(`Status: ${order.status}`)
    .moveDown(1.5);

  // ──── Addresses ────
  doc
    .fontSize(14)
    .fillColor('#1e293b')
    .text('Pickup Address:', { underline: true })
    .fontSize(12)
    .fillColor('#475569')
    .text(order.pickupAddress.fullAddress)
    .text(`Pincode: ${order.pickupAddress.pinCode}`)
    .moveDown(1);

  doc
    .fontSize(14)
    .fillColor('#1e293b')
    .text('Delivery Address:', { underline: true })
    .fontSize(12)
    .fillColor('#475569')
    .text(order.deliveryAddress.fullAddress)
    .text(`Pincode: ${order.deliveryAddress.pinCode}`)
    .moveDown(2);

  // ──── Parcel Details & Pricing ────
  const weight = order.parcelDetails.weightKg;
  const mockPrice = weight * 50;

  doc
    .fontSize(14)
    .fillColor('#1e293b')
    .text('Parcel Details & Charges:', { underline: true })
    .fontSize(12)
    .fillColor('#475569')
    .text(`Weight: ${weight} kg`)
    .text(`Total Volume: ${order.parcelDetails.totalVolumeCm3} cm³`)
    .moveDown(0.5);

  doc
    .rect(50, doc.y, 500, 30)
    .fill('#f1f5f9');
  
  doc
    .fillColor('#0f172a')
    .fontSize(14)
    .text(`Total Amount Paid: \u20B9 ${mockPrice}`, 60, doc.y - 22);

  // ──── Footer ────
  doc
    .moveDown(4)
    .fontSize(10)
    .fillColor('#94a3b8')
    .text('Thank you for using LogiCore Logistics.', { align: 'center' })
    .text('For support, visit www.logicore.com/support', { align: 'center' });

  doc.end();

  return doc;
};
