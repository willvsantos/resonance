"use client";

import { HistoryTable } from "@/components/dashboard/history-table";
import { DashboardHeader } from "@/components/dashboard/header";

export default function HistoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <DashboardHeader 
        heading="History" 
        text="View and manage your generated speech history." 
      />
      <div className="grid gap-4">
        <HistoryTable />
      </div>
    </div>
  );
}
