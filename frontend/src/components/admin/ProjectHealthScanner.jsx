import React from "react";
import {  
  AlertCircle,  
  AlertTriangle,  
  CheckCircle2,  
  Clock3,  
  Loader2,  
  TrendingUp,  
  X,  
} from "lucide-react";  
import { useTheme } from "../../context/ThemeContext"; 
 
const StatCard = ({ label, value, icon: Icon, valueClass, isDarkMode }) => {  
  const iconColor =  
    label === "Overdue" 
      ? "text-red-500" 
      : label === "At Risk" 
      ? "text-amber-500" 
      : "text-blue-500"; 
 
  return ( 
    <div 
      className={`rounded-xl border p-4 sm:p-5 min-w-0 ${ 
        isDarkMode 
          ? "bg-[#0B1128] border-[#1E293B]" 
          : "bg-gray-50 border-gray-100" 
      }`} 
    > 
      <div className="flex items-center justify-between gap-2"> 
        <span className="text-[10px] sm:text-xs font-medium text-gray-500"> 
          {label} 
        </span> 
        <Icon size={17} className={iconColor} /> 
      </div> 
      <p className={`mt-2 text-2xl sm:text-3xl font-bold ${valueClass || (isDarkMode ? "text-white" : "text-gray-900")}`}> 
        {value} 
      </p> 
    </div> 
  ); 
}; 
 
