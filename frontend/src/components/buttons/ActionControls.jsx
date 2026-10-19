import React from "react";
import { Edit2, Trash2, Users } from "lucide-react";

const ActionControls = ({
  onEdit,
  onDelete,
  onManageMembers,
  userRole,
  context = "project",
}) => {
  const cleanRole = userRole?.toString().toLowerCase().replace(/\s+/g, "");
  const isPM = cleanRole === "projectmanager";
  const isAdmin = cleanRole === "projectadmin";

  // Allow actions only for the correct role and context
  if ((context === "workspace" && !isAdmin) || (context !== "workspace" && !isPM)) {
    return null;
  }

  // Prevent card clicks when an action button is used
  const handleClick = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    action?.();
  };

  return (
    // Render available action controls
    <div className="flex space-x-1 relative z-10 shrink-0">
      {/* Edit button */}
      <button
        type="button"
        onClick={(e) => handleClick(e, onEdit)}
        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        title="Edit"
      >
        <Edit2 size={14} />
      </button>

      {/* Manage members button */}
      {context !== "workspace" && isPM && (
        <button
          type="button"
          onClick={(e) => handleClick(e, onManageMembers)}
          className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Manage Members"
        >
          <Users size={14} />
        </button>
      )}

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => handleClick(e, onDelete)}
        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export default ActionControls;