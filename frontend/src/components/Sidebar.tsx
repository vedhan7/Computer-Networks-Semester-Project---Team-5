"use client";

import { Activity, ShieldAlert, Network, Clock, Settings, LayoutDashboard } from "lucide-react";
import { useSDNStore } from "@/store/useSDNStore";

export default function Sidebar() {
  const { activeTab, setActiveTab } = useSDNStore();

  return (
    <aside className="w-16 h-screen border-r border-surface-border bg-surface flex flex-col items-center py-6 space-y-8 fixed left-0 top-0">
      <div className="w-10 h-10 bg-quantum-teal/10 rounded-xl flex items-center justify-center border border-quantum-teal/30">
        <Network className="text-quantum-teal w-5 h-5" />
      </div>
      <nav className="flex-1 flex flex-col space-y-6">
        <SidebarItem 
          icon={<LayoutDashboard />} 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <SidebarItem 
          icon={<Activity />} 
          active={activeTab === 'activity'} 
          onClick={() => setActiveTab('activity')} 
        />
        <SidebarItem 
          icon={<ShieldAlert />} 
          active={activeTab === 'threats'} 
          onClick={() => setActiveTab('threats')} 
        />
        <SidebarItem 
          icon={<Clock />} 
          active={activeTab === 'timeline'} 
          onClick={() => setActiveTab('timeline')} 
        />
      </nav>
      <div className="pb-4">
        <SidebarItem 
          icon={<Settings />} 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </div>
    </aside>
  );
}

function SidebarItem({ icon, active = false, onClick }: { icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
