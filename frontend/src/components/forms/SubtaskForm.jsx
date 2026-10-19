import React, { useEffect, useRef, useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";

const SubtaskForm = ({
  isDarkMode,
  editingSubtaskId,
  subtaskTitle,
  subtaskAssignee,
  subtaskError,
  subtaskSuccess,
  subtaskSaving,
  assignees = [],
  onTitleChange,
  onAssigneeChange,
  onSubmit,
  onCancel,
}) => {
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Core Data Mappings
  const characterCount = subtaskTitle?.length || 0;
  const selectedMember = assignees.find(
    (m) => (m._id || m.id) === subtaskAssignee
  );
  const selectedMemberName = selectedMember
    ? selectedMember.fullName || selectedMember.name || selectedMember.email || "Team Member"
    : "";

  // Shared Styles
  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "6px",
    color: isDarkMode ? "#cbd5e1" : "#374151",
  };

  const inputStyle = `w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white outline-none shadow-none transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleAssigneeSelect = (memberId) => {
    onAssigneeChange(memberId);
    setIsAssigneeOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-32px)] lg:max-h-none bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-none overflow-hidden relative flex flex-col">
        
        {subtaskSuccess && (
          <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-2 text-center text-xs font-bold z-50">
            ✓ {subtaskSuccess}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="min-w-0">
            <h3 className={`text-base font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {editingSubtaskId ? "Edit Subtask" : "Create Subtask"}
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 leading-4">
              Assign this work item to a member of the main task.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="shrink-0 p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain lg:overflow-visible">
          {/* Subtask Name Input Field */}
          <div>
            <label style={labelStyle}>Subtask Name</label>
            <input type="text" value={subtaskTitle} onChange={(e) => onTitleChange(e.target.value.slice(0, 300))} placeholder="e.g. Implement login API" className={inputStyle} maxLength={300} autoFocus />
            <div className="mt-1.5 flex items-start justify-between gap-3">
              {subtaskError ? (
                <p className="text-xs font-medium text-red-500 leading-4">{subtaskError}</p>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-slate-500">Maximum 300 characters</span>
              )}
              <span className={`ml-auto shrink-0 text-[11px] font-semibold ${characterCount >= 300 ? "text-red-500" : "text-gray-400 dark:text-slate-500"}`}>
                {characterCount}/300
              </span>
            </div>
          </div>

          {/* Assignee Custom Select Menu */}
          <div ref={dropdownRef} className="relative">
            <label style={labelStyle}>Assign To</label>
            <button type="button" onClick={() => setIsAssigneeOpen((prev) => !prev)} className={`${inputStyle} flex items-center justify-between gap-3 text-left cursor-pointer`} aria-haspopup="listbox" aria-expanded={isAssigneeOpen}>
              <span className={selectedMemberName ? "truncate text-gray-800 dark:text-white" : "truncate text-gray-400 dark:text-slate-500"}>
                {selectedMemberName || "Select a member"}
              </span>
              <ChevronDown size={17} className={`shrink-0 text-gray-400 dark:text-slate-500 transition-transform duration-150 ${isAssigneeOpen ? "rotate-180" : ""}`} />
            </button>

            {isAssigneeOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[170] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-none">
                <div className="max-h-48 sm:max-h-56 overflow-y-auto overscroll-contain p-1" role="listbox">
                  <button type="button" onClick={() => handleAssigneeSelect("")} className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition-colors duration-100 ${subtaskAssignee === "" ? "bg-blue-600 text-white" : "text-gray-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white"}`} role="option" aria-selected={subtaskAssignee === ""}>
                    <span>Select a member</span>
                    {subtaskAssignee === "" && <Check size={15} className="shrink-0" />}
                  </button>

                  {assignees.length > 0 ? (
                    assignees.map((member) => {
                      const memberId = member._id || member.id;
                      const memberName = member.fullName || member.name || member.email || "Team Member";
                      const isSelected = memberId === subtaskAssignee;

                      return (
                        <button type="button" key={memberId} onClick={() => handleAssigneeSelect(memberId)} className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition-colors duration-100 mt-0.5 ${isSelected ? "bg-blue-600 text-white" : "text-gray-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white"}`} role="option" aria-selected={isSelected}>
                          <span className="truncate">{memberName}</span>
                          {isSelected && <Check size={15} className="shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-xs text-gray-400 dark:text-slate-500">No members available</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Control Buttons Strip */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={subtaskSaving} className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-none transition-colors">
              {subtaskSaving ? "Saving..." : editingSubtaskId ? "Save Changes" : "Create Subtask"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubtaskForm;