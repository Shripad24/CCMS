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
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-slate-100 mb-2">Complaint Submitted!</h2>
          <p className="text-slate-400 mb-4">Reference Number:</p>
          <p className="text-3xl font-mono font-bold text-primary-400 mb-6">{result.reference_no}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-outfit font-semibold text-slate-200">AI Classification Result</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Category</p>
              <p className="text-sm font-medium text-slate-200">{result.ai_category || "N/A"}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Priority</p>
              <p className="text-sm font-medium text-slate-200">{result.ai_priority || "N/A"}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Suggested Department</p>
              <p className="text-sm font-medium text-slate-200">{result.ai_department || "N/A"}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" style={{ width: `${(result.ai_confidence || 0) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-slate-200">{((result.ai_confidence || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          {result.ai_reasoning && (
            <div className="mt-4 bg-dark-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">AI Reasoning</p>
              <p className="text-sm text-slate-300">{result.ai_reasoning}</p>
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
      <h1 className="font-outfit text-2xl font-bold text-slate-100">Submit New Complaint</h1>

      <div className="flex items-center gap-3 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? "bg-primary-500 text-white" : "bg-dark-700 text-slate-500"}`}>{s}</div>
            <span className={`text-sm ${step >= s ? "text-slate-200" : "text-slate-500"}`}>{s === 1 ? "Details" : "Review"}</span>
            {s < 2 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary-500" : "bg-dark-700"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Brief summary of your complaint" maxLength={200} />
            <p className="text-xs text-slate-500 mt-1">{title.length}/200 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Department (Optional)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
            <p className="text-xs text-slate-500 mt-1">Select "Other" or leave blank if you're unsure; our AI will route it for you.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[150px] resize-y"
              placeholder="Describe your complaint in detail. Include location, time, and any relevant information." maxLength={5000} />
            <p className="text-xs text-slate-500 mt-1">{description.length}/5000 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Attachment (optional)</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragOver ? "border-primary-400 bg-primary-500/5" : "border-slate-600 hover:border-slate-500"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {file ? (
                <p className="text-sm text-slate-300">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
              ) : (
                <p className="text-sm text-slate-400">Drag & drop a file or click to browse (max 10MB)</p>
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
          <h3 className="font-outfit font-semibold text-slate-200">Review Your Complaint</h3>
          <div className="space-y-3">
            <div className="bg-dark-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Title</p>
              <p className="text-slate-200">{title}</p>
            </div>
            {departmentId && (
              <div className="bg-dark-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Target Department</p>
                <p className="text-slate-200">
                  {departmentId === "other" ? "Other (AI will decide)" : departments.find((d: any) => d.id === departmentId)?.name || "Unknown"}
                </p>
              </div>
            )}
            <div className="bg-dark-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Description</p>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{description}</p>
            </div>
            {file && (
              <div className="bg-dark-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Attachment</p>
                <p className="text-slate-300 text-sm">{file.name}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> <Sparkles className="w-4 h-4 text-purple-300" /> AI is analysing your complaint...</>
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
