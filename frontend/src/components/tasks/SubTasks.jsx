import React from "react";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";

const SubTasks = ({
  title,
  completed,
  onToggle,
  onDelete,
  onEdit,
  assignee,
  userRole = "projectmanager",
}) => {
  const isMember = userRole === "teammember";
  const assigneeName =
    typeof assignee === "object"
      ? assignee?.fullName || assignee?.name || assignee?.email
      : null;

  return (
    <div className="flex items-center gap-3 py-2.5 px-2 rounded-xl group text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/60">
      <div className="min-w-0 flex-1">
        <span
          className={`text-[13px] font-medium break-words ${
            completed
              ? "text-gray-400 dark:text-slate-500"
              : "text-gray-700 dark:text-slate-200"
          }`}
        >
          {title}
        </span>

        {assigneeName && (
          <span className="block mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">
            Assigned to: {assigneeName}
          </span>
        )}
      </div>

      {isMember ? (
        completed ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10">
            <CheckCircle2 size={14} />
            Completed
          </span>
        ) : (
          onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all"
            >
              Mark as Completed
            </button>
          )
        )
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          {completed && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10">
              <CheckCircle2 size={14} />
              Completed
            </span>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {onEdit && !completed && (
              <button
                type="button"
                onClick={onEdit}
                title="Edit subtask"
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Pencil size={15} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                title="Delete subtask"
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubTasks;
