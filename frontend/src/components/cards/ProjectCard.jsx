import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { User2, Calendar, AlertCircle } from "lucide-react";
import ActionControls from "../buttons/ActionControls";

const ProjectCard = ({ project, userRole = "projectmanager", onEdit, onDelete, onManageMembers, viewMode = "grid",}) => {
  const { workspaceId } = useParams();
  const [showFullDescription] = useState(false);

  const { _id, id, projectName, title, description, status, startDate, endDate, managerName, createdBy, projectManager, members, } = project;
  const tasksCount = project.tasksCount || project.total || 0;
  const completedTasks = project.completedTasks || project.completed || 0;
  const currentId = _id || id;
  const currentTitle = projectName || title;
  const progressPercentage = tasksCount
    ? Math.round((completedTasks / tasksCount) * 100)
    : 0;

  const cleanRole = userRole.toString().toLowerCase().replace(/\s+/g, "");
  const isAdmin = cleanRole === "projectadmin";
  const isManager = cleanRole === "projectmanager";
  const isTeamMember = ["teammember", "member"].includes(cleanRole);
  const isListView = viewMode === "list";

  const targetPath = isAdmin
    ? `/project-admin/manage-workspaces/${workspaceId}/projects/${currentId}`
    : isManager
      ? `/project-manager/workspaces/${workspaceId}/projects/${currentId}`
      : `/team-member/tm-workspace/${workspaceId}/projects/${currentId}`;

  const formatDateForCard = date => {
    if (!date) return "N/A";
    const value = new Date(date);
    return isNaN(value.getTime()) ? "N/A" : value.toISOString().split("T")[0];
  };

  const getStatusBadgeStyle = value => {
    const s = value?.toString().toLowerCase() || "planning";
    if (s.includes("progress")) return "text-amber-500 border border-amber-200";
    if (s.includes("complete")) return "text-emerald-500 border border-emerald-200";
    if (s.includes("hold")) return "text-gray-500 border border-gray-200";
    if (s.includes("plan") || s === "planning") return "text-blue-500 border border-blue-200";
    if (s.includes("cancel")) return "text-rose-500 border border-rose-200";
    return "text-blue-500 border border-blue-200";
  };

  // Status ke mutabik bar color badalne ka logic
  const getProgressBarColor = value => {
    const s = value?.toString().toLowerCase() || "planning";
    if (s.includes("progress")) return "bg-amber-500";
    if (s.includes("complete")) return "bg-emerald-500";
    if (s.includes("hold")) return "bg-gray-500";
    if (s.includes("plan") || s === "planning") return "bg-blue-600";
    if (s.includes("cancel")) return "bg-rose-500";
    return "bg-blue-600";
  };

  const daysLeftCount = endDate
    ? Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const isTimelineAtRisk = progressPercentage < 30 && daysLeftCount !== null && daysLeftCount < 15;
  const realProjectMembers = members || [];

  const actionControls = (
    <ActionControls
      userRole={userRole}
      context="project"
      onEdit={() => onEdit?.(project)}
      onDelete={() => onDelete?.(currentId, tasksCount)}
      onManageMembers={isManager && onManageMembers ? () => onManageMembers(currentId) : undefined}
    />
  );

  const timeline = isTimelineAtRisk ? (
    <span className="text-[12px] font-bold text-rose-600 flex items-center gap-0.5 bg-rose-100 px-1 py-0.5 whitespace-nowrap">
      <AlertCircle size={9} /> At Risk
    </span>
  ) : daysLeftCount !== null && daysLeftCount > 0 ? (
    <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5 whitespace-nowrap">
      <Calendar size={9} /> {daysLeftCount} Days Left
    </span>
  ) : (
    <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">Timeline Sync</span>
  );
  // Admin and manager list view
  if (!isTeamMember && isListView) {
    return (
      <div className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x">
        <div className="w-full min-w-0 max-w-full">
          <div className="w-full min-w-0 max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 sm:px-4 lg:px-5 py-3 sm:py-3.5 shadow-sm hover:shadow-md transition-all duration-200 group box-border overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(180px,1.8fr)_auto_auto] lg:grid-cols-[minmax(220px,2fr)_minmax(110px,0.8fr)_minmax(110px,0.8fr)_minmax(130px,1fr)_auto] gap-3 sm:gap-4 items-center min-w-0">
              <Link to={targetPath} state={{ title: currentTitle }} className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {currentTitle?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}>
                    {currentTitle}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-500 truncate mt-0.5" title={description}>
                    {description || "No project description available."}
                  </p>
                </div>
              </Link>

              <div className="flex items-center justify-between sm:justify-center gap-2 min-w-0">
                <span className="text-[11px] sm:text-[12px] font-semibold text-slate-600">Tasks</span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {completedTasks}/{tasksCount}
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-center gap-2 min-w-0">
                <span className="text-[11px] sm:text-[13px] font-semibold text-slate-600">Status</span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${getStatusBadgeStyle(status)}`}>
                  {status || "Planning"}
                </span>
              </div>

              <div className="min-w-0 hidden lg:block">
                <div className="flex justify-between items-center gap-2 text-[10px] font-semibold">
                  <span className="text-slate-500 font-medium">Progress</span>
                  <span className="text-slate-500">{progressPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(status)}`} style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 min-w-0">
                <div className="text-[9px] sm:text-[10px] font-semibold text-slate-600 whitespace-nowrap hidden sm:block">
                  {isTimelineAtRisk ? "At Risk" : daysLeftCount !== null && daysLeftCount > 0 ? `${daysLeftCount} Days Left` : "Timeline Sync"}
                </div>
        
                <div className="shrink-0" onClick={e => e.stopPropagation()}>{actionControls}</div>
              </div>
            </div>

            <div className="mt-3 sm:hidden flex items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-500 font-medium">Progress</span>
                  <span className="text-slate-500">{progressPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full ${getProgressBarColor(status)}`} style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
              <span className="text-[8px] font-semibold text-slate-400 whitespace-nowrap">{formatDateForCard(endDate)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Team member list view
  if (isTeamMember && isListView) {
    return (
      <div className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x">
        <div className="w-full min-w-0 max-w-full">
          <div className="w-full min-w-0 max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 sm:px-4 lg:px-5 py-3 sm:py-3.5 shadow-sm hover:shadow-md transition-all duration-200 group box-border overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(180px,1.8fr)_auto_auto] lg:grid-cols-[minmax(220px,2fr)_minmax(110px,0.8fr)_minmax(110px,0.8fr)_minmax(130px,1fr)_auto] gap-3 sm:gap-4 items-center min-w-0">
              <Link to={targetPath} state={{ title: currentTitle }} className="flex items-center gap-3 min-w-0" >
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"> {currentTitle?.charAt(0).toUpperCase()} </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}
                  > {currentTitle} </h3>
                  <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-500 truncate mt-0.5" title={description}>
                    {description || "No project description available."} </p> </div></Link>
              <div className="flex items-center justify-between sm:justify-center gap-2 min-w-0"><span className="text-[11px] sm:text-[12px] font-semibold text-slate-600"> Tasks </span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300"> {completedTasks}/{tasksCount} </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between sm:justify-center gap-2 min-w-0">
                <span className="text-[11px] sm:text-[13px] font-semibold text-slate-600"> Status </span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${getStatusBadgeStyle(status)}`} > {status || "Planning"} </span>
              </div>

              {/* Progress */}
              <div className="min-w-0 hidden lg:block">
                <div className="flex justify-between items-center gap-2 text-[10px] font-semibold"> <span className="text-slate-500 font-medium"> Progress </span>
                  <span className="text-slate-500">{progressPercentage}%</span></div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(status)}`} style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between sm:justify-end gap-2 min-w-0">
                <div className="text-[9px] sm:text-[10px] font-semibold text-slate-600 whitespace-nowrap hidden sm:block">
                  {isTimelineAtRisk ? "At Risk" : daysLeftCount !== null && daysLeftCount > 0 ? `${daysLeftCount} Days Left` : "Timeline Sync"}
                </div>
                <div className="shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600">
                    {formatDateForCard(endDate)}
                  </span>
                </div>
              </div>

            </div>

            {/* Mobile progress */}
            <div className="mt-3 sm:hidden flex items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[11px] font-semibold"> <span className="text-slate-500 font-medium">Progress</span> <span className="text-slate-500">{progressPercentage}%</span></div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full ${getProgressBarColor(status)}`} style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>

              <span className="text-[8px] font-semibold text-slate-400 whitespace-nowrap">
                {formatDateForCard(endDate)}
              </span>
            </div>

          </div>
        </div>
      </div>
    );
  }


  // Team Member Grid View
  if (isTeamMember) {
    return (
      <div className="w-full min-w-0 max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 sm:px-4 lg:px-5 py-3 sm:py-3.5 shadow-sm hover:shadow-md transition-all duration-200 group box-border overflow-hidden">
        <Link to={targetPath} state={{ title: currentTitle }} className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">{currentTitle?.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}> {currentTitle}</h3>
            <span className="text-[9px] font-semibold text-slate-600 block">{tasksCount} tasks</span>
          </div>
        </Link>
        <div className="mt-3 min-h-[32px] flex flex-col justify-start">
          <p className={`text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed ${showFullDescription ? "" : "line-clamp-2"} break-words`}>
            {description || "No specific project details inside frameworks."} </p> </div>

        {/* Project Information */}
        <div className="min-w-0 mt-3">
          <div className="space-y-2">
            <div className={`min-w-0 ${isListView ? "lg:w-[340px] lg:flex-shrink-0" : "mt-auto pt-2"}`}>
              <div className={isListView ? "grid grid-cols-2 gap-x-5 gap-y-2" : "space-y-2"}>
                <div className="flex items-center justify-between gap-5 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-600">Status</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusBadgeStyle(status)}`}>
                    {status || "Planning"}
                  </span>
                </div>

                {[
                  ["End date", formatDateForCard(endDate)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center  justify-between  gap-2 min-w-0">
                    <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                    <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center justify-between  gap-10 min-w-0">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Timeline </span>
              {isTimelineAtRisk ? (
                <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 bg-rose-100 px-1.5 py-0.5 rounded whitespace-nowrap"><AlertCircle size={9} /> At Risk </span>
              ) : daysLeftCount !== null && daysLeftCount > 0 ? (
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1"> <Calendar size={9} /> {daysLeftCount} Days </span>
              ) : (
                <span className="text-[8px] font-bold text-slate-400"> Sync </span>)} </div>
          </div>
        </div>
        <div className="mt-3 min-w-0">
          <div className="flex justify-between text-[10px] font-semibold"><span className="text-slate-500 font-medium"> Progress </span>
            <span className="text-slate-500"> {progressPercentage}% </span> </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className={`h-full rounded-full ${getProgressBarColor(status)}`} style={{ width: `${progressPercentage}%` }} /> </div>
        </div>
      </div>
    );
  }






  // Project manager and admin grid view
  return (
    <div className={`${isListView ? "bg-slate-50 dark:bg-slate-900" : "bg-white dark:bg-slate-900"} border border-slate-200 dark:border-slate-700 rounded-2xl p-5 min-h-[250px] shadow-sm hover:shadow-md transition-all w-full min-w-0 max-w-full ${isListView ? "max-w-none" : "max-w-md mx-auto"} animate-in fade-in duration-200 group overflow-hidden`}>
      <div className="flex justify-between items-start mb-2 gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
            {currentTitle?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold truncate text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}>
              {currentTitle}
            </h3>
            <span className="text-[9px] font-semibold text-slate-600 block">{tasksCount} tasks</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1 scale-90">
  
          {actionControls}
        </div>
      </div>

      <Link to={targetPath} state={{ title: currentTitle }} className="block min-w-0 w-full max-w-full">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-500 line-clamp-2 mb-2 leading-relaxed break-words min-h-[32px]">
          {description || "No specific operational project details mapped inside record frameworks."}
        </p>

        <div className="space-y-1.5 pt-1.5">
          <div className="flex justify-between items-center text-[9px] gap-2 min-w-0">
            <div className="flex items-center gap-1 text-slate-500 truncate flex-1 min-w-0">
              <User2 size={10} className="text-blue-500 shrink-0" />
              <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                {managerName || projectManager?.fullName || createdBy?.fullName || "Admin PM"}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${getStatusBadgeStyle(status)}`}>
              {status || "Planning"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-medium text-slate-500">
            {[
              ["Start date", formatDateForCard(startDate)],
              ["End", formatDateForCard(endDate)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-1 min-w-0 bg-slate-50 dark:bg-slate-800 px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600">{label}</span>
                <span className="text-slate-600 dark:text-slate-300 font-semibold">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1.5 text-[8px] font-semibold min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <User2 size={10} className="text-blue-500 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {realProjectMembers.length} {realProjectMembers.length === 1 ? "Member" : "Members"}
              </span>
            </div>
            <div className="shrink-0 pl-2">{timeline}</div>
          </div>
        </div>

        <div className="mt-3 pt-1.5">
          <div className="flex justify-between text-[12px] font-semibold">
            <span className="text-slate-500 font-semibold">Progress</span>
            <span className="text-slate-500">{progressPercentage}%</span>
          </div>
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className={`h-full rounded-full ${getProgressBarColor(status)}`} style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProjectCard;
