import { AppShell } from "@/components/layout/app-shell";
import "@/features/editor/styles/editor-left-panel.css";
import "@/features/editor/styles/editor-canvas.css";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
