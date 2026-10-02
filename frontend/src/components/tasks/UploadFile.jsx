import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AttachmentButton from "../buttons/AttachmentButton";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const decodeUserId = token => {
  try {
    const part = token?.split(".")[1];
    if (!part) return "";
    const payload = JSON.parse(
      atob(part.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return String(payload.id || payload._id || "");
  } catch {
    return "";
  }
};

const UploadFile = ({ userRole = "projectmanager" }) => {
  const { id: routeTaskId, taskId } = useParams();
  const currentTaskId = routeTaskId || taskId;
  const [selectedFile, setSelectedFile] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [openDeleteMenu, setOpenDeleteMenu] = useState(null);
  const uploadInputRef = useRef(null);

  const cleanRole = userRole.toString().toLowerCase().replace(/\s+/g, "");
  const isPM = cleanRole === "projectmanager";
  const currentUserId = decodeUserId(sessionStorage.getItem("token"));

// Sync task files
useEffect(() => {
  if (!currentTaskId) return;

  let cancelled = false;

  const syncTaskFiles = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/tasks/${currentTaskId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      const liveTask = data?.task || data || {};

      if (!cancelled && Array.isArray(liveTask.files)) {
        setAttachments(liveTask.files);
      }
    } catch (error) {
      console.error("Error syncing task attachments:", error);
    }
  };

  syncTaskFiles();

  return () => {
    cancelled = true;
  };
}, [currentTaskId]);


  // Fetch task files
  const fetchTaskFiles = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/tasks/${currentTaskId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      const liveTask = data?.task || data || {};
      if (liveTask.files) setAttachments(liveTask.files);
    } catch (error) {
      console.error("Error loading task attachments from server:", error);
    }
  };

  // Validate selected file
  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.rar",
      "application/x-rar-compressed",
    ];
    const allowedExtensions = /\.(pdf|docx|xlsx|jpg|jpeg|png|zip|rar)$/i;

    if (!allowedExtensions.test(file.name)) {
      alert("Invalid file format. Supported formats: PDF, DOCX, XLSX, JPG, PNG, ZIP, RAR.");
      e.target.value = "";
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must not exceed 5MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // Upload attachment
  const handleAddAttachment = async () => {
    if (!selectedFile || !currentTaskId) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const { data } = await axios.put(
        `${API_URL}/api/tasks/${currentTaskId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedTask = data?.task || data || {};
      updatedTask.files ? setAttachments(updatedTask.files) : fetchTaskFiles();

      setSelectedFile(null);
      setShowUploadUI(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    } catch (error) {
      console.error("Error completely transferring document stream to backend:", error);
      alert(error.response?.data?.message || "File upload failed.");
    }
  };

  // Cancel upload
  const handleCancel = () => {
    setSelectedFile(null);
    setShowUploadUI(false);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  // Delete attachment
  const handleDeleteAttachment = async (fileId, deleteMode) => {
    if (!fileId || !currentTaskId) return;

    const message =
      deleteMode === "me"
        ? "Are you sure you want to delete this file for yourself?"
        : "Are you sure you want to delete this file for everyone?";

    if (!window.confirm(message)) return;

    try {
      const { data } = await axios.delete(
        `${API_URL}/api/tasks/${currentTaskId}/file/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          data: { deleteMode },
        }
      );

      if (deleteMode === "everyone") {
        setAttachments(prev =>
          prev.filter(file => String(file._id || file.id) !== String(fileId))
        );
      }

      if (deleteMode === "me") {
        setAttachments(prev =>
          prev.map(file =>
            String(file._id || file.id) === String(fileId)
              ? {
                  ...file,
                  hiddenFor: [...(file.hiddenFor || []), currentUserId],
                }
              : file
          )
        );
      }

      setOpenDeleteMenu(null);
      console.log(data?.message || "File action completed successfully.");
    } catch (error) {
      console.error("Error deleting task attachment:", error);
      alert(error.response?.data?.message || "Unable to delete file.");
      setOpenDeleteMenu(null);
    }
  };

  // Hide files deleted for current user
  const visibleAttachments = attachments.filter(file =>
    currentUserId
      ? !(file.hiddenFor || []).some(
          userId => String(userId?._id || userId) === String(currentUserId)
        )
      : true
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 border border-gray-200/60 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-none space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center">
        {!showUploadUI && (
          <button
            onClick={() => setShowUploadUI(true)}
            className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline bg-indigo-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            + Add New
          </button>
        )}
      </div>

      {/* Upload panel */}
      {showUploadUI && (
        <div className="border-2 border-dashed border-indigo-100 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-slate-900/30 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-md space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-200 dark:border-slate-700 border-dashed rounded-xl bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group p-2">
              <span className="text-sm text-gray-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium text-center truncate w-full">
                {selectedFile ? selectedFile.name : "Click to choose a file"}
              </span>
              <input
                ref={uploadInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
                onChange={handleFileChange}
              />
            </label>

            {/* Format information */}
            <div className="text-center space-y-1">
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                Supported formats:{" "}
                <span className="font-semibold text-gray-600 dark:text-slate-300">
                  PDF, DOCX, XLSX, JPG, PNG, ZIP, RAR
                </span>
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                Maximum file size:{" "}
                <span className="font-semibold text-gray-600 dark:text-slate-300">
                  5MB
                </span>
              </p>
            </div>

            {selectedFile && (
              <p className="text-xs text-green-500 font-bold text-center animate-pulse">
                File ready to attach!
              </p>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <div className="bg-slate-600 hover:bg-slate-700 rounded-lg sm:w-40">
                <AttachmentButton
                  text="Add Attachment"
                  disabled={!selectedFile}
                  onClick={handleAddAttachment}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
                    selectedFile
                      ? "bg-indigo-600 text-white shadow-indigo-100"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Files */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleAttachments.map((file, index) => {
          const fileId = file._id || file.id;
          const displayFileName = file.fileName || file.name || "Attachment File";
          const dynamicDownloadUrl = file.fileUrl || `${API_URL}/${file.path}`;
          const isUploader =
            file.uploadedBy &&
            String(file.uploadedBy?._id || file.uploadedBy) ===
              String(currentUserId);

          return (
            <div
              key={fileId || index}
              className="relative flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl group"
            >
              {/* Download */}
              <a
                href={dynamicDownloadUrl}
                download={displayFileName}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center gap-3 overflow-hidden text-gray-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors min-w-0"
                title="Click to Download"
              >
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm text-indigo-500 dark:text-indigo-400 shrink-0">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
                <span className="text-sm font-bold truncate">{displayFileName}</span>
              </a>

              {/* Delete menu */}
              <div className="relative shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDeleteMenu(openDeleteMenu === fileId ? null : fileId)
                  }
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer"
                  title="File actions"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>

                {openDeleteMenu === fileId && (
                  <div className="absolute right-0 top-9 z-30 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    {/* Delete for me */}
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(fileId, "me")}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Delete for me
                    </button>

                    {/* Delete for everyone */}
                    {(isPM || isUploader) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAttachment(fileId, "everyone")
                        }
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Delete for everyone
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleAttachments.length === 0 && !showUploadUI && (
        <p className="text-center py-4 text-sm text-gray-400 dark:text-slate-500">
          No attachments added yet.
        </p>
      )}
    </div>
  );
};

export default UploadFile;