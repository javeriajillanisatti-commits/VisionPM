import { useState } from "react";
import axios from "axios";
const MessageDetail = ({ message, onRead, onDelete, onReplySent }) => {
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replySuccess, setReplySuccess] = useState("");
  if (!message) return null;
  const isMeaningfulText = (text) => {
    const value = text.trim();
    if (!/[a-zA-Z]/.test(value) || /(.)\1{3,}/i.test(value)) return false;
    return (value.match(/[a-zA-Z0-9]/g) || []).length >= 2;
  };

  const hasRepeatedPhrase = (text) => { const collapsed = text.replace(/\s+/g, " ").trim();
    return /(.{3,50})(?: \1){2,}/i.test(collapsed);
  };

  const handleReply = async () => {
    const cleanReply = reply.trim();
    if (!cleanReply) return setReplyError("Please enter a reply.");
    if (cleanReply.length < 10)
      return setReplyError("Reply must contain at least 10 characters.");
    if (cleanReply.length > 1000)
      return setReplyError("Reply cannot exceed 1000 characters.");
    if (!isMeaningfulText(cleanReply))
      return setReplyError("Please enter a meaningful reply.");
    if (hasRepeatedPhrase(cleanReply))
      return setReplyError("Please do not repeat the same reply multiple times.");
    if (/^(ok|okay|test|testing|hello|hi|abc|abcde|qwerty)$/i.test(cleanReply))
      return setReplyError("Please enter a meaningful reply.");
    if (/^(www\.?|https?:\/\/)/i.test(cleanReply))
      return setReplyError("Please enter a proper reply instead of a URL.");
    if (cleanReply.replace(/[\s.,!?'"-]/g, "").length < 5)
      return setReplyError("Please enter a meaningful reply.");
    try {setSending(true);
      setReplyError("");
      setReplySuccess("");
      const response = await axios.post(
  `${process.env.REACT_APP_API_URL}/api/contact/${message._id}/reply`,
  { reply: cleanReply }
);
      if (response.data.success) {setReply("");
        setShowReply(false);
        setReplySuccess("Reply sent successfully.");
        onReplySent?.(response.data.data);
      }
    } catch (error) {console.error("Reply Error:", error);
      setReplyError(error.response?.data?.message || "Failed to send reply.");
    } finally {setSending(false);
    }
  };

  const inputClass ="w-full resize-none border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-slate-700 pb-6">
        <div>
          <p className="text-gray-600 dark:text-slate-500 text-xs">From</p>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{message.name}</h3>
          <p className="text-gray-500 dark:text-slate-500 text-sm">{message.email}</p>
        </div>
        <div className="text-right pr-10">
          <p className="text-gray-600 dark:text-slate-500 text-xs">Received</p>
          <p className="text-sm text-gray-700 dark:text-slate-300">{message.time}</p>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-gray-700 dark:text-slate-300 text-sm leading-relaxed border border-transparent dark:border-slate-700">
        {message.message}
      </div>
      {replySuccess && !showReply && (
        <p className="mt-4 text-xs text-green-600">{replySuccess}</p>
      )}

      {showReply && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2"> Reply to User</h4>
          <textarea value={reply} onChange={(e) => { setReply(e.target.value); setReplyError("");
            }} placeholder="Write your reply here..."
            rows={5}
            maxLength={1000}
            autoFocus
            className={inputClass}
          />

          <div className="flex justify-between items-center mt-2 gap-2">
            <span className="text-xs text-gray-400">{reply.length}/1000</span>
            {replyError && <span className="text-xs text-red-500 text-right">{replyError}</span>}
          </div>

        </div>
      )}

      {/* Actions: always one line */}
      <div className="flex items-center gap-2 mt-6">
        <button type="button" onClick={() => {
          if (showReply) {handleReply();return;}
          setShowReply(true);setReplySuccess("");
        }}
          disabled={sending}
          className={`flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm whitespace-nowrap rounded-lg transition text-white ${showReply ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"}`}
        >{sending ? "Sending..." : showReply ? "Send" : "Reply"}</button>
<div className="hidden sm:block sm:flex-1" />
        <button type="button" onClick={onRead}
          className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 text-sm whitespace-nowrap bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition">Mark as Read
        </button>

        <button type="button" onClick={onDelete}
          className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 text-sm whitespace-nowrap bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-500 transition">Delete
        </button>
      </div>
    </div>
  );
};

export default MessageDetail;