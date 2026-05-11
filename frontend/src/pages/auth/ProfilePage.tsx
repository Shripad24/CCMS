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
      <h1 className="font-playfair text-3xl font-bold" style={{ color: "var(--text-heading)" }}>My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="glass-card p-6 md:col-span-1 flex flex-col items-center text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))" }}
          >
            <span className="text-4xl font-bold text-white">{user?.full_name?.charAt(0) || "U"}</span>
          </div>
          <h2 className="text-xl font-playfair font-bold" style={{ color: "var(--text-heading)" }}>{user?.full_name}</h2>
          <p className="text-sm font-dm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          
          <div
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full"
            style={{ background: "rgba(168,197,160,0.15)", border: "1px solid rgba(168,197,160,0.30)" }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "#5f7d58" }}>{user?.role}</span>
          </div>
        </div>

        {/* Edit Form Card */}
        <div className="glass-card p-6 md:col-span-2">
          <h3
            className="text-lg font-playfair font-bold mb-6 flex items-center gap-2 pb-4"
            style={{ color: "var(--text-heading)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
          >
            <User className="w-5 h-5" style={{ color: "var(--accent-lavender)" }} /> Edit Profile Details
          </h3>
          
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field pl-10" 
                  />
                </div>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input 
                    type="email" 
                    value={user?.email || ""}
                    disabled
                    className="input-field pl-10 opacity-60 cursor-not-allowed" 
                  />
                </div>
                <p className="text-xs font-dm mt-1" style={{ color: "var(--text-muted)" }}>Contact your administrator to change your email.</p>
              </div>
            </div>

            <div className="pt-4 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
              <h4 className="text-sm font-dm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-body)" }}>
                <Lock className="w-4 h-4" style={{ color: "var(--accent-rose)" }} /> Change Password
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
