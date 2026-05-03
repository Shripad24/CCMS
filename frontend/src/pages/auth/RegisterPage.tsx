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
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <span className="text-white font-outfit font-bold text-2xl">C</span>
          </div>
          <h1 className="font-outfit text-3xl font-bold gradient-text">CCMS</h1>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>

        <div className="glass-card p-8">
          {error && <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
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
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
