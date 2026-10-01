import React, { useEffect, useState } from "react";
import SaveButton from "../buttons/SaveButton";
import { createWorkspace, updateWorkspace } from "../../services/workspaceService";
import { useWorkspace } from "../../context/WorkspaceContext";

const WorkspaceForm = ({
  onClose,
  onAddWorkspace,
  initialData,
  onUpdateWorkspace,
  existingWorkspaces = [],
}) => {
  const { refreshWorkspaceList } = useWorkspace();

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({ name: "", description: "", general: "" });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  // Validate text patterns
  const validateMeaningfulText = (value, field) => {
    const text = value.trim();
    if (!text) return `${field} is required.`;

    const compact = text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const garbage = [
      "asdf", "asdfgh", "asdfghj", "qwer", "qwerty", "qwertyui",
      "zxcv", "zxcvbn", "poiuy", "lkjhg", "mnbvc", "testtest",
      "abcabc", "xyzxyz", "123123", "000000", "111111", "222222",
      "333333", "444444", "555555", "666666", "777777", "888888", "999999",
    ];

    const letters = text.match(/[a-zA-Z]/g) || [];
    const cleaned = text.replace(/\s/g, "");

    if (
      /^\d+$/.test(cleaned) ||
      /^[^a-zA-Z0-9]+$/.test(text) ||
      letters.length < 2 ||
      /^(.)(\1)+$/i.test(cleaned) ||
      garbage.some((p) => text.toLowerCase().replace(/\s+/g, "").includes(p))
    ) {
      return `Please enter a meaningful ${field}.`;
    }

    if (/\s{2,}/.test(text))
      return `${field} cannot contain multiple consecutive spaces.`;

    if (/[-']{2,}/.test(text))
      return `${field} cannot contain consecutive hyphens or apostrophes.`;

    if (/^['-]|['-]$/.test(text))
      return `${field} cannot start or end with a hyphen or apostrophe.`;

    if (compact.length >= 6 && /^([a-z0-9]{1,4})\1{2,}$/i.test(compact))
      return `Please enter a meaningful ${field}.`;

    if (compact.length >= 5) {
      const counts = {};
      for (const char of compact) counts[char] = (counts[char] || 0) + 1;
      if (Math.max(...Object.values(counts)) / compact.length >= 0.8)
        return `Please enter a meaningful ${field}.`;
    }

    return "";
  };

  // Validate workspace name
  const validateName = (value) => {
    const text = value.trim();
    if (!text) return "Workspace Name is required.";
    if (text.length < 3) return "Workspace Name must be at least 3 characters.";
    if (text.length > 300) return "Workspace Name must not exceed 300 characters.";
    if (/\d/.test(text)) return "Workspace Name cannot contain numbers.";
    return validateMeaningfulText(text, "Workspace Name");
  };

  // Validate description
  const validateDescription = (value) => {
    const text = value.trim();
    if (!text) return "Description is required.";
    if (text.length < 8) return "Description must be at least 8 characters.";
    if (text.length > 1000) return "Description must not exceed 1000 characters.";

    const error = validateMeaningfulText(text, "Description");
    if (error) return error;

    if (text.split(/\s+/).filter(Boolean).length < 2)
      return "Description must contain at least 2 words.";

    return "";
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      description: validateDescription(formData.description),
      general: "",
    };
    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  // Handle input change
  const handleInputChange = (field, value, maxLength) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value.slice(0, maxLength),
    }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  // Submit workspace
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (initialData) {
        const response = await updateWorkspace(initialData._id || initialData.id, data);
        onUpdateWorkspace?.(response.workspace);
      } else {
        const response = await createWorkspace(data);
        onAddWorkspace?.(response.workspace);
        refreshWorkspaceList();
      }

      onClose();
    } catch (err) {
      console.error("Workspace Error:", err);
      setErrors((prev) => ({
        ...prev,
        general: err.response?.data?.message || "Something went wrong. Please try again.",
      }));
    }
  };

  const labelStyle = "block text-xs font-bold text-gray-700 dark:text-slate-400";
  const inputStyle = "w-full border rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:outline-none transition-all";

  return (
    <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-8 w-full max-w-lg relative border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {initialData ? "Edit Workspace" : "Create Workspace"}
        </h2>
        <button type="button" onClick={onClose} className="text-gray-400 dark:text-slate-500 text-3xl hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workspace Name */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelStyle}>Workspace Name <span className="text-red-500">*</span></label>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">{formData.name.length}/300</span>
          </div>
          <input
            type="text"
            value={formData.name}
            maxLength={300}
            placeholder="Enter workspace name..."
            onChange={(e) => handleInputChange("name", e.target.value, 300)}
            className={`${inputStyle} ${errors.name ? "border-red-400 focus:ring-red-400" : "border-gray-300 dark:border-slate-700 focus:ring-blue-500 dark:focus:ring-indigo-500"}`}
          />
          {errors.name && <p className="text-red-500 text-xs font-medium mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelStyle}>Description <span className="text-red-500">*</span></label>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">{formData.description.length}/1000</span>
          </div>
          <textarea
            rows={4}
            value={formData.description}
            maxLength={1000}
            placeholder="Enter brief workspace overview..."
            onChange={(e) => handleInputChange("description", e.target.value, 1000)}
            className={`${inputStyle} resize-none ${errors.description ? "border-red-400 focus:ring-red-400" : "border-gray-300 dark:border-slate-700 focus:ring-blue-500 dark:focus:ring-indigo-500"}`}
          />
          {errors.description && <p className="text-red-500 text-xs font-medium mt-1">{errors.description}</p>}
        </div>

        {/* General API Error */}
        {errors.general && <p className="text-red-500 text-sm font-medium">{errors.general}</p>}

        {/* Footer */}
        <div className="flex justify-end gap-4 border-t border-gray-100 dark:border-slate-800 pt-4 mt-2">
          <button type="button" onClick={onClose} className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer">
            Cancel
          </button>
          <div className="w-44">
            <SaveButton type="submit" text={initialData ? "Save Changes" : "Create Workspace"} />
          </div>
        </div>
      </form>
    </div>
  );
};

export default WorkspaceForm;