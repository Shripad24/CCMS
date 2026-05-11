import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Loader2, Check, X } from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "", role: "STUDENT" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordChecks = [
    { label: "At least 8 characters", valid: form.password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(form.password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(form.password) },
    { label: "Contains a digit", valid: /\d/.test(form.password) },
  ];
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwordChecks.every((c) => c.valid)) { setError("Password doesn't meet requirements"); return; }
    if (!passwordsMatch) { setError("Passwords don't match"); return; }

    setLoading(true);
    try {
      await authApi.register({ full_name: form.full_name, email: form.email, password: form.password, role: form.role });
      setSuccess(true);
      toast.success("Registration successful!");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="glass-card p-10 max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(168,197,160,0.2)", border: "1px solid rgba(168,197,160,0.4)" }}
          >
            <Check className="w-8 h-8" style={{ color: "var(--accent-primary)" }} />
          </div>
          <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: "var(--text-heading)" }}>
            Registration Successful!
          </h2>
          <p className="font-dm text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {form.role === "STAFF"
              ? "Your account has been created. Since you registered as Staff, an Admin must approve your account before you can log in."
              : "Your account has been created. You can now log in with your credentials."}
          </p>
          <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative z-10 overflow-hidden">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Ambient orbs */}
      <div
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          top: "15%", left: "20%",
          background: "radial-gradient(circle, rgba(168,197,160,0.25) 0%, transparent 65%)",
          filter: "blur(80px)",
          animation: "orbFloat1 28s ease-in-out infinite",
        }}
      />

      {/* Left Panel — Editorial (55%) */}
      <div className="hidden lg:flex w-[55%] flex-col justify-center px-16 xl:px-24 relative">
        <div className="max-w-xl space-y-8 slide-up">
          <svg className="w-24 h-24 mb-4" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.15 }}>
            <path
              d="M20 60 C20 40, 35 25, 45 25 L45 35 C38 35, 30 42, 30 50 L45 50 L45 75 L20 75 Z M55 60 C55 40, 70 25, 80 25 L80 35 C73 35, 65 42, 65 50 L80 50 L80 75 L55 75 Z"
              fill="var(--text-heading)"
            />
          </svg>

          <blockquote>
            <p className="font-playfair text-4xl xl:text-5xl font-bold leading-tight" style={{ color: "var(--text-heading)" }}>
              Join the platform
              <br />
              that <span className="gradient-text">empowers</span>
              <br />
              your campus.
            </p>
            <footer className="mt-8 flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CCMS Logo"
                className="w-10 h-10 object-contain rounded-xl"
              />
              <div>
                <p className="font-dm font-semibold text-sm" style={{ color: "var(--text-heading)" }}>Campus Complaint Management</p>
                <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>CCMS Platform</p>
              </div>
            </footer>
          </blockquote>

          <div className="flex gap-3 pt-6">
            {[
              { label: "Smart Classification", color: "var(--accent-peach)" },
              { label: "Real-time Updates", color: "var(--accent-primary)" },
              { label: "Priority SLA", color: "var(--accent-lavender)" },
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

        {/* Abstract shapes */}
        <div className="absolute right-0 bottom-10 w-72 h-72 opacity-20 pointer-events-none">
          <div className="absolute w-40 h-40 rounded-3xl rotate-12 top-0 right-0" style={{ background: "var(--accent-peach)" }} />
          <div className="absolute w-32 h-32 rounded-3xl -rotate-6 top-20 right-24" style={{ background: "var(--accent-lavender)" }} />
          <div className="absolute w-28 h-28 rounded-full bottom-0 right-8" style={{ background: "var(--accent-primary)" }} />
        </div>
      </div>

      {/* Right Panel — Register form (45%) */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="CCMS Logo" className="h-20 w-auto mx-auto mb-4 rounded-2xl object-contain" />
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "var(--text-heading)" }}>CCMS Portal</h1>
          </div>

          <div className="glass-card p-8 lg:p-10 slide-up relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(232,180,184,0.15) 0%, transparent 70%)" }}
            />

            <h2 className="font-playfair text-2xl font-bold mb-2 relative z-10" style={{ color: "var(--text-heading)" }}>
              Create an account
            </h2>
            <p className="font-dm text-sm mb-6 relative z-10" style={{ color: "var(--text-muted)" }}>
              Join the CCMS platform today
            </p>

            {error && (
              <div
                className="mb-4 p-4 rounded-2xl text-sm font-dm relative z-10"
                style={{ background: "rgba(232,112,112,0.1)", border: "1px solid rgba(232,112,112,0.25)", color: "#c96068" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div>
                <label htmlFor="full_name" className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Full Name</label>
                <input id="full_name" type="text" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="John Doe" required />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Email</label>
                <input id="reg-email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@university.edu.in" required />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Role</label>
                <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-field">
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Password</label>
                <div className="relative">
                  <input id="reg-password" type={showPassword ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--text-muted)" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-1.5 text-xs font-dm">
                        {check.valid
                          ? <Check className="w-3 h-3" style={{ color: "var(--accent-primary)" }} />
                          : <X className="w-3 h-3" style={{ color: "var(--text-muted)" }} />}
                        <span style={{ color: check.valid ? "var(--accent-primary)" : "var(--text-muted)" }}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Confirm Password</label>
                <input id="confirm-password" type="password" value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field" required />
                {form.confirmPassword && (
                  <p className="text-xs font-dm mt-1" style={{ color: passwordsMatch ? "var(--accent-primary)" : "#c96068" }}>
                    {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm font-dm relative z-10" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold transition-colors" style={{ color: "var(--accent-primary)" }}>Sign in</Link>
            </p>
          </div>

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
