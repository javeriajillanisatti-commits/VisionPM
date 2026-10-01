import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import AnnouncementButton from "../../components/buttons/AnnouncementButton";
import AnnouncementPanel from "../../components/admin/AnnouncementPanel";

const Announcements = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className={`w-full min-h-full p-3 sm:p-5 lg:p-6 transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#05091D] text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className={`w-9 h-9 sm:w-11 sm:h-11 border rounded-xl shrink-0 flex items-center justify-center transition-colors ${
              isDarkMode
                ? "bg-[#11182B] border-[#263149] text-gray-300 hover:bg-[#172443]"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft size={17} />
          </button>

          <div>
            <h1
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Announcements
            </h1>

            <p
              className={`mt-1 text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Stay updated with the latest announcements and important updates.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
          <AnnouncementButton
            onClick={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      <AnnouncementPanel
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
};

export default Announcements;