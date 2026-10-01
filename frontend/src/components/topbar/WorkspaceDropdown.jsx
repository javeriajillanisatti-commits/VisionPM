import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";
import { ChevronDown } from "lucide-react";

const WorkspaceDropdown = ({
  workspaces = [],
  userRole = "",
}) => {
  const {
    activeWorkspace,
    allWorkspacesSelected,
    changeWorkspace,
  } = useWorkspace();

  const { isDarkMode } = useTheme();

  const [isWSDropdownOpen, setIsWSDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
  });

  const buttonRef = useRef(null);

  const cleanRole = String(userRole || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const isAdmin =
    cleanRole === "projectadmin" ||
    cleanRole === "admin" ||
    cleanRole.includes("projectadmin");

  const initials = activeWorkspace?.name
    ? activeWorkspace.name.substring(0, 2).toUpperCase()
    : "ALL";

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    const screenPadding = 8;
    const dropdownWidth = Math.min(
      256,
      window.innerWidth - screenPadding * 2
    );

    let left = rect.left;

    if (window.innerWidth < 640) {
      left = Math.max(
        screenPadding,
        Math.min(
          rect.left,
          window.innerWidth -
            dropdownWidth -
            screenPadding
        )
      );
    } else {
      left = Math.max(
        screenPadding,
        Math.min(
          rect.left,
          window.innerWidth -
            dropdownWidth -
            screenPadding
        )
      );
    }

    setDropdownPosition({
      top: rect.bottom + 8,
      left,
    });
  };

  const handleToggle = () => {
    if (!isAdmin) return;

    if (!isWSDropdownOpen) {
      updateDropdownPosition();
    }

    setIsWSDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isWSDropdownOpen) return;

    updateDropdownPosition();

    const handlePositionUpdate = () => {
      updateDropdownPosition();
    };

    window.addEventListener(
      "resize",
      handlePositionUpdate
    );

    window.addEventListener(
      "scroll",
      handlePositionUpdate,
      true
    );

    return () => {
      window.removeEventListener(
        "resize",
        handlePositionUpdate
      );

      window.removeEventListener(
        "scroll",
        handlePositionUpdate,
        true
      );
    };
  }, [isWSDropdownOpen]);

  useEffect(() => {
    if (!isWSDropdownOpen) return;

    const handleOutsideClick = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        const dropdown = document.getElementById(
          "workspace-dropdown-menu"
        );

        if (
          dropdown &&
          !dropdown.contains(event.target)
        ) {
          setIsWSDropdownOpen(false);
        }
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [isWSDropdownOpen]);

  const dropdownMenu = isWSDropdownOpen ? (
    <div
      id="workspace-dropdown-menu"
      className={`fixed border shadow-2xl rounded-2xl p-2 z-[99999] w-[calc(100vw-16px)] max-w-64 ${
        isDarkMode
          ? "bg-[#11182B] border-[#263149]"
          : "bg-white border-gray-100"
      }`}
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }}
    >
      <p
        className={`text-[9px] font-black uppercase p-2 tracking-widest border-b mb-1 ${
          isDarkMode
            ? "text-gray-500 border-[#263149]"
            : "text-gray-400 border-gray-50"
        }`}
      >
        Switch Workspace
      </p>

      <div className="max-h-72 overflow-y-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => {
            changeWorkspace(null);
            setIsWSDropdownOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all mb-1 ${
            allWorkspacesSelected
              ? isDarkMode
                ? "bg-indigo-500/15 border border-indigo-500/30"
                : "bg-indigo-50 border border-indigo-100"
              : isDarkMode
              ? "hover:bg-[#1B253B] border border-transparent"
              : "hover:bg-gray-50 border border-transparent"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
            ALL
          </div>

          <span
            className={`text-xs font-bold truncate ${
              isDarkMode
                ? "text-gray-200"
                : "text-gray-700"
            }`}
          >
            All Workspaces
          </span>
        </button>

        {workspaces.length > 0 ? (
          workspaces.map((ws) => {
            const currentId = ws._id || ws.id;

            if (!currentId) return null;

            const activeId =
              activeWorkspace?._id ||
              activeWorkspace?.id;

            const isSelected =
              !allWorkspacesSelected &&
              String(activeId) === String(currentId);

            return (
              <button
                type="button"
                key={currentId}
                onClick={() => {
                  changeWorkspace(ws);
                  setIsWSDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all mb-1 ${
                  isSelected
                    ? isDarkMode
                      ? "bg-indigo-500/15 border border-indigo-500/30"
                      : "bg-indigo-50 border border-indigo-100"
                    : isDarkMode
                    ? "hover:bg-[#1B253B] border border-transparent"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                  {ws.name
                    ? ws.name
                        .substring(0, 2)
                        .toUpperCase()
                    : "WS"}
                </div>

                <span
                  className={`text-xs font-bold truncate ${
                    isDarkMode
                      ? "text-gray-200"
                      : "text-gray-700"
                  }`}
                >
                  {ws.name}
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-5 text-center">
            <p
              className={`text-xs font-semibold ${
                isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
              }`}
            >
              No workspaces found
            </p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative flex-1 flex justify-start">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border ${
            isDarkMode
              ? "bg-indigo-500/10 border-indigo-500/20"
              : "bg-indigo-50 border-indigo-100"
          } ${
            isAdmin
              ? isDarkMode
                ? "hover:bg-indigo-500/20 active:scale-95 cursor-pointer"
                : "hover:bg-indigo-100 active:scale-95 cursor-pointer"
              : "cursor-default"
          }`}
        >
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0">
            {allWorkspacesSelected
              ? "ALL"
              : initials}
          </div>

          <span
            className={`text-xs sm:text-sm font-bold truncate max-w-[120px] ${
              isDarkMode
                ? "text-gray-200"
                : "text-gray-700"
            }`}
            title={
              allWorkspacesSelected
                ? "All Workspaces"
                : activeWorkspace?.name || ""
            }
          >
            {allWorkspacesSelected
              ? "All Workspaces"
              : activeWorkspace?.name || ""}
          </span>

          {isAdmin && (
            <ChevronDown
              size={14}
              className={`transition-transform ${
                isDarkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              } ${
                isWSDropdownOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          )}
        </button>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          dropdownMenu,
          document.body
        )}
    </>
  );
};

export default WorkspaceDropdown;