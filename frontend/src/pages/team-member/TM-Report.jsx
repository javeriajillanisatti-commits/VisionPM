import React, { useEffect, useState, useRef } from "react";
import { CheckCircle, Clock, ListTodo, Layout, Calendar, ChevronDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getMyTasks } from "../../services/memberService";
import DownloadButton from "../../components/buttons/DownloadButton";
import TaskBreakdownTable from "../../components/cards/report/TaskBreakdownTable";
import { useTheme } from "../../context/ThemeContext";
import StatsCard from "../../components/cards/StatsCard";

const CustomDropdown = ({ value, onChange, options, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const selected = options.find(o => o.value === value)?.label || "Select";
  return (
    <div ref={ref} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full min-w-0 flex items-center justify-between gap-2 p-2.5 rounded-xl text-sm font-semibold text-left outline-none border transition-all cursor-pointer hover:border-blue-500 focus:border-blue-500 ${open ? "border-blue-500" : ""} ${isDarkMode ? "bg-[#18223A] border-[#263149] text-white" : "bg-slate-50 border-gray-200 text-gray-900"}`}
      >
        <span className="truncate">{selected}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border shadow-xl overflow-hidden ${isDarkMode ? "bg-[#18223A] border-[#263149]" : "bg-white border-gray-200"}`}>
          {options.map(option => (
            <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false) }} className={`w-full px-3 py-2.5 text-left text-sm font-semibold truncate transition-colors cursor-pointer ${value === option.value ? "bg-blue-600 text-white" : isDarkMode ? "text-gray-200 hover:bg-[#263149]" : "text-gray-700 hover:bg-slate-100"}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TMReport = () => {
  const { isDarkMode } = useTheme();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("All");
  const [dateFilterType, setDateFilterType] = useState("All Time");

  // Load member tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setMyTasks((await getMyTasks()).tasks || []);
      } catch (error) {
        console.error("Error fetching tasks for report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);
  // Build project list
  const projectsMap = new Map();
  myTasks.forEach(task => {
    if (task.project?._id) projectsMap.set(task.project._id, task.project);
  });
  const myProjects = [...projectsMap.values()];

  // Apply report filters
  const filteredTasks = myTasks.filter(task => {
    if (selectedProjectId !== "All" && task.project?._id !== selectedProjectId) return false;
    const taskDate = task.deadline || task.createdAt;
    if (!taskDate || dateFilterType === "All Time") return true;
    const date = new Date(taskDate).setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilterType === "This Week") {
      const start = new Date(today);
      const end = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      end.setDate(today.getDate() + 6 - today.getDay());
      return date >= start.getTime() && date <= end.getTime();
    }

    if (dateFilterType === "This Month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).getTime();
      return date >= start && date <= end;
    }

    return true;
  });

  // Prepare statistics
  const statsData = [
    {
      title: "Total Tasks",
      count: filteredTasks.length,
      icon: <Layout size={20} strokeWidth={2.2} />,
      bgColor: isDarkMode ? "bg-purple-500/10" : "bg-purple-50",
      iconColor: isDarkMode ? "text-purple-400" : "text-purple-600"
    },
    {
      title: "Completed",
      count: filteredTasks.filter(t => t.status === "Completed").length,
      icon: <CheckCircle size={20} strokeWidth={2.2} />,
      bgColor: isDarkMode ? "bg-green-500/10" : "bg-green-50",
      iconColor: isDarkMode ? "text-green-400" : "text-green-600"
    },
    {
      title: "In Progress",
      count: filteredTasks.filter(t => t.status === "In Progress").length,
      icon: <Clock size={20} strokeWidth={2.2} />,
      bgColor: isDarkMode ? "bg-purple-500/10" : "bg-purple-50",
      iconColor: isDarkMode ? "text-purple-400" : "text-purple-600"
    },
    {
      title: "Pending",
      count: filteredTasks.filter(t => t.status === "Todo").length,
      icon: <ListTodo size={20} strokeWidth={2.2} />,
      bgColor: isDarkMode ? "bg-blue-500/10" : "bg-blue-50",
      iconColor: isDarkMode ? "text-blue-400" : "text-blue-600"
    }
  ];

  const projectOptions = [
    { value: "All", label: "All Projects Combined" },
    ...myProjects.map(project => ({ value: project._id, label: project.projectName }))
  ];

  const dateOptions = [
    { value: "All Time", label: "All Time" },
    { value: "This Week", label: "This Week" },
    { value: "This Month", label: "This Month" }
  ];
  // Generate and download PDF
  const handleDownloadPDF = () => {
    if (!filteredTasks.length) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const projectLabel = selectedProjectId === "All" ? "All Projects Combined" : myProjects.find(p => p._id === selectedProjectId)?.projectName || "Selected Project";

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255).setFont("Helvetica", "bold").setFontSize(20);
    doc.text("My Performance Report", 14, 18);
    doc.setFont("Helvetica", "normal").setFontSize(10);
    doc.text(`Project: ${projectLabel}`, 14, 26);
    doc.setTextColor(15, 23, 42).setFont("Helvetica", "bold").setFontSize(14);
    doc.text("1. Task Summary", 14, 48);

    autoTable(doc, {
      head: [["Total Tasks", "Completed", "In Progress", "To Do"]],
      body: [[...statsData.map(stat => stat.count)]],
      startY: 54,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59] }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.text("2. Task Breakdown", 14, finalY);

    autoTable(doc, {
      head: [["Task", "Project", "Status", "Deadline"]],
      body: filteredTasks.map(task => [
        task.taskTitle || task.title || "Untitled",
        task.project?.projectName || "General",
        task.status === "Todo" ? "To Do" : task.status,
        task.deadline ? task.deadline.substring(0, 10) : "N/A"
      ]),
      startY: finalY + 6,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59] }
    });

    const fileName = projectLabel.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`My_Performance_Report_${fileName}.pdf`);
  };

  if (loading) {
    return (
      <div className={`p-10 text-center ${isDarkMode ? "bg-[#05091D] text-gray-300" : "text-gray-900"}`}>
        Loading report...
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen pt-3 pb-10 px-3 min-[430px]:px-4 sm:px-6 lg:px-10 space-y-6 animate-in fade-in duration-500 transition-colors ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50/50 text-gray-900"}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-2xl min-[430px]:text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          My Performance Report
        </h1>
        <div className="w-full sm:w-40">
          <DownloadButton text="Download" onClick={handleDownloadPDF} />
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-5 p-0 rounded-none border-0 shadow-none lg:p-4 lg:rounded-2xl lg:border lg:shadow-sm ${isDarkMode ? "lg:bg-[#11182B] lg:border-[#263149]" : "lg:bg-white lg:border-gray-100"}`}>
        {/* Report Filters: Project (left) */}
        <div className="flex flex-col gap-2 w-full lg:w-80 lg:flex-none min-w-0">
          <label className={`text-sm font-bold ${isDarkMode ? "text-gray-300" : "text-slate-700"}`}>
            Filter by Project:
          </label>
          <div className="w-full">
            <CustomDropdown value={selectedProjectId} onChange={setSelectedProjectId} options={projectOptions} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Date Range (right edge) */}
        <div className="flex flex-col gap-2 w-full lg:w-80 lg:flex-none min-w-0">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400 shrink-0" />
            <span className={`text-sm font-bold ${isDarkMode ? "text-gray-300" : "text-slate-700"}`}>
              Date Range:
            </span>
          </div>

          <div className="w-full">
            <CustomDropdown value={dateFilterType} onChange={setDateFilterType} options={dateOptions} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            count={stat.count}
            icon={stat.icon}
            bgColor={stat.bgColor}
            iconColor={stat.iconColor}
            subText={stat.subText}
          />
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-700 pt-2 min-w-0">
        <h2 className={`text-xl mb-4 font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          Task Breakdown
        </h2>
        <div className="w-full min-w-0 overflow-x-auto">
          <TaskBreakdownTable tasks={filteredTasks} />
        </div>
      </div>
    </div>
  );
};

export default TMReport;