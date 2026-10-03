import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLiveTick, isUserBusy } from "../hooks/useLiveRefresh";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";

const MainLayout = ({ userRole }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // LIVE UPDATES for every role: when the backend reports a change, the current
  // page is re-mounted so it refetches its data (same as pressing refresh, but
  // without a full reload). If the user is typing or a modal is open we wait
  // until they are done so nothing gets interrupted.
  const { user } = useAuth() || {};
  const liveTick = useLiveTick({ currentUserId: user?._id || user?.id });
  const [pageKey, setPageKey] = useState(0);
  const appliedTick = useRef(0);

  useEffect(() => {
    if (liveTick === appliedTick.current) return;

    let retry;
    const apply = () => {
      if (isUserBusy()) {
        retry = setTimeout(apply, 1500); // try again shortly
        return;
      }
      appliedTick.current = liveTick;
      setPageKey((k) => k + 1);
    };
    apply();

    return () => clearTimeout(retry);
  }, [liveTick]);

  // Toggle sidebar
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userRole={userRole}
      />

      <div
        className={`flex flex-col flex-1 min-w-0 bg-[#FAFAFA] dark:bg-slate-900 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:pl-72" : "lg:pl-20"
        }`}
      >
        <Topbar
          toggleSidebar={toggleSidebar}
          userRole={userRole}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4">
            <Outlet key={pageKey} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;