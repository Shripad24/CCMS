import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative z-10 overflow-hidden">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Ambient orbs for login */}
      <div
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          top: "10%",
          left: "25%",
          background: "radial-gradient(circle, rgba(196,184,232,0.30) 0%, transparent 65%)",
          filter: "blur(80px)",
          animation: "orbFloat1 28s ease-in-out infinite",
        }}
      />
      <div
        className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          bottom: "5%",
          right: "20%",
          background: "radial-gradient(circle, rgba(232,180,184,0.25) 0%, transparent 65%)",
          filter: "blur(80px)",
          animation: "orbFloat2 32s ease-in-out infinite",
        }}
      />

      {/* Left Panel — Editorial quote / branding (55%) */}
      <div className="hidden lg:flex w-[55%] flex-col justify-center px-16 xl:px-24 relative">
        <div className="max-w-xl space-y-8 slide-up">
          {/* Large decorative quotation mark */}
          <svg
            className="w-24 h-24 mb-4"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.15 }}
          >
            <path
              d="M20 60 C20 40, 35 25, 45 25 L45 35 C38 35, 30 42, 30 50 L45 50 L45 75 L20 75 Z M55 60 C55 40, 70 25, 80 25 L80 35 C73 35, 65 42, 65 50 L80 50 L80 75 L55 75 Z"
              fill="var(--text-heading)"
            />
          </svg>

          {/* Quote block */}
          <blockquote>
            <p
              className="font-playfair text-4xl xl:text-5xl font-bold leading-tight"
              style={{ color: "var(--text-heading)" }}
            >
              Every voice matters.
              <br />
              <span className="gradient-text">Every complaint</span>
              <br />
              drives change.
            </p>
            <footer className="mt-8 flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CCMS Logo"
                className="w-10 h-10 object-contain rounded-xl"
              />
              <div>
                <p className="font-dm font-semibold text-sm" style={{ color: "var(--text-heading)" }}>
                  Campus Complaint Management
                </p>
                <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  CCMS Platform
                </p>
              </div>
            </footer>
          </blockquote>

          {/* Feature pills */}
          <div className="flex gap-3 pt-6">
            {[
              { label: "AI-Powered Routing", color: "var(--accent-lavender)" },
              { label: "24/7 Tracking", color: "var(--accent-primary)" },
              { label: "SLA Monitoring", color: "var(--accent-rose)" },
            ].map((feat) => (
              <span
                key={feat.label}
                className="px-4 py-2 rounded-full text-xs font-dm font-medium"
                style={{
                  background: `${feat.color}30`,
                  color: "var(--text-body)",
                  border: `1px solid ${feat.color}50`,
                }}
              >
                {feat.label}
              </span>
            ))}
          </div>
        </div>

        {/* 3D decorative element — abstract shapes */}
        <div className="absolute right-0 bottom-10 w-72 h-72 opacity-20 pointer-events-none">
          <div className="absolute w-40 h-40 rounded-3xl rotate-12 top-0 right-0" style={{ background: "var(--accent-rose)" }} />
          <div className="absolute w-32 h-32 rounded-3xl -rotate-6 top-20 right-24" style={{ background: "var(--accent-primary)" }} />
          <div className="absolute w-28 h-28 rounded-full bottom-0 right-8" style={{ background: "var(--accent-lavender)" }} />
        </div>
      </div>

      {/* Right Panel — Login form (45%) */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="CCMS Logo" className="h-20 w-auto mx-auto mb-4 rounded-2xl object-contain" />
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "var(--text-heading)" }}>
              CCMS Portal
            </h1>
          </div>

          <div className="glass-card p-8 lg:p-10 slide-up relative overflow-hidden">
            {/* Subtle inner glow */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(168,197,160,0.15) 0%, transparent 70%)" }}
            />

            <h2 className="font-playfair text-2xl font-bold mb-2 relative z-10" style={{ color: "var(--text-heading)" }}>
              Welcome back
            </h2>
            <p className="font-dm text-sm mb-8 relative z-10" style={{ color: "var(--text-muted)" }}>
              Sign in to your account to continue
            </p>

            {error && (
              <div
                className="mb-5 p-4 rounded-2xl text-sm font-dm relative z-10"
                style={{
                  background: "rgba(232,112,112,0.1)",
                  border: "1px solid rgba(232,112,112,0.25)",
                  color: "#c96068",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div>
                <label htmlFor="email" className="block text-sm font-dm font-medium mb-2" style={{ color: "var(--text-body)" }}>
                  University Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@university.edu.in"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-dm font-medium mb-2" style={{ color: "var(--text-body)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-dm font-medium transition-colors"
                  style={{ color: "var(--accent-rose)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#c96068"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--accent-rose)"; }}
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2.5 py-3.5 text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? "Authenticating..." : "Sign in securely"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-dm relative z-10" style={{ color: "var(--text-muted)" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold transition-colors"
                style={{ color: "var(--accent-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#5f7d58"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; }}
              >
                Register now
              </Link>
            </p>
          </div>

          {/* Creator badge strip */}
          <div className="mt-6 text-center">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
              BUILT WITH ♥ FOR MODERN CAMPUSES
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
