"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import axios from "axios";

export default function BulkUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsedOrders = parseCSV(csvText);

        if (parsedOrders.length === 0) {
          throw new Error("CSV file is empty or formatted incorrectly.");
        }

        // We can pass a default customerId for B2B uploads, or parse it if it exists.
        // Assuming the backend handles missing customerIds by defaulting, or we pass a placeholder.
        const defaultCustomerId = "64c9d921b0b5e2b834e56789"; // Replace with dynamic token ID if available

        const payload = parsedOrders.map(order => ({
          ...order,
          customerId: defaultCustomerId
        }));

        await axios.post("http://localhost:8080/api/orders/bulk", payload);
        
        setSuccess(`Successfully uploaded ${parsedOrders.length} orders!`);
      } catch (err: any) {
        console.error("CSV Upload Error:", err);
        setError(err.message || "Failed to process the CSV file.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file.");
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Expected headers: pickup_address, pickup_pincode, delivery_address, delivery_pincode, weight, length, width, height
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      
      const getValue = (key: string) => values[headers.indexOf(key)] || "";

      return {
        pickupAddress: {
          fullAddress: getValue("pickup_address"),
          pinCode: getValue("pickup_pincode")
        },
        deliveryAddress: {
          fullAddress: getValue("delivery_address"),
          pinCode: getValue("delivery_pincode")
        },
        parcelDetails: {
          weightKg: parseFloat(getValue("weight")) || 1,
          dimensions: {
            lengthCm: parseFloat(getValue("length")) || 10,
            widthCm: parseFloat(getValue("width")) || 10,
            heightCm: parseFloat(getValue("height")) || 10,
          }
        }
      };
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">B2B Bulk Upload</h2>
          <p className="text-sm text-slate-400">Upload a CSV file to create multiple orders instantly.</p>
        </div>
        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
          <UploadCloud className="w-6 h-6" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={loading}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className={`cursor-pointer flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
            loading
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              Select CSV File
            </>
          )}
        </label>
        <span className="text-xs text-slate-500">Requires: pickup_address, pickup_pincode...</span>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-amber-400 bg-amber-400/10 p-3 rounded-xl text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-xl text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
}
