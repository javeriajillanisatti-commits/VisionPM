import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { X, Trash2, Paperclip, Download } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import AnnouncementForm from "../forms/AnnouncementForm";
const announcementCache = new Map();
const API_BASE = process.env.REACT_APP_API_URL;

const AnnouncementPanel = ({ isModalOpen, setIsModalOpen }) => {
  const { isDarkMode } = useTheme();
  const { activeWorkspace } = useWorkspace();
  const liveTick = useLiveTick({
  resources: ["announcements"],
});
  const [announcements, setAnnouncements] = useState([]);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [expandedTitles, setExpandedTitles] = useState({});
  const [longMessages, setLongMessages] = useState({});
  const [longTitles, setLongTitles] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [error, setError] = useState("");
  const titleRefs = useRef({});
  const messageRefs = useRef({});
  const hasLoadedOnce = useRef(false);
  const workspaceId = activeWorkspace?._id || activeWorkspace?.id;
  const getToken = () => sessionStorage.getItem("token") || localStorage.getItem("token");

  // Check expandable content
  const checkTextLength = useCallback(() => {
    const titles = {}, messages = {};

    announcements.forEach(({ _id }) => {
      const title = titleRefs.current[_id];
      const message = messageRefs.current[_id];

      if (title) {
        const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
        titles[_id] = title.scrollHeight > lineHeight * 2 + 1;
      }

      if (message) {
        const lineHeight = parseFloat(getComputedStyle(message).lineHeight);
        messages[_id] = message.scrollHeight > lineHeight * 2 + 1;
      }
    });

    setLongTitles(titles);
    setLongMessages(messages);
  }, [announcements]);

  // Load workspace announcements
 const fetchAnnouncements = useCallback(async (showLoader = true) => {
  if (!workspaceId) {
    setAnnouncements([]);
    setLoadingAnnouncements(false);
    return;
  }

  try {
    const cachedAnnouncements = announcementCache.get(workspaceId);

    if (showLoader && !cachedAnnouncements && !hasLoadedOnce.current) {
      setLoadingAnnouncements(true);
    }

    const { data } = await axios.get(
      `${API_BASE}/api/announcements/${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    const freshAnnouncements = data.announcements || [];

    setAnnouncements(freshAnnouncements);
    announcementCache.set(workspaceId, freshAnnouncements);
  } catch (err) {
    console.error(
      "Announcement fetch error:",
      err.response?.data || err
    );

    const cachedAnnouncements = announcementCache.get(workspaceId);

    if (cachedAnnouncements) {
      setAnnouncements(cachedAnnouncements);
    }
  } finally {
    setLoadingAnnouncements(false);
    hasLoadedOnce.current = true;
  }
}, [workspaceId]);

 useEffect(() => {
  const cachedAnnouncements = workspaceId
    ? announcementCache.get(workspaceId)
    : null;

  if (cachedAnnouncements) {
    setAnnouncements(cachedAnnouncements);
    setLoadingAnnouncements(false);
    hasLoadedOnce.current = true;

    fetchAnnouncements(false);
    return;
  }

  fetchAnnouncements(true);
}, [workspaceId, fetchAnnouncements]);

useEffect(() => {
  if (!hasLoadedOnce.current) return;

  fetchAnnouncements(false);
}, [liveTick, fetchAnnouncements]);

  useEffect(() => {
    if (!announcements.length) return;

    const timer = setTimeout(checkTextLength, 50);
    window.addEventListener("resize", checkTextLength);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkTextLength);
    };
  }, [announcements, checkTextLength]);

  const handleCreate = async ({ title, message, file }) => {
    if (!workspaceId) return setError("Please select a workspace first.");

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("message", message);
      if (file) formData.append("attachment", file);

      const { data } = await axios.post(
        `${API_BASE}/api/announcements/${workspaceId}`,
        formData,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (data.announcement)
        setAnnouncements(prev => [data.announcement, ...prev]);

      setIsModalOpen(false);
    } catch (err) {
      console.error("Announcement publish error:", err);
      setError(err.response?.data?.message || "Failed to publish announcement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      await axios.delete(`${API_BASE}/api/announcements/${workspaceId}/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setAnnouncements(prev => prev.filter(({ _id }) => _id !== id));

      [setExpandedMessages, setExpandedTitles, setLongMessages, setLongTitles].forEach(
        setter =>
          setter(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          })
      );
    } catch (err) {
      console.error("Announcement delete error:", err);
      setError(err.response?.data?.message || "Failed to delete announcement.");
    }
  };

  const toggle = (setter, id) =>
    setter(prev => ({ ...prev, [id]: !prev[id] }));

  const closeModal = () => {
    if (!loading) {
      setError("");
      setIsModalOpen(false);
    }
  };

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  const getFileUrl = url =>
    url?.startsWith("http") ? url : `${API_BASE}${url || ""}`;

  const colors = isDarkMode
    ? {
        panel: "bg-[#0A0F24] border-[#1F2A44]",
        card: "bg-[#11182B] border-[#263149] hover:bg-[#12192B] hover:border-[#303B52]",
        title: "text-white group-hover:text-blue-400",
        message: "text-gray-300",
        muted: "text-gray-500",
        button: "text-blue-400 hover:text-blue-300",
        empty: "bg-[#11182B] border-[#263149]",
        modal: "bg-[#0B1228] border-[#263149]",
        modalBorder: "border-[#263149]",
        modalTitle: "text-white",
        close: "text-gray-400 hover:bg-[#111C38] hover:text-white",
        attachment: "bg-[#0A0F24] border-[#263149] text-gray-300 hover:bg-[#151D31]",
        delete: "text-gray-500 hover:bg-red-500/10 hover:text-red-400",
      }
    : {
        panel: "bg-white border-gray-200",
        card: "bg-gray-50 border-gray-200 hover:border-gray-300",
        title: "text-gray-800 group-hover:text-blue-600",
        message: "text-gray-600",
        muted: "text-gray-400",
        button: "text-blue-600 hover:text-blue-700",
        empty: "bg-gray-50 border-gray-200",
        modal: "bg-white border-gray-200",
        modalBorder: "border-gray-100",
        modalTitle: "text-gray-800",
        close: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        attachment: "bg-white border-gray-200 text-gray-600 hover:bg-gray-100",
        delete: "text-gray-400 hover:bg-red-50 hover:text-red-500",
      };

  return (
    <>
      <section className={`w-full rounded-2xl border p-5 sm:p-6 transition-colors duration-300 ${colors.panel}`}>
        {loadingAnnouncements ? (
          <div className={`rounded-xl border p-7 text-center text-sm ${colors.empty} ${colors.muted}`}>
            Loading announcements...
          </div>
        ) : announcements.length ? (
          <div className="space-y-3">
            {announcements.map(announcement => {
              const {
                _id,
                title,
                message,
                createdAt,
                createdByName,
                attachmentName,
                attachmentUrl,
              } = announcement;
              const expanded = expandedMessages[_id];
              const titleExpanded = expandedTitles[_id];

              return (
                <div key={_id} className={`group rounded-xl border p-4 transition-all duration-200 ${colors.card}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <h3
                            ref={el => (titleRefs.current[_id] = el)}
                            className={`font-semibold transition-colors duration-200 ${titleExpanded ? "" : "line-clamp-2"} ${colors.title}`}
                          >
                            {title}
                          </h3>

                          {longTitles[_id] && (
                            <button
                              type="button"
                              onClick={() => toggle(setExpandedTitles, _id)}
                              className={`mt-1 text-xs font-medium ${colors.button}`}
                            >
                              {titleExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>

                        <span className={`shrink-0 text-xs ${colors.muted}`}>
                          {formatDate(createdAt)}
                        </span>
                      </div>

                      <p
                        ref={el => (messageRefs.current[_id] = el)}
                        className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-2"} ${colors.message}`}
                      >
                        {message}
                      </p>

                      {longMessages[_id] && (
                        <button
                          type="button"
                          onClick={() => toggle(setExpandedMessages, _id)}
                          className={`mt-1 text-xs font-medium ${colors.button}`}
                        >
                          {expanded ? "Show less" : "Show more"}
                        </button>
                      )}

                      {attachmentName && attachmentUrl && (
                        <a
                          href={getFileUrl(attachmentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-3 flex items-center gap-2 w-fit max-w-full px-3 py-2 rounded-lg border transition-colors ${colors.attachment}`}
                        >
                          <Paperclip size={14} className="shrink-0" />
                          <span className="text-xs font-medium truncate max-w-[260px]">
                            {attachmentName}
                          </span>
                          <Download size={14} className="shrink-0" />
                        </a>
                      )}

                      <p className={`mt-3 text-xs ${colors.muted}`}>
                        Posted by {createdByName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(_id)}
                      title="Delete announcement"
                      className={`shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${colors.delete}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`rounded-xl border p-8 text-center ${colors.empty}`}>
            <p className={`text-sm ${colors.muted}`}>No announcements yet.</p>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${colors.modal}`}>
            <div className={`flex items-center justify-between p-5 border-b ${colors.modalBorder}`}>
              <h3 className={`text-lg font-bold ${colors.modalTitle}`}>
                New Announcement
              </h3>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className={`p-2 rounded-lg ${colors.close}`}
              >
                <X size={20} />
              </button>
            </div>

            <AnnouncementForm
              isDarkMode={isDarkMode}
              loading={loading}
              onSubmit={handleCreate}
              onCancel={closeModal}
              serverError={error}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementPanel;