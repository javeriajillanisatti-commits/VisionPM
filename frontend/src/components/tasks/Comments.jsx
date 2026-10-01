import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, Smile, Trash2, Pencil, MoreHorizontal, X } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { createPortal } from "react-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const QUICK_REACTIONS = ["❤️", "👍", "🔥", "🚀", "😂", "😮", "👏", "✅"];

const decodeUserId = (token) => {
  try {
    const part = token?.split(".")[1];
    if (!part) return "";
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return String(payload.id || payload._id || "");
  } catch { return ""; }
};

const cleanRole = (role) => role?.toString().toLowerCase().replace(/[\s_-]+/g, "") || "";

const getPosition = (rect, input = false) => {
  const width = Math.min(input ? 300 : 280, Math.max(input ? 240 : 220, window.innerWidth - 16));
  const height = Math.min(input ? 350 : 330, Math.max(260, window.innerHeight - 24));
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const above = rect.top - 8, below = window.innerHeight - rect.bottom - 8;
  const top = input
    ? above >= height ? rect.top - height - 8 : below >= height ? rect.bottom + 8 : Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - height - 8))
    : below >= height ? rect.bottom + 8 : above >= height ? rect.top - height - 8 : Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - height - 8));
  return { top, left, width, height };
};

const Picker = ({ position, reactionId, input, onClose, onEmoji }) => {
  if (!position) return null;
  return createPortal(
    <div data-input-picker={!reactionId || undefined} data-reaction-picker={reactionId || undefined} className="fixed z-[99999]" style={{ top: position.top, left: position.left, width: position.width, maxWidth: "calc(100vw - 16px)" }}>
      <div className="relative rounded-xl shadow-2xl overflow-hidden">
        <button type="button" onClick={onClose} className="absolute right-1 top-1 z-[100000] h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 hover:text-red-500" title="Close emoji picker"><X size={14} /></button>
        <EmojiPicker onEmojiClick={onEmoji} height={position.height} width="100%" skinTonesDisabled searchDisabled={!input} />
      </div>
    </div>,
    document.body
  );
};

