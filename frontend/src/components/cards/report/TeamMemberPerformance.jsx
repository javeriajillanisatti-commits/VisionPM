import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

const PAGE_SIZE = 5;

const TeamMemberPerformance = ({ teamStats = [], isDarkMode }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  const sortOptions = [
    ["", "Sort By"],
    ["completedHigh", "Most tasks completed"],
    ["completedLow", "Least tasks completed"],
    ["assignedHigh", "Most assigned tasks"],
    ["assignedLow", "Least assigned tasks"],
    ["progressHigh", "Most in progress"],
    ["pendingHigh", "Most pending"],
  ];

  const selectedSort =
    sortOptions.find(([value]) => value === sort)?.[1] || "Sort By";

  useEffect(() => {
    const handleClickOutside = e => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStats = useMemo(() => {
    const result = teamStats.filter(member =>
      member.name?.toLowerCase().includes(search.trim().toLowerCase())
    );

    const sorts = {
      assignedHigh: (a, b) => b.assigned - a.assigned,
      assignedLow: (a, b) => a.assigned - b.assigned,
      completedHigh: (a, b) => b.completed - a.completed,
      completedLow: (a, b) => a.completed - b.completed,
      progressHigh: (a, b) => b.inProgress - a.inProgress,
      pendingHigh: (a, b) => b.pending - a.pending,
    };

    if (sorts[sort]) result.sort(sorts[sort]);
    return result;
  }, [teamStats, search, sort]);

  const totalPages = Math.ceil(filteredStats.length / PAGE_SIZE);

  const paginatedStats = useMemo(
    () => filteredStats.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredStats, page]
  );

  useEffect(() => setPage(1), [search, sort]);

  useEffect(() => {
    if (totalPages && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const border = isDarkMode ? "border-[#1E293B]" : "border-gray-100";

  return (
    <div
      className={`rounded-[2rem] border shadow-sm overflow-hidden ${
        isDarkMode
          ? "bg-[#0B1128] border-[#1E293B]"
          : "bg-white border-gray-100"
      }`}
    >
      <div className={`p-3 sm:p-5 border-b ${border}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3
            className={`text-lg sm:text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Team member performance
          </h3>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72 h-9 sm:h-10">
              <Search
                size={14}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  search ? "text-blue-500" : "text-gray-400"
                }`}
              />

              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className={`w-full h-full pl-9 pr-9 rounded-xl border text-xs outline-none ${
                  search
                    ? isDarkMode
                      ? "bg-[#111A36] border-blue-500 ring-1 ring-blue-500/20 text-gray-200"
                      : "bg-white border-blue-500 ring-1 ring-blue-500/20 text-gray-700"
                    : isDarkMode
                    ? "bg-[#111A36] border-[#263453] text-gray-200 placeholder-gray-500 focus:border-blue-500"
                    : "bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400 focus:border-blue-500"
                }`}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center ${
                    isDarkMode
                      ? "text-gray-400 hover:text-white hover:bg-[#263453]"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div
              ref={sortRef}
              className="relative w-full min-w-0 sm:w-44"
            >
              <button
                type="button"
                onClick={() => setSortOpen(prev => !prev)}
                className={`w-full h-9 sm:h-10 pl-8 pr-3 rounded-xl border text-xs outline-none flex items-center justify-between gap-2 ${
                  isDarkMode
                    ? "bg-[#111A36] border-[#263453] text-gray-200"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <SlidersHorizontal
                  size={13}
                  className={`absolute left-3 ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />

                <span className="truncate">{selectedSort}</span>

                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform ${
                    sortOpen ? "rotate-180" : ""
                  } ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                />
              </button>

              {sortOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 z-50 w-full max-w-[calc(100vw-1.5rem)] sm:w-60 rounded-xl border shadow-xl overflow-hidden ${
                    isDarkMode
                      ? "bg-[#111A36] border-[#263453]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="max-h-60 overflow-y-auto">
                    {sortOptions.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSort(value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs truncate ${
                          sort === value
                            ? "bg-blue-600 text-white"
                            : isDarkMode
                            ? "text-gray-300 hover:bg-[#1E293B]"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full min-w-[650px] text-left border-separate border-spacing-y-1.5 px-2">
          <thead
            className={`text-sm font-bold sticky top-0 z-10 ${
              isDarkMode
                ? "bg-[#111A36] text-gray-300"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <tr>
              {["Team member", "Assigned", "Completed", "In progress", "Pending"].map(
                heading => (
                  <th
                    key={heading}
                    className="px-3 py-3 text-center first:text-left whitespace-nowrap"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedStats.length ? (
              paginatedStats.map((member, index) => (
                <tr
                  key={`${member.name}-${index}`}
                  className={isDarkMode ? "bg-[#111936]" : "bg-gray-50"}
                >
                  <td className="px-3 py-3 rounded-l-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {member.initial}
                      </div>

                      <span
                        className={`font-bold text-xs ${
                          isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {member.name}
                      </span>
                    </div>
                  </td>

                  {[
                    ["assigned", "text-gray-800"],
                    ["completed", "text-green-500"],
                    ["inProgress", "text-orange-400"],
                    ["pending", "text-blue-400"],
                  ].map(([key, color], i) => (
                    <td
                      key={key}
                      className={`px-3 py-3 text-center font-bold text-sm ${
                        member[key]
                          ? isDarkMode && key === "assigned"
                            ? "text-gray-200"
                            : color
                          : "text-gray-300"
                      } ${i === 3 ? "rounded-r-xl" : ""}`}
                    >
                      {member[key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  {search
                    ? "No team member matches your search."
                    : "No team data available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={`flex justify-center gap-2 py-4 border-t ${border}`}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              type="button"
              onClick={() => setPage(number)}
              className={`w-8 h-8 rounded-lg text-xs font-bold ${
                page === number
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "text-gray-400 hover:bg-[#1E293B]"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {number}
            </button>
          ))}

          {page < totalPages && (
            <button
              type="button"
              onClick={() => setPage(current => current + 1)}
              className={`w-8 h-8 rounded-lg text-gray-500 ${
                isDarkMode ? "hover:bg-[#1E293B]" : "hover:bg-gray-100"
              }`}
            >
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamMemberPerformance;