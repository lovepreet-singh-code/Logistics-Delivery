"use client";

import React from "react";

interface SkeletonProps {
  type: "card" | "table" | "text" | "stats";
  count?: number;
}

export default function SkeletonLoader({ type, count = 1 }: SkeletonProps) {
  const renderCard = () => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-pulse h-40 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="w-24 h-4 bg-slate-200 rounded-md" />
        <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
      </div>
      <div className="w-16 h-8 bg-slate-200 rounded-lg mt-4" />
    </div>
  );

  const renderTable = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-200" />
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3">
            <div className="w-1/4 space-y-2">
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            </div>
            <div className="w-1/4 space-y-2">
              <div className="h-4 bg-slate-200 rounded-md w-full" />
              <div className="h-3 bg-slate-100 rounded-md w-2/3" />
            </div>
            <div className="w-1/6">
              <div className="h-6 bg-slate-200 rounded-full w-full" />
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderText = () => (
    <div className="space-y-3 animate-pulse w-full">
      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
      <div className="h-4 bg-slate-200 rounded-md w-1/2" />
    </div>
  );

  switch (type) {
    case "card":
    case "stats":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {[...Array(count)].map((_, i) => (
            <React.Fragment key={i}>{renderCard()}</React.Fragment>
          ))}
        </div>
      );
    case "table":
      return renderTable();
    case "text":
      return renderText();
    default:
      return null;
  }
}
