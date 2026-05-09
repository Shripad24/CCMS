import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Loader2, Check, X } from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

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
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="font-outfit text-xl font-semibold text-slate-200 mb-2">Registration Successful!</h2>
          <p className="text-slate-400 mb-6">
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
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Branding Section (Left) */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-12 relative slide-up">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] -z-10"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] -z-10"></div>
          
          <img src="/logo.png" alt="CCMS Logo" className="h-32 w-auto object-contain rounded-2xl bg-dark-800 shadow-2xl shadow-violet-500/10 mb-2" />
          
          <div>
            <h1 className="text-5xl font-outfit font-bold text-white leading-tight">
              Campus Complaint <br/>
              <span className="gradient-text">Management System</span>
            </h1>
            <p className="text-slate-400 text-lg mt-6 max-w-md leading-relaxed">
              Join the platform to track, manage, and resolve campus issues efficiently. Built for the modern university.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
            <div>
              <h3 className="text-2xl font-bold text-slate-100 font-outfit">24/7</h3>
              <p className="text-sm text-slate-400 mt-1">Issue Tracking</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-100 font-outfit">AI Powered</h3>
              <p className="text-sm text-slate-400 mt-1">Smart Routing</p>
            </div>
          </div>
        </div>

        {/* Register Form (Right) */}
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="CCMS Logo" className="h-24 w-auto mx-auto mb-4 rounded-xl object-contain bg-dark-800" />
            <h1 className="text-2xl font-outfit font-bold text-white">CCMS Portal</h1>
          </div>

          <div className="glass-card p-8 slide-up shadow-[0_0_40px_rgba(139,92,246,0.15)] border-t border-white/20 relative overflow-hidden group">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <h2 className="font-outfit text-2xl font-semibold text-slate-100 mb-6 relative z-10">Create an account</h2>

            {error && <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm relative z-10">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input id="full_name" type="text" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="John Doe" required />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input id="reg-email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@university.edu.in" required />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-field">
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input id="reg-password" type={showPassword ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-1.5 text-xs">
                        {check.valid ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-500" />}
                        <span className={check.valid ? "text-emerald-400" : "text-slate-500"}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <input id="confirm-password" type="password" value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field" required />
                {form.confirmPassword && (
                  <p className={`text-xs mt-1 ${passwordsMatch ? "text-emerald-400" : "text-danger"}`}>
                    {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-400 relative z-10">
              Already have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
