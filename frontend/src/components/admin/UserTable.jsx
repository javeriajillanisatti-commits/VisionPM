import React, { useState } from "react";
import { Users, ArrowUpDown, Crown, User as UserIcon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const SkeletonRow = ({ isDarkMode }) => (
  <tr>
    <td colSpan={4} className="py-2">
      <div
        className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-5 min-[1000px]:px-8 py-4 sm:py-5 rounded-2xl ${
          isDarkMode ? "bg-[#111936]" : "bg-gray-50"
        }`}
      >
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full animate-pulse shrink-0 ${
            isDarkMode ? "bg-[#1E293B]" : "bg-gray-200"
          }`}
        />
        <div
          className={`h-3.5 w-20 sm:w-24 rounded animate-pulse ${
            isDarkMode ? "bg-[#1E293B]" : "bg-gray-200"
          }`}
        />
      </div>
    </td>
  </tr>
);

const avatarStyles = [
  ["bg-indigo-100 text-indigo-600", "bg-indigo-500/15 text-indigo-400", "ring-indigo-200"],
  ["bg-purple-100 text-purple-600", "bg-purple-500/15 text-purple-400", "ring-purple-200"],
  ["bg-teal-100 text-teal-600", "bg-teal-500/15 text-teal-400", "ring-teal-200"],
  ["bg-pink-100 text-pink-600", "bg-pink-500/15 text-pink-400", "ring-pink-200"],
];

const getAvatarStyle = (index, isDarkMode) => {
  const [light, dark, ring] = avatarStyles[index % avatarStyles.length];
  return `${isDarkMode ? dark : light} ring-2 sm:ring-4 ${
    isDarkMode ? "ring-transparent" : ring
  }`;
};

