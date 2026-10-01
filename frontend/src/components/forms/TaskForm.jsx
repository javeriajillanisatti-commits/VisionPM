import React, { useState, useEffect, useRef } from "react";
import Button from "../buttons/PrimaryButton";
import { useParams } from "react-router-dom";
import TaskSuggestions from "../tasks/TaskSuggestions";
import { getProjectMembers, getSmartSuggestions} from "../../services/taskService";
import { getProjectById } from "../../services/projectService";
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";

const CustomSelect = ({ label, value, options, onChange, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 shadow-none text-left ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800/60" : "cursor-pointer"
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder || "Select option"}
        </span>
        <svg
          className={`w-4 h-4 ml-1 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors truncate ${
                  isSelected
                    ? "bg-blue-600 text-white font-medium"
                    : "text-gray-800 dark:text-slate-200 hover:bg-blue-600 hover:text-white"
                }`}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
const formatDateToYYYYMMDD = (y, m, d) => {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

// Custom Calendar Picker 
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
      className="absolute z-50 left-0 bottom-full mb-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 w-64 text-gray-800 dark:text-slate-200"
    >
      {/* Calendar Header with Navigation and Lucide X Icon at Top Right */}
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
                  ? "text-gray-300 dark:text-slate-600 cursor-not-allowed opacity-50"
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
          onClick={handleSelectToday}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  );
};

