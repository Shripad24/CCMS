import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import SubmitComplaint from "@/pages/student/SubmitComplaint";
import MyComplaints from "@/pages/student/MyComplaints";
import StudentComplaintDetail from "@/pages/student/ComplaintDetail";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import AssignedComplaints from "@/pages/staff/AssignedComplaints";
import StaffComplaintDetail from "@/pages/staff/ComplaintDetail";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AllComplaints from "@/pages/admin/AllComplaints";
import UserManagement from "@/pages/admin/UserManagement";
import DepartmentManagement from "@/pages/admin/DepartmentManagement";
import SLAManagement from "@/pages/admin/SLAManagement";
import EscalatedComplaints from "@/pages/admin/EscalatedComplaints";
import Reports from "@/pages/admin/Reports";

import ProfilePage from "@/pages/auth/ProfilePage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <RoleRedirect /> },
      { path: "profile", element: <ProfilePage /> },
      // Student
      { path: "student/dashboard", element: <ProtectedRoute allowedRoles={["STUDENT"]}><StudentDashboard /></ProtectedRoute> },
      { path: "student/complaints/new", element: <ProtectedRoute allowedRoles={["STUDENT"]}><SubmitComplaint /></ProtectedRoute> },
      { path: "student/complaints", element: <ProtectedRoute allowedRoles={["STUDENT"]}><MyComplaints /></ProtectedRoute> },
      { path: "student/complaints/:id", element: <ProtectedRoute allowedRoles={["STUDENT"]}><StudentComplaintDetail /></ProtectedRoute> },
      // Staff
      { path: "staff/dashboard", element: <ProtectedRoute allowedRoles={["STAFF"]}><StaffDashboard /></ProtectedRoute> },
      { path: "staff/complaints", element: <ProtectedRoute allowedRoles={["STAFF"]}><AssignedComplaints /></ProtectedRoute> },
      { path: "staff/complaints/:id", element: <ProtectedRoute allowedRoles={["STAFF"]}><StaffComplaintDetail /></ProtectedRoute> },
      // Admin
      { path: "admin/dashboard", element: <ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute> },
      { path: "admin/complaints", element: <ProtectedRoute allowedRoles={["ADMIN"]}><AllComplaints /></ProtectedRoute> },
      { path: "admin/complaints/:id", element: <ProtectedRoute allowedRoles={["ADMIN"]}><StaffComplaintDetail /></ProtectedRoute> },
      { path: "admin/users", element: <ProtectedRoute allowedRoles={["ADMIN"]}><UserManagement /></ProtectedRoute> },
      { path: "admin/departments", element: <ProtectedRoute allowedRoles={["ADMIN"]}><DepartmentManagement /></ProtectedRoute> },
      { path: "admin/sla", element: <ProtectedRoute allowedRoles={["ADMIN"]}><SLAManagement /></ProtectedRoute> },
      { path: "admin/escalated", element: <ProtectedRoute allowedRoles={["ADMIN"]}><EscalatedComplaints /></ProtectedRoute> },
      { path: "admin/reports", element: <ProtectedRoute allowedRoles={["ADMIN"]}><Reports /></ProtectedRoute> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

function RoleRedirect() {
  const user = JSON.parse(localStorage.getItem("ccms-auth") || "{}");
  const role = user?.state?.user?.role;
  switch (role) {
    case "ADMIN": return <Navigate to="/admin/dashboard" replace />;
    case "STAFF": return <Navigate to="/staff/dashboard" replace />;
    default: return <Navigate to="/student/dashboard" replace />;
  }
}
