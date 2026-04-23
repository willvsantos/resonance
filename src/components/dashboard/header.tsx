import { Separator } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </div>
  );
}
