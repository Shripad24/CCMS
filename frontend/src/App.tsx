import { Outlet } from "react-router-dom";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function App() {
  useWebSocket();
  return <Outlet />;
}
