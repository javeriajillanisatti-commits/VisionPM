import React from "react";
import {
  X,
  FileText,
  ExternalLink,
  UserRound,
  Mail,
  Award,
  CheckCircle2,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getCVUrl = (cvFileUrl, cvFile) => {
  if (cvFileUrl)
    return cvFileUrl.startsWith("http")
      ? cvFileUrl
      : `${API_BASE}${cvFileUrl}`;

  if (cvFile) {
    const fileName = cvFile.replace(/\\/g, "/").split("/").pop();
    return `${API_BASE}/uploads/${fileName}`;
  }

  return null;
};

const CVDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  const cvUrl = getCVUrl(data.cvFileUrl, data.cvFile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 dark:text-white">
                CV Details
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                Project Admin CV Details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-500 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 p-4 mb-5 space-y-4">
          <div className="flex items-center gap-3">
            <UserRound size={18} className="text-gray-400" />
            <div>
              <p className="text-[10px] font-bold  tracking-wider text-gray-400">
                Full Name
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                {data.fullName || "No Name Set"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-[10px] font-bold  tracking-wider text-gray-400">
                Email Address
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                {data.email || "No Email Set"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-700 dark:text-slate-300">
              CV Score
            </h3>
          </div>
          <div className="text-4xl font-black text-blue-600 dark:text-blue-400">
            {data.cvScore || 0}%
          </div>
        </div>

        <div className="bg-green-50 dark:bg-emerald-950/30 border border-green-100 dark:border-emerald-900/40 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2
              size={18}
              className="text-green-600 dark:text-emerald-400"
            />
            <h3 className="font-bold text-gray-700 dark:text-slate-300">
              Recommendation
            </h3>
          </div>
          <p className="font-bold text-green-600 dark:text-emerald-400">
            {data.recommendation || "Pending"}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/70 rounded-2xl p-4 mb-5">
          <h3 className="font-bold text-gray-700 dark:text-slate-300 mb-3">
            Score Breakdown
          </h3>

          <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
            {data.scoreBreakdown &&
              Object.entries(data.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="capitalize">{key}</span>
                  <span className="font-bold text-gray-800 dark:text-white">
                    {value}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
          {cvUrl ? (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition active:scale-[0.98]"
            >
              <FileText size={18} />
              Open CV PDF
              <ExternalLink size={16} />
            </a>
          ) : (
            <div className="w-full text-center px-5 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold text-sm">
              CV file is not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVDetailsModal;