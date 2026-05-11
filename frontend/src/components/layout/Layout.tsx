import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useWebSocket();

  return (
    <div className="min-h-screen flex relative z-10">
      {/* Ambient Orb — Lavender (center-left) */}
      <div
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          top: "30%",
          left: "20%",
          background: "radial-gradient(circle, rgba(196, 184, 232, 0.35) 0%, rgba(196, 184, 232, 0.10) 40%, transparent 65%)",
          filter: "blur(80px)",
          animation: "orbFloat1 28s ease-in-out infinite",
        }}
      />

      {/* Ambient Orb — Peach (top-right) */}
      <div
        className="fixed w-[450px] h-[450px] rounded-full pointer-events-none z-0"
        style={{
          top: "5%",
          right: "10%",
          background: "radial-gradient(circle, rgba(242, 196, 160, 0.30) 0%, rgba(242, 196, 160, 0.10) 40%, transparent 65%)",
          filter: "blur(90px)",
          animation: "orbFloat2 32s ease-in-out infinite",
        }}
      />

      {/* Ambient Orb — Sage (bottom-center) */}
      <div
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          bottom: "-5%",
          left: "40%",
          background: "radial-gradient(circle, rgba(168, 197, 160, 0.25) 0%, rgba(168, 197, 160, 0.08) 40%, transparent 65%)",
          filter: "blur(100px)",
          animation: "float 35s ease-in-out infinite",
          animationDelay: "-12s",
        }}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <div className="page-container page-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
