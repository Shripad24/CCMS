import { useState } from "react";
import { adminApi } from "@/api/admin";
import { Download, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0]; });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await adminApi.generateReport(startDate, endDate);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ccms_report_${startDate}_${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-outfit text-2xl font-bold text-slate-100">Generate Report</h1>
      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5"><Calendar className="w-4 h-4 inline mr-1" />Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5"><Calendar className="w-4 h-4 inline mr-1" />End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate PDF Report"}
        </button>
      </div>
    </div>
  );
}
