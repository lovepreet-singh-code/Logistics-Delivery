import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';

interface ShippingLabelProps {
  order: any;
}

const ShippingLabel = forwardRef<HTMLDivElement, ShippingLabelProps>(({ order }, ref) => {
  if (!order) return null;

  const date = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const trackingId = order._id || order.id || "N/A";

  return (
    <div ref={ref} className="w-[4in] h-[6in] bg-white text-black p-4 flex flex-col font-sans border-4 border-black box-border mx-auto relative" style={{ pageBreakAfter: 'always' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">LOGICORE</h1>
          <p className="text-sm font-bold uppercase">Express Logistics</p>
        </div>
        <div className="border-4 border-black p-1 bg-white">
          <QRCode value={trackingId} size={80} level="M" />
        </div>
      </div>

      {/* ROUTING INFO */}
      <div className="flex flex-col gap-4 border-b-4 border-black pb-4 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-bold uppercase text-gray-600">Ship Date</p>
            <p className="font-bold text-lg">{date}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-600">Weight</p>
            <p className="font-bold text-lg">{order.parcelDetails?.weightKg || 5} KG</p>
          </div>
        </div>
      </div>

      {/* ADDRESSES */}
      <div className="flex flex-col flex-1 border-b-4 border-black pb-4 mb-4">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase text-gray-600">From:</p>
          <p className="font-bold text-lg uppercase leading-tight">{order.pickupAddress?.fullAddress || "Logicore Hub, Main Warehouse"}</p>
          <p className="font-bold text-md uppercase">PIN: {order.pickupAddress?.pinCode || "100001"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-gray-600">To:</p>
          <p className="font-bold text-2xl uppercase leading-tight">{order.deliveryAddress?.fullAddress || "Customer Destination Address"}</p>
          <p className="font-bold text-xl uppercase mt-1">PIN: {order.deliveryAddress?.pinCode || "200002"}</p>
        </div>
      </div>

      {/* TRACKING BARCODE / ID */}
      <div className="flex flex-col items-center justify-center pt-2">
        <p className="text-xs font-bold uppercase text-gray-600 mb-2">Tracking Number (AWB)</p>
        <div className="w-full flex justify-center mb-2">
           <p className="text-3xl font-black font-mono tracking-widest uppercase">{trackingId.slice(-12)}</p>
        </div>
        <p className="text-[10px] font-bold text-center mt-2">Scan QR code at top right with Agent App to update status.</p>
      </div>

    </div>
  );
});

ShippingLabel.displayName = 'ShippingLabel';

export default ShippingLabel;
