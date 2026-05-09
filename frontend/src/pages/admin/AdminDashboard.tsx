import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, FileText, TrendingUp, Clock, ShieldCheck, Star } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#3B82F6", ASSIGNED: "#818CF8", IN_PROGRESS: "#F59E0B",
  PENDING_INFO: "#F97316", ESCALATED: "#EF4444", RESOLVED: "#10B981",
  CLOSED: "#64748B", REJECTED: "#F43F5E",
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => adminApi.getAnalytics() });
  const analytics = data?.data;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;
  if (!analytics) return null;

  const statusData = Object.entries(analytics.by_status).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || "#64748B" }));
  const categoryData = Object.entries(analytics.by_category).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  const trendData = analytics.submission_trend;

  const metrics = [
    { label: "Total Complaints", value: analytics.total_complaints, icon: FileText, color: "text-primary-400", bg: "bg-primary-500/10" },
    { label: "This Month", value: analytics.complaints_this_month, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "SLA Compliance", value: `${analytics.sla_compliance_rate}%`, icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Avg Resolution", value: `${analytics.avg_resolution_hours}h`, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={m.label} className={`glass-card p-5 slide-up stagger-${(i % 5) + 1}`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-400">{m.label}</p><p className="text-2xl font-outfit font-bold text-slate-100 mt-1">{m.value}</p></div>
              <div className={`w-10 h-10 ${m.bg} rounded-lg flex items-center justify-center`}><m.icon className={`w-5 h-5 ${m.color}`} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="glass-card p-6">
          <h3 className="font-outfit font-semibold text-slate-200 mb-4">By Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#F1F5F9" }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#94A3B8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="font-outfit font-semibold text-slate-200 mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#F1F5F9" }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Line */}
      <div className="glass-card p-6">
        <h3 className="font-outfit font-semibold text-slate-200 mb-4">Submission Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#F1F5F9" }} />
            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Staff Leaderboard */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-700/50"><h3 className="font-outfit font-semibold text-slate-200">Staff Performance</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-700/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Resolved</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Avg Rating</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Avg Hours</th>
            </tr></thead>
            <tbody>
              {analytics.staff_leaderboard.map((s: any, i: number) => (
                <tr key={i} className="border-b border-slate-700/20">
                  <td className="px-4 py-3 text-sm text-slate-200">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{s.resolved}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(s.avg_rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">{s.avg_rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{s.avg_hours}h</td>
                </tr>
              ))}
              {analytics.staff_leaderboard.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No staff data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
