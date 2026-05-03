export type Role = "STUDENT" | "STAFF" | "ADMIN";
export type ComplaintStatus = "SUBMITTED" | "ASSIGNED" | "IN_PROGRESS" | "PENDING_INFO" | "ESCALATED" | "RESOLVED" | "CLOSED" | "REJECTED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Category = "INFRASTRUCTURE" | "ACADEMIC" | "ADMINISTRATIVE" | "IT_SERVICES" | "HOSTEL" | "LIBRARY" | "TRANSPORT" | "SAFETY" | "OTHER";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface Complaint {
  id: string;
  reference_no: string;
  student_id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  category: string | null;
  priority: Priority;
  department_id: string | null;
  assigned_staff_id: string | null;
  ai_category: string | null;
  ai_priority: string | null;
  ai_department: string | null;
  ai_reasoning: string | null;
  ai_confidence: number | null;
  sla_deadline: string | null;
  sla_warning_sent: boolean;
  attachment_url: string | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
  student?: User;
  assigned_staff?: User;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  author_id: string;
  update_type: string;
  previous_status: string | null;
  new_status: string | null;
  message: string | null;
  attachment_url: string | null;
  created_at: string;
  author?: User;
}

export interface Message {
  id: string;
  complaint_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { id: string; full_name: string; role: string };
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  complaint_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_user_id: string | null;
  created_at: string;
}

export interface SLAPolicy {
  id: string;
  department_id: string;
  priority: string;
  resolution_hours: number;
  warning_threshold_pct: number;
}

export interface Rating {
  id: string;
  complaint_id: string;
  student_id: string;
  staff_id: string;
  score: number;
  feedback_text: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  unread_count?: number;
}

export interface Analytics {
  total_complaints: number;
  complaints_this_month: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  avg_resolution_hours: number;
  sla_compliance_rate: number;
  ai_acceptance_rate: number;
  submission_trend: { date: string; count: number }[];
  department_performance: { name: string; avg_hours: number; sla_rate: number }[];
  staff_leaderboard: { name: string; resolved: number; avg_rating: number; avg_hours: number }[];
}
