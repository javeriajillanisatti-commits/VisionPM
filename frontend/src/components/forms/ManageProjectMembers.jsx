import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import {
  getWorkspaceMembers,
  updateProjectMembers,
} from "../../services/projectService";

const ManageProjectMembers = ({ projectId, onClose, onSaved }) => {
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [blockedMembers, setBlockedMembers] = useState([]);

  // Load workspace members
  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await getWorkspaceMembers(projectId);
      setMembers(response.members || []);
      setSelectedMembers(
        (response.selectedMembers || []).map((id) => id.toString())
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle member selection
  const toggleMember = (memberId) => {
    setErrorMessage("");
    setBlockedMembers([]);
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Save project members
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage("");
      setBlockedMembers([]);

      await updateProjectMembers(projectId, selectedMembers);
      setSuccessMessage("Project members updated successfully!");
      onSaved?.();

      setTimeout(onClose, 1200);
    } catch (error) {
      console.error(error);
      const data = error?.response?.data;

      if (error?.response?.status === 409 && data) {
        const blocked = data.blockedMembers || [];
        setBlockedMembers(blocked);
        setErrorMessage(
          data.message ||
            "A member with assigned tasks cannot be removed. Reassign their tasks first."
        );
      } else {
        setErrorMessage(data?.message || "Failed to update members.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Render task count
  const taskLabel = (count) =>
    `${count} assigned task${count === 1 ? "" : "s"}`;

  return (
    <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in relative mx-4 transition-colors duration-200">
      {/* Success message */}
      {successMessage && (
        <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-2 text-center text-xs font-bold z-50">
          <div className="flex justify-center items-center gap-2">
            <Check size={15} />
            {successMessage}
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          <p>{errorMessage}</p>
          {blockedMembers.length > 0 && (
            <div className="mt-2 space-y-1">
              {blockedMembers.map((blocked) => (
                <p key={blocked.memberId} className="font-bold">
                  {blocked.fullName}: {taskLabel(blocked.assignedTaskCount)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center p-6 pb-0">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Manage Project Members
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {/* Member selection */}
        <label className="text-[13px] font-bold text-gray-500 dark:text-slate-500 ml-1">
          Select Project Members
        </label>

        <div className="mt-4 border border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-900/40 max-h-[320px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400 text-sm font-medium">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm font-medium">
              No Team Members Found
            </div>
          ) : (
            members.map((member) => (
              <label
                key={member._id}
                className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800/60 last:border-b-0 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                    {member.fullName?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate">
                      {member.fullName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-400 truncate">
                      {member.email}
                    </p>

                    {member.assignedTaskCount > 0 && (
                      <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {taskLabel(member.assignedTaskCount)} — reassign before
                        removing
                      </p>
                    )}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member._id)}
                  onChange={() => toggleMember(member._id)}
                  className="w-5 h-5 accent-blue-600 dark:bg-slate-800 cursor-pointer shrink-0 rounded"
                />
              </label>
            ))
          )}
        </div>

        {/* Form actions */}
        <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 dark:border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Members"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectMembers;