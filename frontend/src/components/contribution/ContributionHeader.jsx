import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Project dropdown
const ContributionHeader = ({ projects = [], selectedProjectId, onProjectChange }) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProject = projects.find(p => p._id === selectedProjectId);
  const selectedProjectName = selectedProject?.projectName || selectedProject?.name || "Select a project";
  const handleProjectSelect = id => {
    onProjectChange(id);
    setIsOpen(false);
  };
  const optionClass = selected => `w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left text-sm transition-colors ${
    selected
      ? isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700"
      : isDarkMode ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"
  }`;

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
      {/* Page heading */}
      <div className="min-w-0">
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          My Contribution
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Explore your contribution across your projects.
        </p>
      </div>

      {/* Project dropdown */}
      <div ref={dropdownRef} className="relative w-full sm:w-auto sm:min-w-[200px] max-w-full">
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full sm:min-w-[200px] max-w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none border transition-all duration-200 flex items-center justify-between gap-3 ${
            isDarkMode ? "bg-[#11182B] border-[#263149] text-gray-100 hover:border-slate-600" : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
          } ${isOpen ? "ring-2 ring-blue-500" : ""}`}
        >
          <span className="truncate text-left min-w-0">{selectedProjectName}</span>
          <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div
            className={`absolute z-[100] top-full left-0 right-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-[220px] max-w-[calc(100vw-2rem)] rounded-xl border shadow-xl overflow-hidden ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}
            role="listbox"
          >
            {/* Select a project */}
            <button
              type="button"
              role="option"
              aria-selected={!selectedProjectId}
              onClick={() => handleProjectSelect("")}
              className={optionClass(!selectedProjectId)}
            >
              <span className="truncate">Select a project</span>
              {!selectedProjectId && <Check size={15} className="shrink-0" />}
            </button>

            {/* Project list */}
            {projects.map(project => {
              const name = project.projectName || project.name || "Unnamed Project";
              const selected = project._id === selectedProjectId;
              return (
                <button
                  key={project._id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleProjectSelect(project._id)}
                  className={optionClass(selected)}
                >
                  <span className="truncate min-w-0">{name}</span>
                  {selected && <Check size={15} className="shrink-0" />}
                </button>
              );
            })}

            {/* No projects */}
            {!projects.length && (
              <div className={`px-3 py-3 text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                No projects available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributionHeader;