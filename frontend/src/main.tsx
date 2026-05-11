import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "./router";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        theme="light"
        offset={100}
        toastOptions={{
          style: { 
            background: "rgba(255, 255, 255, 0.25)", 
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.35)", 
            borderRadius: "20px",
            color: "#1a1a2e",
            fontSize: "0.95rem",
            fontFamily: "'DM Sans', sans-serif",
            padding: "16px 24px",
            minWidth: "320px",
            boxShadow: "0 8px 32px rgba(100,120,100,0.15)"
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
