import { useLiveTick } from "../../hooks/useLiveRefresh";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MailOpen,
  ChevronRight,
  CalendarDays,
  ChevronLeft,
  X,
} from "lucide-react";

import MessageDropdown from "../../components/messagedetail/MessageDropdown";
import MessageDetail from "../../components/messagedetail/MessageDetail";
const messagesCache = new Map();

const PAGE_SIZE = 5;


// Avatar colors
const AVATAR_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
  { bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400" },
  { bg: "bg-pink-100 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-400" },
  { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400" },
];

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
};

const getInitials = (name) => {
  if (!name) return "?";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const FilterButton = ({ label, active, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5
      ${active
        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
      }
    `}
  >
    {label}
    {label === "Unread" && count > 0 && (
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active
            ? "bg-white/20 text-white"
            : "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          }`}
      >
        {count}
      </span>
    )}
  </button>
);

//Skeleton loader
const Skeleton = ({ className = "" }) => (
  <div className={`${className} rounded-md bg-slate-200 dark:bg-slate-700/60`} />
);

const LoadingState = () => (
  <div className="space-y-2.5 animate-pulse">
    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 px-5 sm:px-6 py-4 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
      >
        {/* Avatar */}
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />

        {/* Name + date, email, message */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-56 max-w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>

        {/* Arrow */}
        <Skeleton className="w-4 h-4 flex-shrink-0" />
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
      <MailOpen size={25} className="text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No messages found</h3>
    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your contact inbox is currently empty.</p>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <ChevronLeft size={17} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${currentPage === page
              ? "bg-blue-600 text-white"
              : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
};

const MessageRow = ({ msg, onOpen }) => {
  const fullName = `${msg.firstName || ""} ${msg.lastName || ""}`.trim();
  const avatarColor = getAvatarColor(fullName);

  return (
    <div
      key={msg._id}
      onClick={() => onOpen({ ...msg, id: msg._id, name: fullName, time: new Date(msg.createdAt).toLocaleString() })}
      className={`group relative flex items-center gap-4 px-5 sm:px-6 py-4 rounded-xl border cursor-pointer transition-all duration-150 hover:shadow-sm ${!msg.isRead
          ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-100/60 dark:hover:bg-blue-950/50"
          : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
        }`}
    >
      <div className="flex-shrink-0 relative">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${avatarColor.bg} ${avatarColor.text}`}>
          {getInitials(fullName || msg.email)}
        </div>
        {!msg.isRead && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pr-2">
          <h3 className={`text-sm sm:text-[15px] truncate ${!msg.isRead ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-300"}`}>
            {fullName || "Unknown User"}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
            <CalendarDays size={13} />
            {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{msg.email}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-1 max-w-[95%]">{msg.message}</p>
      </div>

      <div className="flex items-center flex-shrink-0 pl-1">
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};

const MessagePage = () => {
  const liveTick = useLiveTick({ resources: ["contact", "notifications"] });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const cacheKey = "contact-messages";
  const cachedMessages = messagesCache.get(cacheKey);

  const [messages, setMessages] = useState(cachedMessages || []);
  const [loading, setLoading] = useState(!cachedMessages);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null); // delete confirm modal ke liye
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  const fetchMessages = useCallback(async (showLoader = false) => {
    const cachedData = messagesCache.get(cacheKey);

    try {
      if (showLoader && !cachedData) {
        setLoading(true);
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/contact`
      );

      const freshMessages = res.data.data || [];

      setMessages(freshMessages);
      messagesCache.set(cacheKey, freshMessages);
    } catch (error) {
      console.error("Fetch Messages Error:", error);

      if (!cachedData) {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cachedData = messagesCache.get(cacheKey);

    if (cachedData) {
      setMessages(cachedData);
      setLoading(false);

      // Background refresh without showing loading
      fetchMessages(false);
    } else {
      fetchMessages(true);
    }
  }, [fetchMessages, liveTick]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleOpen = (msg) => {
    setSelectedMessage(msg);
    setIsOpen(true);
  };

  const handleClose = () => {
    setSelectedMessage(null);
    setIsOpen(false);
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/contact/${id}/read`
      );

      await fetchMessages(false);

      if (selectedMessage) {
        setSelectedMessage({
          ...selectedMessage,
          isRead: true,
        });
      }
    } catch (error) {
      console.error("Mark Read Error:", error);
    }
  };
  const deleteMessage = async (id) => {
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:5000/api/contact/${id}`);
      await fetchMessages(true);
      if (selectedMessage?._id === id) handleClose();
      setDeleteTarget(null);
      showToast("Message deleted successfully");
    } catch (error) {
      console.error("Delete Error:", error);
      showToast(error.response?.data?.message || "Unable to delete message", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMessages = messages.filter(
    (msg) => filter === "All" || (filter === "Unread" && !msg.isRead) || (filter === "Read" && msg.isRead)
  );
  const totalPages = Math.ceil(filteredMessages.length / PAGE_SIZE);
  const visibleMessages = filteredMessages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const unreadCount = messages.filter((msg) => !msg.isRead).length;
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-3 sm:p-5 lg:p-6 pb-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Contact Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and review messages received from users.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Inbox</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {messages.length} total message{messages.length !== 1 ? "s" : ""}
                {unreadCount > 0 && (
                  <>
                    {" "}•{" "}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{unreadCount} unread</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              {['All', 'Unread', 'Read'].map((item) => (
                <FilterButton
                  key={item}
                  label={item}
                  active={filter === item}
                  count={item === 'Unread' ? unreadCount : 0}
                  onClick={() => setFilter(item)}
                />
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? <LoadingState /> : filteredMessages.length === 0 ? <EmptyState /> : (
              <>
                <div className="space-y-2.5">
                  {visibleMessages.map((msg) => (
                    <MessageRow key={msg._id} msg={msg} onOpen={handleOpen} />
                  ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
              </>
            )}
          </div>
        </div>
      </div>

      <MessageDropdown isOpen={isOpen} onClose={handleClose}>
        <MessageDetail
          message={selectedMessage}
          onRead={() => selectedMessage && markAsRead(selectedMessage._id)}
          onDelete={() => selectedMessage && setDeleteTarget(selectedMessage)}
          onReplySent={(updatedMessage) => {
            setSelectedMessage((prev) => ({ ...prev, ...updatedMessage }));
            setMessages((prev) => prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg)));
          }}
        />
      </MessageDropdown>


      {/* Delete confirmation modal (z-[10000] taake message dropdown ke upar dikhe) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#11182B] border border-transparent dark:border-[#263149] rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete message?</h3>
            <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the message from{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {`${deleteTarget.firstName || ""} ${deleteTarget.lastName || ""}`.trim() || deleteTarget.email || "this user"}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all ${isDeleting ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => deleteMessage(deleteTarget._id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all ${isDeleting ? "opacity-60 cursor-not-allowed" : "active:scale-95"}`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast*/}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[10000] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
        >
          {toast.message}
          <button type="button" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessagePage;
