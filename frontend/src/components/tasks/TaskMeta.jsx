import React, { useState, useEffect, useRef } from "react";
import SaveButton from "../../components/buttons/SaveButton";
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const formatDateToYYYYMMDD = (y, m, d) => {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

const CustomSelect = ({ label, value, onChange, options, disabled, getStyle, clearError, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={selectRef} className="space-y-1.5 min-w-0 w-full relative">
      <label className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 block ml-0.5 truncate">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-w-0 border rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold outline-none flex items-center justify-between shadow-sm transition-all truncate text-left ${
          getStyle ? getStyle(value) : "bg-gray-50/50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-blue-600"
        } ${disabled ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ml-1 text-gray-400 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden p-1 space-y-0.5">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  if (clearError) clearError();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors truncate flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold"
                    : "text-gray-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white"
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1 text-[10px] font-semibold text-red-500">{error}</p>}
    </div>
  );
};
const CustomLucideCalendar = ({ value, onChange, onClose, projectEndDate, onError }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let maxDate = null;
  if (projectEndDate && /^\d{4}-\d{2}-\d{2}$/.test(projectEndDate.substring(0, 10))) {
    const [pY, pM, pD] = projectEndDate.substring(0, 10).split("-").map(Number);
    maxDate = new Date(pY, pM - 1, pD, 23, 59, 59, 999);
  }

  const handleSelectDate = (day) => {
    const selectedDateStr = formatDateToYYYYMMDD(year, month, day);
    const selectedCellDate = new Date(year, month, day);

    if (maxDate && selectedCellDate > maxDate) {
      if (onError) onError(`Deadline cannot exceed project end date (${projectEndDate.substring(0, 10)}).`);
      return;
    }

    onChange(selectedDateStr);
    onClose();
  };

  const handleSelectToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (maxDate && now > maxDate) {
      if (onError) onError(`Today's date exceeds project end date (${projectEndDate.substring(0, 10)}).`);
      return;
    }

    const todayStr = formatDateToYYYYMMDD(now.getFullYear(), now.getMonth(), now.getDate());
    onChange(todayStr);
    onClose();
  };

  const calendarDays = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, isCurrentMonth: true });
  }

  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

  return (
    <div
      ref={calendarRef}
      className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl p-2.5 sm:p-3 w-full max-w-[260px] min-w-[220px] text-gray-800 dark:text-slate-200"
    >
      <div className="flex items-center justify-between mb-2 px-0.5">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-blue-600 hover:text-white rounded-md text-gray-500 dark:text-slate-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-gray-900 dark:text-white truncate px-1">
          {monthNames[month]} {year}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-blue-600 hover:text-white rounded-md text-gray-500 dark:text-slate-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {daysOfWeek.map((day, idx) => (
          <span key={idx} className="text-[10px] sm:text-[11px] font-semibold text-gray-400 dark:text-slate-500">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {calendarDays.map((item, index) => {
          if (!item.isCurrentMonth) {
            return (
              <span key={index} className="text-xs text-gray-300 dark:text-slate-600 py-1">
                {item.day}
              </span>
            );
          }

          const currentCellDate = new Date(year, month, item.day);
          const isPast = currentCellDate < today;
          const isAfterMax = maxDate && currentCellDate > maxDate;
          const isDisabled = isPast || isAfterMax;

          let isSelected = false;
          if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [vY, vM, vD] = value.split("-").map(Number);
            isSelected = vY === year && vM - 1 === month && vD === item.day;
          }

          return (
            <button
              key={index}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelectDate(item.day)}
              className={`text-xs py-1 rounded-md transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white font-bold"
                  : isDisabled
                  ? "text-gray-300 dark:text-slate-600 cursor-not-allowed opacity-40 bg-gray-50/50 dark:bg-slate-800/20"
                  : "hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-gray-700 dark:text-slate-200"
              }`}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-700/60 text-[11px]">

        <button
          type="button"
          onClick={handleSelectToday}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  );
};

const TaskMetaCard = ({ task, setTask,  currentUserRole,  workspaceMembers,  isOpen,  setIsOpen,  handleMemberToggle,  onSave,
  validationErrors = {},
  clearFieldError = () => {},
  saveSuccess = "",
  saving = false,
  projectEndDate = ""
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const SIZE_POINTS = { XS: 5, S: 10, M: 20, L: 40, XL: 80 };

  const resizeAllocations = (nextSize, previousAllocations, assignees, mode) => {
    const total = SIZE_POINTS[nextSize] || 0;
    if (assignees.length === 1) {
      return [{ member: assignees[0]?._id || assignees[0], workload: total }];
    }
    if (!assignees.length) return [];

    if (mode === "equal") {
      const each = total / assignees.length;
      return assignees.map((member) => ({
        member: member?._id || member,
        workload: Number(each.toFixed(4)),
      }));
    }

    const map = new Map(
      (previousAllocations || []).map((item) => [
        String(item.member?._id || item.member),
        Number(item.workload) || 0,
      ])
    );
    const kept = assignees.map((member) => ({
      member: member?._id || member,
      workload: map.get(String(member?._id || member)) || 0,
    }));
    const oldTotal = kept.reduce((sum, item) => sum + item.workload, 0);
    if (!oldTotal) return kept;

    return kept.map((item) => ({
      member: item.member,
      workload: Number(((item.workload / oldTotal) * total).toFixed(4)),
    }));
  };

  const getStatusStyle = (statusStr) => {
    const s = statusStr?.toString().toLowerCase() || "todo";
    if (s.includes("complete")) return "border-emerald-200 text-emerald-600 bg-emerald-50/20 font-bold shadow-sm";
    if (s.includes("progress")) return "border-blue-200 text-blue-600 bg-blue-50/20 font-bold shadow-sm";
    return "border-gray-200 text-gray-600 bg-white";
  };

  const getPriorityStyle = (priorityStr) => {
    const p = priorityStr?.toString().toLowerCase() || "medium";
    if (p.includes("high")) return "border-rose-200 text-rose-600 bg-rose-50/20 font-bold shadow-sm";
    if (p.includes("medium")) return "border-amber-200 text-amber-600 bg-amber-50/20 font-bold shadow-sm";
    return "border-gray-200 text-gray-600 bg-white";
  };

  const calculateDeadlineContext = (dateStr) => {
    if (!dateStr) return null;
    const deadlineDate = new Date(dateStr);
    if (isNaN(deadlineDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Overdue ", className: "text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] border border-rose-100 animate-pulse shadow-sm" };
    }
    if (diffDays === 0) {
      return { text: "Due Today ", className: "text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] border border-amber-100 shadow-sm" };
    }
    if (diffDays === 1) {
      return { text: "1 Day Left", className: "text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] border border-blue-100/50 shadow-sm" };
    }
    return { text: `${diffDays} Days Left`, className: "text-gray-500 font-bold bg-gray-50 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] border border-gray-200/50 shadow-sm" };
  };

  const deadlineBadge = calculateDeadlineContext(task.deadline);
  const displayError = validationErrors.deadline || calendarError;

  const statusOptions = [
    { value: "Todo", label: "To Do" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
  ];

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const sizeOptions = [
    { value: "XS", label: "XS — 5 points · 1-2 Hours" },
    { value: "S", label: "S — 10 points · Half Day" },
    { value: "M", label: "M — 20 points · 1 Day" },
    { value: "L", label: "L — 40 points · 2-3 Days" },
    { value: "XL", label: "XL — 80 points · 1 Week" },
  ];

  return (
    <div className="w-full min-w-[270px] bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5 transition-colors duration-200">
      
      {/* Description Field */}
      <div className="space-y-1.5">
        <label className="text-xs sm:text-[14px] font-bold text-gray-600 dark:text-slate-400 block ml-0.5">Description</label>
        <textarea 
          rows="4" 
          className="w-full text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-gray-50/30 dark:bg-slate-800/40 resize-none transition-all disabled:opacity-90 text-xs sm:text-[13px] font-medium leading-relaxed"
          value={task.description} 
          onChange={(e) => { setTask({...task, description: e.target.value}); clearFieldError("description"); }} 
          disabled={currentUserRole === "teammember"}
          placeholder="No description provided"
        />
        {validationErrors.description && <p className="mt-1.5 text-xs font-semibold text-red-500">{validationErrors.description}</p>}
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-sm items-start sm:items-end w-full min-w-0">
        
        {/* Status */}
        <CustomSelect
          label="Status"
          value={task.status}
          options={statusOptions}
          onChange={(val) => setTask({ ...task, status: val })}
          getStyle={getStatusStyle}
          clearError={() => clearFieldError("status")}
          error={validationErrors.status}
        />
        
        {/* Priority */}
        <CustomSelect
          label="Priority"
          value={task.priority}
          options={priorityOptions}
          disabled={currentUserRole === "teammember"}
          onChange={(val) => setTask({ ...task, priority: val })}
          getStyle={getPriorityStyle}
          clearError={() => clearFieldError("priority")}
          error={validationErrors.priority}
        />

        {/* Task Size */}
        <CustomSelect
          label="Task Size"
          value={task.size}
          options={sizeOptions}
          disabled={currentUserRole === "teammember"}
          onChange={(nextSize) => {
            setTask({
              ...task,
              size: nextSize,
              assigneeWorkloads: resizeAllocations(
                nextSize,
                task.assigneeWorkloads,
                task.assignees || [],
                task.allocationMode || "manual"
              ),
            });
            clearFieldError("size");
            clearFieldError("assigneeWorkloads");
          }}
          clearError={() => clearFieldError("size")}
          error={validationErrors.size}
        />

        {/* Custom Calendar Picker Popover for Due Date */}
        <div className="space-y-1.5 relative min-w-0 w-full">
          <div className="flex items-center justify-between gap-1 ml-0.5 min-w-0">
            <label className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 truncate">Due Date</label>
            {deadlineBadge && (
              <span className={`${deadlineBadge.className} shrink-0 truncate max-w-[80px] sm:max-w-none`}>{deadlineBadge.text}</span>
            )}
          </div>

          <button
            type="button"
            disabled={currentUserRole === "teammember"}
            onClick={() => setShowCalendar((prev) => !prev)}
            className={`w-full h-[38px] sm:h-[42px] border ${
              displayError
                ? "border-red-400 focus:ring-red-400"
                : deadlineBadge?.text.includes("Overdue")
                ? "border-rose-300 ring-2 ring-rose-50/20"
                : "border-gray-200 dark:border-slate-700"
            } rounded-lg sm:rounded-xl px-2 sm:px-3 text-xs sm:text-sm font-semibold flex items-center justify-between bg-gray-50/50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 shadow-sm cursor-pointer hover:border-blue-600 disabled:opacity-90 disabled:cursor-not-allowed transition-colors`}
          >
            <span className="truncate">{task.deadline || "Select date"}</span>
            <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
          </button>

          {showCalendar && (
            <CustomLucideCalendar
              value={task.deadline}
              projectEndDate={projectEndDate}
              onChange={(dateStr) => {
                setTask({ ...task, deadline: dateStr });
                setCalendarError("");
                clearFieldError("deadline");
              }}
              onError={(msg) => {
                setCalendarError(msg);
              }}
              onClose={() => setShowCalendar(false)}
            />
          )}

          {displayError && <p className="mt-1 text-[10px] font-semibold text-red-500">{displayError}</p>}
        </div>
      </div>

      {/* Team Member Assignee Field */}
      <div className="w-full pt-1">
        <div className="space-y-1.5 relative w-full">
          <label className="text-xs font-bold text-gray-500 dark:text-slate-400 block ml-0.5">Assign To</label>
          <div 
            onClick={() => currentUserRole !== "teammember" && setIsOpen(!isOpen)}
            className={`w-full min-h-[44px] border border-gray-200 dark:border-slate-700 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-50/50 dark:bg-slate-800 outline-none cursor-pointer hover:border-blue-600 flex flex-wrap gap-1.5 items-center justify-start shadow-sm transition-colors ${currentUserRole === "teammember" ? "opacity-90 pointer-events-none" : ""}`}
          >
            {task.assignees?.length === 0 ? (
              <span className="text-gray-400 dark:text-slate-500 font-medium">Select Members...</span>
            ) : (
              task.assignees.map((member, idx) => (
                <span 
                  key={member._id || idx} 
                  className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-blue-600 flex items-center shrink-0 max-w-full truncate"
                >
                  <span className="truncate">{member.fullName || member.name || "Team Member"}</span>
                </span>
              ))
            )}
          </div>
          
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {workspaceMembers.length === 0 ? (
                <div className="text-gray-400 dark:text-slate-500 p-3 text-xs text-center font-medium">No members found</div>
              ) : (
                workspaceMembers.map((member) => {
                  const isChecked = task.assignees.some((m) => (m._id || m) === member._id);
                  return (
                    <label 
                      key={member._id} 
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-lg cursor-pointer transition-colors select-none text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-200 group"
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { handleMemberToggle(member); clearFieldError("assignees"); }}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer dark:bg-slate-800"
                      />
                      <span className="group-hover:text-white truncate">
                        {member.fullName || member.name}
                      </span>
                    </label>
                  );
                })
              )}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold px-3 py-1 hover:bg-blue-600 hover:text-white rounded-md uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {task.assignees?.length === 1 && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Calculated Workload</span>
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
              {SIZE_POINTS[task.size] || 0} points
            </span>
          </div>
        </div>
      )}

      {task.assignees?.length > 1 && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20 p-2.5 sm:p-3 space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-slate-200">Workload Allocation</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
              Task workload: {SIZE_POINTS[task.size] || 0} points
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ["equal", "Equal Split"],
              ["manual", "Manual Points"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTask({
                  ...task,
                  allocationMode: mode,
                  assigneeWorkloads: resizeAllocations(
                    task.size,
                    task.assigneeWorkloads,
                    task.assignees,
                    mode
                  ),
                })}
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                  (task.allocationMode || "manual") === mode
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {task.assignees.map((member) => {
              const id = member._id || member;
              const allocation = (task.assigneeWorkloads || []).find(
                (item) => String(item.member?._id || item.member) === String(id)
              )?.workload ?? 0;

              return (
                <div key={id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex-1 min-w-0 truncate">
                    {member.fullName || member.name || "Team Member"}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={allocation}
                      disabled={(task.allocationMode || "manual") === "equal"}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setTask({
                          ...task,
                          assigneeWorkloads: (task.assigneeWorkloads || []).map((item) =>
                            String(item.member?._id || item.member) === String(id)
                              ? { ...item, workload: Number.isFinite(value) ? value : 0 }
                              : item
                          ),
                        });
                        clearFieldError("assigneeWorkloads");
                      }}
                      className="w-full sm:w-24 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-white outline-none focus:border-blue-600 disabled:opacity-70"
                    />
                    <span className="text-[10px] text-gray-500 dark:text-slate-400">points</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-t border-blue-100 dark:border-blue-900/40 pt-2">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 truncate">
              Allocated: {(task.assigneeWorkloads || [])
                .reduce((sum, item) => sum + (Number(item.workload) || 0), 0)
                .toFixed(2).replace(/\.00$/, "")} / {SIZE_POINTS[task.size] || 0} points
            </span>
            {(task.allocationMode || "manual") === "manual" && (
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Total must match exactly.</span>
            )}
          </div>

          {validationErrors.assigneeWorkloads && (
            <p className="text-red-500 text-[10px] font-semibold">{validationErrors.assigneeWorkloads}</p>
          )}
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
          ✓ {saveSuccess}
        </div>
      )}

      {validationErrors.form && <p className="text-xs font-semibold text-red-500">{validationErrors.form}</p>}

      {currentUserRole !== "teammember" && (
        <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 w-full min-w-0">
          <div className="w-full sm:w-40 sm:ml-auto shrink-0">
            <SaveButton
              text={saving ? "Saving..." : "Save Changes"}
              onClick={async () => { await onSave?.(); }}
              disabled={saving}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default TaskMetaCard;