import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";

const MainLayout = ({ userRole }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get current user
  const { user } = useAuth() || {};

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
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default MainLayout;