import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Loader2, FileText, TrendingUp, Clock, ShieldCheck, Star } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#c4b8e8", ASSIGNED: "#a8c5a0", IN_PROGRESS: "#f0d080",
  PENDING_INFO: "#f2c4a0", ESCALATED: "#e8b4b8", RESOLVED: "#a8c5a0",
  CLOSED: "#7a8a7a", REJECTED: "#e87070",
};

const CHART_TOOLTIP_STYLE = {
  background: "rgba(255,255,255,0.25)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: "16px",
  color: "#1a1a2e",
  boxShadow: "0 8px 32px rgba(100,120,100,0.15)",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "12px",
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => adminApi.getAnalytics() });
  const analytics = data?.data;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} /></div>;
  if (!analytics) return null;

  const statusData = Object.entries(analytics.by_status).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || "#7a8a7a" }));
  const categoryData = Object.entries(analytics.by_category).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  const trendData = analytics.submission_trend;

  const metrics = [
    { label: "Total Complaints", value: analytics.total_complaints, icon: FileText, accent: "var(--accent-primary)", bg: "rgba(168,197,160,0.15)" },
    { label: "This Month", value: analytics.complaints_this_month, icon: TrendingUp, accent: "var(--accent-lavender)", bg: "rgba(196,184,232,0.15)" },
    { label: "SLA Compliance", value: `${analytics.sla_compliance_rate}%`, icon: ShieldCheck, accent: "var(--accent-gold)", bg: "rgba(240,208,128,0.15)" },
    { label: "Avg Resolution", value: `${analytics.avg_resolution_hours}h`, icon: Clock, accent: "var(--accent-rose)", bg: "rgba(232,180,184,0.15)" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="glass-card p-8 lg:p-10 relative overflow-hidden slide-up">
        <div className="flex items-center justify-between">
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-4" style={{ background: "rgba(232,180,184,0.2)", color: "#c96068", border: "1px solid rgba(232,180,184,0.3)" }}>Admin</span>
            <h1 className="font-playfair text-3xl lg:text-4xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>Admin <span className="gradient-text">Dashboard</span></h1>
            <p className="font-dm text-sm" style={{ color: "var(--text-muted)" }}>Campus-wide analytics and performance overview</p>
          </div>
          <div className="hidden lg:block relative w-48 h-32">
            <div className="absolute w-20 h-20 rounded-2xl rotate-12 right-4 top-0" style={{ background: "var(--accent-rose)", opacity: 0.2 }} />
            <div className="absolute w-16 h-16 rounded-2xl -rotate-6 right-16 top-8" style={{ background: "var(--accent-gold)", opacity: 0.25 }} />
            <div className="absolute w-14 h-14 rounded-full right-0 bottom-0" style={{ background: "var(--accent-lavender)", opacity: 0.2 }} />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, i) => (
          <div key={m.label} className={`glass-card p-6 slide-up stagger-${(i % 5) + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-dm font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{m.label}</p>
                <p className="text-3xl font-playfair font-bold mt-2" style={{ color: "var(--text-heading)" }}>{m.value}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: m.bg }}>
                <m.icon className="w-6 h-6" style={{ color: m.accent }} />
              </div>
            </div>
            <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full" style={{ background: m.accent }} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-playfair font-bold mb-5" style={{ color: "var(--text-heading)" }}>By Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#7a8a7a", fontFamily: "'Space Mono', monospace" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-playfair font-bold mb-5" style={{ color: "var(--text-heading)" }}>Top Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "'DM Sans'" }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "var(--glass-card-bg-hover)" }} />
              <Bar dataKey="value" fill="var(--accent-lavender)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend */}
      <div className="glass-card p-6">
        <h3 className="font-playfair font-bold mb-5" style={{ color: "var(--text-heading)" }}>Submission Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "'Space Mono'" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="count" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ fill: "var(--accent-primary)", r: 3, strokeWidth: 0 }} activeDot={{ fill: "var(--accent-lavender)", r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Staff Leaderboard */}
      <div className="glass-card overflow-hidden p-0">
        <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.20)" }}>
          <h3 className="font-playfair font-bold" style={{ color: "var(--text-heading)" }}>Staff Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <th className="text-left px-5 py-3.5">Name</th>
              <th className="text-left px-5 py-3.5">Resolved</th>
              <th className="text-left px-5 py-3.5">Avg Rating</th>
              <th className="text-left px-5 py-3.5">Avg Hours</th>
            </tr></thead>
            <tbody>
              {analytics.staff_leaderboard.map((s: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.10)", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--accent-lavender), var(--accent-rose))" }}>
                        {s.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-dm font-medium" style={{ color: "var(--text-body)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-dm" style={{ color: "var(--text-body)" }}>{s.resolved}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className={`w-3.5 h-3.5`} style={{ color: star <= Math.round(s.avg_rating) ? "var(--accent-gold)" : "rgba(122,138,122,0.3)", fill: star <= Math.round(s.avg_rating) ? "var(--accent-gold)" : "transparent" }} />
                      ))}
                      <span className="text-xs font-mono ml-1" style={{ color: "var(--text-muted)" }}>{s.avg_rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono" style={{ color: "var(--text-muted)" }}>{s.avg_hours}h</td>
                </tr>
              ))}
              {analytics.staff_leaderboard.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center font-dm" style={{ color: "var(--text-muted)" }}>No staff data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
