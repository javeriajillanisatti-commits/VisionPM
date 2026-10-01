import React from "react";
import { X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ProjectDetailModal = ({ project, onClose }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 min-[375px]:p-3 min-[430px]:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div
        className={`${
          isDarkMode
            ? "bg-[#11182B] border border-[#263149]"
            : "bg-white"
        } rounded-2xl min-[430px]:rounded-3xl min-[600px]:rounded-[2rem] shadow-2xl w-full max-w-xl relative max-h-[calc(100vh-1rem)] min-[375px]:max-h-[calc(100vh-1.5rem)] min-[430px]:max-h-[calc(100vh-2rem)] overflow-y-auto animate-in zoom-in duration-200`}
      >

        <button
          onClick={onClose}
          className={`absolute top-3 right-3 min-[375px]:top-4 min-[375px]:right-4 min-[430px]:top-5 min-[430px]:right-5 min-[600px]:top-6 min-[600px]:right-6 w-8 h-8 flex items-center justify-center rounded-full ${
            isDarkMode
              ? "text-gray-500 hover:text-gray-300 hover:bg-[#1B253B]"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          } transition-colors shrink-0`}
        >
          <X size={20} />
        </button>

        <div className="p-4 min-[375px]:p-5 min-[430px]:p-6 min-[600px]:p-10 space-y-4">

          <div className="pr-8 min-w-0">
            <p className="text-[10px] min-[375px]:text-[11px] min-[430px]:text-xs font-black text-indigo-500 tracking-[0.12em] min-[430px]:tracking-[0.2em] mb-1 break-words">
              Workspace: {project.workspace?.name || "No Workspace"}
            </p>

            <h2
              className={`text-lg min-[375px]:text-xl min-[430px]:text-2xl font-semibold ${
                isDarkMode ? "text-gray-100" : "text-gray-800"
              } tracking-tight break-words`}
            >
              {project.projectName}
            </h2>
          </div>

          <div className="grid grid-cols-1 min-[600px]:grid-cols-2 gap-4">

            <div className="min-w-0">
              <p className={`text-[9px] min-[375px]:text-[10px] min-[430px]:text-xs font-black ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              } tracking-widest mb-1`}>
                Manager
              </p>

              <p className={`text-sm min-[375px]:text-base font-bold ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              } break-words`}>
                {project.createdBy?.fullName || "Project Manager"}
              </p>
            </div>

            <div className="min-w-0">
              <p className={`text-[9px] min-[375px]:text-[10px] min-[430px]:text-xs font-black ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              } tracking-widest mb-1`}>
                Created On
              </p>

              <p className={`text-sm min-[375px]:text-base font-bold ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              } break-words`}>
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <div className="min-w-0">
              <p className={`text-[9px] min-[375px]:text-[10px] min-[430px]:text-xs font-black ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              } tracking-widest mb-1`}>
                Status
              </p>

              <span className={`inline-block max-w-full ${
                isDarkMode
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-blue-50 text-blue-600"
              } px-2.5 min-[375px]:px-3 py-1 rounded-full text-[10px] min-[430px]:text-sm font-black break-words`}>
                {project.status}
              </span>
            </div>

          </div>

          <div className={`pt-4 border-t ${
            isDarkMode ? "border-[#263149]" : "border-gray-50"
          }`}>
            <p className={`text-[9px] min-[375px]:text-[10px] min-[430px]:text-xs font-black ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            } tracking-widest mb-2`}>
              Project Overview
            </p>

            <p className={`text-sm min-[375px]:text-base ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            } leading-relaxed font-medium break-words`}>
              {project.description || "No description provided."}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;