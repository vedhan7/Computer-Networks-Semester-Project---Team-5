"use client";
import { AuthProvider } from "@/providers/AuthProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Sidebar />
        <Header title={title} subtitle={subtitle} />
        <main className="main-content fade-in">
          {children}
        </main>
      </WebSocketProvider>
    </AuthProvider>
  );
}
