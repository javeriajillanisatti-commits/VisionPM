import React, { useState } from "react";
import { Paperclip, X } from "lucide-react";

const TITLE_MAX_CHARS = 300;
const MESSAGE_MAX_WORDS = 1000;
const TITLE_MIN_CHARS = 3;
const MESSAGE_MIN_CHARS = 8;
const MESSAGE_MIN_WORDS = 2;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const GARBAGE_PATTERNS = [
  "asdf", "fdsa", "qwer", "qwerty", "zxcv", "xcvz",
  "asdfgh", "qwertyui", "poiuy", "lkjhg", "hjkl",
];

const INJECTION_PATTERNS = [
  "$where", "$ne", "$gt", "$gte", "$lt", "$lte", "$regex", "$or",
  "$and", "$in", "$nin", "$exists", "$elemMatch", "$not", "$nor",
  String.fromCharCode(106, 97, 118, 97, 115, 99, 114, 105, 112, 116, 58),
  "<script", "</script", "<iframe", "</iframe",
  "<object", "</object", "<embed", "onerror", "onload", "onclick",
  "onmouseover", "eval(", "alert(",
];

const cleanText = (value = "") =>
  value.normalize("NFKC")
// eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

const compact = text => cleanText(text).toLowerCase().replace(/\s/g, "");
const countWords = text => {
  const value = cleanText(text).trim();
  return value ? value.split(/\s+/).length : 0;
};

const hasGarbagePattern = text =>
  GARBAGE_PATTERNS.some(pattern => compact(text).includes(pattern));

const hasRepeatingPattern = text => {
  const value = compact(text);
  if (value.length < 6) return false;

  for (let size = 1; size <= Math.floor(value.length / 2); size++) {
    if (value.length % size) continue;
    const pattern = value.slice(0, size);
    if (value.length / size >= 3 && pattern.repeat(value.length / size) === value)
      return true;
  }
  return false;
};

const hasRepeatedConsecutiveWords = text => {
  const words = cleanText(text).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words.some((word, i) => i > 0 && word === words[i - 1]);
};

const hasRepeatedCharacter = text => {
  const value = compact(text);
  return value.length > 0 && /^(.)\1+$/.test(value);
};

const hasExcessiveCharacterRepetition = text => {
  const value = compact(text);
  if (value.length < 6) return false;

  const frequency = {};
  for (const char of value) frequency[char] = (frequency[char] || 0) + 1;
  return Math.max(...Object.values(frequency), 0) / value.length >= 0.8;
};

const hasOnlyNumbers = text => /^\d+$/.test(cleanText(text).trim());

const hasOnlySymbols = text => {
  const value = cleanText(text).trim();
  return value.length > 0 && !/[\p{L}]/u.test(value) && !/\d/.test(value);
};

const hasHtmlOrScript = text => /<\s*\/?\s*[a-z][^>]*>/i.test(text);

const hasInjectionPattern = text => {
  const value = cleanText(text).toLowerCase();
  return INJECTION_PATTERNS.some(pattern => value.includes(pattern.toLowerCase()));
};

const hasSuspiciousJson = text => {
  const value = cleanText(text).trim();
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) return true;
  return /["']?\$?[a-zA-Z_][\w$]*["']?\s*:\s*/.test(value);
};

const hasInvalidBoundaryCharacters = text => {
  const value = cleanText(text).trim();
  return /^[-,']/.test(value) || /[-,']$/.test(value) ||
    /--|,,|''/.test(value);
};

