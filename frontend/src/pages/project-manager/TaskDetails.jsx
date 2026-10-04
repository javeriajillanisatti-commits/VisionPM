import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import SubTasks from "../../components/tasks/SubTasks";
import SubtaskForm from "../../components/forms/SubtaskForm";
import UploadFile from "../../components/tasks/UploadFile";
import Comments from "../../components/tasks/Comments";
import TaskMetaCard from "../../components/tasks/TaskMeta"; 
import { ArrowLeft, AlertTriangle, Plus,  } from "lucide-react"; 
import { getTaskById, updateTask, createSubtask, updateSubtask, deleteSubtask } from "../../services/taskService";
import { getProjectMembers } from "../../services/taskService";
const taskDetailsCache = new Map();

const SIZE_POINTS = { XS: 5, S: 10, M: 20, L: 40, XL: 80 };

const TaskDetails = () => {
  const liveTick = useLiveTick({ resources: ["tasks", "projects"] });
  const navigate = useNavigate();
  const { state } = useLocation();
  const { taskId: routeTaskId } = useParams();
  const { isDarkMode } = useTheme();
  const currentTaskId = routeTaskId || state?._id || state?.id || "";
  const sectionCardStyle = ` bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm`;
  const [currentUserRole, setCurrentUserRole] = useState("projectmanager");
  const [workspaceMembers, setWorkspaceMembers] = useState([]); 
  const [isOpen, setIsOpen] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [conflictSeverity, setConflictSeverity] = useState("Warning");
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const buildEqualAllocations = useCallback((assignees, size) => {
    const total = SIZE_POINTS[size] || 0;
    if (assignees.length === 1) return [{ member: assignees[0]?._id || assignees[0], workload: total }];
    if (!assignees.length) return [];
    const each = total / assignees.length;
    return assignees.map((member) => ({
      member: member?._id || member,
      workload: Number(each.toFixed(4)),
    }));
  }, []);

  const scaleAllocations = (assignees, size, previous) => {
    if (assignees.length <= 1) return buildEqualAllocations(assignees, size);
    const total = SIZE_POINTS[size] || 0;
    const map = new Map(
      (previous || []).map((item) => [
        String(item.member?._id || item.member),
        Number(item.workload) || 0,
      ])
    );
    const kept = assignees.map((member) => ({
      member: member?._id || member,
      workload: map.get(String(member?._id || member)) || 0,
    }));
    const oldTotal = kept.reduce((sum, item) => sum + item.workload, 0);
    if (!oldTotal) return buildEqualAllocations(assignees, size);
    return kept.map((item) => ({
      member: item.member,
      workload: Number(((item.workload / oldTotal) * total).toFixed(4)),
    }));
  };

  const [task, setTask] = useState({
    id: state?._id || state?.id || routeTaskId || "",
    projectId: state?.project?._id || state?.project || state?.projectId || "", 
    taskTitle: state?.taskTitle || state?.title || "Untitled Task", 
    description: state?.description || "",
    status: state?.status || "Todo",
    priority: state?.priority || "Medium",
    size: state?.size || "M", 
    requiredSkills: state?.requiredSkills || [], 
    deadline: state?.deadline || state?.dueDate || "",
    assignees: [],
    allocationMode: "manual",
    assigneeWorkloads: [],
  });

  const [subtasks, setSubtasks] = useState([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskAssignee, setSubtaskAssignee] = useState("");
  const [subtaskError, setSubtaskError] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [subtaskSaving, setSubtaskSaving] = useState(false);
  const [subtaskSuccess, setSubtaskSuccess] = useState("");

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".");
        const base64 = base64Url[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(window.atob(base64));
        const cleanRole = payload.role?.toString().toLowerCase().replace(/\s+/g, "");
        if (cleanRole === "teammember") {
          setCurrentUserRole("teammember");
        } else if (cleanRole === "projectadmin") {
          setCurrentUserRole("projectadmin");
        } else {
          setCurrentUserRole("projectmanager");
        }
      }
    } catch (err) {
      console.error("Session identity tracing exception:", err);
    }
  }, []);

  const fetchTaskFullDetails = useCallback(async (taskId) => {
    try {
      const response = await getTaskById(taskId);
      const liveTask = response.task || response;
      
      if (liveTask) {
        let resolvedAssignees = [];
        if (Array.isArray(liveTask.assignedTo)) {
          resolvedAssignees = liveTask.assignedTo.map((member) => {
            if (typeof member === "object" && member !== null) return member;
            return { _id: member };
          });
        } else if (liveTask.assignedTo) {
          resolvedAssignees = typeof liveTask.assignedTo === "object" ? [liveTask.assignedTo] : [{ _id: liveTask.assignedTo }];
        }

        const targetProjectId = liveTask.project?._id || liveTask.project || liveTask.projectId;

        setTask({
          id: liveTask._id || liveTask.id,
          projectId: targetProjectId,
          taskTitle: liveTask.taskTitle || liveTask.title || "Untitled Task",
          description: liveTask.description || "",
          status: liveTask.status || "Todo",
          priority: liveTask.priority || "Medium",
          size: liveTask.size || "M", 
          requiredSkills: liveTask.requiredSkills || [], 
          deadline: liveTask.deadline ? liveTask.deadline.substring(0, 10) : "",
          assignees: resolvedAssignees,
          allocationMode: liveTask.allocationMode || "manual",
          assigneeWorkloads: Array.isArray(liveTask.assigneeWorkloads)
            ? liveTask.assigneeWorkloads.map((item) => ({
                member: item.member?._id || item.member,
                workload: Number(item.workload) || 0,
              }))
            : buildEqualAllocations(resolvedAssignees, liveTask.size || "M")
        });

        if (liveTask.subtasks) setSubtasks(liveTask.subtasks);

        if (targetProjectId) {
          try {
            const response = await getProjectMembers(targetProjectId);
            setWorkspaceMembers(response.members || []);
          } catch (err) {
            console.error("Error loading project members:", err);
          }
        }
      }
    } catch (error) {
      console.error("Error loading task real-time details:", error);
    }
  }, [buildEqualAllocations]);

  useEffect(() => {
  if (!currentTaskId) return;

  let cancelled = false;

  const syncTaskDetails = async () => {
    const cachedData = taskDetailsCache.get(currentTaskId);

    if (cachedData) {
      setTask(cachedData.task);
      setSubtasks(cachedData.subtasks);
      setWorkspaceMembers(cachedData.workspaceMembers);
    }

    try {
      const response = await getTaskById(currentTaskId);
      const liveTask = response?.task || response;

      if (!liveTask || cancelled) return;

      let resolvedAssignees = [];

      if (Array.isArray(liveTask.assignedTo)) {
        resolvedAssignees = liveTask.assignedTo.map((member) => {
          if (typeof member === "object" && member !== null) {
            return member;
          }

          return { _id: member };
        });
      } else if (liveTask.assignedTo) {
        resolvedAssignees =
          typeof liveTask.assignedTo === "object"
            ? [liveTask.assignedTo]
            : [{ _id: liveTask.assignedTo }];
      }

      const targetProjectId =
        liveTask.project?._id ||
        liveTask.project ||
        liveTask.projectId;

      const nextTask = {
        id: liveTask._id || liveTask.id,
        projectId: targetProjectId,
        taskTitle: liveTask.taskTitle || liveTask.title || "Untitled Task",
        description: liveTask.description || "",
        status: liveTask.status || "Todo",
        priority: liveTask.priority || "Medium",
        size: liveTask.size || "M",
        requiredSkills: liveTask.requiredSkills || [],
        deadline: liveTask.deadline
          ? liveTask.deadline.substring(0, 10)
          : "",
        assignees: resolvedAssignees,
        allocationMode: liveTask.allocationMode || "manual",
        assigneeWorkloads: Array.isArray(liveTask.assigneeWorkloads)
          ? liveTask.assigneeWorkloads.map((item) => ({
              member: item.member?._id || item.member,
              workload: Number(item.workload) || 0,
            }))
          : buildEqualAllocations(
              resolvedAssignees,
              liveTask.size || "M"
            ),
      };

      let nextWorkspaceMembers = [];

      if (targetProjectId) {
        try {
          const membersResponse = await getProjectMembers(targetProjectId);
          nextWorkspaceMembers = membersResponse.members || [];
        } catch (err) {
          console.error("Error loading project members:", err);

          if (cachedData?.workspaceMembers) {
            nextWorkspaceMembers = cachedData.workspaceMembers;
          }
        }
      }

      const nextSubtasks = liveTask.subtasks || [];

      if (!cancelled) {
        setTask(nextTask);
        setSubtasks(nextSubtasks);
        setWorkspaceMembers(nextWorkspaceMembers);

        taskDetailsCache.set(currentTaskId, {
          task: nextTask,
          subtasks: nextSubtasks,
          workspaceMembers: nextWorkspaceMembers,
        });
      }
    } catch (error) {
      if (!cancelled) {
        console.error("Error loading task real-time details:", error);

        if (!cachedData) {
          setSubtasks([]);
        }
      }
    }
  };

  syncTaskDetails();

  return () => {
    cancelled = true;
  };
}, [currentTaskId, buildEqualAllocations, liveTick]);

  const resetSubtaskForm = (closeForm = true) => {
    setSubtaskTitle("");
    setSubtaskAssignee("");
    setSubtaskError("");
    setEditingSubtaskId(null);
    if (closeForm) setShowSubtaskForm(false);
  };

  const hasRandomGibberish = (value) => {
    const compact = value.toLowerCase().replace(/[^a-z]/g, "");
    if (compact.length < 6) return false;

    const keyboardPatterns = [
      "qwerty", "asdfgh", "zxcvbn", "qazwsx", "wsxedc", "edcrfv",
      "rfvtgb", "tgbyhn", "yhnujm", "ujmikl", "ikoljm", "plokm",
      "qazxsw", "sxedcr", "dcfvgb", "fvgbhn", "gbhnjm", "hjmklo",
    ];
    if (keyboardPatterns.some((pattern) => compact.includes(pattern))) return true;

    // Reject obvious repeated 2-3 character gibberish such as abababab or xzyxzyx.
    for (const size of [2, 3]) {
      if (compact.length >= size * 3 && compact.length % size === 0) {
        const part = compact.slice(0, size);
        if (part.repeat(compact.length / size) === compact) return true;
      }
    }

    const vowels = (compact.match(/[aeiou]/g) || []).length;
    const uniqueRatio = new Set(compact).size / compact.length;
    // Very long strings with almost no vowels and very low character variety are
    if (compact.length >= 8 && vowels / compact.length < 0.16 && uniqueRatio < 0.55) return true;
    if (compact.length >= 10 && vowels / compact.length < 0.12) return true;

    return false;
  };

  const validateSubtaskTitle = (value, currentSubtaskId = null) => {
    const title = value.trim();

    if (!title) return "Subtask name is required.";
    if (title.length < 3) return "Subtask name must be at least 3 characters.";
    if (title.length > 300) return "Subtask name must be 300 characters or less.";
    if (/\s{2,}/.test(title)) return "Subtask name cannot contain consecutive spaces.";
    if (/[^A-Za-z0-9\s.,!?()&'’:_/-]/.test(title)) {
      return "Subtask name contains invalid special characters.";
    }
    if (/<\/?(script|iframe|object|embed|style)[^>]*>/i.test(title) || /javascript\s*:/i.test(title)) {
      return "Subtask name contains invalid content.";
    }
    if (/\$where|\$gt|\$lt|\$ne|\$in|\$nin|__proto__|constructor|prototype/i.test(title)) {
      return "Subtask name contains invalid content.";
    }
    if (/\b(https?:\/\/|www\.)/i.test(title)) return "Please enter a valid subtask name.";
    if (/^(.)\1{4,}$/.test(title.replace(/\s/g, ""))) {
      return "Please enter meaningful text for the subtask name.";
    }
    if (hasRandomGibberish(title)) {
      return "Please enter meaningful text for the subtask name.";
    }

    const words = title.split(/\s+/).filter(Boolean);
    if (words.some((word) => word.length > 80)) {
      return "Subtask name contains an excessively long word.";
    }
    for (let i = 1; i < words.length; i += 1) {
      if (words[i].toLowerCase() === words[i - 1].toLowerCase()) {
        return "Subtask name cannot contain duplicate consecutive words.";
      }
    }

    const letters = title.match(/[A-Za-z]/g) || [];
    if (letters.length < 3) return "Please enter meaningful text for the subtask name.";

    const lower = letters.join("").toLowerCase();
    const uniqueRatio = new Set(lower).size / lower.length;
    const vowelRatio = (lower.match(/[aeiou]/g) || []).length / lower.length;
    if (
      uniqueRatio < 0.35 ||
      (lower.length >= 8 && vowelRatio < 0.18) ||
      /(.)\1{4,}/.test(lower)
    ) {
      return "Please enter meaningful text for the subtask name.";
    }

    const duplicate = subtasks.some((subtask) => {
      const id = subtask.id || subtask._id;
      return id !== currentSubtaskId &&
        String(subtask.title || "").trim().toLowerCase() === title.toLowerCase();
    });
    if (duplicate) return "A subtask with this name already exists.";

    return "";
  };

  const openCreateSubtask = () => {
    setEditingSubtaskId(null);
    setSubtaskTitle("");
    setSubtaskAssignee("");
    setSubtaskError("");
    setSubtaskSuccess("");
    setShowSubtaskForm(true);
  };

  const openEditSubtask = (subtask) => {
    setEditingSubtaskId(subtask.id || subtask._id);
    setSubtaskTitle(subtask.title || "");
    setSubtaskAssignee(subtask.assignedTo?._id || subtask.assignedTo || "");
    setSubtaskError("");
    setSubtaskSuccess("");
    setShowSubtaskForm(true);
  };

  const handleSubtaskSubmit = async (event) => {
    event?.preventDefault();
    if (currentUserRole !== "projectmanager") return;

    const validationError = validateSubtaskTitle(subtaskTitle, editingSubtaskId);
    if (validationError) {
      setSubtaskError(validationError);
      return;
    }

    if (!subtaskAssignee) {
      setSubtaskError("Please select a subtask assignee.");
      return;
    }

    setSubtaskSaving(true);
    setSubtaskError("");
    setSubtaskSuccess("");

    try {
      if (editingSubtaskId) {
        const response = await updateSubtask(task.id, editingSubtaskId, {
          title: subtaskTitle.trim(),
          assignedTo: subtaskAssignee,
        });
        const updated = response.subtask;
       setSubtasks((prev) => {
  const updatedSubtasks = prev.map((item) =>
    (item.id || item._id) === editingSubtaskId ? updated : item
  );

  const cached = taskDetailsCache.get(currentTaskId);

  if (cached) {
    taskDetailsCache.set(currentTaskId, {
      ...cached,
      subtasks: updatedSubtasks,
    });
  }

  return updatedSubtasks;
});
      } else {
        const response = await createSubtask(task.id, {
          title: subtaskTitle.trim(),
          assignedTo: subtaskAssignee,
        });
        setSubtasks((prev) => {
  const updatedSubtasks = [...prev, response.subtask];

  const cached = taskDetailsCache.get(currentTaskId);

  if (cached) {
    taskDetailsCache.set(currentTaskId, {
      ...cached,
      subtasks: updatedSubtasks,
    });
  }

  return updatedSubtasks;
});
      }
      const successMessage = editingSubtaskId ? "Subtask updated successfully!" : "Subtask created successfully!";
      // Keep the modal open so the success banner is shown
      resetSubtaskForm(false);
      setSubtaskSuccess(successMessage);
      window.setTimeout(() => {
        setSubtaskSuccess("");
        setShowSubtaskForm(false);
      }, 1000);
    } catch (error) {
      setSubtaskError(error?.message || "Unable to save subtask.");
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleSubtaskToggle = async (subId) => {
  const current = subtasks.find((s) => (s.id || s._id) === subId);
  if (!current) return;

  try {
    const response = await updateSubtask(task.id, subId, {
      completed: !current.completed,
    });

    setSubtasks((prev) => {
      const updatedSubtasks = prev.map((item) =>
        (item.id || item._id) === subId
          ? { ...item, ...response.subtask }
          : item
      );

      const cached = taskDetailsCache.get(currentTaskId);

      if (cached) {
        taskDetailsCache.set(currentTaskId, {
          ...cached,
          subtasks: updatedSubtasks,
        });
      }

      return updatedSubtasks;
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
  }
};

  const handleDeleteSubtask = async (subId) => {
  if (currentUserRole !== "projectmanager") {
    alert("Access Denied. Only Project Managers can delete subtasks.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this subtask?"
  );

  if (!confirmed) return;

  try {
    await deleteSubtask(task.id, subId);

    setSubtasks((prev) => {
      const updatedSubtasks = prev.filter(
        (item) => (item.id || item._id) !== subId
      );

      const cached = taskDetailsCache.get(currentTaskId);

      if (cached) {
        taskDetailsCache.set(currentTaskId, {
          ...cached,
          subtasks: updatedSubtasks,
        });
      }

      return updatedSubtasks;
    });
  } catch (error) {
    console.error("Error deleting subtask:", error);
  }
};
const handleMemberToggle = (member) => {
    setTask((prev) => {
      const memberId = String(member._id);
      const isAlreadySelected = prev.assignees.some(
        (m) => String(m._id || m) === memberId
      );
      const updatedAssignees = isAlreadySelected
        ? prev.assignees.filter((m) => String(m._id || m) !== memberId)
        : [...prev.assignees, member];

      let allocations =
        prev.allocationMode === "equal"
          ? buildEqualAllocations(updatedAssignees, prev.size)
          : scaleAllocations(
              updatedAssignees,
              prev.size,
              prev.assigneeWorkloads
            );

      if (updatedAssignees.length > 1 && prev.allocationMode === "manual") {
        const oldMap = new Map(
          (prev.assigneeWorkloads || []).map((item) => [
            String(item.member?._id || item.member),
            Number(item.workload) || 0,
          ])
        );
        allocations = updatedAssignees.map((m) => ({
          member: m._id || m,
          workload: oldMap.get(String(m._id || m)) || 0,
        }));
      }

      return {
        ...prev,
        assignees: updatedAssignees,
        assigneeWorkloads: allocations,
      };
    });
  };

  const cleanInput = (value) => typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[\p{Cc}]/gu, "")
    : "";
  const hasHtmlOrScript = (value) => /<[^>]*>|<script|<\/script|javascript:/i.test(value);
  const hasSuspiciousInjection = (value) => /\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$exists|\$or|\$and|\$expr|\$function/i.test(value) || /^or$/i.test(value.trim()) || /javascript:/i.test(value);
  const hasSuspiciousObjectPattern = (value) => /^\s*(?:\{.*\}|\[.*\])\s*$/s.test(value);
  const isOnlyRepeatedCharacter = (value) => { const compact=value.replace(/\s/g, ""); return !!compact && compact.length>=4 && /^(.)(?:\1)+$/u.test(compact); };
  const isOnlyNumbers = (value) => /^\d+$/.test(value.trim());
  const isOnlySymbols = (value) => /^[^\p{L}\p{N}]+$/u.test(value.trim());
  const hasConsecutiveSpaces = (value) => /\s{2,}/.test(value);
  const hasConsecutiveSpecialChars = (value) => /[-',]{2,}/.test(value);
  const startsOrEndsWithSpecialChar = (value) => /^[-',]|[-',]$/u.test(value.trim());
  const hasInvalidStandaloneSpecial = (value) => /^[-,']+$/.test(value.trim());
  const hasDuplicateWord = (value) => { const words=value.toLowerCase().trim().split(/\s+/).filter(Boolean); for(let i=1;i<words.length;i++) if(words[i]===words[i-1]) return true; return false; };
  const hasRepeatingPattern = (value) => { const compact=value.replace(/\s/g, "").toLowerCase(); if(compact.length<6) return false; for(let size=1;size<=Math.floor(compact.length/2);size++){ if(compact.length%size!==0) continue; const pattern=compact.slice(0,size); if(pattern.repeat(compact.length/size)===compact) return true; } return false; };
  const hasGarbagePattern = (value) => ["asdf","asdfgh","asdfghj","qwer","qwerty","qwertyui","zxcv","zxcvbn","poiuy","lkjhg","mnbvc","hjkl","testtest","abcabc","xyzxyz","123123","000000","111111","222222","333333","444444","555555","666666","777777","888888","999999"].some(p=>value.toLowerCase().replace(/[^a-z]/g, "").includes(p));
  const hasMostlySameCharacter = (value) => { const compact=value.replace(/\s/g, "").toLowerCase(); if(compact.length<5) return false; const counts={}; for(const c of compact) counts[c]=(counts[c]||0)+1; return Math.max(...Object.values(counts))/compact.length>=0.8; };
  const validateMeaningfulText = (value, fieldName, minimumLength) => { const text=cleanInput(value).trim(); if(!text) return `${fieldName} is required.`; if(text.length<minimumLength) return `${fieldName} must be at least ${minimumLength} characters.`; if(isOnlyNumbers(text)) return "Only numbers are not allowed."; if(isOnlySymbols(text)) return "Only symbols are not allowed."; if((text.match(/[A-Za-z]/g)||[]).length<2) return `${fieldName} must contain at least 2 letters.`; if(isOnlyRepeatedCharacter(text)) return "Repeated single characters are not allowed."; if(hasGarbagePattern(text)) return `Please enter meaningful ${fieldName.toLowerCase()}.`; if(hasRepeatingPattern(text)) return "Repeating patterns are not allowed."; if(hasConsecutiveSpaces(text)) return "Multiple consecutive spaces are not allowed."; if(hasConsecutiveSpecialChars(text)) return "Consecutive special characters are not allowed."; if(startsOrEndsWithSpecialChar(text)) return "Text cannot start or end with -, , or '."; if(hasInvalidStandaloneSpecial(text)) return "Invalid special character input."; if(hasDuplicateWord(text)) return "Duplicate consecutive words are not allowed."; if(hasMostlySameCharacter(text)) return "Text contains too many repeated characters."; if(hasHtmlOrScript(text)) return "HTML or script input is not allowed."; if(hasSuspiciousInjection(text)) return "Invalid or suspicious input detected."; if(hasSuspiciousObjectPattern(text)) return "Object-style input is not allowed."; return ""; };
  const validateTaskTitle = (value) => { const title=cleanInput(value).trim(); if(!title) return "Task Title is required."; if(title.length<3) return "Task Title must be at least 3 characters."; if(title.length>300) return "Task Title cannot exceed 300 characters."; if(/\d/.test(title)) return "Task Title cannot contain numbers."; return validateMeaningfulText(title,"Task Title",3); };
  const validateDescription = (value) => { const description=cleanInput(value).trim(); if(!description) return "Description is required."; if(description.length<8) return "Description must be at least 8 characters."; if(description.length>1000) return "Description cannot exceed 1000 characters."; if(description.trim().split(/\s+/).filter(Boolean).length<2) return "Description must contain at least 2 words."; return validateMeaningfulText(description,"Description",8); };
  const validateDeadline = (value) => { if(!value) return "Deadline is required."; if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Deadline is invalid. Please select a valid date."; const [year,month,day]=value.split("-").map(Number); const date=new Date(Date.UTC(year,month-1,day)); if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day) return "Deadline is invalid. Please select a valid date."; const now=new Date(); const today=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())); return date<today ? "Deadline cannot be a past date." : ""; };
  const validateTaskEdit = () => {
    const next={};
    const titleError=validateTaskTitle(task.taskTitle); if(titleError) next.taskTitle=titleError;
    const descError=validateDescription(task.description); if(descError) next.description=descError;
    if (!["Todo","In Progress","Completed"].includes(task.status)) next.status="Please select a valid task status.";
    if (!["Low","Medium","High"].includes(task.priority)) next.priority="Please select a valid task priority.";
    if (!["XS","S","M","L","XL"].includes(task.size)) next.size="Please select a valid task size.";
    const dateError=validateDeadline(task.deadline); if(dateError) next.deadline=dateError;
    const seen=new Set();
    for(const skill of (task.requiredSkills||[])){
      const cleaned=cleanInput(skill).trim();
      if(!cleaned){next.requiredSkills="Skill cannot be empty.";break;}
      const err=validateMeaningfulText(cleaned,"Skill",2);
      if(err){next.requiredSkills=err;break;}
      if(cleaned.length>100){next.requiredSkills="Skill cannot exceed 100 characters.";break;}
      const key=cleaned.toLowerCase(); if(seen.has(key)){next.requiredSkills="Duplicate skills are not allowed.";break;} seen.add(key);
    }
    const memberIds=new Set((workspaceMembers||[]).map(m=>String(m._id||m.id)));
    const ids=(task.assignees||[]).map(m=>String(m._id||m.id||m));
    if(!ids.length) next.assignees="Please select at least one assignee.";
    else if(ids.some(id=>!memberIds.has(id))) next.assignees="Please select only members of this project.";

    if (ids.length > 1) {
      const total = SIZE_POINTS[task.size] || 0;
      const allocations = task.assigneeWorkloads || [];
      const allocatedTotal = allocations.reduce(
        (sum, item) => sum + (Number(item.workload) || 0), 0
      );
      const complete = ids.every((id) =>
        allocations.some((item) => String(item.member?._id || item.member) === id)
      );
      if (!complete) next.assigneeWorkloads="Enter workload points for every selected assignee.";
      else if (Math.abs(allocatedTotal - total) > 0.0001) {
        next.assigneeWorkloads=`Allocated workload must equal ${total} points.`;
      }
    }

    setValidationErrors(next); return Object.keys(next).length===0;
  };
  const clearFieldError = (field) => setValidationErrors(prev => ({...prev,[field]:"",form:""}));

  const handleSave = async () => {
    if (currentUserRole === "teammember") {
      alert("Access Denied.");
      return false;
    }
    setSaveSuccess("");
    if (!validateTaskEdit()) return false;
    setSaving(true);
    try {
      const updatedAssigneesIds = (task.assignees || []).map(member => member._id || member);
      const syncPayload = {
        taskTitle: task.taskTitle,
        description: task.description,
        status: task.status,
        priority: task.priority,
        size: task.size, 
        requiredSkills: task.requiredSkills, 
        deadline: task.deadline || null,
        assignedTo: updatedAssigneesIds,
        allocationMode: task.assignees.length > 1 ? (task.allocationMode || "manual") : "manual",
        assigneeWorkloads: task.assigneeWorkloads || []
      };
      try {
        await updateTask(task.id, syncPayload);
        setSaveSuccess("Task parameters saved successfully.");
        window.setTimeout(() => setSaveSuccess(""), 3000);
        return true;
      } catch (error) {
        if (error?.conflict) {
          setPendingUpdatePayload(syncPayload);
          setConflictMessage(error.message || "This assignment has a workload or task conflict.");
          setConflictSeverity(error.severity || "Warning");
          setShowConflictModal(true);
          return false;
        }
        throw error;
      }
    } catch (error) {
      console.error("Critical error saving parameters:", error);
      const message = error?.message || "Failed to save task parameters.";
      setValidationErrors(prev => ({ ...prev, form: message }));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmConflict = async () => {
    if (!pendingUpdatePayload) return;
    try {
      await updateTask(task.id, { ...pendingUpdatePayload, forceCreate: true });
      setShowConflictModal(false);
      setPendingUpdatePayload(null);
      setConflictSeverity("Warning");
      alert("Task parameters saved successfully with the conflict override.");
    } catch (error) {
      alert(error?.message || "Failed to force assign task.");
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 bg-transparent min-h-screen font-sans text-gray-900 dark:text-white transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top main header row containing title input and back arrow */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm text-gray-700 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-full flex-1 min-w-0">
            <input
              className="w-full text-2xl sm:text-3xl font-bold tracking-tight border-none outline-none py-1 placeholder:text-gray-300 bg-transparent disabled:opacity-90 text-gray-800 dark:text-white"
              value={task.taskTitle}
              onChange={(e) => { setTask({ ...task, taskTitle: e.target.value }); clearFieldError("taskTitle"); }}
              disabled={currentUserRole === "teammember"}
              placeholder="Task Title"
              maxLength={300}
            />
            {validationErrors.taskTitle && <p className="mt-1.5 text-xs font-semibold text-red-500">{validationErrors.taskTitle}</p>}
          </div>
        </div>

        {/* Task meta card handles external details like status and users layout */}
        <TaskMetaCard 
          task={task}
          setTask={setTask}
          currentUserRole={currentUserRole}
          workspaceMembers={workspaceMembers}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          handleMemberToggle={handleMemberToggle}
          onSave={handleSave}
          validationErrors={validationErrors}
          clearFieldError={clearFieldError}
          saveSuccess={saveSuccess}
          saving={saving}
        />

        {/* Subtask management */}
        <section className="w-full">
          <div className={`${sectionCardStyle} p-5 sm:p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <span className="text-[14px] font-bold text-gray-600 dark:text-slate-500 mb-0">Subtasks</span>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Manage and track task-level work items.</p>
              </div>
              {currentUserRole === "Aprojectmanager" && (
                <button
                  type="button"
                  onClick={openCreateSubtask}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  <Plus size={16} />
                  Create Subtask
                </button>
              )}
            </div>

            {subtaskSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                {subtaskSuccess}
              </div>
            )}

            <div className="h-[250px] overflow-y-auto pr-1 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-950/20">
              {subtasks.length > 0 ? (
                <div className="p-2 space-y-1">
                  {subtasks.map((sub) => (
                    <SubTasks
                      key={sub.id || sub._id}
                      title={sub.title}
                      completed={sub.completed}
                      assignee={sub.assignedTo}
                      userRole={currentUserRole}
                      onToggle={() => handleSubtaskToggle(sub.id || sub._id)}
                      onDelete={() => handleDeleteSubtask(sub.id || sub._id)}
                      onEdit={() => openEditSubtask(sub)}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3">
                    <Plus size={20} className="text-indigo-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">No subtasks yet</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-xs">Create the first subtask to start breaking this task into manageable work.</p>
                </div>
              )}
            </div>
          </div>

          {showSubtaskForm && currentUserRole === "projectmanager" && (
            <SubtaskForm
              isDarkMode={isDarkMode}
              editingSubtaskId={editingSubtaskId}
              subtaskTitle={subtaskTitle}
              subtaskAssignee={subtaskAssignee}
              subtaskError={subtaskError}
              subtaskSuccess={subtaskSuccess}
              subtaskSaving={subtaskSaving}
              assignees={task.assignees || []}
              onTitleChange={(value) => {
                setSubtaskTitle(value);
                if (subtaskError) setSubtaskError("");
              }}
              onAssigneeChange={(value) => {
                setSubtaskAssignee(value);
                if (subtaskError) setSubtaskError("");
              }}
              onSubmit={handleSubtaskSubmit}
              onCancel={resetSubtaskForm}
            />
          )}
        </section>

        {/* File document attachments repository container block */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[14px] font-bold text-gray-600 dark:text-slate-500 block ml-0.5">
            Attachments & Documentation
          </label>
          <UploadFile userRole={currentUserRole} />
        </div>

        {/* Discussion stream and commentary channel messaging section */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[14px] font-bold text-gray-600 dark:text-slate-500 block ml-0.5">
            Discussion
          </label>
          <Comments taskId={task.id} userRole={currentUserRole} />
        </div>

      </div>

      {showConflictModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">{conflictSeverity === "Strong Warning" ? "Strong Assignment Warning" : "Assignment Conflict Detected"}</h3>
            </div>
            <div className={`mb-3 rounded-xl px-3 py-2 text-xs font-bold ${
              conflictSeverity === "Strong Warning"
                ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50"
                : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50"
            }`}>
              {conflictSeverity}
            </div>
            <div className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/60">
              {conflictMessage.split("\n\n").map((message, index) => (
                <p key={index} className="mb-3 last:mb-0 whitespace-pre-line">{message}</p>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowConflictModal(false); setPendingUpdatePayload(null); }}
                className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel Assignment
              </button>
              <button
                onClick={handleConfirmConflict}
                className="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl"
              >
                Assign Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;

