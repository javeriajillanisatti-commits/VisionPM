import React, { useEffect, useState } from "react";
import { X, Clock3 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ScheduleTaskModal = ({
  isOpen, mode, task, initialStart, initialEnd, initialNote,
  onClose, onSave, onDelete,
}) => {
  const { isDarkMode } = useTheme();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStartTime(initialStart || "");
    setEndTime(initialEnd || "");
    setNote(initialNote || "");
    setError("");
    setSaving(false);
  }, [isOpen, initialStart, initialEnd, initialNote]);

  if (!isOpen) return null;

  const taskTitle = task?.taskTitle || task?.title || "Task";
  const inputStyle = `w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDarkMode ? "bg-[#0d1428] border-[#263149] text-gray-100" : "bg-white border-gray-200 text-gray-900"}`;
  const labelStyle = "text-[11px] font-bold uppercase block mb-1 text-gray-500";

  // Validate and save schedule
  const handleSave = async () => {
    if (!startTime || !endTime) return setError("Please select both start and end time.");
    if (startTime >= endTime) return setError("Start time must be before end time.");

    setSaving(true);
    setError("");
    try {
      const success = await onSave(startTime, endTime, note);
      if (!success) setError("Could not save. This slot may overlap with another task, or check your connection.");
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError("Could not save the schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const clearError = setter => e => {
    setter(e.target.value);
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-xl w-full max-w-sm p-6 border transition-colors duration-300 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-transparent"}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {mode === "edit" ? "Edit Schedule" : "Schedule Task"}
            </h3>
            {mode === "create" && initialStart && initialEnd && (
              <p className={`flex items-center gap-1 text-[10px] mt-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                <Clock3 size={11} /> Time slot selected from timeline
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"}`}>
            <X size={18} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
          </button>
        </div>

        <p className={`text-sm font-semibold mb-4 rounded-lg px-3 py-2 ${isDarkMode ? "text-gray-300 bg-white/5" : "text-gray-600 bg-gray-50"}`}>
          {taskTitle}
        </p>

        {/* Time fields */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Start Time", startTime, setStartTime],
            ["End Time", endTime, setEndTime],
          ].map(([label, value, setter]) => (
            <div key={label}>
              <label className={labelStyle}>{label}</label>
              <input type="time" value={value} onChange={clearError(setter)} className={inputStyle} />
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-3">
          <label className={labelStyle}>
            Note <span className={`normal-case font-medium ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={clearError(setNote)}
            placeholder="Add a note for this schedule..."
            maxLength={300}
            rows={2}
            className={`${inputStyle} resize-none`}
          />
        </div>

        {error && <p className={`text-xs font-semibold mt-3 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          {mode === "edit" && (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 ${isDarkMode ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTaskModal;