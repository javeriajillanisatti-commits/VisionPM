import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, FolderKanban, ArrowUpRight, Calendar } from "lucide-react";
import ActionControls from "../buttons/ActionControls";

const WorkspaceCard = ({
  workspace,
  onEdit,
  onDelete,
  userRole = "projectmanager",
  isSingle = false,
  viewMode = "grid",
  matchSectionHeight = false,
}) => {
  const navigate = useNavigate();
  const {
    _id,
    id,
    name,
    description,
    projectsCount,
    createdAt,
    updatedAt,
    ownerName,
    projectAdmin,
  } = workspace || {};

  const currentId = _id || id;
  const totalProjects = projectsCount || 0;
  const currentOwner = projectAdmin?.fullName || ownerName || "Admin";
  const cleanRole = userRole.toString().toLowerCase().replace(/\s+/g, "");
  const isTeamMember = cleanRole === "teammember";
  const isProjectAdmin = cleanRole === "projectadmin";
  const isListView = viewMode === "list";
  const isActive = totalProjects > 0;

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 640
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showList = isProjectAdmin ? isListView : isDesktop;

  const targetPath = isTeamMember
    ? `/team-member/tm-workspace/${currentId}`
    : isProjectAdmin
    ? `/project-admin/manage-workspaces/${currentId}`
    : `/project-manager/workspaces/${currentId}`;

  const state = { id: currentId, name, description };

  const formatDateString = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const isWithinDays = (value, days) => {
    if (!value) return false;
    const date = new Date(value);
    const difference = Date.now() - date.getTime();
    return (
      !isNaN(date.getTime()) &&
      difference >= 0 &&
      difference <= days * 86400000
    );
  };

  const isNew = isWithinDays(createdAt, 7);
  const isRecentlyUpdated =
    updatedAt && updatedAt !== createdAt && isWithinDays(updatedAt, 7);

  const getInitials = (value) =>
    value ? value.split(" ").join("").toUpperCase().slice(0, 2) : "W";

  const handleWorkspaceMap = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/project-admin/workspace-map/${currentId}`, { state });
  };

  const actions = (
    <ActionControls
      userRole={userRole}
      context="workspace"
      onEdit={() => onEdit && onEdit(workspace)}
      onDelete={() => onDelete && onDelete(currentId, totalProjects)}
    />
  );

  const badges = (
    <>
      {isActive && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Active
        </span>
      )}
      {isNew && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
          New
        </span>
      )}
      {isRecentlyUpdated && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
          Updated
        </span>
      )}
    </>
  );

  if (showList) {
    return (
      <div
        className={`w-full min-w-0 max-w-full ${
          isProjectAdmin ? "overflow-x-auto overflow-y-hidden" : "overflow-hidden"
        } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 sm:px-4 md:px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200 group`}
      >
        <div
          className={`${
            isProjectAdmin
              ? "grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,120px)_minmax(0,70px)] min-w-[900px]"
              : "grid grid-cols-1 min-[600px]:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,120px)_minmax(0,70px)]"
          } items-center gap-3 min-[600px]:gap-4 w-full`}
        >
          <Link
            to={targetPath}
            state={state}
            className="flex items-center gap-3 min-w-0 min-[600px]:pr-4 min-[600px]:border-r border-slate-100 dark:border-slate-800"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {getInitials(name)}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h3
                className="text-sm font-bold text-slate-800 dark:text-slate-200 break-words tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                title={name}
              >
                {name}
              </h3>
              <p
                className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-clamp-2 mt-0.5 break-words"
                title={description}
              >
                {description || "No workspace description available."}
              </p>
            </div>
          </Link>

          <div className="min-w-0 min-[600px]:px-1 min-[600px]:pr-4 min-[600px]:border-r border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-500">
                  Owner
                </p>
                <p
                  className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 break-words mt-0.5"
                  title={currentOwner}
                >
                  {currentOwner}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 min-[600px]:px-1 min-[600px]:pr-4 min-[600px]:border-r border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <FolderKanban size={14} className="text-blue-500 shrink-0" />
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {totalProjects}{" "}
                {totalProjects === 1 ? "Project" : "Projects"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">{badges}</div>
          </div>

          <div className="flex items-center min-w-0 min-[600px]:px-1 min-[600px]:pr-4 min-[600px]:border-r border-slate-100 dark:border-slate-800">
            <Calendar
              size={14}
              className="text-slate-500 dark:text-slate-500 shrink-0 mr-2"
            />
            <div>
              <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-500">
                Created
              </p>
              <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5 whitespace-nowrap">
                {formatDateString(createdAt)}
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-start min-[600px]:justify-end shrink-0"
            onClick={(e) => e.preventDefault()}
          >
            {isTeamMember ? null : actions}
          </div>
        </div>

        {isProjectAdmin && (
          <div className="w-full min-w-[900px] mt-4">
            <button
              type="button"
              onClick={handleWorkspaceMap}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-100 dark:border-slate-700 transition-all duration-200 text-xs font-semibold whitespace-nowrap"
            >
              <FolderKanban size={15} />
              Workspace Project Map
              <ArrowUpRight size={13} className="opacity-60" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`block group min-w-0 ${
        isSingle ? "w-full max-w-sm" : "w-full"
      } ${matchSectionHeight ? "h-full" : ""} ${
        isProjectAdmin ? "h-full flex flex-col" : ""
      }`}
    >
      <Link
        to={targetPath}
        state={state}
        className={`block w-full min-w-0 ${
          matchSectionHeight ? "h-full" : ""
        } ${isProjectAdmin ? "h-full flex-1" : ""}`}
      >
        <div
          className={`w-full min-w-0 ${
            matchSectionHeight ? "h-full" : ""
          } ${
            isProjectAdmin ? "h-full flex flex-col" : ""
          } bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
        >
          <div className="absolute top-0 left-4 sm:left-6 right-4 sm:right-6 h-[2px] rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex justify-between items-start mb-4 gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-2xl shrink-0 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                {getInitials(name)}
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h3
                  className="font-bold text-gray-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  title={name}
                >
                  {name}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                  {totalProjects}{" "}
                  {totalProjects === 1 ? "Project" : "Projects"}
                </p>
              </div>
            </div>

            {!isTeamMember && (
              <div className="shrink-0">{actions}</div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {badges}
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4 min-h-[32px] break-words">
            {description || "No description available."}
          </p>

          <div className="flex items-center gap-2 mb-4 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <User size={13} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-gray-500 dark:text-slate-500">
                Owner
              </p>
              <p
                className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-full"
                title={currentOwner}
              >
                {currentOwner}
              </p>
            </div>
          </div>

          <div
            className={`pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2 ${
              isProjectAdmin ? "mt-auto" : ""
            }`}
          >
            <span className="text-[12px] font-semibold text-gray-500 dark:text-slate-500">
              Created {formatDateString(createdAt)}
            </span>

            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap">
              View Projects <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </Link>

      {isProjectAdmin && (
        <button
          type="button"
          onClick={handleWorkspaceMap}
          className="mt-3 w-full min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-100 dark:border-slate-700 transition-all duration-200 text-xs font-semibold cursor-pointer whitespace-nowrap overflow-hidden shrink-0"
        >
          <FolderKanban size={15} strokeWidth={1.8} className="shrink-0" />
          <span className="truncate">Workspace Project Map</span>
          <ArrowUpRight size={13} className="opacity-60 shrink-0" />
        </button>
      )}
    </div>
  );
};

export default WorkspaceCard;