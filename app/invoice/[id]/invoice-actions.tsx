"use client";

import { useState } from "react";
import { Copy, Check, Printer } from "lucide-react";

export default function InvoiceActions() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="w-full max-w-3xl flex justify-end items-center mb-8 print:hidden gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-white hover:bg-[#EDE4D6]/40 text-[#4A4038] hover:text-[#C1272D] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm border border-[#E0D5C3] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#1A1A1A]" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy Link
            </>
          )}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#C1272D] hover:bg-[#9E1B20] text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Download PDF / Print
        </button>
      </div>
    </div>
  );
}
