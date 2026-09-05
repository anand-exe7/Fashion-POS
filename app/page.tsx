"use client";

import dynamic from "next/dynamic";

const POSBilling = dynamic(
  () => import("./pos/admin/secure/control-panel/daddys-home/page"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-[#F5EFE6]" />,
  },
);

export default function Home() {
  return <POSBilling />;
}

