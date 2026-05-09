import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
              A modern, intelligent platform to track, manage, and resolve campus issues efficiently. Built for the future.
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

        {/* Login Form (Right) */}
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="CCMS Logo" className="h-24 w-auto mx-auto mb-4 rounded-xl object-contain bg-dark-800" />
            <h1 className="text-2xl font-outfit font-bold text-white">CCMS Portal</h1>
          </div>

          <div className="glass-card p-8 slide-up shadow-[0_0_40px_rgba(139,92,246,0.15)] border-t border-white/20 relative overflow-hidden group">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <h2 className="font-outfit text-2xl font-semibold text-slate-100 mb-6 relative z-10">Sign in to your account</h2>

            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm relative z-10">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">University Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field" placeholder="you@university.edu.in" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? "Authenticating..." : "Sign in securely"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400 relative z-10">
              Don't have an account?{" "}
              <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Register now</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
