import React, { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, UserX, X } from "lucide-react";

const ProjectAttentionCenter = ({ projects = [], isDarkMode }) => {
  const [showModal, setShowModal] = useState(false);

  const getProjectName = project =>
    project?.name || project?.projectName || project?.title || "Untitled Project";

  const getProjectDeadline = project =>
    project?.deadline ||
    project?.dueDate ||
    project?.endDate ||
    project?.projectDeadline ||
    null;

  const getProjectTasks = project =>
    Array.isArray(project?.tasks)
      ? project.tasks
      : Array.isArray(project?.taskList)
      ? project.taskList
      : [];

  // Check project attention issues
  const getProjectIssues = useCallback(
    project => {
      const issues = [];
      const deadline = getProjectDeadline(project);
      const progress = Number(project?.progress || 0);
      const tasks = getProjectTasks(project);

      if (deadline) {
        const date = new Date(deadline);
        const now = new Date();
        const diffDays = (date - now) / 86400000;

        if (!Number.isNaN(date.getTime()) && date < now && progress < 100) {
          issues.push({
            type: "overdue",
            label: "Overdue",
            icon: AlertTriangle,
            rowClassName: isDarkMode
              ? "bg-rose-500/10 border-rose-500/20"
              : "bg-rose-50 border-rose-100",
            iconClassName: isDarkMode
              ? "text-rose-400 bg-rose-500/15"
              : "text-rose-600 bg-rose-100",
          });
        } else if (diffDays >= 0 && diffDays <= 3 && progress < 100) {
          issues.push({
            type: "deadline",
            label: "Deadline Near",
            icon: Clock3,
            rowClassName: isDarkMode
              ? "bg-orange-500/10 border-orange-500/20"
              : "bg-orange-50 border-orange-100",
            iconClassName: isDarkMode
              ? "text-orange-400 bg-orange-500/15"
              : "text-orange-600 bg-orange-100",
          });
        }
      }

      if (tasks.length) {
        const unassigned = tasks.filter(
          task => !task?.assignee && !task?.assignedTo && !task?.assigneeId
        );

        if (unassigned.length) {
          issues.push({
            type: "unassigned",
            label: `${unassigned.length} Unassigned Task${unassigned.length === 1 ? "" : "s"}`,
            icon: UserX,
            rowClassName: isDarkMode
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-amber-50 border-amber-100",
            iconClassName: isDarkMode
              ? "text-amber-400 bg-amber-500/15"
              : "text-amber-600 bg-amber-100",
          });
        }

        const critical = tasks.filter(task => {
          const priority = String(task?.priority || "").toLowerCase();
          const status = String(task?.status || "").toLowerCase();
          return (
            (priority === "high" || priority === "critical") &&
            status !== "completed" &&
            status !== "done"
          );
        });

        if (critical.length) {
          issues.push({
            type: "critical",
            label: `${critical.length} Critical Task${critical.length === 1 ? "" : "s"} Pending`,
            icon: AlertTriangle,
            rowClassName: isDarkMode
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-emerald-50 border-emerald-100",
            iconClassName: isDarkMode
              ? "text-emerald-400 bg-emerald-500/15"
              : "text-emerald-600 bg-emerald-100",
          });
        }
      }

      return issues;
    },
    [isDarkMode]
  );

  const attentionItems = useMemo(
    () =>
      projects.flatMap(project =>
        getProjectIssues(project).map(issue => ({
          ...issue,
          projectId: project?._id || project?.id,
          projectName: getProjectName(project),
        }))
      ),
    [projects, getProjectIssues]
  );

  const attentionCount = attentionItems.length;
  const closeModal = () => setShowModal(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`h-10 px-4 rounded-xl border font-semibold text-xs transition-all shadow-sm shrink-0 ${
          showModal
            ? "bg-blue-600 border-blue-600 text-white"
            : isDarkMode
            ? "bg-[#11182B] border-[#263149] text-gray-300 hover:bg-[#18223A]"
            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        Attention Center
        {attentionCount > 0 && (
          <span
            className={`ml-2 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full text-[10px] ${
              showModal
                ? "bg-white text-blue-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {attentionCount > 99 ? "99+" : attentionCount}
          </span>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div
            className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isDarkMode
                ? "bg-[#0B1128] border-[#263149]"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${
                isDarkMode ? "border-[#263149]" : "border-gray-200"
              }`}
            >
              <div>
                <h2
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Attention Center
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Projects that may need attention
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-[#18223A]"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-y-auto">
              {attentionItems.length ? (
                <div className="space-y-3">
                  {attentionItems.map((item, index) => {
                    const IssueIcon = item.icon;

                    return (
                      <div
                        key={`${item.projectId}-${item.type}-${index}`}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${item.rowClassName}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.iconClassName}`}
                        >
                          <IssueIcon size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-bold truncate ${
                              isDarkMode ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {item.projectName}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {item.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <CheckCircle2
                    size={35}
                    className="mx-auto text-emerald-500"
                  />
                  <h3
                    className={`mt-3 font-bold ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Everything looks good
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    No projects currently need attention.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectAttentionCenter;