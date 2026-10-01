import React, { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Grid3X3, List, ChevronDown, X } from "lucide-react";

const ProjectControls = ({ searchQuery, setSearchQuery, sortBy, setSortBy, viewMode = "grid", setViewMode }) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  const sortOptions = [
    { id: "", label: "Sort By" },
    { id: "newest", label: "Newest First" },
    { id: "oldest", label: "Oldest First" },
    { id: "inprogress", label: "In Progress First" },
    { id: "planning", label: "Planning First" },
    { id: "onhold", label: "On Hold First" },
    { id: "completed", label: "Completed First" },
    { id: "cancelled", label: "Cancelled First" },
  ];

  const currentSort = sortOptions.find((opt) => opt.id === sortBy);

  useEffect(() => {
    const close = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
      
      <div className="flex flex-col min-[520px]:flex-row items-stretch min-[520px]:items-center gap-2.5 flex-1 w-full sm:w-auto">   
        
        <div className="relative w-full min-[520px]:w-72 md:w-80 xl:w-96 shrink-0 h-10">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            // focus shadow removed to change only border color
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 dark:border-[#263149] bg-white dark:bg-[#11182B] text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all focus:border-blue-500"
          />
          
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery("")}
              // circular close button with light gray background
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div ref={sortRef} className="relative w-full min-[520px]:w-48 shrink-0 z-40">
          <div
            onClick={() => setIsSortOpen(!isSortOpen)}
            // border changes to blue when dropdown is active
            className={`w-full h-10 pl-9 pr-8 border bg-white dark:bg-[#11182B] text-sm text-gray-700 dark:text-white outline-none flex items-center cursor-pointer select-none relative rounded-xl transition-all ${
              isSortOpen 
                ? "border-blue-500" 
                : "border-gray-200 dark:border-[#263149]"
            }`}
          >
            <SlidersHorizontal size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <span className="truncate flex-1">{currentSort && currentSort.id !== "" ? currentSort.label : "Sort By"}</span>
            <ChevronDown size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
          </div>

          {isSortOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top">
              {sortOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => { setSortBy(option.id); setIsSortOpen(false); }}
                  // blue background on hover and active option
                  className={`px-4 py-1.5 text-sm flex items-center cursor-pointer transition-colors ${option.id === sortBy ? "bg-blue-600 text-white font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600"}`}
                >
                  <span className="truncate">{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {setViewMode && (
        <div className="hidden sm:flex items-center shrink-0 sm:ml-auto">
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-[#263149] bg-white dark:bg-[#11182B] p-1">
            {[["grid", Grid3X3, "Grid"], ["list", List, "List"]].map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`h-8 px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors ${viewMode === mode ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
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

export default ProjectControls;