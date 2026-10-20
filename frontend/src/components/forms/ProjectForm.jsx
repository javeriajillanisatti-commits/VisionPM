import React, { useState, useEffect, useRef } from "react"; 
import SaveButton from "../buttons/SaveButton";
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react"; 
const CustomLucideCalendar = ({ value, onChange, onClose, alignRight = false }) => {
  const [currentDate, setCurrentDate] = useState(() => (value ? new Date(value) : new Date()));
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

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleSelectDate = (day) => {
    const selected = new Date(year, month, day);
    const yearStr = selected.getFullYear();
    const monthStr = String(selected.getMonth() + 1).padStart(2, "0");
    const dayStr = String(selected.getDate()).padStart(2, "0");
    onChange(`${yearStr}-${monthStr}-${dayStr}`);
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
      className={`absolute z-[120] bottom-full mb-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 w-64 text-gray-800 dark:text-slate-200 ${
        alignRight ? "right-0" : "left-0"
      }`}
    >
      {/* Calendar Header with Top Right Cross Icon */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-500 dark:text-slate-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {monthNames[month]} {year}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-500 dark:text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Lucide X Cross Icon to Close Calendar */}
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

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {daysOfWeek.map((day, idx) => (
          <span key={idx} className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((item, index) => {
          if (!item.isCurrentMonth) {
            return (
              <span key={index} className="text-xs text-gray-300 dark:text-slate-600 py-1">
                {item.day}
              </span>
            );
          }

          const selectedDateObj = value ? new Date(value) : null;
          const isSelected =
            selectedDateObj &&
            selectedDateObj.getFullYear() === year &&
            selectedDateObj.getMonth() === month &&
            selectedDateObj.getDate() === item.day;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectDate(item.day)}
              className={`text-xs py-1 rounded-md transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white font-bold"
                  : "hover:bg-blue-600 hover:text-white text-gray-700 dark:text-slate-200"
              }`}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      {/* Footer Options */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 dark:border-slate-700/60 text-[11px]">
       
        <button
          type="button"
          onClick={() => {
            const todayStr = new Date().toISOString().split("T")[0];
            onChange(todayStr);
            onClose();
          }}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  );
};

const DatePicker = ({ label, value, onChange, error, alignRight = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-0 w-full relative">
      <label className="block text-xs font-bold text-gray-700 dark:text-slate-400 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full min-w-0 h-[42px] border rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-0 focus:shadow-none focus:border-blue-500 flex items-center justify-between gap-2 text-left cursor-pointer ${
          error ? "border-red-400" : "border-gray-300 dark:border-slate-700"
        }`}
      >
        <span className={`truncate ${value ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}>
          {value || "Select date"}
        </span>
        <CalendarIcon size={16} className="text-gray-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
      </button>

      {/* Calendar alignment controlled via alignRight prop */}
      {open && (
        <CustomLucideCalendar
          value={value}
          alignRight={alignRight}
          onChange={(val) => onChange(val)}
          onClose={() => setOpen(false)}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const ProjectForm = ({ 
  onClose, 
  onSubmit, 
  initialData, 
  isEdit, 
}) => { 
  const [formData, setFormData] = useState({ 
    projectName: "", 
    description: "", 
    status: "Planning", 
    startDate: "", 
    endDate: "", 
  }); 
 
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideStatusClick = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideStatusClick);
    return () => document.removeEventListener("mousedown", handleOutsideStatusClick);
  }, []);
 
  const formatDateForInput = (dateStr) => { 
    if (!dateStr) return ""; 
 
    const date = new Date(dateStr); 
 
    return isNaN(date.getTime()) 
      ? "" 
      : date.toISOString().split("T")[0]; 
  }; 
 
  useEffect(() => { 
    if (initialData) { 
      setFormData({ 
        projectName: 
          initialData.projectName || 
          initialData.title || 
          "", 
        description: initialData.description || "", 
        status: initialData.status || "Planning", 
        startDate: formatDateForInput(initialData.startDate), 
        endDate: formatDateForInput(initialData.endDate), 
      }); 
    } 
  }, [initialData]); 
 
  const handleInputChange = (field, value) => {
    setSuccessMessage(""); 
    setFormData((prev) => ({ 
      ...prev, 
      [field]: value, 
    })); 
 
    setErrors((prev) => ({ 
      ...prev, 
      [field]: "", 
    })); 
  }; 
 
  const cleanInput = (value) =>
    typeof value === "string"
      ? value
          .normalize("NFKC")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .split("")
          .filter((ch) => {
            const code = ch.charCodeAt(0);
            return !((code >= 0 && code <= 8) || code === 11 || code === 12 ||
              (code >= 14 && code <= 31) || code === 127);
          })
          .join("")
      : "";

  const hasHtmlOrScript = (value) =>
    /<[^>]*>|<script|<\/script|javascript:/i.test(value);

  const hasSuspiciousInjection = (value) =>
    /\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$exists|\$or|\$and|\$expr|\$function/i.test(value) ||
    /^or$/i.test(value.trim()) ||
    /javascript:/i.test(value);

  const hasSuspiciousObjectPattern = (value) => {
    const trimmed = value.trim();
    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
  };

  const isOnlyRepeatedCharacter = (value) => {
    const compact = value.replace(/\s/g, "");
    if (!compact || compact.length < 4) return false;
    return /^(.)(?:\1)+$/u.test(compact);
  };

  const isOnlyNumbers = (value) => /^\d+$/.test(value.trim());
  const isOnlySymbols = (value) => /^[^\p{L}\p{N}]+$/u.test(value.trim());
  const hasConsecutiveSpaces = (value) => /\s{2,}/.test(value);
  const hasConsecutiveSpecialChars = (value) => /[-',]{2,}/.test(value);
  const startsOrEndsWithSpecialChar = (value) => /^[-',]|[-',]$/u.test(value.trim());
  const hasInvalidStandaloneSpecial = (value) => /^[-,']+$/.test(value.trim());

  const hasDuplicateWord = (value) => {
    const words = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) return true;
    }
    return false;
  };

  const hasRepeatingPattern = (value) => {
    const compact = value.replace(/\s/g, "").toLowerCase();
    if (compact.length < 6) return false;
    for (let size = 1; size <= Math.floor(compact.length / 2); size++) {
      if (compact.length % size !== 0) continue;
      const pattern = compact.slice(0, size);
      if (pattern.repeat(compact.length / size) === compact && pattern.length < compact.length) {
        return true;
      }
    }
    return false;
  };

  const hasMinimumWords = (value, minimum) =>
    value.trim().split(/\s+/).filter(Boolean).length < minimum;

  const hasGarbagePattern = (value) => {
    const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
    const garbagePatterns = [
      "asdf", "asdfgh", "qwer", "qwerty", "qwertyui", "zxcv", "zxcvbn",
      "poiuy", "lkjhg", "mnbvc", "hjkl", "testtest", "abcabc", "xyzxyz",
      "123123", "000000", "111111", "222222", "333333", "444444", "555555",
      "666666", "777777", "888888", "999999",
    ];
    return garbagePatterns.some((pattern) => normalized.includes(pattern));
  };

  const hasMostlySameCharacter = (value) => {
    const compact = value.replace(/\s/g, "").toLowerCase();
    if (compact.length < 5) return false;
    const counts = {};
    for (const char of compact) counts[char] = (counts[char] || 0) + 1;
    return Math.max(...Object.values(counts)) / compact.length >= 0.8;
  };

  const validateMeaningfulText = (value, fieldName, minimumLength) => {
    const text = cleanInput(value).trim();
    if (!text) return `${fieldName} is required.`;
    if (text.length < minimumLength) return `${fieldName} must be at least ${minimumLength} characters.`;
    if (isOnlyNumbers(text)) return "Only numbers are not allowed.";
    if (isOnlySymbols(text)) return "Only symbols are not allowed.";
    if (isOnlyRepeatedCharacter(text)) return "Repeated single characters are not allowed.";
    if (hasGarbagePattern(text)) return `Please enter meaningful ${fieldName.toLowerCase()}.`;
    if (hasRepeatingPattern(text)) return "Repeating patterns are not allowed.";
    if (hasConsecutiveSpaces(text)) return "Multiple consecutive spaces are not allowed.";
    if (hasConsecutiveSpecialChars(text)) return "Consecutive special characters are not allowed.";
    if (startsOrEndsWithSpecialChar(text)) return "Text cannot start or end with -, , or '.";
    if (hasInvalidStandaloneSpecial(text)) return "Invalid special character input.";
    if (hasDuplicateWord(text)) return "Duplicate words are not allowed.";
    if (hasMostlySameCharacter(text)) return "Text contains too many repeated characters.";
    if (hasHtmlOrScript(text)) return "HTML or script input is not allowed.";
    if (hasSuspiciousInjection(text)) return "Invalid or suspicious input detected.";
    if (hasSuspiciousObjectPattern(text)) return "Object-style input is not allowed.";
    return "";
  };

  const validateProjectName = (value) => {
    const text = cleanInput(value).trim();
    if (!text) return "Project name is required.";
    if (text.length < 3) return "Project name must be at least 3 characters.";
    if (text.length > 300) return "Project name cannot exceed 300 characters.";
    if (/\d/.test(text)) return "Project name cannot contain numbers.";
    return validateMeaningfulText(text, "Project name", 3);
  };

  const validateDescription = (value) => {
    const text = cleanInput(value).trim();
    if (!text) return "Description is required.";
    if (text.length < 8) return "Description must be at least 8 characters.";
    if (text.length > 1000) return "Description cannot exceed 1000 characters.";
    if (hasMinimumWords(text, 2)) return "Description must contain at least 2 words.";
    return validateMeaningfulText(text, "Description", 8);
  };

  const validateForm = () => {
    const newErrors = {};
    const projectName = cleanInput(formData.projectName).trim();
    const description = cleanInput(formData.description).trim();

    const nameError = validateProjectName(projectName);
    if (nameError) newErrors.projectName = nameError;

    const descriptionError = validateDescription(description);
    if (descriptionError) newErrors.description = descriptionError;

    const editing = Boolean(initialData || isEdit);
    const allowedStatuses = editing
      ? ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]
      : ["Planning"];

    if (!allowedStatuses.includes(formData.status)) {
      newErrors.status = editing
        ? "Please select a valid project status."
        : "New projects can only use Planning status.";
    }

    const isValidDateInput = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    };

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required.";
    } else if (!isValidDateInput(formData.startDate)) {
      newErrors.startDate = "Start date is invalid. Please select a valid date.";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required.";
    } else if (!isValidDateInput(formData.endDate)) {
      newErrors.endDate = "End date is invalid. Please select a valid date.";
    }

    if (isValidDateInput(formData.startDate) && isValidDateInput(formData.endDate)) {
      const start = new Date(`${formData.startDate}T00:00:00Z`);
      const end = new Date(`${formData.endDate}T00:00:00Z`);
      if (end < start) {
        newErrors.endDate = "End date cannot be before start date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) return;

    if (typeof onSubmit === "function") {
      try {
        const result = await onSubmit({
          ...formData,
          projectName: formData.projectName.trim(),
          description: formData.description.trim(),
          _id: initialData?._id || initialData?.id,
          workspace:
            initialData?.workspace?._id ||
            initialData?.workspace,
        });

        if (result === false) return;

        const editing = Boolean(initialData || isEdit);
        setSuccessMessage(editing ? "Project updated successfully!" : "Project created successfully!");
        setTimeout(() => {
          onClose();
        }, 1000);
      } catch (error) {
        const responseData = error?.response?.data || error?.data || {};
        const field = responseData.field;
        const message = responseData.message || error?.message || "Unable to save project.";

        if (field && ["projectName", "description", "status", "startDate", "endDate"].includes(field)) {
          setErrors((prev) => ({ ...prev, [field]: message }));
        } else if (/project name already exists/i.test(message)) {
          setErrors((prev) => ({
            ...prev,
            projectName: "Project name already exists. Choose a different name.",
          }));
        } else {
          setErrors((prev) => ({ ...prev, form: message }));
        }
      }
    }
  }; 
 
  return ( 
    <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-3xl p-5 sm:p-7 w-full max-w-md border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white transition-colors duration-200 relative overflow-hidden">
      {/* Success message */}
      {successMessage && (
        <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top z-50">
          {successMessage}
        </div>
      )}
      {errors.form && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {errors.form}
        </div>
      )}

      {/* Header */} 
      <div className="flex justify-between items-center mb-5"> 
        <h2 className="text-lg font-bold"> 
          {initialData || isEdit 
            ? "Edit Project" 
            : "Create Project"} 
        </h2> 
 
        <button 
          onClick={onClose} 
          className="text-gray-400 dark:text-slate-500 hover:text-red-500 cursor-pointer" 
        > 
          <X className="w-5 h-5" />
        </button> 
      </div> 
 
      <form onSubmit={handleSubmit} className="space-y-4"> 
        {/* Project Name */} 
        <div> 
          <div className="flex justify-between items-center mb-1"> 
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-400"> 
              Project Name{" "} 
              <span className="text-red-500">*</span> 
            </label> 
 
            <span className="text-[10px] text-gray-400"> 
              {formData.projectName.length}/300 
            </span> 
          </div> 
 
          <input 
            type="text" 
            maxLength={300} 
            value={formData.projectName} 
            onChange={(e) => 
              handleInputChange( 
                "projectName", 
                e.target.value 
              ) 
            } 
            className={`w-full border rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:shadow-none focus:border-blue-500 ${ 
              errors.projectName 
                ? "border-red-400 focus:ring-0 focus:border-blue-500" 
                : "border-gray-300 dark:border-slate-700 focus:ring-0 focus:border-blue-500" 
            }`} 
            placeholder="Enter project name..." 
          /> 
 
          {errors.projectName && ( 
            <p className="text-red-500 text-xs mt-1"> 
              {errors.projectName} 
            </p> 
          )} 
        </div> 
 
        {/* Description */} 
        <div> 
          <div className="flex justify-between items-center mb-1"> 
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-400"> 
              Description{" "} 
              <span className="text-red-500">*</span> 
            </label> 
 
            <span className="text-[10px] text-gray-400"> 
              {formData.description.length}/1000 
            </span> 
          </div> 
 
          <textarea 
            rows="3" 
            maxLength={1000} 
            value={formData.description} 
            onChange={(e) => 
              handleInputChange( 
                "description", 
                e.target.value 
              ) 
            } 
            className={`w-full border rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:shadow-none focus:border-blue-500 resize-none ${ 
              errors.description 
                ? "border-red-400 focus:ring-0 focus:border-blue-500" 
                : "border-gray-300 dark:border-slate-700 focus:ring-0 focus:border-blue-500" 
            }`} 
            placeholder="Enter brief project overview..." 
          /> 
 
          {errors.description && ( 
            <p className="text-red-500 text-xs mt-1"> 
              {errors.description} 
            </p> 
          )} 
        </div> 
 
        {/* Status Dropdown with Animated SVG Chevron Icon */}
        <div ref={statusDropdownRef} className="relative">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-400 mb-1">
            Status
          </label>
          <button
            type="button"
            onClick={() => setIsStatusOpen((prev) => !prev)}
            className={`w-full h-[42px] border rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-0 focus:shadow-none focus:border-blue-500 flex items-center justify-between cursor-pointer ${
              errors.status ? "border-red-400" : "border-gray-300 dark:border-slate-700"
            }`}
          >
            <span>{formData.status}</span>
            <svg
              className={`w-4 h-4 ml-1 text-gray-400 transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isStatusOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-[110] w-full max-w-full overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1">
              {(initialData || isEdit
                ? ["On Hold", "Cancelled"]
                : ["Planning"]
              ).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    handleInputChange("status", option);
                    setIsStatusOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm cursor-pointer transition-colors ${
                    formData.status === option
                      ? "bg-blue-600 text-white font-medium"
                      : "text-gray-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
        </div>

        {/* Dates Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
          <DatePicker
            label="Start Date"
            value={formData.startDate}
            onChange={(value) => handleInputChange("startDate", value)}
            error={errors.startDate}
          />

          <DatePicker
            label="End Date"
            value={formData.endDate}
            alignRight={true}
            onChange={(value) => handleInputChange("endDate", value)}
            error={errors.endDate}
          />
        </div>

        {/* Action Buttons */} 
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800"> 
          <button 
            type="button" 
            onClick={onClose} 
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 cursor-pointer" 
          > 
            Cancel 
          </button> 
 
          <div className="w-40"> 
            <SaveButton 
              text={ 
                initialData || isEdit 
                  ? "Save Changes" 
                  : "Create Project" 
              } 
              type="submit" 
            /> 
          </div> 
        </div> 
      </form> 
    </div> 
  ); 
}; 
 
export default ProjectForm;