const hasMultipleSpaces = text => /\s{2,}/.test(cleanText(text));
const hasStandaloneSpecialCharacters = text => /^[-,']+$/.test(cleanText(text).trim());
const hasMeaningfulCharacters = text => /[\p{L}\p{N}]/u.test(cleanText(text));

const isMeaninglessText = text => {
  const value = cleanText(text).trim();
  return !value || !hasMeaningfulCharacters(value) ||
    hasOnlyNumbers(value) || hasOnlySymbols(value) ||
    hasRepeatedCharacter(value) || hasGarbagePattern(value) ||
    hasRepeatingPattern(value) || hasExcessiveCharacterRepetition(value);
};

const validateText = (text, type, minChars, maxChars) => {
  const value = cleanText(text).trim();
  const title = type === "title";

  if (!value) return title
    ? "Please enter a title for your announcement."
    : "Please write a message for your announcement.";

  if (value.length < minChars) return title
    ? `Title must be at least ${minChars} characters.`
    : `Message must be at least ${minChars} characters.`;

  if (value.length > maxChars) return title
    ? `Title cannot exceed ${maxChars} characters.`
    : `Message cannot exceed ${maxChars} characters.`;

  if (hasHtmlOrScript(value)) return "HTML or script content is not allowed.";
  if (hasInjectionPattern(value)) return "Invalid or unsafe input detected.";
  if (hasSuspiciousJson(value)) return "JSON or object-style input is not allowed.";
  if (hasMultipleSpaces(value)) return "Multiple consecutive spaces are not allowed.";
  if (hasInvalidBoundaryCharacters(value)) return "Invalid special characters or character placement.";
  if (hasStandaloneSpecialCharacters(value) || !hasMeaningfulCharacters(value))
    return "Please enter meaningful text.";
  if (hasOnlyNumbers(value)) return "Numbers-only input is not allowed.";
  if (hasOnlySymbols(value)) return "Symbols-only input is not allowed.";
  if (isMeaninglessText(value))
    return "Please enter meaningful text, not random or repeated characters.";
  if (hasRepeatedConsecutiveWords(value))
    return "Repeated consecutive words are not allowed.";

  return "";
};

const AnnouncementForm = ({
  isDarkMode,
  loading,
  onSubmit,
  onCancel,
  serverError,
}) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({ title: "", message: "", file: "" });

  const validate = () => {
    const newErrors = { title: "", message: "", file: "" };
    const cleanedTitle = cleanText(title).trim();
    const cleanedMessage = cleanText(message).trim();

    newErrors.title = validateText(cleanedTitle, "title", TITLE_MIN_CHARS, TITLE_MAX_CHARS);
    newErrors.message = validateText(cleanedMessage, "message", MESSAGE_MIN_CHARS, Infinity);

    const words = countWords(cleanedMessage);
    if (!newErrors.message && words < MESSAGE_MIN_WORDS)
      newErrors.message = `Message must be at least ${MESSAGE_MIN_WORDS} words.`;
    if (!newErrors.message && words > MESSAGE_MAX_WORDS)
      newErrors.message = `Message cannot exceed ${MESSAGE_MAX_WORDS} words.`;
    if (file?.size > MAX_FILE_SIZE) newErrors.file = "File size cannot exceed 5 MB.";

    setErrors(newErrors);
    return !newErrors.title && !newErrors.message && !newErrors.file;
  };

  const handleTitleChange = e => {
    setTitle(cleanText(e.target.value));
    if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
  };

  const handleMessageChange = e => {
    const value = cleanText(e.target.value);
    if (countWords(value) > MESSAGE_MAX_WORDS) return;
    setMessage(value);
    if (errors.message) setErrors(prev => ({ ...prev, message: "" }));
  };

  const handleFileChange = e => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return setFile(null);

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setErrors(prev => ({ ...prev, file: "File size cannot exceed 5 MB." }));
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setErrors(prev => ({ ...prev, file: "" }));
  };

  const removeFile = () => {
    setFile(null);
    setErrors(prev => ({ ...prev, file: "" }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: cleanText(title).trim(),
      message: cleanText(message).trim(),
      file,
    });
  };

  const messageWordCount = countWords(message);
  const labelColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const inputTheme = isDarkMode
    ? "bg-[#11182B] text-white placeholder:text-gray-500"
    : "bg-white text-gray-800 placeholder:text-gray-400";
  const inputBorder = (error) =>
    error
      ? "border-red-400 focus:border-red-500"
      : isDarkMode
      ? "border-[#263149] focus:border-blue-500"
      : "border-gray-200 focus:border-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {serverError && (
        <div className={`rounded-xl border px-3 py-2.5 text-sm ${
          isDarkMode
            ? "bg-red-500/10 border-red-500/20 text-red-300"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {serverError}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-sm font-medium ${labelColor}`}>Title</label>
          <span className={`text-xs ${
            title.trim().length > TITLE_MAX_CHARS
              ? "text-red-400"
              : isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}>
            {title.trim().length}/{TITLE_MAX_CHARS}
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter announcement title"
          maxLength={TITLE_MAX_CHARS}
          disabled={loading}
          className={`w-full px-3 py-2.5 rounded-xl border outline-none ${inputBorder(errors.title)} ${inputTheme}`}
        />
        {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-sm font-medium ${labelColor}`}>Message</label>
          <span className={`text-xs ${
            messageWordCount >= MESSAGE_MAX_WORDS
              ? "text-red-400"
              : isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}>
            {messageWordCount}/{MESSAGE_MAX_WORDS} words
          </span>
        </div>
        <textarea
          value={message}
          onChange={handleMessageChange}
          placeholder="Write your announcement..."
          rows={5}
          disabled={loading}
          className={`w-full px-3 py-2.5 rounded-xl border outline-none resize-none ${inputBorder(errors.message)} ${inputTheme}`}
        />
        {errors.message && <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>}
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1.5 ${labelColor}`}>Attachment</label>

        {!file ? (
          <label className={`flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl border border-dashed cursor-pointer transition-colors ${
            isDarkMode
              ? "border-[#35415A] text-gray-400 hover:bg-[#11182B] hover:text-gray-200"
              : "border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}>
            <Paperclip size={16} />
            <span className="text-sm">Attach a file</span>
            <input type="file" onChange={handleFileChange} disabled={loading} className="hidden" />
          </label>
        ) : (
          <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border ${
            isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip size={15} className="shrink-0 text-indigo-500" />
              <span className={`text-sm truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              disabled={loading}
              className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove file"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <p className={`mt-1.5 text-xs ${
          errors.file ? "text-red-400" : isDarkMode ? "text-gray-500" : "text-gray-400"
        }`}>
          {errors.file || "Maximum file size: 5 MB"}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
            isDarkMode
              ? "bg-[#111C38] text-gray-300 hover:bg-[#172443]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  );
};

export default AnnouncementForm;