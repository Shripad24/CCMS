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
        theme="dark"
        offset={100}
        toastOptions={{
          style: { 
            background: "#1E293B", 
            border: "1px solid #334155", 
            color: "#F1F5F9",
            fontSize: "1.1rem",
            padding: "16px 24px",
            minWidth: "350px"
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
