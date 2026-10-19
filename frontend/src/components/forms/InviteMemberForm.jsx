import React, { useState } from "react";
import { Copy, Check, Mail, X } from "lucide-react";
import { sendInvite } from "../../services/inviteService";

const InviteMemberForm = ({
  onClose,
  userRole = "projectadmin",
  workspaceId,
}) => {
  const [activeTab, setActiveTab] = useState("email");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState(
    userRole === "projectadmin" ? "Project Manager" : "Team Member"
  );
  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handleEmailChange = (e) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setEmail(value);
      setError("");
      setSuccessMessage("");
    }
  };

  const validateEmail = () => {
    const value = email.trim();

    if (!value) {
      setError("Email is required");
      return false;
    }

    if (value.length > 50) {
      setError("Email cannot exceed 50 characters");
      return false;
    }

    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (
      !regex.test(value) ||
      value.includes("..") ||
      value.startsWith(".") ||
      value.endsWith(".")
    ) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateEmail()) return;

    try {
      const response = await sendInvite({
        email: email.trim().toLowerCase(),
        role: selectedRole,
        workspaceId,
      });

      setInviteLink(response.inviteLink || response.data?.inviteLink || "");
      setIsSent(true);
      setSuccessMessage("Invitation sent successfully!");
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invite");
    }
  };

  const handleCopy = async () => {
    const link =
      inviteLink ||
      `${window.location.origin}/signup?workspaceId=${workspaceId}&role=${encodeURIComponent(
        selectedRole
      )}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  };

  const link =
    inviteLink ||
    `${window.location.origin}/signup?workspaceId=${workspaceId}&role=${encodeURIComponent(
      selectedRole
    )}`;

  return (
    <div className="relative w-full max-w-md min-w-0 mx-auto overflow-x-hidden bg-white dark:bg-slate-900 shadow-2xl rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white">
      {successMessage && (
        <div className="absolute top-0 left-0 z-50 w-full bg-green-500 py-2 text-center text-xs font-bold text-white">
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 p-4 sm:p-6 pb-0">
        <h2 className="text-lg sm:text-xl font-bold">Invite Member</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="mb-5">
          <label className="mb-2 ml-1 block text-sm font-bold text-gray-700 dark:text-slate-400">
            Assigned Role
          </label>

          {userRole === "projectadmin" ? (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="Project Manager">Project Manager</option>
              <option value="Team Member">Team Member</option>
            </select>
          ) : (
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Team Member
            </div>
          )}
        </div>

      <div className="mb-2 flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold ${
              activeTab === "email"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <Mail size={14} />
            Send Email
          </button>
        </div>

        {activeTab === "email" ? (
          <form onSubmit={handleSendEmail} className="space-y-3" noValidate>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={handleEmailChange}
                maxLength={50}
                className={`w-full min-w-0 flex-1 rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none dark:bg-slate-800 dark:text-white ${
                  error
                    ? "border-red-500 focus:ring-2 focus:ring-red-500"
                    : "border-gray-200 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:focus:ring-indigo-500"
                }`}
              />

              <button
                type="submit"
                className="w-full shrink-0 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 sm:w-auto"
              >
                {isSent ? "Sent!" : "Send"}
              </button>
            </div>

            {error && (
              <p className="break-words text-sm font-semibold text-red-500">
                {error}
              </p>
            )}
          </form>
        ) : (
          <div className="w-full min-w-0">
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
              <input
                type="text"
                readOnly
                value={link}
                className="w-full min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[10px] text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />

              <button
                type="button"
                onClick={handleCopy}
                className={`w-full shrink-0 rounded-xl px-5 py-3 font-bold sm:w-auto ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span className="text-xs">
                    {copied ? "Copied" : "Copy"}
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteMemberForm;
