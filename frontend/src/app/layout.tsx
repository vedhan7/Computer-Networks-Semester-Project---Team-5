import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SDN Command Center",
  description: "Secure Minimalist Command for Mathematical SDN Ecosystem",
};

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
