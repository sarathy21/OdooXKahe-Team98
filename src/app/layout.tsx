import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { Navbar } from "@/components/layout/navbar/navbar";
import { RoleProvider } from "@/lib/auth/role-context";
import QueryProvider from "@/components/shared/query-provider";
import { Bot } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mini ERP - Demand to Delivery",
  description: "A modern SaaS ERP dashboard built for a 24-hour National Hackathon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#F9FAFB] text-slate-900 font-sans overflow-hidden transition-colors duration-150`}>
        <QueryProvider>
          <RoleProvider>
            <div className="grid grid-cols-[auto_1fr] h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-col min-w-0 overflow-hidden relative bg-[#F9FAFB]">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth">
                  <div className="max-w-[1800px] mx-auto">
                    {children}
                  </div>
                </main>
                
                {/* --- FLOATING AI ASSISTANT --- */}
                <button className="fixed bottom-6 right-6 w-12 h-12 bg-[#774F6C] rounded-none shadow-lg shadow-[#774F6C]/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-150 z-50 group border border-white/20">
                   <Bot className="w-5 h-5" />
                   <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full animate-pulse"></span>
                </button>
              </div>
            </div>
          </RoleProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
