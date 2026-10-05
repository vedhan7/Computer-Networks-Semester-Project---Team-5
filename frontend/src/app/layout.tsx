import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Activity, ShieldAlert, Network, Clock, Settings, LayoutDashboard } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SDN Command Center",
  description: "Secure Minimalist Command for Mathematical SDN Ecosystem",
};

function Sidebar() {
  return (
    <aside className="w-16 h-screen border-r border-surface-border bg-surface flex flex-col items-center py-6 space-y-8 fixed left-0 top-0">
      <div className="w-10 h-10 bg-quantum-teal/10 rounded-xl flex items-center justify-center border border-quantum-teal/30">
        <Network className="text-quantum-teal w-5 h-5" />
      </div>
      <nav className="flex-1 flex flex-col space-y-6">
        <SidebarItem icon={<LayoutDashboard />} active />
        <SidebarItem icon={<Activity />} />
        <SidebarItem icon={<ShieldAlert />} />
        <SidebarItem icon={<Clock />} />
      </nav>
      <div className="pb-4">
        <SidebarItem icon={<Settings />} />
      </div>
    </aside>
  );
}

function SidebarItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`p-3 rounded-lg transition-all duration-200 ${
        active 
          ? "bg-quantum-teal/20 text-quantum-teal shadow-[0_0_15px_rgba(45,212,191,0.2)]" 
          : "text-gray-500 hover:text-gray-300 hover:bg-surface-border"
      }`}
    >
      {icon}
    </button>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-obsidian text-gray-200 antialiased overflow-hidden`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-16 h-screen overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
