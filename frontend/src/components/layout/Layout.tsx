import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useWebSocket();

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <div className="page-container fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