const TaskForm = ({ onClose, onSubmit }) => {
  const { projectId } = useParams();

  const [formData, setFormData] = useState({ taskTitle: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    size: "M",
    deadline: "",
    requiredSkills: [],
    assignees: [],
    allocationMode: "",
    assigneeWorkloads: [],
  });

  const [errors, setErrors] = useState({
    taskTitle: "",
    description: "",
    status: "",
    priority: "",
    size: "",
    deadline: "",
    requiredSkills: "",
    assignees: "",
    form: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");

  const SIZE_POINTS = { XS: 5, S: 10, M: 20, L: 40, XL: 80 };

  const syncAllocations = (assignees, size, mode, previous = []) => {
    const total = SIZE_POINTS[size] || 0;
    if (assignees.length === 0) return [];
    if (assignees.length === 1) {
      return [{ member: assignees[0], workload: total }];
    }

    if (mode === "equal") {
      const totalCents = Math.round(total * 100);
      const baseCents = Math.floor(totalCents / assignees.length);
      const remainderCents = totalCents % assignees.length;

      return assignees.map((member, index) => ({
        member,
        workload: (baseCents + (index < remainderCents ? 1 : 0)) / 100,
      }));
    }

    const previousMap = new Map(
      (Array.isArray(previous) ? previous : []).map((item) => [
        String(item.member),
        Number(item.workload) || 0,
      ])
    );

    const kept = assignees.map((member) => ({
      member,
      workload: previousMap.get(String(member)) || 0,
    }));
    const oldTotal = kept.reduce((sum, item) => sum + item.workload, 0);

    if (oldTotal > 0) {
      return kept.map((item) => ({
        member: item.member,
        workload: Number(((item.workload / oldTotal) * total).toFixed(2)),
      }));
    }

    return kept;
  };

  const getAllocationTotal = (allocations = []) =>
    allocations.reduce((sum, item) => sum + (Number(item?.workload) || 0), 0);

  const hasCompleteAllocations = (assignees, allocations) => {
    if (!Array.isArray(allocations) || allocations.length !== assignees.length) {
      return false;
    }

    const selected = new Set(assignees.map((id) => String(id)));

    return (
      allocations.every(
        (item) =>
          selected.has(String(item?.member)) &&
          Number.isFinite(Number(item?.workload)) &&
          Number(item?.workload) > 0
      ) &&
      new Set(allocations.map((item) => String(item?.member))).size === assignees.length
    );
  };

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const response = await getProjectMembers(projectId);
        setInvitedMembers(response.members || []);
      } catch (err) {
        console.error("Error loading project members:", err);
      }
    };

    if (projectId) {
      fetchProjectMembers();
      getProjectById(projectId)
        .then((project) => {
          const end = project?.endDate;
          setProjectEndDate(end ? String(end).substring(0, 10) : "");
        })
        .catch((err) => console.error("Error loading project:", err));
    }
  }, [projectId]);

  const cleanInput = (value) =>
    typeof value === "string"
      ? value
          .normalize("NFKC")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .replace(/[\p{Cc}]/gu, "")
      : "";

  const hasHtmlOrScript = (value) =>
    /<[^>]*>|<script|<\/script|javascript:/i.test(value);

  const hasSuspiciousInjection = (value) =>
    /\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$exists|\$or|\$and|\$expr|\$function/i.test(value) ||
    /^or$/i.test(value.trim()) ||
    /javascript:/i.test(value);

  const hasSuspiciousObjectPattern = (value) =>
    /^\s*(?:\{.*\}|\[.*\])\s*$/s.test(value);

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
      if (
        pattern.repeat(compact.length / size) === compact &&
        pattern.length < compact.length
      ) {
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
      "asdf", "asdfgh", "asdfghj", "qwer", "qwerty", "qwertyui",
      "zxcv", "zxcvbn", "poiuy", "lkjhg", "mnbvc", "hjkl",
      "testtest", "abcabc", "xyzxyz", "123123", "000000", "111111",
      "222222", "333333", "444444", "555555", "666666", "777777",
      "888888", "999999",
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

  const hasEnoughLetters = (value) =>
    (value.match(/[A-Za-z]/g) || []).length >= 2;

  const validateMeaningfulText = (value, fieldName, minimumLength) => {
    const text = cleanInput(value).trim();
    if (!text) return `${fieldName} is required.`;
    if (text.length < minimumLength)
      return `${fieldName} must be at least ${minimumLength} characters.`;
    if (isOnlyNumbers(text)) return "Only numbers are not allowed.";
    if (isOnlySymbols(text)) return "Only symbols are not allowed.";
    if (!hasEnoughLetters(text)) return `${fieldName} must contain at least 2 letters.`;
    if (isOnlyRepeatedCharacter(text)) return "Repeated single characters are not allowed.";
    if (hasGarbagePattern(text)) return `Please enter meaningful ${fieldName.toLowerCase()}.`;
    if (hasRepeatingPattern(text)) return "Repeating patterns are not allowed.";
    if (hasConsecutiveSpaces(text)) return "Multiple consecutive spaces are not allowed.";
    if (hasConsecutiveSpecialChars(text)) return "Consecutive special characters are not allowed.";
    if (startsOrEndsWithSpecialChar(text)) return "Text cannot start or end with -, , or '.";
    if (hasInvalidStandaloneSpecial(text)) return "Invalid special character input.";
    if (hasDuplicateWord(text)) return "Duplicate consecutive words are not allowed.";
    if (hasMostlySameCharacter(text)) return "Text contains too many repeated characters.";
    if (hasHtmlOrScript(text)) return "HTML or script input is not allowed.";
    if (hasSuspiciousInjection(text)) return "Invalid or suspicious input detected.";
    if (hasSuspiciousObjectPattern(text)) return "Object-style input is not allowed.";
    return "";
  };

  const validateTaskTitle = (value) => {
    const title = cleanInput(value).trim();
    if (!title) return "Task Title is required.";
    if (title.length < 3) return "Task Title must be at least 3 characters.";
    if (title.length > 300) return "Task Title cannot exceed 300 characters.";
    if (/\d/.test(title)) return "Task Title cannot contain numbers.";
    return validateMeaningfulText(title, "Task Title", 3);
  };

  const validateDescription = (value) => {
    const description = cleanInput(value).trim();
    if (!description) return "Description is required.";
    if (description.length < 8) return "Description must be at least 8 characters.";
    if (description.length > 1000) return "Description cannot exceed 1000 characters.";
    if (hasMinimumWords(description, 2)) return "Description must contain at least 2 words.";
    return validateMeaningfulText(description, "Description", 8);
  };

  const validateSkill = (value) => {
    const skill = cleanInput(value).trim();
    if (!skill) return "";
    if (skill.length < 2) return "Skill must be at least 2 characters.";
    if (skill.length > 100) return "Skill cannot exceed 100 characters.";
    return validateMeaningfulText(skill, "Skill", 2);
  };

  const validateDeadline = (value) => {
    if (!value) return "Deadline is required.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Deadline is invalid. Please select a valid date.";

    const [year, month, day] = value.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== day
    ) {
      return "Deadline is invalid. Please select a valid date.";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) return "Deadline cannot be a past date.";

    if (projectEndDate && /^\d{4}-\d{2}-\d{2}$/.test(projectEndDate.substring(0, 10))) {
      const [pY, pM, pD] = projectEndDate.substring(0, 10).split("-").map(Number);
      const projectEndObj = new Date(pY, pM - 1, pD, 23, 59, 59, 999);
      if (selectedDate > projectEndObj) {
        return `Deadline cannot be after project end date (${projectEndDate.substring(0, 10)}).`;
      }
    }

    return "";
  };

  const validateTaskForm = () => {
    const nextErrors = {};
    const titleError = validateTaskTitle(formData.taskTitle);
    const descriptionError = validateDescription(formData.description);
    const deadlineError = validateDeadline(formData.deadline);

    if (titleError) nextErrors.taskTitle = titleError;
    if (descriptionError) nextErrors.description = descriptionError;
    if (!["Todo", "In Progress", "Completed"].includes(formData.status)) {
      nextErrors.status = "Please select a valid task status.";
    }
    if (!["Low", "Medium", "High"].includes(formData.priority)) {
      nextErrors.priority = "Please select a valid task priority.";
    }
    if (!["XS", "S", "M", "L", "XL"].includes(formData.size)) {
      nextErrors.size = "Please select a valid task size.";
    }
    if (deadlineError) nextErrors.deadline = deadlineError;

    if (formData.assignees.length > 1) {
      const total = SIZE_POINTS[formData.size] || 0;
      const allocations = Array.isArray(formData.assigneeWorkloads)
        ? formData.assigneeWorkloads
        : [];
      const allocationTotal = getAllocationTotal(allocations);
      const complete = hasCompleteAllocations(
        formData.assignees,
        allocations
      );

      if (!["equal", "manual"].includes(formData.allocationMode)) {
        nextErrors.assigneeWorkloads =
          "Please choose Equal Split or Manual Points.";
      } else if (!complete) {
        nextErrors.assigneeWorkloads =
          "Enter a positive workload value for every selected assignee.";
      } else if (
        allocations.some(
          (item) =>
            Math.abs(
              Number(item.workload) * 100 -
                Math.round(Number(item.workload) * 100)
            ) > 1e-8
        )
      ) {
        nextErrors.assigneeWorkloads =
          "Workload points can contain at most 2 decimal places.";
      } else if (Math.abs(allocationTotal - total) > 0.0001) {
        nextErrors.assigneeWorkloads =
          `Allocated workload must equal ${total} points.`;
      }
    }

    const seenSkills = new Set();
    for (const skill of formData.requiredSkills) {
      const cleaned = cleanInput(skill).trim();
      const skillError = validateSkill(cleaned);
      if (skillError) {
        nextErrors.requiredSkills = skillError;
        break;
      }
      const key = cleaned.toLowerCase();
      if (seenSkills.has(key)) {
        nextErrors.requiredSkills = "Duplicate skills are not allowed.";
        break;
      }
      seenSkills.add(key);
    }

    if (invitedMembers.length === 0) {
      nextErrors.assignees = "No members are assigned to this project. Please add project members first.";
    } else if (formData.assignees.some((id) => !invitedMembers.some((member) => String(member._id) === String(id)))) {
      nextErrors.assignees = "Please select only members of this project.";
    }

    setErrors((prev) => ({ ...prev, ...nextErrors, form: "" }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleFinalSubmit = async (data) => {
    if (typeof onSubmit !== "function") {
      onClose();
      return true;
    }

    try {
      const result = await onSubmit(data);
      if (result === false) return false;

      setSuccessMessage("Task created successfully!");
      setTimeout(() => onClose(), 1000);
      return result;
    } catch (error) {
      const responseData = error?.response?.data || error?.data || error || {};
      const field = responseData.field;
      const message = responseData.message || error?.message || "Unable to create task.";

      if (field && ["taskTitle", "description", "status", "priority", "size", "deadline", "requiredSkills", "assignees", "assigneeWorkloads"].includes(field)) {
        setErrors((prev) => ({ ...prev, [field]: message, form: "" }));
      } else if (/task title already exists/i.test(message)) {
        setErrors((prev) => ({ ...prev, taskTitle: "Task title already exists in this project. Choose a different title.", form: "" }));
      } else {
        setErrors((prev) => ({ ...prev, form: message }));
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateTaskForm()) return;

    if (formData.assignees.length === 0) {
      try {
        const response = await getSmartSuggestions({
          projectId,
          requiredSkills: formData.requiredSkills,
        });
        setSmartSuggestions(response.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
        setErrors((prev) => ({ ...prev, form: "", assignees: "Unable to generate smart suggestions." }));
      }
      return;
    }

    await handleFinalSubmit({
      ...formData,
      taskTitle: cleanInput(formData.taskTitle).trim(),
      description: cleanInput(formData.description).trim(),
      requiredSkills: formData.requiredSkills.map((skill) => cleanInput(skill).trim()),
    });
  };

  const addSkill = () => {
    const skill = skillInput.trim();

    if (!skill) {
      return;
    }

    const skillError = validateSkill(skill);
    if (skillError) {
      setErrors((prev) => ({ ...prev, requiredSkills: skillError }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, skill],
    }));

    setSkillInput("");
    setErrors((prev) => ({
      ...prev,
      requiredSkills: "",
    }));
  };

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const selectSuggestedMember = (memberId) => {
    setFormData((prev) => {
      const nextAssignees = prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId];

      const nextMode =
        nextAssignees.length > 1
          ? ["equal", "manual"].includes(prev.allocationMode)
            ? prev.allocationMode
            : ""
          : "manual";
      const nextWorkloads =
        nextAssignees.length > 1
          ? syncAllocations(
              nextAssignees,
              prev.size,
              nextMode,
              prev.assigneeWorkloads
            )
          : syncAllocations(nextAssignees, prev.size, "manual", []);

      return {
        ...prev,
        assignees: nextAssignees,
        allocationMode: nextMode,
        assigneeWorkloads: nextWorkloads,
      };
    });

    setErrors((prev) => ({
      ...prev,
      assignees: "",
      assigneeWorkloads: "",
    }));
  };

  const handleAssigneeChange = (value) => {
    if (value && !formData.assignees.includes(value)) {
      setFormData((prev) => {
        const nextAssignees = [...prev.assignees, value];
        const nextMode =
          nextAssignees.length > 1
            ? ["equal", "manual"].includes(prev.allocationMode)
              ? prev.allocationMode
              : ""
            : "manual";
        const nextWorkloads =
          nextAssignees.length > 1
            ? syncAllocations(
                nextAssignees,
                prev.size,
                nextMode,
                prev.assigneeWorkloads
              )
            : syncAllocations(nextAssignees, prev.size, "manual", []);

        return {
          ...prev,
          assignees: nextAssignees,
          allocationMode: nextMode,
          assigneeWorkloads: nextWorkloads,
        };
      });

      setErrors((prev) => ({
        ...prev,
        requiredSkills: "",
      }));
    }
  };

  const removeAssignee = (memberId) => {
    setFormData((prev) => {
      const nextAssignees = prev.assignees.filter((id) => id !== memberId);
      const nextMode =
        nextAssignees.length > 1
          ? ["equal", "manual"].includes(prev.allocationMode)
            ? prev.allocationMode
            : ""
          : "manual";
      const nextWorkloads =
        nextAssignees.length > 1
          ? syncAllocations(
              nextAssignees,
              prev.size,
              nextMode,
              prev.assigneeWorkloads
            )
          : syncAllocations(nextAssignees, prev.size, "manual", []);

      return {
        ...prev,
        assignees: nextAssignees,
        allocationMode: nextMode,
        assigneeWorkloads: nextWorkloads,
      };
    });
  };

  const statusOptions = [{ value: "Todo", label: "To Do" }];

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const sizeOptions = [
    { value: "XS", label: "XS — 5 points · 1-2 Hrs" },
    { value: "S", label: "S — 10 points · Half Day" },
    { value: "M", label: "M — 20 points · 1 Day" },
    { value: "L", label: "L — 40 points · 2-3 Days" },
    { value: "XL", label: "XL — 80 points · 1 Week" },
  ];

  const memberOptions = invitedMembers.map((m) => ({
    value: m._id,
    label: m.fullName,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 w-full max-w-md mx-auto border border-gray-200 dark:border-slate-800 shadow-xl transition-colors duration-200 relative overflow-hidden">
      {successMessage && (
        <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top z-50">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-slate-200">
          {showSuggestions ? "Smart Suggestions" : "Create Task"}
        </h2>

        <button
          onClick={onClose}
          type="button"
          className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!showSuggestions ? (
        <form onSubmit={handleSubmit} className="relative space-y-3 w-full">
          {errors.form && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {errors.form}
            </div>
          )}

          {/* Task Title */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 ml-0.5">
                Task Title <span className="text-red-500">*</span>
              </label>

              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {formData.taskTitle.length}/300
              </span>
            </div>

            <input
              type="text"
              maxLength={300}
              placeholder="Enter a descriptive task title"
              value={formData.taskTitle}
              className={`w-full border ${
                errors.taskTitle
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500"
              } bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-none`}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  taskTitle: e.target.value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  taskTitle: "",
                }));
              }}
            />

            {errors.taskTitle && (
              <p className="text-red-500 text-xs font-medium mt-1">
                {errors.taskTitle}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 ml-0.5">
                Description <span className="text-red-500">*</span>
              </label>

              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {formData.description.length}/1000
              </span>
            </div>

            <textarea
              maxLength={1000}
              placeholder="Provide brief details about the task context"
              rows="3"
              value={formData.description}
              className={`w-full border ${
                errors.description
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500"
              } bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-none`}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  description: "",
                }));
              }}
            />

            {errors.description && (
              <p className="text-red-500 text-xs font-medium mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* Custom Select Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-[0.85fr_0.75fr_1.4fr] gap-2.5">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 ml-0.5">
                Status
              </label>

              <CustomSelect
                value="Todo"
                options={statusOptions}
                onChange={() => {}}
                disabled={true}
              />
              {errors.status && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.status}</p>}
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 ml-0.5">
                Priority
              </label>

              <CustomSelect
                value={formData.priority}
                options={priorityOptions}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, priority: val }));
                  setErrors((prev) => ({ ...prev, priority: "" }));
                }}
              />
              {errors.priority && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.priority}</p>}
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 ml-0.5">
                Size (Effort)
              </label>

              <CustomSelect
                value={formData.size}
                options={sizeOptions}
                onChange={(val) => {
                  setFormData((prev) => {
                    return {
                      ...prev,
                      size: val,
                      assigneeWorkloads: syncAllocations(
                        prev.assignees,
                        val,
                        prev.allocationMode,
                        prev.assigneeWorkloads
                      ),
                    };
                  });
                  setErrors((prev) => ({ ...prev, size: "", assigneeWorkloads: "" }));
                }}
              />
              {errors.size && <p className="text-red-500 text-[10px] font-medium mt-1">{errors.size}</p>}
            </div>
          </div>

          {/* Deadline Field with Lucide Calendar Popover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <div className="flex flex-col space-y-0.5 relative">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 ml-0.5">
                Deadline <span className="text-red-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setShowCalendar((prev) => !prev)}
                className={`w-full h-9 border ${
                  errors.deadline
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500"
                } rounded-lg px-3 text-xs sm:text-sm flex items-center justify-between bg-white dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer shadow-none`}
              >
                <span className={formData.deadline ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                  {formData.deadline || "Select date"}
                </span>
                <CalendarIcon className="w-4 h-4 text-gray-400" />
              </button>

              {/* Lucide Calendar Popup Dropdown */}
              {showCalendar && (
                <CustomLucideCalendar
                  value={formData.deadline}
                  projectEndDate={projectEndDate}
                  onChange={(dateStr) => {
                    const err = validateDeadline(dateStr);
                    if (err) {
                      setErrors((prev) => ({ ...prev, deadline: err }));
                    } else {
                      setFormData((prev) => ({ ...prev, deadline: dateStr }));
                      setErrors((prev) => ({ ...prev, deadline: "" }));
                    }
                  }}
                  onError={(msg) => {
                    setErrors((prev) => ({ ...prev, deadline: msg }));
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              )}

              {errors.deadline && (
                <p className="text-red-500 text-xs font-medium mt-1">
                  {errors.deadline}
                </p>
              )}
            </div>

            {/* Required Skills */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 ml-0.5">
                Required Skills{" "}
                <span className="text-gray-400 dark:text-slate-500 font-normal">
                  (Optional)
                </span>
              </label>

              <div className="flex h-9 border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 items-center shadow-none">
                <input
                  type="text"
                  placeholder="Type skill and press Enter..."
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);

                    setErrors((prev) => ({
                      ...prev,
                      requiredSkills: "",
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="w-full px-3 text-sm outline-none bg-transparent text-gray-900 dark:text-white"
                />
              </div>

              {errors.requiredSkills && (
                <p className="text-red-500 text-xs font-medium mt-1">
                  {errors.requiredSkills}
                </p>
              )}
            </div>
          </div>

          {/* Skill */}
          {formData.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-gray-200 dark:border-slate-700 max-w-full">
              {formData.requiredSkills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 px-2 py-0.5 rounded text-xs font-semibold max-w-full truncate"
                >
                  <span className="truncate">{skill}</span>

                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-green-500 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Assignees */}
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-400 ml-0.5">
              Assignees{" "}
              <span className="text-gray-400 dark:text-slate-500 font-normal">
                (Leave empty for smart suggestions)
              </span>
            </label>

            <CustomSelect
              value=""
              placeholder="Select a project member"
              options={memberOptions}
              disabled={invitedMembers.length === 0}
              onChange={handleAssigneeChange}
            />

            {invitedMembers.length === 0 && (
              <p className="text-xs text-red-500 mt-1 font-medium">
                No members have been added to this project yet.
              </p>
            )}

            {formData.assignees.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 max-w-full">
                {formData.assignees.map((id) => {
                  const matchedUser = invitedMembers.find(
                    (member) => member._id === id
                  );

                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 max-w-full truncate"
                    >
                      <span className="truncate">{matchedUser ? matchedUser.fullName : id}</span>

                      <button
                        type="button"
                        onClick={() => removeAssignee(id)}
                        className="text-gray-400 dark:text-slate-500 hover:text-red-500 font-bold ml-1 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {errors.assignees && (
            <p className="text-red-500 text-xs font-medium">
              {errors.assignees}
            </p>
          )}

          {/* Workload Allocations */}
          {formData.assignees.length > 1 && (
            <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-3 w-full">
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-slate-200">
                  Workload Allocation
                </p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Task workload: {SIZE_POINTS[formData.size] || 0} points
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      allocationMode: "equal",
                      assigneeWorkloads: syncAllocations(prev.assignees, prev.size, "equal", prev.assigneeWorkloads),
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      assigneeWorkloads: "",
                    }));
                  }}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold ${formData.allocationMode === "equal"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-gray-200 bg-white text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  Equal Split
                </button>
                <button type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      allocationMode: "manual",
                      assigneeWorkloads: syncAllocations(prev.assignees, prev.size, "manual", prev.assigneeWorkloads),
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      assigneeWorkloads: "",
                    }));
                  }}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold ${formData.allocationMode === "manual"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-gray-200 bg-white text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  Manual Points
                </button>
              </div>

              <div className="space-y-2">
                {formData.assignees.map((id) => {
                  const member = invitedMembers.find((item) => String(item._id) === String(id));
                  const allocation = formData.assigneeWorkloads.find(
                    (item) => String(item.member) === String(id)
                  )?.workload ?? 0;

                  return (
                    <div key={id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex-1 min-w-0 truncate">
                        {member?.fullName || id}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={allocation}
                          disabled={formData.allocationMode === "equal"}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              assigneeWorkloads: prev.assigneeWorkloads.map((item) =>
                                String(item.member) === String(id)
                                  ? { ...item, workload: Number.isFinite(value) ? value : 0 }
                                  : item
                              ),
                            }));
                            setErrors((prev) => ({ ...prev, assigneeWorkloads: "" }));
                          }}
                          className="w-full sm:w-24 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-70 shadow-none"
                        />
                        <span className="text-[10px] text-gray-500 dark:text-slate-400">points</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-t border-indigo-100 dark:border-indigo-900/40 pt-2">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
                  Allocated: {getAllocationTotal(formData.assigneeWorkloads).toFixed(2).replace(/\.00$/, "")} / {SIZE_POINTS[formData.size] || 0} points
                </span>
                {formData.allocationMode === "manual" && (
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Total must match exactly.</span>
                )}
              </div>

              {errors.assigneeWorkloads && (
                <p className="text-red-500 text-[10px] font-semibold">{errors.assigneeWorkloads}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>

            <div className="w-36">
              <Button
                text="Create Task"
                type="submit"
                disabled={invitedMembers.length === 0}
                className={`w-full text-xs font-bold rounded-lg py-2 ${
                  invitedMembers.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              />
            </div>
          </div>
        </form>
      ) : (
        <TaskSuggestions
          invitedMembers={smartSuggestions}
          assignees={formData.assignees}
          onSelectMember={selectSuggestedMember}
          onBack={() => setShowSuggestions(false)}
          onConfirm={() => {
            if (formData.assignees.length === 0) {
              setErrors((prev) => ({
                ...prev,
                assignees: "Please select at least one assignee!",
              }));
              return;
            }

            setShowSuggestions(false);
            setErrors((prev) => ({
              ...prev,
              assignees: "",
              assigneeWorkloads: "",
              form: "",
            }));
          }}
        />
      )}
    </div>
  );
};

export default TaskForm;