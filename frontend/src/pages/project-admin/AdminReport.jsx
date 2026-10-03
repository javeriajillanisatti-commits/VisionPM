import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import { getAllWorkspaces } from "../../services/workspaceService";
import { getDashboardProjects } from "../../services/projectService";
import { getDashboardTasks } from "../../services/taskService";
import DownloadButton from "../../components/buttons/DownloadButton";
import TaskPriorityChart from "../../components/cards/dashboard/TaskPriorityChart";
import StatsCard from "../../components/cards/StatsCard";
import TeamMemberPerformance from "../../components/cards/report/TeamMemberPerformance";
import {
  ClipboardList, CheckCircle, Clock, AlertCircle,
  FolderKanban, CalendarRange, ChevronDown
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const INPROGRESS_STATUSES = ["in progress", "inprogress"];
const PENDING_STATUSES = ["todo", "to do", "pending"];

const normalizeStatus = status =>
  String(status || "").toLowerCase().replace(/[\s_-]+/g, " ").trim();

const isStatus = (task, list) => list.includes(normalizeStatus(task.status));

const getTaskDate = task => {
  const value = task.dueDate || task.deadline || task.endDate || task.createdAt;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getAssignedUserIds = task => {
  const values = [
    task.assignedTo, task.assignee, task.assignedUser, task.user,
    task.assignedMember, task.teamMember, task.assignedToUser
  ];

  const extract = value => {
    if (!value) return [];
    if (typeof value === "string" || typeof value === "number") return [String(value)];
    if (Array.isArray(value)) return value.flatMap(extract);
    if (typeof value !== "object") return [];
    const id = value._id || value.id || value.userId || value.memberId ||
      value.user?._id || value.user?.id;
    return id ? [String(id)] : [];
  };

  return [...new Set(values.flatMap(extract))];
};

const getProjectId = project => project?._id || project?.id;
const getProjectWorkspaceId = project =>
  project?.workspace?._id || project?.workspace?.id || project?.workspace;
const getTaskProjectId = task => task.project?._id || task.project?.id || task.project;

const HEALTH_STYLES = {
  red: { text: "text-red-500", badge: "bg-red-50 text-red-600", border: "border-l-red-500" },
  yellow: { text: "text-yellow-500", badge: "bg-yellow-50 text-yellow-600", border: "border-l-yellow-500" },
  green: { text: "text-green-500", badge: "bg-green-50 text-green-600", border: "border-l-green-500" },
  gray: { text: "text-gray-400", badge: "bg-gray-50 text-gray-500", border: "border-l-gray-300" }
};

const AdminReport = () => {
  const liveTick = useLiveTick({ resources: ["projects", "tasks", "users", "workspaces"] });
  const { activeWorkspace } = useWorkspace();
  const { isDarkMode } = useTheme();

  const [selectedProject, setSelectedProject] = useState("All");
  const [dateRange, setDateRange] = useState("all");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectOpen, setProjectOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  const storedWorkspace = useMemo(() => {
    try {
      const saved = localStorage.getItem("activeWorkspace");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error reading active workspace:", error);
      return null;
    }
  }, []);

  const currentWorkspace = activeWorkspace || storedWorkspace;
  const workspaceId =
    currentWorkspace?.id || currentWorkspace?._id || currentWorkspace?.workspaceId || null;


  const loadData = useCallback(async showLoader => {
    try {
      if (showLoader) setLoading(true);
      const token = sessionStorage.getItem("token");

      const [, projectRes, taskRes, userRes] = await Promise.all([
        getAllWorkspaces(workspaceId),
        getDashboardProjects(workspaceId),
        getDashboardTasks(workspaceId),
        axios.get(`${process.env.REACT_APP_API_URL}/api/users?workspaceId=${workspaceId || ""}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const projectList = Array.isArray(projectRes) ? projectRes : projectRes?.projects || [];
      const allTasks = taskRes?.tasks || [];
      let workspaceTasks = allTasks;

      if (workspaceId) {
        const ids = projectList
          .filter(project => String(getProjectWorkspaceId(project)) === String(workspaceId))
          .map(project => String(getProjectId(project)));
        workspaceTasks = allTasks.filter(task => ids.includes(String(getTaskProjectId(task))));
      }

      setProjects(projectList);
      setTasks(workspaceTasks);
      setUsers(userRes?.data?.users || []);

      setSelectedProject(current =>
        current === "All" ||
        projectList.some(project => String(getProjectId(project)) === String(current))
          ? current
          : "All"
      );
    } catch (error) {
      console.error("Report load error:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [workspaceId, liveTick]);

  useEffect(() => {
  loadData(true);
}, [loadData]);

  const projectList = useMemo(
    () =>
      workspaceId
        ? projects.filter(project => String(getProjectWorkspaceId(project)) === String(workspaceId))
        : projects,
    [projects, workspaceId]
  );

  
  const isTaskInDateRange = useCallback(task => {
    if (dateRange === "all") return true;
    const taskDate = getTaskDate(task);
    if (!taskDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === "week") {
      const start = new Date(today);
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return taskDate >= start && taskDate <= end;
    }

    if (dateRange === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return taskDate >= start && taskDate <= end;
    }

    return true;
  }, [dateRange]);

  const applyProjectFilter = useCallback(
    list =>
      selectedProject === "All"
        ? list
        : list.filter(task => String(getTaskProjectId(task)) === String(selectedProject)),
    [selectedProject]
  );


  const filteredData = useMemo(() => {
    const filteredTasks = applyProjectFilter(tasks.filter(isTaskInDateRange));

    const inProgress = filteredTasks.filter(task => isStatus(task, INPROGRESS_STATUSES)).length;
    const pending = filteredTasks.filter(task => isStatus(task, PENDING_STATUSES)).length;
    const completed = filteredTasks.filter(task => normalizeStatus(task.status) === "completed").length;

    const chartData = ["High", "Medium", "Low"].map(priority => ({
      name: `${priority} Priority`,
      value: filteredTasks.filter(task => task.priority === priority).length
    }));

    const teamStats = users
      .filter(user =>
        ["teammember", "member"].includes(
          String(user.role || "").toLowerCase().replace(/[\s_-]+/g, "")
        )
      )
      .map(user => {
        const userId = String(user._id || user.id || user.userId || "");
        const memberTasks = filteredTasks.filter(task =>
          getAssignedUserIds(task).includes(userId)
        );
        const name = user.fullName || user.name || user.username || user.email || "Team Member";

        return {
          name,
          initial: name.charAt(0).toUpperCase(),
          assigned: memberTasks.length,
          completed: memberTasks.filter(task => normalizeStatus(task.status) === "completed").length,
          inProgress: memberTasks.filter(task => isStatus(task, INPROGRESS_STATUSES)).length,
          pending: memberTasks.filter(task => isStatus(task, PENDING_STATUSES)).length
        };
      });

    return { total: filteredTasks.length, completed, inProgress, pending, chartData, teamStats };
  }, [tasks, users, applyProjectFilter, isTaskInDateRange]);

  
  const projectHealth = useMemo(() => {
    const healthTasks = applyProjectFilter(tasks.filter(isTaskInDateRange));
    const total = healthTasks.length;

    if (!total) return { score: 0, status: "No Data", color: "gray", completed: 0, overdue: 0 };

    const completed = healthTasks.filter(task => normalizeStatus(task.status) === "completed").length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = healthTasks.filter(task => {
      if (normalizeStatus(task.status) === "completed") return false;
      const value = task.dueDate || task.deadline || task.endDate;
      if (!value) return false;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      date.setHours(0, 0, 0, 0);
      return date < today;
    }).length;

    const score = Math.round((completed / total) * 100);
    const overdueRate = (overdue / total) * 100;

    let status = "Healthy", color = "green";
    if (score < 40 || overdueRate > 40) { status = "Critical"; color = "red"; }
    else if (score < 70 || overdueRate > 0) { status = "At Risk"; color = "yellow"; }

    return { score, status, color, completed, overdue };
  }, [tasks, applyProjectFilter, isTaskInDateRange]);

  const reportWorkspaceName = currentWorkspace?.name || currentWorkspace?.workspaceName || "Workspace";

  const selectedProjectData = projectList.find(
    project => String(getProjectId(project)) === String(selectedProject)
  );

  const selectedProjectName =
    selectedProject === "All"
      ? "All projects"
      : selectedProjectData?.projectName || selectedProjectData?.name || "Project";

  const reportDateRangeName =
    dateRange === "week" ? "This week" : dateRange === "month" ? "This month" : "All dates";

 
const handleDownload = () => {
  const doc = new jsPDF();

  const safeName = String(selectedProjectName || "Report")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-");

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 54, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Executive Performance Report", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Workspace: ${reportWorkspaceName}`, 14, 30);
  doc.text(`Project: ${selectedProjectName}`, 14, 37);
  doc.text(`Date range: ${reportDateRangeName}`, 14, 44);

  doc.setTextColor(15, 23, 42);

  // Task Performance
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("1. Task Performance", 14, 66);

  autoTable(doc, {
    startY: 72,
    head: [["Task performance", "Value"]],
    body: [
      ["Total tasks", filteredData.total],
      ["Completed", filteredData.completed],
      ["In progress", filteredData.inProgress],
      ["Pending", filteredData.pending]
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      textColor: [51, 65, 85]
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4
    },
    margin: {
      left: 14,
      right: 14
    }
  });

  // Project Health
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Project Health", 14, doc.lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 21,
    head: [["Project health", "Value"]],
    body: [
      ["Health score", `${projectHealth.score}%`],
      ["Status", projectHealth.status],
      ["Completed tasks", projectHealth.completed],
      ["Overdue tasks", projectHealth.overdue]
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      textColor: [51, 65, 85]
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4
    },
    margin: {
      left: 14,
      right: 14
    }
  });

  // Team Member Performance
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Team Member Performance", 14, doc.lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 21,
    head: [["Team member", "Assigned", "Completed", "In progress", "Pending"]],
    body: filteredData.teamStats.length
      ? filteredData.teamStats.map(m => [
          m.name,
          m.assigned,
          m.completed,
          m.inProgress,
          m.pending
        ])
      : [["No team data available.", "", "", "", ""]],
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      textColor: [51, 65, 85]
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3.5
    },
    margin: {
      left: 14,
      right: 14
    }
  });

  doc.save(`VisionPM-${safeName}-Report.pdf`);
};

  
  if (loading) {
    const skeleton = isDarkMode ? "bg-[#111A36]" : "bg-gray-200";
    const card = isDarkMode ? "bg-[#0B1128] border-[#1E293B]" : "bg-white border-gray-100";

    return (
      <div className={`min-h-screen w-full px-3 sm:px-6 lg:px-10 pt-4 pb-6 ${isDarkMode ? "bg-[#05091D]" : "bg-gray-50"}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex flex-col min-[500px]:flex-row justify-between gap-3">
            <div className="space-y-2">
              <div className={`h-8 w-32 rounded-lg ${skeleton}`} />
              <div className={`h-4 w-72 rounded-md ${skeleton}`} />
            </div>
            <div className={`h-10 w-36 rounded-xl ${skeleton}`} />
          </div>
          <div className={`h-16 rounded-2xl border ${card}`} />
          <div className={`h-24 rounded-2xl border ${card}`} />
          <div className={`h-[300px] rounded-[2rem] border ${card}`} />
          <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className={`h-24 rounded-2xl border ${card}`} />)}
          </div>
          <div className={`h-[380px] rounded-[2rem] border ${card}`} />
        </div>
      </div>
    );
  }

  
  const inputClass = `border rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold outline-none ${
    isDarkMode
      ? "bg-[#11182B] border-[#263149] text-gray-200 focus:border-blue-500"
      : "bg-white border-gray-200 text-gray-700 focus:border-blue-400"
  }`;

  const dropdownClass = isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200";

  const optionClass = selected =>
    selected
      ? "bg-blue-600 text-white"
      : isDarkMode ? "text-gray-300 hover:bg-[#1B253B]" : "text-gray-700 hover:bg-gray-100";

  const health = HEALTH_STYLES[projectHealth.color] || HEALTH_STYLES.gray;

  const dateRangeOptions = [
    ["all", "All dates"],
    ["week", "This week"],
    ["month", "This month"]
  ];

  const statCards = [
    ["Total tasks", filteredData.total, <ClipboardList size={20} />, "purple"],
    ["Completed", filteredData.completed, <CheckCircle size={20} />, "green"],
    ["In progress", filteredData.inProgress, <Clock size={20} />, "orange"],
    ["Pending", filteredData.pending, <AlertCircle size={20} />, "blue"]
  ];

  return (
    <div className={`screen-report w-full max-w-full overflow-x-hidden px-3 sm:px-6 lg:px-10 pt-3 pb-5 ${isDarkMode ? "bg-[#05091D]" : "bg-gray-50"}`}>
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col min-[500px]:flex-row justify-between items-start min-[500px]:items-center gap-3 mb-3 sm:mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Report</h1>
            <p className={`mt-1.5 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              A detailed breakdown of your project's progress.
            </p>
          </div>
          <div className="shrink-0 self-start min-[500px]:self-auto w-full min-[500px]:w-auto min-w-[140px]">
            <DownloadButton text="Download" onClick={handleDownload} />
          </div>
        </div>

        {/* Filters */}
        <div className={`p-0 sm:p-3 sm:rounded-2xl sm:border sm:shadow-sm mb-3 sm:mb-4 ${isDarkMode ? "sm:bg-[#0B1128] sm:border-[#1E293B]" : "sm:bg-white sm:border-gray-100"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-start lg:items-center justify-between gap-3">
            {/* Project filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto min-w-0">
              <label className={`text-sm sm:text-base font-bold flex items-center gap-1.5 shrink-0 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                <FolderKanban size={17} /> Project
              </label>
              <div className="relative w-full sm:w-60 lg:w-64">
                <button
                  type="button"
                  onClick={() => { setProjectOpen(v => !v); setDateRangeOpen(false); }}
                  className={`${inputClass} w-full h-10 sm:h-11 flex items-center justify-between gap-2 text-left`}
                >
                  <span className="truncate">{selectedProjectName}</span>
                  <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${projectOpen ? "rotate-180" : ""}`} />
                </button>

                {projectOpen && (
                  <div className={`absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border shadow-lg ${dropdownClass}`}>
                    <button
                      type="button"
                      onClick={() => { setSelectedProject("All"); setProjectOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm ${optionClass(selectedProject === "All")}`}
                    >
                      All projects
                    </button>
                    {projectList.map(project => {
                      const projectId = getProjectId(project);
                      const projectName = project.projectName || project.name;
                      return (
                        <button
                          key={projectId}
                          type="button"
                          onClick={() => { setSelectedProject(String(projectId)); setProjectOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm ${optionClass(String(selectedProject) === String(projectId))}`}
                        >
                          <span className="block truncate">{projectName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Date range filter */}
            <div className="w-full lg:w-80 lg:flex-none min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className={`text-sm sm:text-base font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <CalendarRange size={17} /> Date range
                </label>
                <div className="relative w-full sm:w-60 lg:w-full">
                  <button
                    type="button"
                    onClick={() => { setDateRangeOpen(v => !v); setProjectOpen(false); }}
                    className={`${inputClass} w-full h-10 sm:h-11 flex items-center justify-between gap-2 text-left`}
                  >
                    <span className="truncate">{reportDateRangeName}</span>
                    <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${dateRangeOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dateRangeOpen && (
                    <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden ${dropdownClass}`}>
                      {dateRangeOptions.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => { setDateRange(value); setDateRangeOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm ${optionClass(dateRange === value)}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project health */}
        <div className={`flex flex-col min-[600px]:flex-row min-[600px]:items-center justify-between gap-3 px-3 sm:px-4 py-2.5 rounded-2xl border-l-4 shadow-sm mb-3 sm:mb-4 overflow-x-auto ${isDarkMode ? "bg-[#0B1128] border-y-[#1E293B] border-r-[#1E293B]" : "bg-white border-y-gray-100 border-r-gray-100"} ${health.border}`}>
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>Project health</h3>
            <p className="text-[9px] sm:text-[11px] text-gray-500">Based on completion and overdue tasks</p>
          </div>

          <div className="grid grid-cols-3 min-[600px]:flex items-center gap-2 min-[600px]:gap-4 sm:gap-5 shrink-0">
            <div className="text-center min-[700px]:text-right">
              <p className={`text-lg sm:text-xl font-bold ${health.text}`}>{projectHealth.score}%</p>
              <p className="text-[9px] sm:text-xs font-bold text-gray-400">Health score</p>
            </div>
            <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold text-center ${health.badge}`}>
              {projectHealth.status}
            </div>
            <div className="text-center min-[700px]:text-right text-[9px] sm:text-[10px] font-bold text-gray-500 whitespace-nowrap">
              {projectHealth.completed} completed • {projectHealth.overdue} overdue
            </div>
          </div>
        </div>

        <div className="w-full mb-3 sm:mb-4">
          <TaskPriorityChart data={filteredData.chartData} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          {statCards.map(([title, count, icon, color]) => (
            <StatsCard
              key={title}
              title={title}
              count={count}
              icon={icon}
              bgColor={isDarkMode ? `bg-${color}-500/10` : `bg-${color}-50`}
              iconColor={isDarkMode ? `text-${color}-400` : `text-${color}-600`}
            />
          ))}
        </div>

        <TeamMemberPerformance teamStats={filteredData.teamStats} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default AdminReport;
