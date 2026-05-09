import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { User, Lock, Mail, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && !currentPassword) {
      toast.error("Please enter your current password to change it");
      return;
    }
    
    setIsUpdating(true);
    try {
      const data: any = {};
      if (fullName !== user?.full_name) data.full_name = fullName;
      if (currentPassword && newPassword) {
        data.current_password = currentPassword;
        data.new_password = newPassword;
      }
      
      if (Object.keys(data).length === 0) {
        toast.info("No changes to save");
        setIsUpdating(false);
        return;
      }

      const res = await authApi.updateProfile(data);
      updateUser(res.data);
      toast.success("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-outfit text-slate-100">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="glass-card p-6 md:col-span-1 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <span className="text-4xl font-bold text-white">{user?.full_name?.charAt(0) || "U"}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{user?.full_name}</h2>
          <p className="text-slate-400 text-sm mt-1 mb-4">{user?.email}</p>
          
          <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-dark-800/50 border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>

        {/* Edit Form Card */}
        <div className="glass-card p-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
            <User className="w-5 h-5 text-violet-400" /> Edit Profile Details
          </h3>
          
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field pl-10" 
                  />
                </div>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={user?.email || ""}
                    disabled
                    className="input-field pl-10 opacity-60 cursor-not-allowed bg-dark-800/80" 
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Contact your administrator to change your email.</p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-white/5">
              <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-fuchsia-400" /> Change Password
              </h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <input 
                    type="password" 
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field" 
                  />
                </div>
                <div>
                  <input 
                    type="password" 
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={isUpdating}
                className="btn-primary flex items-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