const ProjectHealthScanner = ({ 
  healthWorkspace, 
  healthData, 
  healthLoading, 
  healthSummary, 
  getProjectHealth, 
  onClose, 
}) => { 
  const { isDarkMode } = useTheme();
   
  if (!healthWorkspace) return null; 
 
  return ( 
    <div className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-2 sm:p-3 min-[600px]:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"> 
      <div 
        className={`w-full max-w-5xl max-h-[98vh] sm:max-h-[94vh] min-[600px]:max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-xl sm:rounded-2xl shadow-2xl border ${ 
          isDarkMode 
            ? "bg-[#080E22] border-[#1E293B]" 
            : "bg-white border-gray-200" 
        }`} 
      > 
        <div 
          className={`sticky top-0 z-20 px-3 sm:px-5 min-[600px]:px-6 py-3 sm:py-4 min-[600px]:py-5 border-b ${ 
            isDarkMode 
              ? "bg-[#080E22] border-[#1E293B]" 
              : "bg-white border-gray-100" 
          }`} 
        > 
          <div className="flex items-start justify-between gap-3"> 
            <div className="flex items-center gap-2 sm:gap-3 min-w-0"> 
              <div className="min-w-0"> 
                <h2 className={`text-base sm:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}> 
                  Project Health Scanner 
                </h2> 
                <p className="text-[10px] sm:text-xs mt-1 text-gray-500"> 
                  {healthWorkspace.name} 
                </p> 
              </div> 
            </div> 
 
            <button 
              type="button" 
              onClick={onClose} 
              className={`p-1.5 sm:p-2 rounded-lg ${ 
                isDarkMode 
                  ? "text-gray-400 hover:bg-[#172443]" 
                  : "text-gray-400 hover:bg-gray-100" 
              }`} 
            > 
              <X size={18} /> 
            </button> 
          </div> 
        </div> 
 
        {healthLoading ? ( 
          <div className="min-h-[300px] sm:min-h-[380px] px-4 py-10 flex flex-col items-center justify-center text-center"> 
            <Loader2 size={30} className="animate-spin text-blue-500" /> 
            <p className={`mt-4 text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}> 
              Scanning workspace health... 
            </p> 
            <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}> 
              Checking projects, tasks and deadlines 
            </p> 
          </div> 
        ) : ( 
          <div className="p-3 sm:p-5 min-[600px]:p-6"> 
            <div 
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 mb-4 sm:mb-6 ${ 
                healthSummary.status === "Healthy" 
                  ? isDarkMode 
                    ? "bg-emerald-500/5 border-emerald-500/20" 
                    : "bg-emerald-50 border-emerald-100" 
                  : healthSummary.status === "Critical" 
                  ? isDarkMode 
                    ? "bg-red-500/5 border-red-500/20" 
                    : "bg-red-50 border-red-100" 
                  : isDarkMode 
                  ? "bg-amber-500/5 border-amber-500/20" 
                  : "bg-amber-50 border-amber-100" 
              }`} 
            > 
              <div className="flex flex-col min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between gap-4"> 
                <div className="flex items-center gap-2 sm:gap-3 min-w-0"> 
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-[#111936]" : "bg-white"}`}> 
                    {healthSummary.status === "Healthy" ? ( 
                      <CheckCircle2 size={22} className="text-emerald-500" /> 
                    ) : healthSummary.status === "Critical" ? ( 
                      <AlertCircle size={22} className="text-red-500" /> 
                    ) : ( 
                      <AlertTriangle size={22} className="text-amber-500" /> 
                    )} 
                  </div> 
                  <div> 
                    <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500"> 
                      Workspace Health 
                    </p> 
                    <h3 className={`text-base sm:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}> 
                      {healthSummary.status} 
                    </h3> 
                  </div> 
                </div> 
 
                <div className="min-[430px]:text-right"> 
                  <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}> 
                    {healthSummary.progress}% 
                  </p> 
                  <p className="text-[9px] sm:text-xs text-gray-500"> 
                    Overall task completion 
                  </p> 
                </div> 
              </div> 
            </div> 
 
            <div className="grid grid-cols-2 min-[600px]:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6"> 
              {[ 
                ["Projects", healthSummary.totalProjects, TrendingUp], 
                ["Tasks", healthSummary.totalTasks, TrendingUp], 
                ["Overdue", healthSummary.overdueTasks, Clock3, healthSummary.overdueTasks > 0 ? "text-red-500" : ""], 
                ["At Risk", healthSummary.riskyProjects, AlertCircle, healthSummary.riskyProjects > 0 ? "text-amber-500" : ""], 
              ].map(([label, value, icon, valueClass]) => ( 
                <StatCard 
                  key={label} 
                  label={label} 
                  value={value} 
                  icon={icon} 
                  valueClass={valueClass} 
                  isDarkMode={isDarkMode} 
                /> 
              ))} 
            </div> 
 
            <div className="mb-3 sm:mb-4"> 
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}> 
                Project Health 
              </h3> 
              <p className="text-[10px] sm:text-xs mt-1 text-gray-500"> 
                Scanner results for each project 
              </p> 
            </div> 
 
            {healthData.length ? ( 
              <div className="space-y-3"> 
                {healthData.map(project => { 
                  const health = getProjectHealth(project); 
                  const HealthIcon = health.icon; 
                  const progress = Math.min(100, Math.max(0, Number(project.progress || 0))); 
 
                  return ( 
                    <div 
                      key={project.id} 
                      className={`rounded-xl border p-3 sm:p-4 ${ 
                        isDarkMode 
                          ? "bg-[#0B1128] border-[#1E293B]" 
                          : "bg-white border-gray-200" 
                      }`} 
                    > 
                      <div className="flex flex-col min-[600px]:flex-row min-[600px]:items-center gap-3 sm:gap-4"> 
                        <div className="flex-1 min-w-0"> 
                          <div className="flex flex-wrap items-center gap-2"> 
                            <h4 className={`text-sm font-bold break-words ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}> 
                              {project.name} 
                            </h4> 
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${health.className}`}> 
                              <HealthIcon size={10} /> 
                              {health.label} 
                            </span> 
                          </div> 
 
                          <div className="mt-3"> 
                            <div className="flex items-center justify-between gap-3 mb-1"> 
                              <span className="text-[10px] sm:text-[11px] text-gray-500">Progress</span> 
                              <span className={`text-[10px] sm:text-[11px] font-bold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}> 
                                {project.progress || 0}% 
                              </span> 
                            </div> 
                            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-[#17213A]" : "bg-gray-100"}`}> 
                              <div 
                                className={`h-full rounded-full ${ 
                                  health.label === "At Risk" 
                                    ? "bg-red-500" 
                                    : health.label === "Needs Attention" 
                                    ? "bg-amber-500" 
                                    : "bg-emerald-500" 
                                }`} 
                                style={{ width: `${progress}%` }} 
                              /> 
                            </div> 
                          </div> 
                        </div> 
 
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full min-[600px]:w-60 min-[600px]:shrink-0"> 
                          {[ 
                            ["Tasks", project.total || 0, ""], 
                            ["Done", project.completed || 0, "text-emerald-500"], 
                            ["Active", (project.todo || 0) + (project.inProgress || 0), "text-blue-500"], 
                          ].map(([label, value, color]) => ( 
                            <div 
                              key={label} 
                              className={`rounded-lg p-2 sm:p-2.5 text-center ${isDarkMode ? "bg-[#11182B]" : "bg-gray-50"}`} 
                            > 
                              <p className="text-[9px] sm:text-[10px] text-gray-500">{label}</p> 
                              <p className={`mt-1 text-sm font-bold ${color || (isDarkMode ? "text-white" : "text-gray-800")}`}> 
                                {value} 
                              </p> 
                            </div> 
                          ))} 
                        </div> 
                      </div> 
                    </div> 
                  ); 
                })} 
              </div> 
            ) : ( 
              <div 
                className={`rounded-xl border p-6 sm:p-10 text-center ${ 
                  isDarkMode 
                    ? "bg-[#0B1128] border-[#1E293B]" 
                    : "bg-gray-50 border-gray-100" 
                }`} 
              > 
                <CheckCircle2 size={30} className="mx-auto text-emerald-500" /> 
                <p className={`mt-3 text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}> 
                  No projects found 
                </p> 
                <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}> 
                  This workspace does not have any projects to scan. 
                </p> 
              </div> 
            )} 
          </div> 
        )} 
      </div> 
    </div> 
  ); 
}; 
 
export default ProjectHealthScanner;