const SortableHeader = ({ label, isDarkMode, sortDirection, onClick }) => (
  <th className="px-3 sm:px-5 min-[1000px]:px-8 py-4 sm:py-5">
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 sm:gap-1.5 group/sort transition-colors whitespace-nowrap text-xs sm:text-sm ${
        isDarkMode ? "hover:text-gray-200" : "hover:text-gray-700"
      }`}
    >
      {label}
      <ArrowUpDown
        size={12}
        className={
          sortDirection
            ? isDarkMode
              ? "text-blue-400"
              : "text-blue-600"
            : isDarkMode
            ? "text-gray-600 group-hover/sort:text-gray-300"
            : "text-gray-400 group-hover/sort:text-gray-600"
        }
      />
    </button>
  </th>
);

const UserTable = ({
  users = [],
  isLoading,
  hasError,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort,
  onUserClick,
}) => {
  const { isDarkMode } = useTheme();
  const [localSortField, setLocalSortField] = useState(null);
  const [localSortDirection, setLocalSortDirection] = useState("asc");

  const sortField = externalSortField ?? localSortField;
  const sortDirection = externalSortDirection ?? localSortDirection;

  // Handle local or parent-controlled sorting
  const handleSort = (field) => {
    if (onSort) return onSort(field);

    if (localSortField === field)
      setLocalSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setLocalSortField(field);
      setLocalSortDirection("asc");
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0;

    let result = 0;
    if (sortField === "user") {
      result = String(a.fullName || "")
        .toLowerCase()
        .localeCompare(String(b.fullName || "").toLowerCase());
    } else if (sortField === "status") {
      result = (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
    }

    return sortDirection === "asc" ? result : -result;
  });

  const cardStyle = isDarkMode
    ? "bg-[#0B1128] border-[#1E293B] shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
    : "bg-white border-gray-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]";

  // Render the users table with responsive states
  return (
    <div
      className={`w-full min-w-0 max-w-full rounded-[1.5rem] sm:rounded-[2rem] border overflow-hidden transition-colors duration-300 ${cardStyle}`}
    >
      <div className="w-full max-w-full min-w-0 max-h-[560px] overflow-y-auto overflow-x-auto p-1.5 sm:p-2">
        <table
          className="w-full min-w-[680px] min-[600px]:min-w-[760px] min-[1000px]:min-w-0 text-left table-auto"
          style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
        >
          <colgroup>
            <col className="min-[1000px]:w-[32%]" />
            <col className="min-[1000px]:w-[30%]" />
            <col className="min-[1000px]:w-[20%]" />
            <col className="min-[1000px]:w-[18%]" />
          </colgroup>

          <thead>
            <tr
              className={`text-xs sm:text-sm font-bold tracking-wide sticky top-0 z-10 ${
                isDarkMode
                  ? "text-gray-400 bg-[#111936]"
                  : "text-gray-500 bg-white"
              }`}
            >
              <SortableHeader
                label="User"
                isDarkMode={isDarkMode}
                sortDirection={sortField === "user" ? sortDirection : null}
                onClick={() => handleSort("user")}
              />
              {["Email", "Role"].map((label) => (
                <th
                  key={label}
                  className="px-3 sm:px-5 min-[1000px]:px-8 py-4 sm:py-5 whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
              <SortableHeader
                label="Status"
                isDarkMode={isDarkMode}
                sortDirection={sortField === "status" ? sortDirection : null}
                onClick={() => handleSort("status")}
              />
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <SkeletonRow key={i} isDarkMode={isDarkMode} />
              ))
            ) : hasError ? (
              <tr>
                <td
                  colSpan={4}
                  className={`py-12 sm:py-16 text-center px-4 text-xs sm:text-sm ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Users couldn't be loaded right now.
                </td>
              </tr>
            ) : !sortedUsers.length ? (
              <tr>
                <td colSpan={4} className="py-16 sm:py-20 text-center px-4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                        isDarkMode ? "bg-indigo-500/10" : "bg-indigo-50"
                      }`}
                    >
                      <Users
                        size={20}
                        className={isDarkMode ? "text-indigo-400" : "text-indigo-600"}
                      />
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      No users found
                    </p>
                 
                  </div>
                </td>
              </tr>
            ) : (
              sortedUsers.map((user, index) => {
                const manager = user.role === "Project Manager";

                return (
                  <tr
                    key={user._id}
                    onClick={() => onUserClick?.(user)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isDarkMode
                        ? "bg-[#0D1430] hover:bg-[#151E40]"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <td className="px-3 sm:px-5 min-[1000px]:px-8 py-4 sm:py-5 rounded-l-2xl min-w-0">
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${getAvatarStyle(
                            index,
                            isDarkMode
                          )}`}
                        >
                          {user.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                        <span
                          className={`font-semibold text-xs sm:text-sm min-w-0 break-words ${
                            isDarkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {user.fullName}
                        </span>
                      </div>
                    </td>

                    <td
                      className={`px-3 sm:px-5 min-[1000px]:px-8 py-4 sm:py-5 text-xs sm:text-sm min-w-0 break-all ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {user.email}
                    </td>

                    <td className="px-3 sm:px-5 min-[1000px]:px-8 py-4 sm:py-5 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-sm font-medium max-w-full ${
                          manager
                            ? isDarkMode
                              ? "bg-purple-500/10 text-purple-300 border border-purple-400/20"
                              : "bg-purple-50 text-purple-600 border border-purple-100"
                            : isDarkMode
                            ? "bg-blue-500/10 text-blue-300 border border-blue-400/20"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {manager ? <Crown size={12} /> : <UserIcon size={12} />}
                        <span className="break-words">
                          {manager ? "Project Manager" : "Team Member"}
                        </span>
                      </span>
                    </td>

                    <td className="px-3 sm:px-5 min-[1000px]:px-8 py-4 sm:py-5 rounded-r-2xl min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-sm font-medium whitespace-nowrap ${
                          user.isOnline
                            ? isDarkMode
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-400/20"
                              : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            : isDarkMode
                            ? "bg-slate-500/10 text-slate-400 border border-slate-400/20"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            user.isOnline ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        {user.isOnline ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;