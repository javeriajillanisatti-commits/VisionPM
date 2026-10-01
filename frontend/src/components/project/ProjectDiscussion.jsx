import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, Smile, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import io from "socket.io-client";
import { getProjectDiscussion } from "../../services/projectDiscussionService";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const QUICK_REACTIONS = ["❤️", "👍", "🔥", "🚀", "😂", "👏", "✅"];

const decodeUserId = (token) => {
  try {
    const part = token?.split(".")[1];
    if (!part) return "";
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return String(payload.id || payload._id || "");
  } catch {
    return "";
  }
};

const cleanRole = (role) => role?.toString().toLowerCase().replace(/[\s_-]+/g, "") || "";

const ProjectDiscussion = ({ project }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const projectId = project?._id || project?.id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const [pickerPosition, setPickerPosition] = useState(null);
  const [inputEmojiPosition, setInputEmojiPosition] = useState(null);
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [reactionBarFor, setReactionBarFor] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [canModerate, setCanModerate] = useState(false);


  const [isOpen, setIsOpen] = useState(false);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const inputEmojiRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const inputEmojiButtonRef = useRef(null);
  const reactionAnchorRef = useRef(null);
  const typingTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const touchStartRef = useRef(null);
  const lastTapRef = useRef({ id: null, time: 0 });
  const currentUserId = useMemo(() => decodeUserId(sessionStorage.getItem("token")), []);
  const canOpenDiscussion = useMemo(() => {
    if (!currentUserId || !project) return false;
    const creatorId = String(project.createdBy?._id || project.createdBy || "");
    const isCreatorPM = cleanRole(user?.role) === "projectmanager" && creatorId === String(currentUserId);
    const isMember = (project.members || []).some((member) => String(member?._id || member) === String(currentUserId));
    return isCreatorPM || isMember;
  }, [project, currentUserId, user?.role]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  useEffect(() => {
    setMessages([]);
    setDenied(false);
    setError("");
    setCanModerate(false);
    setIsOpen(false);
    setEditingId(null);
    setText("");
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !isOpen) return undefined;
    const token = sessionStorage.getItem("token");
    if (!token) return undefined;

    let mounted = true;
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;
    setLoading(true);
    setDenied(false);

    getProjectDiscussion(projectId)
      .then((data) => {
        if (!mounted) return;
        setMessages(data.messages || []);
        setCanModerate(Boolean(data.canModerate));

        setLoading(false);
        scrollToBottom();
      })
      .catch((err) => {
        if (!mounted) return;
        setLoading(false);
        if (err?.response?.status === 403) setDenied(true);
        else setError(err?.response?.data?.message || "Unable to load project discussion.");
      });

    socket.on("project_discussion_access_denied", () => {
      if (!mounted) return;
      setDenied(true);
      setLoading(false);
    });

    socket.on("project_message_received", (message) => {
      if (!mounted) return;
      setMessages((prev) => prev.some((item) => String(item._id) === String(message._id)) ? prev : [...prev, message]);
      scrollToBottom();
    });

    socket.on("project_message_updated", ({ messageId, message, editedAt }) => {
      setMessages((prev) => prev.map((item) => String(item._id) === String(messageId) ? { ...item, message, edited: true, editedAt } : item));
    });

    socket.on("project_message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((item) => String(item._id) !== String(messageId)));
    });

    socket.on("project_message_hidden_for_me", ({ messageId }) => {
      setMessages((prev) => prev.filter((item) => String(item._id) !== String(messageId)));
    });

    socket.on("project_reaction_updated", ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((item) => String(item._id) === String(messageId) ? { ...item, reactions } : item));
    });

    socket.on("project_user_typing", ({ userId, fullName, isTyping }) => {
      if (String(userId) === String(currentUserId)) return;
      setTypingUsers((prev) => {
        if (isTyping) return prev.some((u) => String(u.id) === String(userId)) ? prev : [...prev, { id: userId, fullName }];
        return prev.filter((u) => String(u.id) !== String(userId));
      });
    });


    socket.on("project_discussion_joined", () => setLoading(false));
    socket.on("project_discussion_error", ({ message }) => setError(message || "Discussion action failed."));
    socket.on("connect", () => socket.emit("join_project_discussion", { projectId }));

    return () => {
      mounted = false;
      clearTimeout(typingTimerRef.current);
      socket.emit("project_typing", { projectId, isTyping: false });
      socket.emit("leave_project_discussion", { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, isOpen, currentUserId]);

  useEffect(() => {
    const close = (event) => {
      if (inputEmojiRef.current && !inputEmojiRef.current.contains(event.target) && !event.target.closest("[data-input-emoji-picker]")) {
        setShowInputEmoji(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target) && !event.target.closest("[data-reaction-emoji-picker]")) {
        setPickerFor(null);
      }
      // Close the quick-reaction bar when clicking anywhere outside it.
      if (!event.target.closest("[data-reaction-bar]")) {
        setReactionBarFor(null);
      }
      if (!event.target.closest("[data-message-menu]")) setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const emitTyping = (isTyping) => {
    if (!socketRef.current || !projectId) return;
    socketRef.current.emit("project_typing", { projectId, isTyping });
    if (isTyping) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => socketRef.current?.emit("project_typing", { projectId, isTyping: false }), 1200);
    }
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    const message = text.trim();
    if (!message || !socketRef.current) return;

    if (editingId) {
      socketRef.current.emit("edit_project_message", { projectId, messageId: editingId, message });
      setEditingId(null);
    } else {
      socketRef.current.emit("send_project_message", { projectId, message });
    }
    setText("");
    setShowInputEmoji(false);
    emitTyping(false);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setText(item.message || "");
    setOpenMenu(null);
    setPickerFor(null);
    setReactionBarFor(null);
    setShowInputEmoji(false);
    requestAnimationFrame(() => document.getElementById("project-discussion-input")?.focus());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText("");
    setShowInputEmoji(false);
    emitTyping(false);
  };

  const deleteMessage = (messageId, mode) => {
    socketRef.current?.emit("delete_project_message", { projectId, messageId, mode });
    setOpenMenu(null);
  };

  const toggleReaction = (messageId, emoji) => {
    socketRef.current?.emit("toggle_project_reaction", { projectId, messageId, emoji });
    setPickerFor(null);
    setPickerPosition(null);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = (event, messageId) => {
    if (event?.pointerType && event.pointerType !== "touch") return;
    clearLongPress();
    longPressTriggeredRef.current = false;
    touchStartRef.current = {
      x: event.clientX || event.touches?.[0]?.clientX || 0,
      y: event.clientY || event.touches?.[0]?.clientY || 0,
    };

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setReactionBarFor(messageId);
      setPickerFor(null);
      setPickerPosition(null);
      setOpenMenu(null);
      if (navigator.vibrate) navigator.vibrate(15);
    }, 700);
  };

  const moveLongPress = (event) => {
    if (!touchStartRef.current) return;
    const point = event.touches?.[0] || event;
    const dx = Math.abs((point.clientX || 0) - touchStartRef.current.x);
    const dy = Math.abs((point.clientY || 0) - touchStartRef.current.y);
    if (dx > 10 || dy > 10) {
      clearLongPress();
      touchStartRef.current = null;
    }
  };

  const handleDoubleTap = (messageId) => {
    const now = Date.now();
    const last = lastTapRef.current;

    if (last.id === messageId && now - last.time < 350) {
      setReactionBarFor(messageId);
      setPickerFor(null);
      setPickerPosition(null);
      setOpenMenu(null);
      lastTapRef.current = { id: null, time: 0 };
      return;
    }

    lastTapRef.current = { id: messageId, time: now };
  };

  const endLongPress = () => {
    clearLongPress();
    touchStartRef.current = null;
  };

  const getViewportSize = () => {
    const viewport = window.visualViewport;
    return {
      width: viewport?.width || window.innerWidth,
      height: viewport?.height || window.innerHeight,
    };
  };

  const positionReactionPicker = useCallback((anchor = reactionAnchorRef.current) => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const { width: viewportWidth, height: viewportHeight } = getViewportSize();
    const width = Math.min(320, Math.max(220, viewportWidth - 16));
    const height = Math.min(320, Math.max(180, viewportHeight - 16));
    const left = Math.max(8, Math.min(rect.left, Math.max(8, viewportWidth - width - 8)));
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const top = spaceBelow >= height
      ? rect.bottom + 8
      : spaceAbove >= height
        ? rect.top - height - 8
        : 8;
    setPickerPosition({ top: Math.max(8, Math.min(top, viewportHeight - height - 8)), left });
  }, []);

  const positionInputEmojiPicker = useCallback((anchor = inputEmojiButtonRef.current) => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const { width: viewportWidth, height: viewportHeight } = getViewportSize();
    const width = Math.min(320, Math.max(220, viewportWidth - 16));
    const height = Math.min(350, Math.max(180, viewportHeight - 16));
    const left = Math.max(8, Math.min(rect.left, Math.max(8, viewportWidth - width - 8)));
    const spaceAbove = rect.top - 8;
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const top = spaceAbove >= height
      ? rect.top - height - 8
      : spaceBelow >= height
        ? rect.bottom + 8
        : 8;
    setInputEmojiPosition({ top: Math.max(8, Math.min(top, viewportHeight - height - 8)), left });
  }, []);

  const openReactionPicker = (event, messageId) => {
    const anchor = event.currentTarget;
    reactionAnchorRef.current = anchor;
    // Calculate the position immediately so the picker never waits for a second frame.
    positionReactionPicker(anchor);
    setPickerFor(messageId);
    setOpenMenu(null);
    setShowInputEmoji(false);
    setInputEmojiPosition(null);
  };

  const openInputEmojiPicker = (event) => {
    const anchor = event.currentTarget;
    inputEmojiButtonRef.current = anchor;
    // Calculate the position immediately so the picker opens on the same interaction.
    positionInputEmojiPicker(anchor);
    setShowInputEmoji(true);
    setPickerFor(null);
    setPickerPosition(null);
  };

  useEffect(() => {
    if (!showInputEmoji && !pickerFor) return undefined;

    const reposition = () => {
      if (showInputEmoji) positionInputEmojiPicker();
      if (pickerFor) positionReactionPicker();
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
    };
  }, [showInputEmoji, pickerFor, positionInputEmojiPicker, positionReactionPicker]);

  useEffect(() => () => clearLongPress(), []);

  const renderReactions = (message) => {
    const grouped = {};
    (message.reactions || []).forEach(({ emoji }) => { grouped[emoji] = (grouped[emoji] || 0) + 1; });
    return Object.entries(grouped).map(([emoji, count]) => (
      <button key={emoji} type="button" onClick={() => toggleReaction(message._id, emoji)} className={`px-2 py-0.5 rounded-full text-[10px] border ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-gray-200 text-gray-700"}`}>
        {emoji} {count}
      </button>
    ));
  };

  if (denied || !canOpenDiscussion) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group min-w-0 w-full sm:w-auto justify-center inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl border font-semibold text-[11px] sm:text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:border-blue-600 hover:text-white ${isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-800"}`}
      >
        <MessageCircle size={17} className="shrink-0 text-blue-600 group-hover:text-white transition-colors" />
        <span className="truncate">Project Discussion</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6">
          <button type="button" aria-label="Close discussion" onClick={() => setIsOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <section className={`relative z-10 w-full max-w-4xl max-h-[calc(100dvh-0.75rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-3rem)] overflow-hidden rounded-xl sm:rounded-2xl border shadow-2xl ${isDarkMode ? "bg-[#0B1120] border-slate-800" : "bg-white border-gray-200"}`}>
            <div className={`px-3 sm:px-5 py-3 sm:py-3.5 border-b flex items-center justify-between gap-2 sm:gap-4 shrink-0 ${isDarkMode ? "border-slate-800 bg-slate-900/70" : "border-gray-100 bg-gray-50"}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><MessageCircle size={18} /></div>
                <div className="min-w-0">
                  <div className={`font-bold text-sm sm:text-base truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>Project Discussion</div>

                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {typingUsers.length > 0 && <div className="hidden sm:block text-[11px] text-blue-500 font-medium">{typingUsers.length === 1 ? `${typingUsers[0].fullName || "Someone"} is typing...` : `${typingUsers.length} people are typing...`}</div>}
                <button type="button" onClick={() => setIsOpen(false)} className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-gray-500 hover:bg-gray-100"}`} title="Close"><X size={18} /></button>
              </div>
            </div>

            {error && <div className="px-5 py-2 text-xs text-red-500 border-b border-red-100 dark:border-red-950">{error}</div>}

            <div ref={scrollRef} className={`h-[min(56dvh,430px)] min-h-[180px] max-h-[calc(100dvh-12rem)] sm:max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3 sm:space-y-4 ${isDarkMode ? "bg-[#080D19]" : "bg-gray-50/40"}`}>
              {loading ? (
                <div className={`h-full flex items-center justify-center text-sm ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}>Loading discussion...</div>
              ) : messages.length === 0 ? (
                <div className={`h-full flex flex-col items-center justify-center text-center ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                  <MessageCircle size={34} className="mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No project discussion yet</p>
                  <p className="text-xs mt-1">Start a conversation with your project team.</p>
                </div>
              ) : messages.map((item) => {
                const id = item._id;
                const senderId = String(item.sender?._id || "");
                const mine = senderId === String(currentUserId);
                const role = item.sender?.role || "Team Member";
                const isManagerMessage = cleanRole(role) === "projectmanager";

                return (
                  <div
                    key={id}
                    className={`group flex w-full ${mine ? "justify-end" : "justify-start"}`}
                    onTouchStart={(event) => startLongPress(event, id)}
                    onTouchMove={moveLongPress}
                    onTouchEnd={(event) => {
                      endLongPress();
                      handleDoubleTap(id);
                    }}
                    onTouchCancel={endLongPress}
                    onContextMenu={(event) => {
                      if (longPressTriggeredRef.current) {
                        event.preventDefault();
                        longPressTriggeredRef.current = false;
                      }
                    }}
                  >
                    <div className={`max-w-[94%] sm:max-w-[76%] flex gap-1.5 sm:gap-2 min-w-0 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="shrink-0 pt-5"><div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold ${mine ? "bg-blue-600 text-white" : isDarkMode ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"}`}>{(item.sender?.fullName || "U").charAt(0).toUpperCase()}</div></div>
                      <div className={`min-w-0 ${mine ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`flex items-center gap-2 mb-1 px-1 ${mine ? "justify-end" : "justify-start"}`}>
                          {!mine && <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{item.sender?.fullName || "User"}</span>}
                          {!mine && isManagerMessage && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">PM</span>}
                          <span className={`text-[9px] ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                        </div>

                        <div className="relative">
                          <div className={`relative max-w-full px-3 pr-9 sm:px-3.5 sm:pr-3.5 py-2 sm:py-2.5 rounded-2xl shadow-sm ${mine ? "bg-blue-600 text-white rounded-tr-sm" : isDarkMode ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm" : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"}`}>
                            <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{item.message}</p>
                            {item.edited && <span className={`block text-[8px] mt-1 ${mine ? "text-blue-100" : isDarkMode ? "text-slate-500" : "text-gray-400"}`}>Edited</span>}

                            <div data-reaction-bar
                              className={`absolute -top-8 ${mine ? "right-0" : "left-0"} ${reactionBarFor === id ? "flex" : "hidden sm:group-hover:flex"} items-center gap-1 p-1 rounded-full border shadow-md z-20 max-w-[calc(100vw-32px)] overflow-x-auto ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
                              {QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" onClick={() => toggleReaction(id, emoji)} className="text-sm hover:scale-125 transition-transform">{emoji}</button>)}
                              <button type="button" onClick={(event) => pickerFor === id ? (setPickerFor(null), setPickerPosition(null)) : (setReactionBarFor(id), openReactionPicker(event, id))} className={`h-5 w-5 rounded-full text-xs ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-500"}`}>+</button>
                            </div>
                          </div>

                          {(mine || canModerate) && (
                            <button type="button" onClick={() => setOpenMenu(openMenu === id ? null : id)} className={`absolute z-30 top-1 right-1 sm:right-auto sm:top-1 ${mine ? "sm:-left-8" : "sm:left-full sm:ml-2"} opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-full ${isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-gray-400 hover:bg-gray-100"}`} title="Message actions">
                              <MoreHorizontal size={15} />
                            </button>
                          )}

                          {openMenu === id && (
                            <div data-message-menu className={`absolute right-0 top-7 sm:top-0 z-30 w-40 max-w-[calc(100vw-2rem)] rounded-xl border shadow-lg p-1 ${mine ? "sm:right-full sm:mr-2" : "sm:left-full sm:ml-2"} ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
                              {mine && <button type="button" onClick={() => startEdit(item)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-slate-800"><Pencil size={13} /> Edit</button>}
                              {mine && <button type="button" onClick={() => deleteMessage(id, "me")} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-slate-800"><Trash2 size={13} /> Delete for me</button>}
                              {(mine || canModerate) && <button type="button" onClick={() => deleteMessage(id, "everyone")} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={13} /> Delete for everyone</button>}
                            </div>
                          )}

                          {pickerFor === id && pickerPosition && createPortal(
                            <div ref={reactionPickerRef} data-reaction-emoji-picker className="fixed z-[300] max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] overflow-hidden" style={{ top: pickerPosition.top, left: pickerPosition.left, width: "min(320px, calc(100vw - 16px))" }}>
                              <div className={`relative rounded-xl shadow-2xl ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
                                <button type="button" onClick={() => { setPickerFor(null); setPickerPosition(null); }} className={`absolute right-1 top-1 z-[301] h-7 w-7 rounded-full flex items-center justify-center shadow ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-white text-gray-600"}`} title="Close emoji picker"><X size={14} /></button>
                                <EmojiPicker onEmojiClick={(emojiData) => toggleReaction(id, emojiData.emoji)} height={Math.min(320, Math.max(180, (window.visualViewport?.height || window.innerHeight) - 16))} width={Math.min(320, Math.max(220, (window.visualViewport?.width || window.innerWidth) - 16))} skinTonesDisabled />
                              </div>
                            </div>,
                            document.body
                          )}
                        </div>
                        <div className={`flex flex-wrap gap-1 mt-1 px-1 ${mine ? "justify-end" : "justify-start"}`}>{renderReactions(item)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={inputEmojiRef} className={`relative p-2.5 sm:p-4 border-t shrink-0 ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-gray-100 bg-white"}`}>
              {showInputEmoji && inputEmojiPosition && createPortal(
                <div data-input-emoji-picker className="fixed z-[300] max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] overflow-hidden" style={{ top: inputEmojiPosition.top, left: inputEmojiPosition.left, width: "min(320px, calc(100vw - 16px))" }}>
                  <div className={`relative rounded-xl shadow-2xl ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
                    <button type="button" onClick={() => { setShowInputEmoji(false); setInputEmojiPosition(null); }} className={`absolute right-1 top-1 z-[301] h-7 w-7 rounded-full flex items-center justify-center shadow ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-white text-gray-600"}`} title="Close emoji picker"><X size={14} /></button>
                    <EmojiPicker onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)} height={Math.min(350, Math.max(180, (window.visualViewport?.height || window.innerHeight) - 16))} width={Math.min(320, Math.max(220, (window.visualViewport?.width || window.innerWidth) - 16))} skinTonesDisabled />
                  </div>
                </div>,
                document.body
              )}

              {editingId && (
                <div className={`mb-2 px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-between ${isDarkMode ? "bg-blue-950/40 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                  <span>Editing your message</span>
                  <button type="button" onClick={cancelEdit} className="font-semibold hover:underline">Cancel</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className={`flex items-end gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border p-1.5 sm:p-2 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
                <button ref={inputEmojiButtonRef} type="button" onClick={(event) => showInputEmoji ? (setShowInputEmoji(false), setInputEmojiPosition(null)) : openInputEmojiPicker(event)} className={`p-2 rounded-lg sm:rounded-xl shrink-0 ${isDarkMode ? "text-slate-400 hover:bg-slate-700" : "text-gray-400 hover:bg-white"}`} title="Emoji"><Smile size={18} /></button>
                <textarea
                  id="project-discussion-input"
                  value={text}
                  onChange={(e) => { setText(e.target.value); emitTyping(Boolean(e.target.value.trim())); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  rows={1}
                  maxLength={5000}
                  placeholder={editingId ? "Edit your message..." : "Write a message to the project team..."}
                  className={`flex-1 min-w-0 resize-none bg-transparent outline-none text-[13px] sm:text-sm py-2 max-h-28 ${isDarkMode ? "text-white placeholder:text-slate-500" : "text-gray-900 placeholder:text-gray-400"}`}
                />
                <button type="submit" disabled={!text.trim()} className="h-10 min-w-10 px-2.5 sm:px-3 shrink-0 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors" title={editingId ? "Update message" : "Send message"}>
                  <Send size={16} />
                  <span className="hidden sm:inline text-xs font-semibold">{editingId ? "Update" : "Send"}</span>
                </button>
              </form>
              <div className={`mt-1.5 text-[9px] text-right ${isDarkMode ? "text-slate-600" : "text-gray-400"}`}>Enter to send/update • Shift + Enter for a new line</div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default ProjectDiscussion;