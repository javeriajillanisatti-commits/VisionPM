import React from "react";
import { X, Bell, FileText, RefreshCw, Clock, Megaphone, CheckCircle2 } from "lucide-react";

const NotificationDetailModal = ({ notification, onClose }) => {
  if (!notification) return null;

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    const value = new Date(date);
    return Number.isNaN(value.getTime())
      ? "N/A"
      : value.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  // Get notification info
  const info = {
    TASK_ASSIGNED: {
      icon: FileText,
      label: "Task Assigned",
      iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
      iconText: "text-indigo-600 dark:text-indigo-400",
    },
    SUBTASK_ASSIGNED: {
      icon: FileText,
      label: "Subtask Assigned",
      iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
      iconText: "text-indigo-600 dark:text-indigo-400",
    },
    SUBTASK_COMPLETED: {
      icon: CheckCircle2,
      label: "Subtask Completed",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
    TASK_MEMBER_COMPLETED: {
      icon: CheckCircle2,
      label: "Task Part Completed",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
    STATUS_UPDATED: {
      icon: RefreshCw,
      label: "Task Status Updated",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
      iconText: "text-blue-600 dark:text-blue-400",
    },
    DEADLINE: {
      icon: Clock,
      label: "Deadline Reminder",
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
      iconText: "text-amber-600 dark:text-amber-400",
    },
    ANNOUNCEMENT: {
      icon: Megaphone,
      label: "Announcement",
      iconBg: "bg-purple-50 dark:bg-purple-500/10",
      iconText: "text-purple-600 dark:text-purple-400",
    },
  }[notification.type] || {
    icon: Bell,
    label: "Notification",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconText: "text-slate-600 dark:text-slate-400",
  };

  const Icon = info.icon;

  // Get notification title
  const title =
    (typeof notification.title === "string" && notification.title.trim()) ||
    (typeof notification.announcement?.title === "string" && notification.announcement.title.trim()) ||
    (typeof notification.task?.title === "string" && notification.task.title.trim()) ||
    (typeof notification.task?.taskTitle === "string" && notification.task.taskTitle.trim()) ||
    info.label;

  // Get notification message
  const message =
    (typeof notification.message === "string" && notification.message.trim()) ||
    (typeof notification.description === "string" && notification.description.trim()) ||
    (typeof notification.announcement?.description === "string" && notification.announcement.description.trim()) ||
    (typeof notification.announcement?.message === "string" && notification.announcement.message.trim()) ||
    "No message available.";

  const announcement = notification.type === "ANNOUNCEMENT" ? notification.announcement : null;
  const task = notification.type !== "ANNOUNCEMENT" ? notification.task : null;

  // Render metadata
  const Meta = ({ title, value }) =>
    value && (
      <div>
        <p className="text-sm font-medium text-slate-400 tracking-wide mb-1">{title}</p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${info.iconBg} ${info.iconText}`}>
              <Icon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-white">Notification</h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{info.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-slate-400  tracking-wide mb-2">Title</p>
            <h3 className="text-2xl font-bold leading-snug text-slate-900 dark:text-white break-words">{title}</h3>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-400 tracking-wide mb-2">Message</p>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-slate-700 dark:text-slate-200 text-sm leading-6 whitespace-pre-wrap break-words">{message}</p>
            </div>
          </div>

          {/* Announcement details */}
         {announcement && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
    <Meta title="Announced By" value={announcement.createdBy && (announcement.createdByName || "Project Admin")}/>
    <Meta title="Published" value={notification.createdAt && formatDate(notification.createdAt)}
    />

    {notification.attachmentName && notification.attachmentUrl && (
      <div className="sm:col-span-2">
        <p className="text-sm font-medium text-slate-400 tracking-wide mb-2">
          Attachment
        </p>

        <button
          type="button"
          onClick={() =>
            window.open(
              `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${notification.attachmentUrl}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
          className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <FileText size={18} className="shrink-0 text-purple-500 dark:text-purple-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
            {notification.attachmentName}
          </span>
        </button>
      </div>
    )}
  </div>
)}

          {/* Task details */}
          {task && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Meta title="Task" value={task.title} />
              <Meta title="Received" value={notification.createdAt && formatDate(notification.createdAt)} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;