import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { complaintsApi } from "@/api/complaints";
import { adminApi } from "@/api/admin";
import { useQuery } from "@tanstack/react-query";
import { Upload, Loader2, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: deptData } = useQuery({ 
    queryKey: ["departments"], 
    queryFn: () => adminApi.getDepartments() 
  });
  const departments = deptData?.data || [];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (departmentId && departmentId !== "other") formData.append("department_id", departmentId);
      if (file) formData.append("file", file);
      const res = await complaintsApi.submit(formData);
      setResult(res.data);
      toast.success("Complaint submitted successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.size <= 10 * 1024 * 1024) {
      setFile(droppedFile);
    } else {
      toast.error("File must be under 10MB");
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 fade-in">
        <div className="glass-card p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(168,197,160,0.15)", border: "1px solid rgba(168,197,160,0.30)" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "var(--accent-primary)" }} />
          </div>
          <h2 className="font-playfair text-2xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>Complaint Submitted!</h2>
          <p className="font-dm text-sm mb-2" style={{ color: "var(--text-muted)" }}>Reference Number:</p>
          <p className="text-3xl font-mono font-bold mb-6" style={{ color: "var(--accent-primary)" }}>{result.reference_no}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: "var(--accent-lavender)" }} />
            <h3 className="font-playfair font-bold" style={{ color: "var(--text-heading)" }}>AI Classification Result</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Category", value: result.ai_category || "N/A" },
              { label: "Priority", value: result.ai_priority || "N/A" },
              { label: "Suggested Department", value: result.ai_department || "N/A" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}>
                <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                <p className="text-sm font-dm font-medium" style={{ color: "var(--text-body)" }}>{item.value}</p>
              </div>
            ))}
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}>
              <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(result.ai_confidence || 0) * 100}%`, background: "linear-gradient(90deg, var(--accent-primary), var(--accent-lavender))" }}
                  />
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: "var(--text-body)" }}>{((result.ai_confidence || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          {result.ai_reasoning && (
            <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}>
              <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>AI Reasoning</p>
              <p className="text-sm font-dm" style={{ color: "var(--text-body)" }}>{result.ai_reasoning}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate("/student/complaints")} className="btn-secondary flex-1">View My Complaints</button>
          <button onClick={() => { setResult(null); setStep(1); setTitle(""); setDescription(""); setFile(null); setDepartmentId(""); }} className="btn-primary flex-1">Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-playfair text-2xl font-bold" style={{ color: "var(--text-heading)" }}>Submit New Complaint</h1>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-dm font-semibold"
              style={{
                background: step >= s ? "var(--accent-primary)" : "rgba(255,255,255,0.15)",
                color: step >= s ? "white" : "var(--text-muted)",
                border: `1px solid ${step >= s ? "var(--accent-primary)" : "rgba(255,255,255,0.25)"}`,
              }}
            >
              {s}
            </div>
            <span className="text-sm font-dm" style={{ color: step >= s ? "var(--text-body)" : "var(--text-muted)" }}>
              {s === 1 ? "Details" : "Review"}
            </span>
            {s < 2 && (
              <div className="w-12 h-0.5 rounded-full" style={{ background: step > s ? "var(--accent-primary)" : "rgba(255,255,255,0.20)" }} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Brief summary of your complaint" maxLength={200} />
            <p className="text-xs font-dm mt-1" style={{ color: "var(--text-muted)" }}>{title.length}/200 characters</p>
          </div>
          <div>
            <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Department (Optional)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <select 
                value={departmentId} 
                onChange={(e) => setDepartmentId(e.target.value)} 
                className="input-field pl-10"
              >
                <option value="">Let AI automatically categorize</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
            <p className="text-xs font-dm mt-1" style={{ color: "var(--text-muted)" }}>Select "Other" or leave blank if you're unsure; our AI will route it for you.</p>
          </div>
          <div>
            <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[150px] resize-y"
              placeholder="Describe your complaint in detail. Include location, time, and any relevant information." maxLength={5000} />
            <p className="text-xs font-dm mt-1" style={{ color: "var(--text-muted)" }}>{description.length}/5000 characters</p>
          </div>
          <div>
            <label className="block text-sm font-dm font-medium mb-1.5" style={{ color: "var(--text-body)" }}>Attachment (optional)</label>
            <div
              className="rounded-2xl p-6 text-center transition-all cursor-pointer"
              style={{
                border: `2px dashed ${dragOver ? "var(--accent-primary)" : "rgba(255,255,255,0.30)"}`,
                background: dragOver ? "rgba(168,197,160,0.08)" : "rgba(255,255,255,0.05)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              {file ? (
                <p className="text-sm font-dm" style={{ color: "var(--text-body)" }}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
              ) : (
                <p className="text-sm font-dm" style={{ color: "var(--text-muted)" }}>Drag & drop a file or click to browse (max 10MB)</p>
              )}
              <input id="file-input" type="file" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!title.trim() || !description.trim()}
            className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-50">
            Review <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-playfair font-bold" style={{ color: "var(--text-heading)" }}>Review Your Complaint</h3>
          <div className="space-y-3">
            {[
              { label: "Title", value: title },
              ...(departmentId ? [{
                label: "Target Department",
                value: departmentId === "other" ? "Other (AI will decide)" : departments.find((d: any) => d.id === departmentId)?.name || "Unknown"
              }] : []),
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}>
                <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                <p className="text-sm font-dm" style={{ color: "var(--text-body)" }}>{item.value}</p>
              </div>
            ))}
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}>
              <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Description</p>
              <p className="text-sm font-dm whitespace-pre-wrap" style={{ color: "var(--text-body)" }}>{description}</p>
            </div>
            {file && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}>
                <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Attachment</p>
                <p className="text-sm font-dm" style={{ color: "var(--text-body)" }}>{file.name}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> <Sparkles className="w-4 h-4" style={{ color: "var(--accent-lavender)" }} /> AI is analysing your complaint...</>
              ) : (
                "Submit Complaint"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
