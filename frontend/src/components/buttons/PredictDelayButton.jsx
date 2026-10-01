import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const PredictDelayButton = ({
  onClick,
  variant = "default",
  predictionStatus = "normal",
  disabled = false,
  loading = false,
}) => {
  const isTable = variant === "table";

  const statusStyles = {
    normal: isTable
      ? "border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
      : "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30",
    delayed: isTable
      ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
      : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30",
    safe: isTable
      ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30",
    disabled:
      "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500",
  };

  const icon = loading ? (
    <Loader2 size={isTable ? 12 : 16} className="animate-spin" />
  ) : predictionStatus === "delayed" ? (
    <AlertCircle size={isTable ? 12 : 16} />
  ) : predictionStatus === "safe" ? (
    <CheckCircle2 size={isTable ? 12 : 16} />
  ) : (
    <AlertCircle size={isTable ? 12 : 16} />
  );

  const label = loading
    ? "Predicting..."
    : predictionStatus === "delayed"
      ? "Delay Prediction"
      : "Predict Delay";

  const classes = isTable
    ? `flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors whitespace-nowrap ${statusStyles[disabled ? "disabled" : predictionStatus]}`
    : `flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${statusStyles[disabled ? "disabled" : predictionStatus]}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {icon}
      {label}
    </button>
  );
};

export default PredictDelayButton;
