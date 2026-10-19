import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MousePointerClick } from "lucide-react";
import { getMyProjects } from "../../services/memberService";
import { getMyContribution } from "../../services/contributionService";
import ContributionHeader from "../../components/contribution/ContributionHeader";
import ContributionMap from "../../components/contribution/ContributionMap";
import ContributionDetails from "../../components/contribution/ContributionDetails";
import { useTheme } from "../../context/ThemeContext";

//  Skeleton loader
const Skeleton = ({ dark, className = "" }) => (
  <div className={`${className} rounded-md ${dark ? "bg-slate-800" : "bg-gray-200"}`} />
);

const ContributionMapSkeleton = ({ isDarkMode }) => (
  <div className={`border rounded-3xl shadow-sm p-6 h-full min-h-[300px] animate-pulse flex flex-col gap-5 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
    <div className="flex items-center gap-3">
      <Skeleton dark={isDarkMode} className="w-12 h-12 rounded-full" />
      <Skeleton dark={isDarkMode} className="h-5 w-40" />
    </div>
    <Skeleton dark={isDarkMode} className="flex-1 min-h-[200px] w-full rounded-2xl" />
  </div>
);

const emptyProfile = { fullName: "", profilePic: "" };
const tmContributionProjectsCache = new Map();
const tmContributionDataCache = new Map();

const TMContribution = () => {
  const liveTick = useLiveTick({ resources: ["projects", "tasks"] });
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const cachedProjects = tmContributionProjectsCache.get("my-projects");

const [projects, setProjects] = useState(cachedProjects || []);
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => sessionStorage.getItem("tmContributionProjectId") || ""
  );
  const contributionCacheKey =
  selectedProjectId || "no-project";

const cachedContribution =
  tmContributionDataCache.get(contributionCacheKey);

const [profile, setProfile] = useState(
  cachedContribution?.profile || emptyProfile
);
const [tasks, setTasks] = useState(
  cachedContribution?.tasks || []
);
const [selectedTask, setSelectedTask] = useState(null);
const [loading, setLoading] = useState(!cachedContribution);
  const [error, setError] = useState("");

  useEffect(() => {
  const fetchProjects = async () => {
    const cachedData = tmContributionProjectsCache.get("my-projects");

    if (cachedData) {
      setProjects(cachedData);
    }

    try {
      setError("");

      const list = (await getMyProjects()).projects || [];

      tmContributionProjectsCache.set("my-projects", list);
      setProjects(list);

      const saved = sessionStorage.getItem(
        "tmContributionProjectId"
      );

      const exists = list.some(
        (project) => project._id === saved
      );

      if (exists) {
        setSelectedProjectId(saved);
      } else if (list.length) {
        setSelectedProjectId(list[0]._id);
        sessionStorage.setItem(
          "tmContributionProjectId",
          list[0]._id
        );
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Unable to load your projects.");

      if (!cachedData) {
        setProjects([]);
      }
    }
  };

  fetchProjects();
}, []);
// Load contribution data
useEffect(() => {
  if (!selectedProjectId) {
    setTasks([]);
    setSelectedTask(null);
    setProfile(emptyProfile);
    setLoading(false);
    return;
  }

  const cacheKey = selectedProjectId;
  const cachedData = tmContributionDataCache.get(cacheKey);

  if (cachedData) {
    setProfile(cachedData.profile || emptyProfile);
    setTasks(cachedData.tasks || []);
    setLoading(false);

    return;
  }

  const fetchContribution = async () => {
    try {
      setLoading(true);
      setError("");
      setSelectedTask(null);

      const data = await getMyContribution(selectedProjectId);

      const contributionData = {
        profile: data.profile || emptyProfile,
        tasks: data.tasks || [],
      };

      tmContributionDataCache.set(cacheKey, contributionData);

      setProfile(contributionData.profile);
      setTasks(contributionData.tasks);
    } catch (err) {
      console.error("Error fetching contribution:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to load contribution data."
      );
      setProfile(emptyProfile);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  fetchContribution();
}, [selectedProjectId]);

  // Handle project and task selection
  const handleNodeClick = taskId => setSelectedTask(tasks.find(t => t._id === taskId) || null);
  const handleProjectChange = id => {
    setSelectedProjectId(id);
    setSelectedTask(null);
    sessionStorage.setItem("tmContributionProjectId", id);
  };
 useEffect(() => {
  if (!liveTick || !selectedProjectId) return;

  getMyContribution(selectedProjectId)
    .then(data => {
      const contributionData = {
        profile: data.profile || emptyProfile,
        tasks: data.tasks || [],
      };

      tmContributionDataCache.set(
        selectedProjectId,
        contributionData
      );

      setProfile(contributionData.profile);
      setTasks(contributionData.tasks);
    })
    .catch(error => {
      console.error("Error refreshing contribution:", error);
    });
}, [liveTick, selectedProjectId]);
  // Open task details
  const handleViewDetails = task => {
    if (!task?._id) return;
    const project = projects.find(p => p._id === selectedProjectId);
    const workspaceId =
      task.workspaceId || task.workspace?._id || task.workspace ||
      project?.workspaceId || project?.workspace?._id || project?.workspace;
    const projectId =
      task.projectId || task.project?._id || task.project || selectedProjectId;

    if (!workspaceId || !projectId) {
      console.error("Workspace or project ID missing:", { task, project });
      return;
    }

    navigate(`/team-member/tm-workspace/${workspaceId}/projects/${projectId}/tasks/${task._id}`);
  };

  const placeholder = (
    <div className={`border rounded-2xl p-6 shadow-sm h-full min-h-[300px] flex flex-col items-center justify-center text-center ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDarkMode ? "bg-blue-950/50" : "bg-blue-50"}`}>
        <MousePointerClick size={24} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
      </div>
      <h3 className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>Select a Task</h3>
      <p className={`text-xs mt-1 max-w-[220px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
        Click any task on the contribution map to view its details.
      </p>
    </div>
  );

  const emptyMap = message => (
    <div className={`border rounded-3xl shadow-sm min-h-[300px] h-full flex items-center justify-center ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
      {message && <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{message}</p>}
    </div>
  );

  // Render main content
  const content = loading ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2"><ContributionMapSkeleton isDarkMode={isDarkMode} /></div>
      <div>{placeholder}</div>
    </div>
  ) : !selectedProjectId ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <div className="lg:col-span-2">{emptyMap()}</div>
      <div>{placeholder}</div>
    </div>
  ) : !tasks.length ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <div className="lg:col-span-2">{emptyMap("No tasks available for this project.")}</div>
      <div>{placeholder}</div>
    </div>
  ) : (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <div className="lg:col-span-2">
        <ContributionMap tasks={tasks} profile={profile} onNodeClick={handleNodeClick} />
      </div>
      <div>
        {selectedTask ? (
          <ContributionDetails
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onViewDetails={handleViewDetails}
          />
        ) : placeholder}
      </div>
    </div>
  );

  return (
    <div className={`w-full min-h-screen px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6 lg:px-10 lg:pt-4 lg:pb-10 space-y-6 transition-colors duration-300 ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"}`}>
      <ContributionHeader
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={handleProjectChange}
      />

      {error && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${isDarkMode ? "bg-red-950/40 border-red-900 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
          {error}
        </div>
      )}

      {content}
    </div>
  );
};

export default TMContribution;
