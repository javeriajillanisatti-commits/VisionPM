import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const TaskFilters = ({ activeFilter, setActiveFilter, counts }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filters = [
    { name: "All Tasks", count: counts.all },
    { name: "Todo", count: counts.todo },
    { name: "In Progress", count: counts.inprogress },
    { name: "Completed", count: counts.completed },
  ];

  const active =
    filters.find((filter) => filter.name === activeFilter) || filters[0];

  return (
    <div className="w-full">
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-slate-900 flex items-center justify-between text-xs font-semibold transition-all ${
            isOpen
              ? "border-blue-500"
              : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <span className="text-slate-700 dark:text-slate-200 truncate">
            {active.name === "Todo" ? "To Do" : active.name}
          </span>

          <ChevronDown
            size={16}
            className={`shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-[100]">
            {filters.map((filter) => {
              const isSelected = activeFilter === filter.name;

              return (
                <button
                  key={filter.name}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter.name);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 flex items-center justify-between text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>
                    {filter.name === "Todo" ? "To Do" : filter.name}
                  </span>

                  <span
                    className={
                      isSelected
                        ? "text-white/90"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  >
                    ({filter.count})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-2.5 w-max min-w-full">
        {filters.map((filter) => {
          const isSelected = activeFilter === filter.name;

          return (
            <button
              key={filter.name}
              type="button"
              onClick={() => setActiveFilter(filter.name)}
              className={`inline-flex items-center justify-center min-h-[34px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border shrink-0 cursor-pointer select-none ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              {filter.name === "Todo" ? "To Do" : filter.name}

              <span
                className={`ml-1.5 text-[11px] ${
                  isSelected
                    ? "text-white/90"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                ({filter.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TaskFilters;