import Link from "next/link";

export default function InvoiceNotFound() {
  return (
    <div className="min-h-screen bg-[#F5EFE6] flex flex-col items-center justify-center gap-4">
      <p className="text-[#C1272D] font-bold text-xl">Invoice Not Found</p>
      <p className="text-sm text-[#6B5F52]">The requested invoice record could not be found or has been removed.</p>
      <Link
        href="/"
        className="px-6 py-2 bg-[#E0D5C3] hover:bg-[#E0D5C3] rounded-lg text-[#000000] font-bold transition-colors mt-2"
      >
        Return to Home
      </Link>
    </div>
  );
}
