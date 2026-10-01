import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";

const TaskControls = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  viewMode = "grid",
  setViewMode,
  showViewToggle = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    ["", "Sort By"],
    ["priority_high", "Priority: High to Low"],
    ["priority_low", "Priority: Low to High"],
    ["newest", "Created: Newest First"],
    ["oldest", "Created: Oldest First"],
  ];

  const current = options.find(([id]) => id === sortBy);
  const displayLabel = current ? current[1] : "Sort By";

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 w-full min-w-0">
      {/* Mobile: 2 equal columns (Search | Sort By). Desktop: unchanged flex row */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 flex-1 min-w-0 w-full sm:w-auto">
        <div className="relative flex-1 min-w-0 sm:flex-none w-full sm:w-72 md:w-80 xl:w-96 h-10">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />

          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 dark:border-[#263149] bg-white dark:bg-[#11182B] text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all focus:border-blue-500"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div ref={dropdownRef} className="relative w-full min-w-0 sm:w-auto sm:min-w-[auto] shrink-0 z-50">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Sort tasks"
            className={`h-10 w-full sm:w-52 shrink-0 border bg-white dark:bg-[#11182B] text-sm text-gray-700 dark:text-white outline-none flex items-center justify-start pl-4 pr-8 sm:pl-0 sm:pr-0 cursor-pointer select-none relative rounded-xl transition-all ${
              isOpen
                ? "border-blue-500"
                : "border-gray-200 dark:border-[#263149]"
            }`}
          >
            <SlidersHorizontal
              size={14}
              className="hidden sm:block text-gray-400 dark:text-gray-500 sm:absolute sm:left-3.5"
            />

            <span className="truncate flex-1 text-left sm:text-center sm:ml-2">
              {displayLabel}
            </span>

            <ChevronDown
              size={14}
              className={`absolute right-3 text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 w-56 sm:w-52 bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top">
              {options.map(([id, label]) => (
                <div
                  key={id}
                  onClick={() => {
                    setSortBy(id);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-1.5 text-sm flex items-center cursor-pointer transition-colors ${
                    id === sortBy
                      ? "bg-blue-600 text-white font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600"
                  }`}
                >
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showViewToggle && setViewMode && (
        <div className="hidden sm:flex items-center shrink-0 sm:ml-auto">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-[#263149] bg-white dark:bg-[#11182B] p-1">
            {[
              ["grid", LayoutGrid, "Grid"],
              ["list", List, "List"],
            ].map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`h-8 px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  viewMode === mode
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskControls;