const Comments = ({ taskId, userRole, onCountChange }) => {
  const { id, taskId: paramTaskId } = useParams();
  const currentTaskId = taskId || id || paramTaskId;
  const role = cleanRole(userRole);
  const isAdmin = ["projectadmin", "admin"].includes(role);
  const isProjectManager = role === "projectmanager";

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showInputPicker, setShowInputPicker] = useState(false);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);
  const [reactionPosition, setReactionPosition] = useState(null);
  const [inputPickerPosition, setInputPickerPosition] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const reactionButtonRefs = useRef({});
  const inputButtonRef = useRef(null);

  useEffect(() => onCountChange?.(comments.length), [comments, onCountChange]);

  // Keep pickers inside viewport
  useEffect(() => {
    const reposition = () => {
      if (activeReactionPickerId && reactionButtonRefs.current[activeReactionPickerId])
        setReactionPosition(getPosition(reactionButtonRefs.current[activeReactionPickerId].getBoundingClientRect()));
      if (showInputPicker && inputButtonRef.current)
        setInputPickerPosition(getPosition(inputButtonRef.current.getBoundingClientRect(), true));
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("orientationchange", reposition);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("orientationchange", reposition);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
    };
  }, [activeReactionPickerId, showInputPicker]);

  // Close menus outside
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest("[data-comment-menu]")) setOpenMenu(null);
      if (!e.target.closest("[data-reaction-picker]") && !e.target.closest("[data-reaction-trigger]")) {
        setActiveReactionPickerId(null);
        setReactionPosition(null);
      }
      if (!e.target.closest("[data-input-picker]") && !e.target.closest("[data-input-emoji-trigger]")) {
        setShowInputPicker(false);
        setInputPickerPosition(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Load comments and socket
  useEffect(() => {
    if (isAdmin || !currentTaskId) return;
    const keys = ["token", "authToken", "access_token", "jwt"];
    const token = [...keys.map((k) => sessionStorage.getItem(k)), ...keys.map((k) => localStorage.getItem(k))].find(Boolean);
    if (!token) return;

    setCurrentUserId(decodeUserId(token));
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    axios.get(`${API_URL}/api/comments/task/${currentTaskId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setComments(Array.isArray(data?.comments) ? data.comments : []))
      .catch((err) => console.error("Failed to load comments:", err));

    socket.on("connect", () => socket.emit("join_task_chat", { taskId: currentTaskId }));
    socket.on("receive_message", (msg) => setComments((prev) => [...prev, msg]));
    socket.on("reaction_updated", ({ commentId, reactions }) =>
      setComments((prev) => prev.map((c) => String(c._id || c.id) === String(commentId) ? { ...c, reactions } : c))
    );
    socket.on("message_deleted", ({ commentId }) =>
      setComments((prev) => prev.filter((c) => String(c._id || c.id) !== String(commentId)))
    );
    socket.on("message_hidden_for_me", ({ commentId }) =>
      setComments((prev) => prev.filter((c) => String(c._id || c.id) !== String(commentId)))
    );
    socket.on("message_edited", ({ commentId, message, editedAt }) =>
      setComments((prev) => prev.map((c) => String(c._id || c.id) === String(commentId)
        ? { ...c, message, isEdited: true, updatedAt: editedAt || c.updatedAt } : c))
    );
    socket.on("task_chat_access_denied", ({ message }) =>
      console.error(message || "Task comments access denied.")
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentTaskId, isAdmin]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [comments]);

  // Add or edit comment
  const handleAddComment = (e) => {
    e?.preventDefault();
    const message = newComment.trim();
    if (!message || !currentUserId || !currentTaskId || !socketRef.current) return;

    socketRef.current.emit(editingId ? "edit_message" : "send_message", editingId
      ? { commentId: editingId, taskId: currentTaskId, newMessage: message }
      : { taskId: currentTaskId, message }
    );
    setEditingId(null);
    setNewComment("");
    setShowInputPicker(false);
    setInputPickerPosition(null);
  };

  const startEdit = (comment) => {
    setEditingId(comment._id || comment.id);
    setNewComment(comment.message || "");
    setOpenMenu(null);
    setShowInputPicker(false);
    setInputPickerPosition(null);
    requestAnimationFrame(() => document.getElementById("task-comment-input")?.focus());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewComment("");
    setShowInputPicker(false);
    setInputPickerPosition(null);
  };

  // Delete comment
  const deleteComment = (commentId, mode) => {
    if (!socketRef.current) return;
    const label = mode === "everyone" ? "Delete this comment for everyone?" : "Remove this comment from your view?";
    if (!window.confirm(label)) return;
    socketRef.current.emit("delete_message", { commentId, taskId: currentTaskId, mode });
    setOpenMenu(null);
  };

  // Toggle reaction
  const handleReaction = (commentId, emoji) => {
    if (!currentUserId || !currentTaskId || !socketRef.current) return;
    socketRef.current.emit("toggle_reaction", { commentId, taskId: currentTaskId, emoji });
    setActiveReactionPickerId(null);
    setReactionPosition(null);
  };

  const openReactionPicker = (e, commentId) => {
    e.stopPropagation();
    reactionButtonRefs.current[commentId] = e.currentTarget;
    setActiveReactionPickerId(commentId);
    setReactionPosition(getPosition(e.currentTarget.getBoundingClientRect()));
    setOpenMenu(null);
    setShowInputPicker(false);
    setInputPickerPosition(null);
  };

  const openInputPicker = (e) => {
    e.stopPropagation();
    setShowInputPicker(true);
    setInputPickerPosition(getPosition(e.currentTarget.getBoundingClientRect(), true));
    setActiveReactionPickerId(null);
    setReactionPosition(null);
  };

  const reactions = (items = [], id) => {
    const counts = {};
    items.forEach(({ emoji }) => counts[emoji] = (counts[emoji] || 0) + 1);
    return Object.entries(counts).map(([emoji, count]) => (
      <button key={emoji} type="button" onClick={() => handleReaction(id, emoji)} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-1.5 py-0.5 rounded-full text-[10px] hover:bg-indigo-50 dark:hover:bg-slate-700">
        {emoji} <b className="text-indigo-600">{count}</b>
      </button>
    ));
  };

  if (isAdmin) return (
    <div className="w-full bg-gray-50/50 border border-gray-200 border-dashed rounded-[2rem] p-5 sm:p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
      <div className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-lg shadow-sm mb-3">🔒</div>
      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Discussion Board Locked</h4>
      <p className="text-xs text-gray-400 max-w-sm mt-1 px-2">Task comments are restricted to the Project Manager and assigned Team Members.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[min(500px,calc(100dvh-180px))] min-h-[360px] w-full min-w-0 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/40 flex justify-between items-center gap-2 shrink-0">
        <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{comments.length} Comments</span>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50/20 dark:bg-slate-900/10">
        {comments.length ? comments.map((c) => {
          const commentId = c._id || c.id;
          const mine = String(c.sender?._id || c.sender?.id || "") === String(currentUserId);
          const canDeleteEveryone = mine || isProjectManager;

          return (
            <div key={commentId} className={`flex flex-col gap-1 group w-full min-w-0 ${mine ? "items-end" : "items-start"}`}>
              <div className={`flex items-center gap-1.5 sm:gap-2 px-1 text-[10px] text-gray-500 max-w-full min-w-0 ${mine ? "justify-end" : ""}`}>
                <span className="font-bold truncate max-w-[48%] sm:max-w-none">
                  {c.sender?.fullName || "User"}<span className="font-normal text-gray-400 ml-1">({c.sender?.role || "Member"})</span>
                </span>
                <span className="text-[9px] text-gray-300 whitespace-nowrap shrink-0">
                  {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
                {c.isEdited && <span className="text-[9px] text-gray-400 italic whitespace-nowrap">Edited</span>}
              </div>

              <div className={`relative max-w-[94%] sm:max-w-[85%] min-w-0 flex items-center gap-1 sm:gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <div className={`relative min-w-0 max-w-full border p-2.5 sm:p-3 rounded-2xl shadow-sm ${mine ? "bg-indigo-600 border-indigo-600 text-white rounded-tr-none" : "bg-indigo-50/50 dark:bg-slate-800 border-indigo-100/50 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-tl-none"}`}>
                  <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{c.message}</p>

                  <div className={`absolute -top-7 hidden group-hover:flex bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-lg rounded-full px-2 py-1 gap-1.5 z-20 max-w-[calc(100vw-16px)] overflow-hidden ${mine ? "right-0" : "left-0"}`}>
                    {QUICK_REACTIONS.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => handleReaction(commentId, emoji)} className="hover:scale-125 transition-transform text-sm shrink-0">{emoji}</button>
                    ))}
                    <button type="button" data-reaction-trigger onClick={(e) => openReactionPicker(e, commentId)} className="text-gray-400 bg-gray-50 dark:bg-slate-700 rounded-full w-5 h-5 shrink-0" title="More reactions">+</button>
                  </div>
                </div>

                {(mine || canDeleteEveryone) && (
                  <div className="relative shrink-0" data-comment-menu>
                    <button type="button" onClick={() => setOpenMenu(openMenu === commentId ? null : commentId)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-opacity" title="Comment options">
                      <MoreHorizontal size={15} />
                    </button>

                    {openMenu === commentId && (
                      <div className={`absolute top-full mt-1 w-44 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-40 ${mine ? "right-0" : "left-0"}`}>
                        {mine && (
                          <button type="button" onClick={() => startEdit(c)} className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                            <Pencil size={13} /> Edit
                          </button>
                        )}
                        {mine && (
                          <button type="button" onClick={() => deleteComment(commentId, "me")} className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                            <Trash2 size={13} /> Delete for me
                          </button>
                        )}
                        {canDeleteEveryone && (
                          <button type="button" onClick={() => deleteComment(commentId, "everyone")} className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-2">
                            <Trash2 size={13} /> Delete for everyone
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`flex flex-wrap gap-1 px-1 max-w-full ${mine ? "justify-end" : ""}`}>{reactions(c.reactions, commentId)}</div>
            </div>
          );
        }) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2 text-gray-400 px-4 text-center">
            <Smile size={32} />
            <p className="text-xs font-semibold uppercase">No comments yet</p>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 relative shrink-0">
        {editingId && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300">
            <span className="font-semibold truncate">Editing comment</span>
            <button type="button" onClick={cancelEdit} className="p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 shrink-0" title="Cancel edit"><X size={14} /></button>
          </div>
        )}

        <form onSubmit={handleAddComment} className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-gray-200 dark:border-slate-700 min-w-0">
          <button ref={inputButtonRef} type="button" data-input-emoji-trigger onClick={openInputPicker} className="p-1.5 sm:p-2 text-gray-400 hover:text-indigo-600 shrink-0" title="Emoji"><Smile size={18} /></button>
          <input id="task-comment-input" type="text" placeholder={editingId ? "Edit your comment..." : "Type your comment..."} value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 min-w-0 bg-transparent outline-none text-[13px] sm:text-sm px-1 text-gray-700 dark:text-slate-200" />
          <button type="submit" disabled={!newComment.trim()} className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${newComment.trim() ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-400"}`} title={editingId ? "Save comment" : "Send comment"}><Send size={14} /></button>
        </form>
      </div>

      {showInputPicker && <Picker position={inputPickerPosition} input onClose={() => { setShowInputPicker(false); setInputPickerPosition(null); }} onEmoji={(e) => setNewComment((prev) => prev + e.emoji)} />}
      {activeReactionPickerId && <Picker position={reactionPosition} reactionId={activeReactionPickerId} onClose={() => { setActiveReactionPickerId(null); setReactionPosition(null); }} onEmoji={(e) => handleReaction(activeReactionPickerId, e.emoji)} />}
    </div>
  );
};

export default Comments;