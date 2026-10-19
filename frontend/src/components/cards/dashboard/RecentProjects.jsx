import React, { useState } from "react";
import {
  BriefcaseBusiness,
  ArrowRight,
  FolderClock,
  FolderKanban,
  FolderCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";

export const ProjectsOverview = ({ projects = [] }) => {
  const [activeTab, setActiveTab] = useState("Recent Projects");
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const tabs = ["Recent Projects", "Ongoing Projects", "Completed Projects"];
  const tabIcons = {
    "Recent Projects": FolderClock,
    "Ongoing Projects": FolderKanban,
    "Completed Projects": FolderCheck,
  };

  const parseSafeDate = value => {
    if (!value) return "N/A";
    const date = new Date(value);
    return isNaN(date.getTime())
      ? value.toString().substring(0, 10)
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const getTaskProgress = status => {
    const value = status?.toString().trim().toLowerCase();
    return value === "completed"
      ? 100
      : ["in progress", "inprogress", "in-progress"].includes(value)
      ? 50
      : 0;
  };

  const getProjectProgress = project => {
    const tasks = project.tasks || project.projectTasks || project.taskList;

    if (Array.isArray(tasks) && tasks.length) {
      return Math.min(
        100,
        Math.max(
          0,
          Math.round(
            tasks.reduce((sum, task) => sum + getTaskProgress(task.status), 0) /
              tasks.length
          )
        )
      );
    }

    const todo = Math.max(
      0,
      Number(project.todo ?? project.toDo ?? project.todoTasks ?? 0) || 0
    );
    const inProgress = Math.max(
      0,
      Number(
        project.inProgress ??
          project.inprogress ??
          project.inProgressTasks ??
          0
      ) || 0
    );
    const completed = Math.max(
      0,
      Number(project.completed ?? project.completedTasks ?? 0) || 0
    );
    const total = todo + inProgress + completed;

    return total
      ? Math.min(
          100,
          Math.max(0, Math.round((inProgress * 50 + completed * 100) / total))
        )
      : 0;
  };

  const getWorkspaceId = project =>
    project.workspaceId ||
    project.workspace?._id ||
    project.workspace?.id ||
    project.workspace ||
    null;

  const getStatusStyle = status => {
    const value = (status || "Planning").toString().trim().toLowerCase();

    if (value === "completed")
      return isDarkMode
         ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
         : "bg-blue-50 text-blue-600 border-blue-200/80";

    if (["in progress", "inprogress", "in-progress"].includes(value))
      return isDarkMode
        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
        : "bg-amber-50 text-amber-600 border-amber-200/80";

    return isDarkMode
      ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
      : "bg-indigo-50 text-indigo-600 border-indigo-200/80";
  };

  const formatLabel = label =>
    label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  const handleViewAll = () => {
    const workspaceId = projects[0] && getWorkspaceId(projects[0]);
    if (!workspaceId)
      return console.warn("Workspace ID is missing. Cannot open Projects page.");

    navigate(`/project-admin/manage-workspaces/${workspaceId}`);
  };

  const handleProjectClick = project => {
    const projectId = project._id || project.id || project.projectId;
    const workspaceId = getWorkspaceId(project);

    if (!projectId || !workspaceId)
      return console.warn(
        `${!projectId ? "Project" : "Workspace"} ID is missing. Cannot open project details.`
      );

    navigate(
      `/project-admin/manage-workspaces/${workspaceId}/projects/${projectId}`
    );
  };

  const filteredProjects = projects.filter(project => {
    const value = (project.status || "Planning").toString().trim().toLowerCase();

    if (activeTab === "Completed Projects") return value === "completed";
    if (activeTab === "Ongoing Projects")
      return ["in progress", "inprogress", "planning"].includes(value);

    return true;
  });

  const emptyMessages = {
    "Recent Projects": [
      "No projects found",
      "Projects created in this workspace will appear here.",
    ],
    "Ongoing Projects": [
      "No ongoing projects found",
      "Projects currently in progress will appear here.",
    ],
    "Completed Projects": [
      "No completed projects found",
      "Completed projects will appear here.",
    ],
  };

  const [emptyMessage, emptyDescription] = emptyMessages[activeTab];

  return (
    <div className={`rounded-[1.25rem] border overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 w-full min-h-[520px] sm:min-h-[560px] p-4 sm:p-6 lg:p-8 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
      <div className="flex items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div>
          <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Projects Overview
          </h3>
          <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Track and manage all projects in one place
          </p>
        </div>

        {projects.length > 0 && (
          <button
            type="button"
            onClick={handleViewAll}
            className={`group flex items-center gap-1.5 text-xs sm:text-sm font-semibold shrink-0 ${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
          >
            View all
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 mb-5 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tabIcons[tab];
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-[12px] font-bold whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === tab ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md shadow-blue-900/30" : isDarkMode ? "bg-[#1A2338] text-gray-300 hover:bg-[#263149]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <Icon size={14} strokeWidth={2} />
              {formatLabel(tab)}
            </button>
          );
        })}
      </div>

      <div className="w-full overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="min-w-[960px] w-full">
            <div className={`grid grid-cols-[minmax(280px,1fr)_130px_220px_150px_60px] gap-4 px-5 pb-3 text-xs sm:text-sm font-semibold tracking-wide border-b ${isDarkMode ? "text-gray-400 border-[#263149]" : "text-gray-500 border-gray-200"}`}>
              <div>Project title</div>
              <div>Status</div>
              <div>Progress</div>
              <div className="text-right">Date created</div>
              <div className="text-right">Action</div>
            </div>

            <div className="mt-3 space-y-2 min-h-[300px] sm:min-h-[360px]">
              {filteredProjects.length ? (
                filteredProjects.map((project, index) => {
                  const progress = getProjectProgress(project);
                  const status = project.status || "Planning";
                  const name =
                    project.projectName || project.title || "Unnamed project";

                  return (
                    <div
                      key={project._id || project.id || index}
                      className={`group grid grid-cols-[minmax(280px,1fr)_130px_220px_150px_60px] gap-4 items-center w-full min-w-[960px] px-5 py-3.5 rounded-xl border transition-all ${isDarkMode ? "bg-[#1e293b]/60 border-[#334155]/70 hover:bg-[#1e293b]" : "bg-gray-50/50 border-gray-200/60 hover:bg-gray-100"}`}
                    >
                      <div className={`font-bold text-sm truncate transition-colors ${isDarkMode ? "text-gray-200 group-hover:text-blue-400" : "text-gray-800 group-hover:text-blue-600"}`} title={name}>
                        {name}
                      </div>

                      <div className="w-[130px]">
                        <span className={`inline-flex items-center justify-center min-h-[26px] px-3 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${getStatusStyle(status)}`}>
                          {formatLabel(status)}
                        </span>
                      </div>

                      <div className="w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-[165px] h-2.5 rounded-full overflow-hidden ${isDarkMode ? "bg-[#263149]" : "bg-gray-200"}`}>
                            <div
                             className={`h-full rounded-full bg-gradient-to-r ${progress === 100 ? "from-emerald-400 to-emerald-500" : progress === 50 ? "from-amber-400 to-amber-500" : progress > 0 ? "from-blue-400 to-blue-500" : isDarkMode ? "from-gray-600 to-gray-600" : "from-gray-300 to-gray-300"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold w-9 text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {progress}%
                          </span>
                        </div>
                      </div>

                      <div className={`w-[150px] text-right text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {parseSafeDate(project.createdAt || project.startDate)}
                      </div>

                      <div className="w-[60px] text-right">
                        <button
                          type="button"
                          onClick={() => handleProjectClick(project)}
                          title="Open project"
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${isDarkMode ? "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}
                        >
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`min-h-[300px] sm:min-h-[360px] flex flex-col items-center justify-center text-center px-6 rounded-xl border ${isDarkMode ? "bg-[#182238] border-[#263149]" : "bg-gray-50 border-gray-100"}`}>
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-blue-500/10" : "bg-blue-50"}`}>
                    <BriefcaseBusiness size={23} className="text-blue-500" />
                  </div>
                  <h4 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {emptyMessage}
                  </h4>
                  <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {emptyDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsOverview;