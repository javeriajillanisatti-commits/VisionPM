import React, { useMemo, useRef, useEffect, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from "reactflow";
import { Paperclip, MessageCircle, UserRound, ListTodo } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import "reactflow/dist/style.css";

const priorityConfig = {
  High: { color: "#D96B6B", bg: "#D96B6B1A", text: "#D96B6B", darkBg: "rgba(217,107,107,0.1)", darkText: "#D96B6B" },
  Medium: { color: "#D6A832", bg: "#D6A8321A", text: "#D6A832", darkBg: "rgba(214,168,50,0.1)", darkText: "#D6A832" },
  Low: { color: "#5FAF68", bg: "#5FAF681A", text: "#5FAF68", darkBg: "rgba(95,175,104,0.1)", darkText: "#5FAF68" },
};
const statusConfig = {
  Todo: { bg: "#eff6ff", text: "#2563eb", darkBg: "rgba(37,99,235,0.1)", darkText: "#60a5fa" },
  "In Progress": { bg: "#fffbeb", text: "#d97706", darkBg: "rgba(245,158,11,0.1)", darkText: "#fbbf24" },
  Completed: { bg: "#f0fdf4", text: "#16a34a", darkBg: "rgba(34,197,94,0.1)", darkText: "#4ade80" },
};

// Task node
const TaskNode = ({ data }) => {
  const dark = data.isDarkMode;
  const priority = priorityConfig[data.priority] || { color: "#9ca3af", bg: "#f9fafb", text: "#6b7280", darkBg: "rgba(255,255,255,0.05)", darkText: "#9ca3af" };
  const status = statusConfig[data.status] || statusConfig.Todo;

  return (
    <div
      className={`relative rounded-2xl border shadow-lg px-4 py-3 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${dark ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}
      style={{ width: 210, minHeight: 125, borderTop: `4px solid ${priority.color}` }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white" />

      {/* Task title */}
      <div className="flex items-start gap-2 mb-3">
        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: priority.color }} />
        <p className={`text-sm font-bold leading-5 line-clamp-2 ${dark ? "text-gray-100" : "text-gray-800"}`}>
          {data.taskTitle || "Untitled Task"}
        </p>
      </div>

      {/* Status and priority */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className="px-2 py-1 rounded-lg text-[10px] font-bold"
          style={{ backgroundColor: dark ? status.darkBg : status.bg, color: dark ? status.darkText : status.text }}
        >
          {data.status || "Todo"}
        </span>
        <span
          className="px-2 py-1 rounded-lg text-[10px] font-bold"
          style={{ backgroundColor: dark ? priority.darkBg : priority.bg, color: dark ? priority.darkText : priority.text }}
        >
          {data.priority || "Normal"}
        </span>
      </div>

      {/* Files and comments */}
      <div className={`flex items-center gap-4 text-[11px] font-medium ${dark ? "text-gray-500" : "text-gray-400"}`}>
        <span className="flex items-center gap-1.5"><Paperclip size={12} />{data.filesCount || 0}</span>
        <span className="flex items-center gap-1.5"><MessageCircle size={12} />{data.commentsCount || 0}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white" />
    </div>
  );
};

// Profile node
const ProfileNode = ({ data }) => {
  const dark = data.isDarkMode;

  return (
    <div className="flex flex-col items-center">
      {/* Profile image */}
      <div className="relative">
        <div className={`w-28 h-28 rounded-full p-1 shadow-2xl border-4 ${dark ? "bg-[#11182B] border-blue-500/20" : "bg-white border-blue-100"}`}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt={data.fullName || "Profile"}
              className="w-full h-full rounded-full object-cover"
              onError={e => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
          )}
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white ${data.profileImage ? "hidden" : "flex"}`}>
            <UserRound size={38} />
          </div>
        </div>

        {/* Online indicator */}
        <div className={`absolute bottom-1 right-2 w-5 h-5 rounded-full bg-green-500 border-4 ${dark ? "border-[#05091D]" : "border-white"}`} />
      </div>

      {/* Profile name */}
      <div className={`mt-3 px-5 py-2 rounded-xl shadow-md border text-center ${dark ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
        <p className={`text-sm font-bold ${dark ? "text-gray-100" : "text-gray-800"}`}>{data.fullName || "You"}</p>
        <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
          <UserRound size={9} /> YOU
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-600 !border-2 !border-white" />
    </div>
  );
};

const nodeTypes = { taskNode: TaskNode, profileNode: ProfileNode };
const FIT_PADDING = 0.35;

// Main contribution map
const ContributionMap = ({ tasks = [], profile, onNodeClick }) => {
  const { isDarkMode } = useTheme();

  const wrapperRef = useRef(null);      
  const rfInstance = useRef(null);     

  const refit = useCallback(() => {
    rfInstance.current?.fitView({ padding: FIT_PADDING, duration: 300 });
  }, []);

  const { nodes, edges } = useMemo(() => {
    const centerX = 500, centerY = 300;
    let profileImage = profile?.profilePic || null;

    if (profileImage && !profileImage.startsWith("http")) {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      profileImage = `${apiUrl.replace(/\/$/, "")}/${profileImage.replace(/^\/+/, "")}`;
    }

    const centerNode = {
      id: "you",
      type: "profileNode",
      position: { x: centerX - 60, y: centerY - 60 },
      data: { fullName: profile?.fullName, profileImage, isDarkMode },
      draggable: false,
    };

    // Create task grid
    const columns = 3, taskWidth = 210, horizontalGap = 70, rowHeight = 190;
    const startX = centerX - (columns * taskWidth + (columns - 1) * horizontalGap) / 2;

    const taskNodes = tasks.map((task, index) => {
      const column = index % columns, row = Math.floor(index / columns);
      const y = row === 0 ? 65 : centerY + 120 + (row - 1) * rowHeight;
      const x = startX + column * (taskWidth + horizontalGap);

      return {
        id: task._id,
        type: "taskNode",
        position: { x, y },
        data: {
          taskTitle: task.taskTitle || task.title || "Untitled Task",
          status: task.status || "Todo",
          priority: task.priority || "Medium",
          filesCount: task.filesCount || 0,
          commentsCount: task.commentsCount || 0,
          isDarkMode,
        },
      };
    });

    // Create task connections
    const taskEdges = tasks.map(task => ({
      id: `edge-${task._id}`,
      source: "you",
      target: task._id,
      type: "smoothstep",
      animated: task.status === "In Progress",
      style: { stroke: priorityConfig[task.priority]?.color || "#94a3b8", strokeWidth: 2, opacity: 0.7 },
    }));

    return { nodes: [centerNode, ...taskNodes], edges: taskEdges };
  }, [tasks, profile, isDarkMode]);

  useEffect(() => {
    const t = setTimeout(refit, 100);
    return () => clearTimeout(t);
  }, [tasks, refit]);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refit, 150); // debounce, taake bar bar na chale
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [refit]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-[480px] sm:h-[540px] lg:h-[600px] rounded-3xl border shadow-sm overflow-hidden transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-[#05091D] via-[#0b0f1f] to-[#0d1428] border-[#263149]"
          : "bg-gradient-to-br from-slate-50 via-white to-blue-50 border-gray-200"
      }`}
    >
      {/* Header  */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6 z-10 pointer-events-none">
        <div className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl backdrop-blur-sm ${isDarkMode ? "bg-[#05091D]/70" : "bg-white/70"}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
            <ListTodo size={17} />
          </div>
          <div>
            <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Contribution Map</h2>
          </div>
        </div>
      </div>

      {/* Priority legend */}
      <div className={`absolute bottom-3 left-3 sm:bottom-5 sm:left-6 z-10 backdrop-blur-sm rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 shadow-md border ${isDarkMode ? "bg-[#11182B]/90 border-[#263149]" : "bg-white/90 border-gray-100"}`}>
        <p className={`text-[9px] sm:text-[10px] font-bold uppercase mb-1.5 sm:mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Priority</p>
        <div className={`flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Low</span>
        </div>
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={instance => { rfInstance.current = instance; }}  // instance save karo, refit ke liye
        onNodeClick={(event, node) => node.id !== "you" && onNodeClick && onNodeClick(node.id)}
        fitView
        fitViewOptions={{ padding: FIT_PADDING }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={25} size={1} color={isDarkMode ? "#1e293b" : "#e5e7eb"} />
        <Controls showInteractive={false} position="bottom-right" className="!scale-90 sm:!scale-100 !origin-bottom-right" />
        <MiniMap
          position="top-right"
          className="!hidden lg:!block"
          nodeColor={node => node.id === "you" ? "#2563eb" : priorityConfig[node.data?.priority]?.color || "#94a3b8"}
          maskColor={isDarkMode ? "rgba(5,9,29,0.75)" : "rgba(241,245,249,0.75)"}
          style={{
            width: 130,
            height: 90,
            backgroundColor: isDarkMode ? "#11182B" : "#ffffff",
            borderRadius: 12,
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default ContributionMap;