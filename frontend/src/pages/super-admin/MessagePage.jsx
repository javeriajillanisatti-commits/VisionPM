import { useLiveTick } from "../../hooks/useLiveRefresh";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MailOpen,
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
      ${
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
      }
    `}
  >
    {label}
    {label === "Unread" && count > 0 && (
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active
            ? "bg-white/20 text-white"
            : "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
        }`}
      >
        {count}
      </span>
    )}
  </button>);

const MessagePage = () => {
   const liveTick = useLiveTick({ resources: ["contact", "notifications"] });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
 const cacheKey = "contact-messages";
const cachedMessages = messagesCache.get(cacheKey);

const [messages, setMessages] = useState(cachedMessages || []);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
const fetchMessages = useCallback(async () => {
  const cachedData = messagesCache.get(cacheKey);

  try {
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
  }
}, []);

  useEffect(() => {
  const cachedData = messagesCache.get(cacheKey);

  if (cachedData) {
    setMessages(cachedData);
    fetchMessages();
  } else {
    fetchMessages();
  }
}, [fetchMessages, liveTick]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleClose = () => {
    setSelectedMessage(null);
    setIsOpen(false);
  };

const markAsRead = async (id) => {
  try {
    await axios.patch(
      `${process.env.REACT_APP_API_URL}/api/contact/${id}/read`
    );

    await fetchMessages();

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
    await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/contact/${id}`
    );

    await fetchMessages();

    if (selectedMessage?._id === id) {
      handleClose();
    }
  } catch (error) {
    console.error("Delete Error:", error);
  }
};

  const filteredMessages = messages.filter(
    (msg) => filter === "All" || (filter === "Unread" && !msg.isRead) || (filter === "Read" && msg.isRead)
  );
  const unreadCount = messages.filter((msg) => !msg.isRead).length;

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
        
          </div>
        </div>
      </div>

      <MessageDropdown isOpen={isOpen} onClose={handleClose}>
        <MessageDetail
          message={selectedMessage}
          onRead={() => selectedMessage && markAsRead(selectedMessage._id)}
          onDelete={() => selectedMessage && deleteMessage(selectedMessage._id)}
          onReplySent={(updatedMessage) => {
            setSelectedMessage((prev) => ({ ...prev, ...updatedMessage }));
            setMessages((prev) => prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg)));
          }}
        />
      </MessageDropdown>
    </div>);

};

export default MessagePage;