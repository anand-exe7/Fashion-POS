import { getOrder } from "@/lib/db";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail } from "lucide-react";
import InvoiceActions from "./invoice-actions";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invoice - ${id}`,
  };
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F5EFE6] text-[#000000] font-sans py-12 px-4 print:p-0 print:bg-white flex flex-col items-center">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Top Navigation / Action Bar (Hidden when printing) */}
      <InvoiceActions />

      {/* The Invoice Document */}
      <div className="w-full max-w-3xl bg-white border border-[#E0D5C3] rounded-2xl shadow-xl print:shadow-none print:border-none print:rounded-none overflow-hidden">
        {/* Header Section */}
        <div className="bg-[#FAF7F2] border-b border-[#E0D5C3] p-8 sm:p-12 print:p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 flex items-center justify-center mb-4">
            <img
              src="/logo.jpg"
              alt="Daddy's Home Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-black text-[#C1272D] tracking-tight">
            Daddy's Home
          </h1>
          <p className="text-xs text-[#6B5F52] font-bold tracking-wider mt-1 mb-4">
            INVOICE: {order.id}
          </p>

          <div className="flex flex-col items-center gap-2 text-sm text-[#4A4038] font-semibold">
            <div className="text-center max-w-md leading-relaxed">
              <span className="inline-block text-[#C1272D] mr-1.5 align-middle -mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <span>
                East 2nd Street, Near Bombay Bhavan, 1st Floor, Pudukkottai -
                622001.
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C1272D] shrink-0" />
                +91 8056642706
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C1272D] shrink-0" />
                divyadarshan409@gmail.com
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Meta Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 sm:p-12 print:p-6 border-b border-[#E0D5C3]/50">
          <div>
            <h3 className="text-[10px] font-bold text-[#6B5F52] uppercase tracking-[0.2em] mb-3">
              Billed To
            </h3>
            <p className="text-base font-bold text-[#C1272D]">
              {order.customer_name || "Guest Customer"}
            </p>
            {order.customer_phone && (
              <p className="text-sm text-[#4A4038] font-semibold mt-1">
                +91 {order.customer_phone}
              </p>
            )}
          </div>
          <div className="sm:text-right flex flex-col sm:items-end">
            <h3 className="text-[10px] font-bold text-[#6B5F52] uppercase tracking-[0.2em] mb-3 self-start sm:self-auto">
              Order Details
            </h3>
            <div className="inline-block text-left text-sm space-y-1">
              <div className="flex gap-2">
                <span className="text-[#6B5F52] font-bold w-12 text-left sm:text-right">
                  Date:
                </span>
                <span className="text-[#000000] font-black">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#6B5F52] font-bold w-12 text-left sm:text-right">
                  Time:
                </span>
                <span className="text-[#000000] font-black">
                  {new Date(order.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#6B5F52] font-bold w-12 text-left sm:text-right">
                  Type:
                </span>
                <span className="text-[#000000] font-black uppercase">
                  {order.source} SALE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8 sm:p-12 print:py-4 print:px-6">
          <div className="w-full overflow-x-auto scrollbar-thin pb-2">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b-2 border-[#E0D5C3]">
                  <th className="py-4 text-[11px] font-bold text-[#6B5F52] uppercase tracking-wider">
                    Item Description
                  </th>
                  <th className="py-4 text-[11px] font-bold text-[#6B5F52] uppercase tracking-wider text-center">
                    Qty
                  </th>
                  <th className="py-4 text-[11px] font-bold text-[#6B5F52] uppercase tracking-wider text-right">
                    Price
                  </th>
                  <th className="py-4 text-[11px] font-bold text-[#6B5F52] uppercase tracking-wider text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D5C3]/40">
                {order.order_items
                  .filter((i) => !i.snapshot_name.startsWith("GST ("))
                  .map((item, index) => (
                    <tr key={index} className="group">
                      <td className="py-6 pr-4 print:py-3">
                        <p className="text-sm font-bold text-[#C1272D]">
                          {item.snapshot_name}
                        </p>
                      </td>
                      <td className="py-6 px-4 print:py-3 text-center text-sm font-bold text-[#4A4038]">
                        {item.quantity}
                      </td>
                      <td className="py-6 pl-4 print:py-3 text-right text-sm font-bold text-[#4A4038]">
                        ₹
                        {item.snapshot_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-6 pl-4 print:py-3 text-right text-sm font-black text-[#C1272D]">
                        ₹
                        {(item.snapshot_price * item.quantity).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="bg-[#FAF7F2] border-t border-[#E0D5C3] p-8 sm:p-12 print:p-6 flex justify-end">
          {/* Calculations */}
          <div className="w-full sm:w-1/2 space-y-3">
            {(() => {
              const gstItem = order.order_items?.find((i) =>
                i.snapshot_name.startsWith("GST ("),
              );
              const showSubtotal =
                order.discount_amount > 0 ||
                order.delivery_fee > 0 ||
                !!gstItem;
              return (
                <>
                  {showSubtotal && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#6B5F52] font-bold uppercase tracking-wider">
                        Subtotal
                      </span>
                      <span className="font-bold text-[#000000]">
                        ₹
                        {order.subtotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {order.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#6B5F52] font-bold uppercase tracking-wider">
                        Discount{" "}
                        {order.discount_type === "PERCENT"
                          ? `(${order.discount_value}%)`
                          : ""}
                      </span>
                      <span className="font-bold text-[#C1272D]">
                        -₹
                        {order.discount_amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {gstItem && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#6B5F52] font-bold uppercase tracking-wider">
                        {gstItem.snapshot_name}
                      </span>
                      <span className="font-bold text-[#000000]">
                        ₹
                        {(
                          gstItem.snapshot_price * gstItem.quantity
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {order.delivery_fee > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#6B5F52] font-bold uppercase tracking-wider">
                        Delivery Fee
                      </span>
                      <span className="font-bold text-[#000000]">
                        ₹
                        {order.delivery_fee.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="border-t border-[#E0D5C3] pt-4 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
              <span className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest shrink-0">
                Total Amount
              </span>
              <span className="text-[28px] sm:text-3xl font-black text-[#C1272D] self-end sm:self-auto leading-none mt-1 sm:mt-0">
                ₹
                {order.grand_total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E0D5C3]/60 p-6 print:p-4 text-center bg-[#F5EFE6] flex flex-col items-center justify-center gap-1.5">
          <p className="text-xs font-bold text-[#C1272D] tracking-wider uppercase">
            Thank you for shopping!
          </p>
          <p className="text-[9px] font-bold text-[#6B5F52]/80 uppercase tracking-[0.15em]">
            Powered by cenexa system @2026
          </p>
        </div>
      </div>
    </div>
  );
}
