  import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useEffect, useMemo, useState } from "react";
import WorkspaceCard from "../../components/cards/WorkspaceCard";
import { getMyWorkspace, getMyProjects, getMyTasks } from "../../services/memberService";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, User } from "lucide-react";
const memberWorkspaceCache = new Map();
// Skeleton loader
const Skeleton = ({ dark, className = "" }) => (
  <div className={`${className} rounded-md ${dark ? "bg-slate-800" : "bg-gray-200"}`} />
);

const WorkspacePageSkeleton = ({ isDarkMode }) => (
  <div className={`w-full min-h-screen pt-4 px-4 sm:px-6 lg:px-10 pb-10 overflow-x-hidden animate-pulse ${isDarkMode ? "bg-[#05091D]" : "bg-gray-50/50"}`}>
    <div className="space-y-2 mb-2"><Skeleton dark={isDarkMode} className="h-9 w-56 rounded-lg" /><Skeleton dark={isDarkMode} className="h-4 w-full max-w-2xl" /><Skeleton dark={isDarkMode} className="h-4 w-80" /></div>
    <div className="mt-5 mb-5 flex justify-end gap-6">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} dark={isDarkMode} className="h-6 w-20" />))}</div>
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
      <Skeleton dark={isDarkMode} className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2"><Skeleton dark={isDarkMode} className="h-5 w-48" /><Skeleton dark={isDarkMode} className="h-4 w-3/4" /></div>
      <Skeleton dark={isDarkMode} className="h-8 w-24 rounded-lg hidden sm:block" />
    </div>
  </div>
);
const MemberWorkspace = () => {
  const liveTick = useLiveTick({ resources: ["workspaces", "projects", "tasks"] });
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
const cacheKey = "member-workspace";
const cachedData = memberWorkspaceCache.get(cacheKey);

const [workspace, setWorkspace] = useState(cachedData?.workspace || null);
const [projects, setProjects] = useState(cachedData?.projects || []);
const [tasks, setTasks] = useState(cachedData?.tasks || []);
const [visibleTaskCount, setVisibleTaskCount] = useState(5);
const [activeTab, setActiveTab] = useState(null);
const [showFullDescription, setShowFullDescription] = useState(false);
const [loading, setLoading] = useState(!cachedData);

  // Fetch workspace data
useEffect(() => {
  const cachedData = memberWorkspaceCache.get(cacheKey);

  if (cachedData) {
    setWorkspace(cachedData.workspace || null);
    setProjects(cachedData.projects || []);
    setTasks(cachedData.tasks || []);
    setLoading(false);
  }

  const fetchWorkspaceData = async () => {
    try {
      const [workspaceResponse, projectsResponse, tasksResponse] =
        await Promise.all([
          getMyWorkspace(),
          getMyProjects(),
          getMyTasks(),
        ]);

      const freshData = {
        workspace: workspaceResponse?.workspace || null,
        projects: projectsResponse?.projects || [],
        tasks: tasksResponse?.tasks || [],
      };

      memberWorkspaceCache.set(cacheKey, freshData);

      setWorkspace(freshData.workspace);
      setProjects(freshData.projects);
      setTasks(freshData.tasks);
    } catch (error) {
      console.error("Error fetching Team Member workspace:", error);

      if (!cachedData) {
        setWorkspace(null);
        setProjects([]);
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchWorkspaceData();
}, [liveTick]);

  // Map projects for quick task lookup
  const projectMap = useMemo(
    () => new Map(projects.map(project => [String(project._id || project.id), project])),
    [projects]
  );

  // Build task display data
  const taskRows = useMemo(
    () =>
      tasks.map(task => {
        const projectId = task.project?._id || task.project?.id || task.project;
        const project = projectMap.get(String(projectId));
        return {
          ...task,
          projectName:
            task.project?.projectName ||
            task.project?.title ||
            project?.projectName ||
            project?.title ||
            project?.name ||
            "Unknown Project",
          projectOwner:
            project?.createdBy?.fullName ||
            project?.createdBy?.name ||
            "Unknown Owner",
        };
      }),
    [tasks, projectMap]
  );

  // Build unique workspace access members
  const accessMembers = useMemo(() => {
    const members = new Map();

    const addMember = (person, roles) => {
      if (!person) return;
      const id = person._id || person.id || person.email || person.fullName || person.name;
      if (!id) return;

      const key = String(id);
      const existing = members.get(key);
      if (existing) {
        existing.roles = Array.from(new Set([...existing.roles, ...roles]));
        return;
      }

      members.set(key, {
        id: key,
        name: person.fullName || person.name || "Unknown User",
        email: person.email || "",
        roles: [...roles],
      });
    };

    addMember(user, ["You"]);
    addMember(
      workspace?.projectAdmin || workspace?.createdBy || workspace?.owner,
      ["Workspace Owner"]
    );
    projects.forEach(project =>
      addMember(project.createdBy || project.projectAdmin, ["Project Owner"])
    );

    return Array.from(members.values());
  }, [user, workspace, projects]);

  const tabs = [
    { id: "tasks", label: "Tasks", count: tasks.length },
    { id: "projects", label: "Projects", count: projects.length },
    { id: "access", label: "Access", count: accessMembers.length },
  ];

  // Reset visible tasks when tab changes
  useEffect(() => {
    if (activeTab === "tasks") setVisibleTaskCount(5);
  }, [activeTab]);

  const descriptionText =
    workspace?.description ||
    "This is your personal workspace overview. Here you can track the tasks assigned to you, keep an eye on the projects you're part of, and see who has access to your workspace.";
  const isLongDescription = descriptionText.length > 160;
  const displayedDescription =
    !showFullDescription && isLongDescription
      ? `${descriptionText.slice(0, 160).trim()}...`
      : descriptionText;

   if (loading) {
    return <WorkspacePageSkeleton isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`w-full min-h-screen pt-4 px-4 sm:px-6 lg:px-10 pb-10 transition-colors duration-300 overflow-x-hidden ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50/50 text-gray-900"}`}>
      {/* Page header */}
      <div className="space-y-1 mb-2">
        <div className="max-w-4xl">
          <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            My Workspace
          </h1>
          <div className="mt-1">
            <p className={`text-sm leading-relaxed break-words ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {displayedDescription}
            </p>
            {isLongDescription && (
              <button
                type="button"
                onClick={() => setShowFullDescription(prev => !prev)}
                className="mt-1 font-semibold text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {showFullDescription ? "See less" : "See more"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 mb-5 w-full">
        <div className="flex w-full min-w-0 items-center justify-between gap-1 sm:justify-end sm:gap-6">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex min-w-0 flex-1 items-center justify-center gap-1 px-1 pb-2 text-xs min-[430px]:text-sm font-semibold whitespace-nowrap transition-all duration-200 sm:flex-none sm:gap-2 ${
                  isActive
                    ? isDarkMode ? "text-white" : "text-gray-900"
                    : isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isDarkMode ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"
                }`}>
                  {tab.count}
                </span>
                {isActive && (
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${isDarkMode ? "bg-blue-500" : "bg-gray-900"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace content */}
      <div className="w-full">
        {workspace ? (
          <div className="w-full">
            <WorkspaceCard
              key={workspace._id || workspace.id}
              workspace={workspace}
              userRole="teammember"
              viewMode="list"
            />
          </div>
        ) : (
          <EmptyState message="No workspace assigned to this member." />
        )}

        {activeTab && (
          <div className="mt-8 w-full min-w-0 rounded-2xl border p-4 sm:p-5 shadow-sm overflow-hidden">
            {/* Active section header */}
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {activeTab === "tasks" ? "My Tasks" : activeTab === "projects" ? "My Projects" : "Access"}
                </h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                  {activeTab === "tasks" ? tasks.length : activeTab === "projects" ? projects.length : accessMembers.length}
                </span>
              </div>
            </div>

            {activeTab === "tasks" && (
              <section>
                {!taskRows.length ? (
                  <EmptyState message="No tasks are assigned to you." />
                ) : (
                  <div className="flex flex-col gap-3 w-full min-w-0">
                    {taskRows.slice(0, visibleTaskCount).map(task => (
                      <TaskCard key={task._id || task.id} task={task} isDarkMode={isDarkMode} />
                    ))}
                    {visibleTaskCount < taskRows.length && (
                      <button
                        type="button"
                        onClick={() => setVisibleTaskCount(count => Math.min(count + 5, taskRows.length))}
                        className={`w-full sm:w-auto mx-auto mt-1 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${isDarkMode ? "bg-[#11182B] border-[#263149] text-blue-400 hover:bg-[#18223A] hover:border-blue-500/40" : "bg-white border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200"}`}
                      >
                        Show More Tasks
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}

            {activeTab === "projects" && (
              <section>
                {!projects.length ? (
                  <EmptyState message="No projects are assigned to you." />
                ) : (
                  <div className="flex flex-col gap-3 w-full min-w-0">
                    {projects.map(project => (
                      <ProjectSummaryCard key={project._id || project.id} project={project} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "access" && (
              <section>
                {!accessMembers.length ? (
                  <EmptyState message="No access information is available." />
                ) : (
                  <div className="flex flex-col gap-3 w-full min-w-0">
                    {accessMembers.map(member => (
                      <AccessCard key={member.id} member={member} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Task card
const TaskCard = ({ task, isDarkMode }) => {
  const priorityClass =
    task.priority === "High"
      ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
      : task.priority === "Medium"
      ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
      : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  const taskTitle = task.taskTitle || task.title || "Untitled Task";

  return (
    <div className={`group w-full rounded-2xl border px-5 py-4 transition-all duration-300 hover:shadow-md hover:-translate-y-[1px] hover:border-blue-200 dark:hover:border-blue-500/30 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-bold break-words transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            {taskTitle}
          </h3>
          <p className={`text-xs mt-1 truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {task.projectName || "Unknown Project"}
          </p>
        </div>
        {task.priority && (
          <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${priorityClass}`}>
            {task.priority}
          </span>
        )}
      </div>
    </div>
  );
};

// Project summary card
const ProjectSummaryCard = ({ project, isDarkMode }) => {
  const total = Number(project.tasksCount || project.totalTasks || project.total || 0);
  const completed = Number(project.completedTasks || project.completed || 0);
  const progress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const projectTitle = project.projectName || project.title || project.name || "Untitled Project";

  return (
    <div className={`group w-full rounded-2xl border px-5 py-4 transition-all duration-300 hover:shadow-md hover:-translate-y-[1px] hover:border-blue-200 dark:hover:border-blue-500/30 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-bold truncate transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            {projectTitle}
          </h3>
          <p className={`text-xs mt-1 truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {project.description || "Smart Task Management System"}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {progress}%
        </span>
      </div>
      <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-gray-100"}`}>
        <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

// Access card
const AccessCard = ({ member, isDarkMode }) => (
  <div className={`group w-full rounded-2xl border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-[1px] hover:border-blue-200 dark:hover:border-blue-500/30 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
          <User size={18} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            {member.name}
          </p>
          {member.email && (
            <p className={`text-[11px] truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              {member.email}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:justify-end">
        {member.roles.map(role => <RoleBadge key={role} role={role} />)}
      </div>
    </div>
  </div>
);

// Role badge
const RoleBadge = ({ role }) => {
  const classes =
    role === "Workspace Owner"
      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
      : role === "Project Owner"
      ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
      : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";

  return (
    <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${classes}`}>
      {role === "You" ? "Member" : role}
    </span>
  );
};

// Empty state
const EmptyState = ({ message }) => (
  <div className="w-full flex flex-col items-center justify-center py-14 rounded-2xl border-2 border-dashed bg-gray-50 dark:bg-[#11182B] border-gray-200 dark:border-[#263149]">
    <AlertCircle size={38} className="mb-3 text-gray-300 dark:text-gray-600" />
    <p className="text-sm font-bold text-gray-700 dark:text-white">Nothing to show</p>
    <p className="text-xs text-center px-4 mt-1 text-gray-400 dark:text-gray-500">{message}</p>
  </div>
);

export default MemberWorkspace;
