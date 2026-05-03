import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    switch (user.role) {
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "STAFF":
        return <Navigate to="/staff/dashboard" replace />;
      default:
        return <Navigate to="/student/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
