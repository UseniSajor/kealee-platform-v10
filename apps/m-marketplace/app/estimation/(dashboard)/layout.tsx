import { DashboardNav } from '@estimation/components/shared/DashboardNav';
import { DashboardHeader } from '@estimation/components/shared/DashboardHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <DashboardNav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
