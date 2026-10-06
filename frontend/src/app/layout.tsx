import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import EngineInitializer from "@/components/EngineInitializer";
import PresenterControls from "@/components/PresenterControls";
export const metadata: Metadata = {
  title: "SDN Command Center",
  description: "Enterprise Software Defined Networking Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text-primary antialiased overflow-hidden">
        <div className="flex h-screen w-full">
          <Sidebar />
          {/* Main content wrapper with dynamic left margin for sidebar */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden ml-[56px] lg:ml-[220px] transition-all duration-200">
            <EngineInitializer />
            {children}
            <PresenterControls />
          </main>
        </div>
      </body>
    </html>
  );
}
