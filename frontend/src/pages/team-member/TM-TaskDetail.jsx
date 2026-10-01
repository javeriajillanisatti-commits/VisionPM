import React, { useEffect, useRef, useState } from "react";
import { getTaskById, updateTask, updateSubtask } from "../../services/taskService";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Flag,
  Maximize2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import SubTasks from "../../components/tasks/SubTasks";
import UploadFile from "../../components/tasks/UploadFile";
import Comments from "../../components/tasks/Comments";
import { useTheme } from "../../context/ThemeContext";

// Status Dropdown Component
const StatusDropdown = ({ value, onChange, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const options = [
    { value: "Todo", label: "To Do" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) { setOpen(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return {
          label: "text-amber-500",
          selected: isDarkMode ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700",
          pill: "bg-amber-500 text-white",
        };
      case "Completed":
        return {
          label: "text-emerald-500",
          selected: isDarkMode ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700",
          pill: "bg-emerald-500 text-white",
        };
      case "Todo":
      default:
        return {
          label: "text-blue-600",
          selected: isDarkMode ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700",
          pill: "bg-blue-600 text-white",
        };
    }
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button type="button" onClick={() => setOpen((prev) => !prev)} className={`w-full min-w-0 h-10 px-3 rounded-lg border outline-none flex items-center justify-between gap-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-blue-500/40
    ${isDarkMode ? "bg-[#11182B] border-[#263149] hover:border-[#3A4C70]" : "bg-white border-gray-200 hover:border-gray-300"}`}
      >
        <span className={`truncate ${getStatusColor(selectedOption.value).label}`}>
          {selectedOption.label}
        </span>

        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute left-0 right-0 top-full z-50 mt-1.5 w-full min-w-0 overflow-hidden rounded-xl border shadow-lg
            ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
          {options.map((option) => (
            <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full min-w-0 px-3 py-2.5 text-left text-sm font-medium truncate transition-colors
                ${value === option.value
                  ? getStatusColor(option.value).selected
                  : isDarkMode ? "text-gray-300 hover:bg-[#1D2940]" : "text-gray-700 hover:bg-gray-100"}`}
            > {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TaskDetails = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { isDarkMode } = useTheme();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const statusRef = useRef(null);
  // Fetch task
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(taskId); setTask(data.task || data);
      } catch (error) {
        console.error("Error fetching task:", error);
      } finally { setLoading(false); }
    };
    fetchTask();
  }, [taskId]);
  // Keep task data synchronized
  useEffect(() => {
    if (!taskId) return; let cancelled = false; const syncTask = async () => {
      try {
        const data = await getTaskById(taskId); const liveTask = data?.task || data;
        if (!cancelled && liveTask) { setTask((prev) => ({ ...(prev || {}), ...liveTask, subtasks: liveTask.subtasks || [], })); }
      } catch (error) { console.error("Error syncing TM task:", error); }
    };
    const intervalId = setInterval(syncTask, 2000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [taskId]);

  // Open status selector from event
  useEffect(() => {
    const openStatus = () => statusRef.current?.focus();
    window.addEventListener("open-task-status", openStatus);
    return () => window.removeEventListener("open-task-status", openStatus);
  }, []);

  // Calculate progress
  const getStatusProgress = (status) =>
    status === "Completed" ? 100 : status === "In Progress" ? 50 : 0;
  const progress = getStatusProgress(task?.status);
  const subtasks = task?.subtasks || [];
  // Complete subtask
  const handleToggleSubtask = async (id) => {
    const current = subtasks.find((st) => (st.id || st._id) === id);
    if (!current || current.completed) return;
    try {
      const response = await updateSubtask(taskId, id, { completed: true, });
      const updated = response?.subtask || { ...current, completed: true, };
      setTask((prev) => ({ ...prev, ...(response?.taskStatus ? { status: response.taskStatus } : {}), subtasks: subtasks.map((st) => (st.id || st._id) === id ? { ...st, ...updated, completed: true, } : st), }));
    } catch (error) { console.error("Error completing subtask:", error); alert(error?.message || "Unable to complete subtask."); }
  };

  // Update task status
  const handleStatusUpdate = async (newStatus) => {
    try {
      setTask((prev) => ({ ...prev, status: newStatus, }));
      await updateTask(taskId, { status: newStatus, });
    } catch (error) { console.error("Error updating task status:", error); }
  };

  // Shared styles
  const sectionCardStyle = `rounded-2xl border shadow-sm transition-all duration-200 ${isDarkMode ? "bg-[#11182B] border-[#263149] hover:border-[#33466A]" : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"}`;
  const labelStyle = `text-[13px] font-bold tracking-wider mb-2 block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`;
  const valueStyle = `text-sm font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`;

  if (loading) {
    return (
      <div className={`min-h-screen p-10 flex items-center justify-center ${isDarkMode ? "bg-[#05091D] text-gray-300" : "bg-gray-50 text-gray-900"}`}
      >
        Loading task details...</div>);
  }
  if (!task) {
    return (<div className={`min-h-screen p-10 flex items-center justify-center ${isDarkMode ? "bg-[#05091D] text-gray-400" : "bg-gray-50 text-gray-500"}`} >Task not found.</div>);
  }
  const taskTitle = task.taskTitle || task.title || "Task Details";
  const infoItems = [
    {
      label: "Status", icon: (<CheckCircle2 size={16} className="text-blue-500" />),
      content: (<StatusDropdown value={task.status || "Todo"} onChange={handleStatusUpdate} isDarkMode={isDarkMode} statusRef={statusRef} />),
    },
    {
      label: "Priority", icon: (<Flag size={16} className="text-orange-500" />),
      content: (<span className={valueStyle}> {task.priority || "Medium"} </span>),
    },
    {
      label: "Size", icon: (<Maximize2 size={16} className="text-purple-500" />),
      content: (<span className={valueStyle}> {task.size || "M"} </span>),
    },
    {
      label: "Due Date", icon: (<CalendarDays size={16} className="text-green-500" />),
      content: (<span className={valueStyle}> {task.deadline ? task.deadline.substring(0, 10) : "No deadline"} </span>),
    },];
  return (
    <div
      className={`w-full min-h-screen p-4 sm:p-6 lg:p-10 transition-colors duration-300 overflow-x-hidden ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50/60 text-gray-900"}`}
    >
      <div className="w-full max-w-none mx-auto space-y-6 sm:space-y-7">
        {/* Page Header */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={() => navigate(-1)}
            className={`p-3 rounded-xl border transition-all duration-200 shrink-0 ${isDarkMode ? "bg-[#11182B] border-[#263149] text-gray-300 hover:bg-[#18223A] hover:border-[#3A4C70]" : "bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm"}`}
            title="Go back"
          > <ArrowLeft size={20} /> </button>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight break-words ${isDarkMode ? "text-white" : "text-gray-900"}`}> {taskTitle}</h1> </div>
        {/* Description */}
        <section> <span className={labelStyle}> Description</span>
          <div className={`${sectionCardStyle} p-5 sm:p-6`} >
            <p className={`text-sm sm:text-[15px] leading-7 whitespace-pre-wrap [overflow-wrap:anywhere] ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              {task.description || "No description provided for this task."} </p></div>
        </section>

        {/* Task Information */}
        <section> <span className={labelStyle}>Task Information </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className={`${sectionCardStyle} p-4`}>
                <div className="flex items-center gap-2 mb-3"> {item.icon}<span className={`${labelStyle} mb-0`} > {item.label} </span> </div>{item.content}
              </div>
            ))}
          </div>
        </section>

        {/* Overall Progress */}
        <section>
           <div className="flex items-center justify-between mb-3">
          <span className={labelStyle}> Overall Progress </span>
          <span className={`text-sm font-bold ${task.status === "Completed" ? "text-green-500" : task.status === "In Progress" ? "text-amber-500" : "text-blue-600"}`}>
            {progress}% </span> </div>

          <div className={`${sectionCardStyle} p-5`}>
            <div className={`h-3 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-[#263149]" : "bg-gray-100"}`}>
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${task.status === "Completed" ? "bg-green-500" : task.status === "In Progress" ? "bg-amber-500" : "bg-blue-600"}`}
                style={{ width: `${progress}%`, }} /></div>
          </div>
        </section>
        {/* Assigned Subtasks */}
        <section> <span className={labelStyle}> Assigned Subtasks </span>
          <div className={`${sectionCardStyle} p-4 sm:p-5 space-y-1`}>
            {subtasks.length ? (subtasks.map((st) => (
              <SubTasks key={st.id || st._id} title={st.title} completed={st.completed} assignee={st.assignedTo} userRole="teammember" onToggle={() =>
                handleToggleSubtask(st.id || st._id)} />))
            ) : (
              <p className={`text-sm py-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} > No subtasks assigned. </p>)} </div> </section>
        {/* Files and Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
           <UploadFile />
            <Comments taskId={taskId} /> </div>
      </div>
    </div>
  );
};

export default TaskDetails;