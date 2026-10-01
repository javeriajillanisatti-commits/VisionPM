import React, { useEffect, useState, useRef } from 'react';
import { useWorkspace } from "../../context/WorkspaceContext"; 
import { useTheme } from "../../context/ThemeContext";
import DownloadButton from "../../components/buttons/DownloadButton";
import StatsCard from "../../components/cards/StatsCard"; 
import ProjectPerformance from "../../components/cards/report/ProjectPerformance";
import TeamPerformance from "../../components/cards/report/TeamPerformance";
import { getProjectsByWorkspace, getProjectReport } from "../../services/projectService";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FolderKanban, CheckCircle2, ListTodo, BarChart3, Filter, FileText, ChevronDown } from "lucide-react";

const Report = () => {
  const { activeWorkspace } = useWorkspace(); 
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("All");
  const [reportType, setReportType] = useState("All");
  const [allReportsDump, setAllReportsDump] = useState([]);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const normalizeId = (value) => (value == null ? "" : String(value));
  const projectDropdownRef = useRef(null);
  const reportDropdownRef = useRef(null);

  const workspaceIdDependency = activeWorkspace?.id || activeWorkspace?._id;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) setIsProjectDropdownOpen(false);
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(e.target)) setIsReportDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let requestInFlight = false;
    
    const fetchWorkspaceReportsData = async (showLoader = false) => {
      if (!workspaceIdDependency) {
        setError("Please select an active workspace to view reports.");
        return;
      }
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const workspaceProjects = await getProjectsByWorkspace(workspaceIdDependency);
        if (cancelled) return;
        setProjectsList(workspaceProjects || []);

        if (!workspaceProjects || workspaceProjects.length === 0) {
          setAllReportsDump([]);
          if (showLoader) setLoading(false);
          return;
        }

        // download complete workspace data
        const reportPromises = workspaceProjects.map(p => getProjectReport(p._id || p.id).catch(() => null));
        const resolvedReports = await Promise.all(reportPromises);
        const validReports = resolvedReports.filter(r => r && r.success).map(r => r.data);
        
        if (cancelled) return;
        setAllReportsDump(validReports || []);

      } catch (err) {
        if (!cancelled) setError("Failed to fetch analytical datasets from database.");
      } finally {
        if (showLoader && !cancelled) setLoading(false);
      }
    };

    const refreshReport = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        await fetchWorkspaceReportsData(false);
      } finally {
        requestInFlight = false;
      }
    };

    fetchWorkspaceReportsData(true);
    const intervalId = setInterval(refreshReport, 2000);
    const handleFocus = () => refreshReport();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshReport();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [workspaceIdDependency]);
 
  const getComputedFilteredView = () => {
    const reports = allReportsDump || [];
    const sourceProjects = projectsList || [];

    const selectedId = normalizeId(selectedProjectId);
    const filteredReports = selectedId === "All"
      ? reports
      : reports.filter(r => normalizeId(r?.projectDetails?._id || r?.projectDetails?.id) === selectedId);

    let totalTasksCount = 0;
    let completedTasksCount = 0;
    const allTeamMembers = {};
    
    const projectsPerformanceData = filteredReports.map(report => {
      if (!report) return null;
      const details = report.projectDetails || {};
      const breakdown = report.taskBreakdown || { totalTasks: 0, todo: 0, inProgress: 0, completed: 0 };
      totalTasksCount += breakdown.totalTasks || 0;
      completedTasksCount += breakdown.completed || 0;
      
      if (report.teamPerformance && Array.isArray(report.teamPerformance)) {
        report.teamPerformance.forEach(member => {
          if (!member) return;
          const memberName = member.name || "Unknown Team Member";
          const memberEmail = member.email || member._id;      
          if (!allTeamMembers[memberEmail]) {
            allTeamMembers[memberEmail] = {
              name: memberName,
              email: memberEmail,
              workload: member.workload || 0,
              availability: member.availability || "Unknown",
              totalTasks: 0,
              completedTasks: 0,
            };
          }
          allTeamMembers[memberEmail].totalTasks += member.totalTasks || 0;
          allTeamMembers[memberEmail].completedTasks += member.completedTasks || 0;
          allTeamMembers[memberEmail].workload = member.workload || 0;
          allTeamMembers[memberEmail].availability = member.availability || "Unknown";
        });
      }
      return {
        name: details.projectName || "Unnamed Project", desc: details.description || "No description provided", 
        total: breakdown.totalTasks || 0, todo: breakdown.todo || 0, ip: breakdown.inProgress || 0, done: breakdown.completed || 0,
        progress: details.calculatedProgress || 0, status: details.status || "Planning",
        timeline: details.startDate ? `${new Date(details.startDate).toLocaleDateString()} - ${new Date(details.endDate).toLocaleDateString()}` : "TBD"
      };
    }).filter(Boolean);

    const overallCompletion = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    const teamPerformanceData = Object.values(allTeamMembers).map((m) => {
      const completionRate = m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;
      return {
        name: m.name,
        initial: m.name ? m.name.charAt(0).toUpperCase() : "U",
        tasks: m.totalTasks,
        completed: m.completedTasks,
        workload: m.workload,
        availability: m.availability,
        rate: completionRate,
      };
    });

    const activeList = selectedId === "All"
      ? sourceProjects
      : sourceProjects.filter(p => normalizeId(p?._id || p?.id) === selectedId);
    const stats = [
      { title: "Total Projects", count: selectedProjectId === "All" ? sourceProjects.length : 1 },
      { title: "Completed Projects", count: activeList.filter(p => p?.status === "Completed").length },
      { title: "Total Tasks", count: totalTasksCount },
      { title: "Overall Completion", count: `${overallCompletion}%` }
    ];

    return { stats, projectsPerformanceData, teamPerformanceData };
  };

  const { stats, projectsPerformanceData, teamPerformanceData } = getComputedFilteredView();

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const workspaceName = activeWorkspace ? (activeWorkspace.name || activeWorkspace.workspaceName) : "Global";
    
    // Top Header Banner
    doc.setFillColor(17, 24, 39); 
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold").setFontSize(20);
    doc.text("EXECUTIVE PERFORMANCE REPORT", 14, 18);
    doc.setFont("Helvetica", "normal").setFontSize(10);
    
    const projectScopeText = selectedProjectId === "All" ? "All Workspace Projects" : "Selected Project";
    doc.text(`Workspace: ${workspaceName} | ${projectScopeText}`, 14, 26);

    let nextY = 48;
    const tableStyles = {
      headStyles: { fillColor: [17, 24, 39],  textColor: [255, 255, 255],  fontStyle: 'bold',  fontSize: 10,  halign: 'left' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { textColor: [51, 65, 85], fontSize: 9 },
      theme: 'striped'
    };

    if (reportType === "All" || reportType === "Project") {
      doc.setTextColor(17, 24, 39).setFont("Helvetica", "bold").setFontSize(14);
      doc.text("1. Project Performance Analytics", 14, nextY);
      const projHeaders = [["Project Name", "Total Tasks", "To Do", "In Progress", "Completed", "Progress", "Status","Timeline"]];
      
      const projRows = projectsPerformanceData.length > 0 
        ? projectsPerformanceData.map(p => [p.name, p.total, p.todo, p.ip, p.done, `${p.progress}%`, p.status, p.timeline])
        : [["No project data available", "-", "-", "-", "-", "-", "-", "-"]];
      
      autoTable(doc, { 
        head: projHeaders, 
        body: projRows, 
        startY: nextY + 6, 
        ...tableStyles
      });
      nextY = doc.lastAutoTable.finalY + 15;
    }

    if (reportType === "All" || reportType === "Team") {
      doc.setTextColor(17, 24, 39).setFont("Helvetica", "bold").setFontSize(14);
      doc.text(reportType === "Team" ? "1. Team Member Execution Metrics" : "2. Team Member Execution Metrics", 14, nextY);
      const teamHeaders = [["Team Member", "Assigned Tasks", "Completed Tasks", "Workload", "Availability"]];
      
      const teamRows = teamPerformanceData.length > 0 
        ? teamPerformanceData.map((m) => [m.name, m.tasks, m.completed, `${m.workload}%`, m.availability])
        : [["No team performance data available", "-", "-", "-", "-"]]; 
      
      autoTable(doc, { 
        head: teamHeaders, 
        body: teamRows, 
        startY: nextY + 6, 
        ...tableStyles
      });
    }

    const sanitizedName = workspaceName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Performance_Report_${sanitizedName}.pdf`);
  };

  const getCardMeta = (title) => {
    switch (title) {
      case "Total Projects": return { icon: <FolderKanban size={18} />, bg: "bg-indigo-50/60 dark:bg-indigo-950/20", text: "text-indigo-600 dark:text-indigo-400" };
      case "Completed Projects": return { icon: <CheckCircle2 size={18} />, bg: "bg-emerald-50/60 dark:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400" };
      case "Total Tasks": return { icon: <ListTodo size={18} />, bg: "bg-purple-50/60 dark:bg-purple-950/20", text: "text-purple-600 dark:text-purple-400" };
      default: return { icon: <BarChart3 size={18} />, bg: "bg-amber-50/60 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400" };
    }
  };

  const currentProjectLabel = selectedProjectId === "All"
    ? "All Workspace Projects"
    : (projectsList.find(p => normalizeId(p._id || p.id) === normalizeId(selectedProjectId))?.projectName || "Selected Project");
  const reportTypeOptions = [
    { id: "All", label: "All" },
    { id: "Project", label: "Project Performance Only" },
    { id: "Team", label: "Team Performance Only" }
  ];
  const currentReportLabel = reportTypeOptions.find(opt => opt.id === reportType)?.label || "All Components (Default)";
  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header block section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Report</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Analyze workspace performance metrics, task completions, and team resource utilization.</p>
          </div>
          <div className="w-full sm:w-36 shrink-0 self-start sm:self-auto">
            <DownloadButton text="Download" onClick={handleDownloadPDF} disabled={loading} />
          </div>
        </div>

        
        {projectsList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 w-full">
            
            {/* Project selection dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full">
              <div className="flex items-center gap-2.5 px-1 text-[14px] font-bold text-gray-900 dark:text-slate-400 shrink-0">
                <Filter size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Project Filter:</span>
              </div>
              <div className="relative flex-1 w-full" ref={projectDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className={`w-full h-11 flex items-center justify-between px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all bg-white dark:bg-[#11182B] text-gray-700 dark:text-white outline-none ${
                    isProjectDropdownOpen ? "border-blue-500" : "border-gray-200 dark:border-[#263149]"
                  }`}
                >
                  <span className="truncate">{currentProjectLabel}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProjectDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isProjectDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl shadow-xl py-1 z-50 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setSelectedProjectId("All"); setIsProjectDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${selectedProjectId === "All" ? "bg-blue-600 text-white font-semibold" : "text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white"}`}
                    >
                      All Workspace Projects
                    </button>
                    {projectsList.map((proj) => {
                      const id = proj._id || proj.id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setSelectedProjectId(id); setIsProjectDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${selectedProjectId === id ? "bg-blue-600 text-white font-semibold" : "text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white"}`}
                        >
                          {proj.projectName || proj.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Custom report type dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full">
              <div className="flex items-center gap-2.5 px-1 text-[14px] font-bold text-gray-900 dark:text-slate-400 shrink-0">
                <FileText size={14} className="text-blue-500 dark:text-pblue-500" />
                <span>Report Type:</span>
              </div>
              <div className="relative flex-1 w-full" ref={reportDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                  className={`w-full h-11 flex items-center justify-between px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all bg-white dark:bg-[#11182B] text-gray-700 dark:text-white outline-none ${
                    isReportDropdownOpen ? "border-blue-500" : "border-gray-200 dark:border-[#263149]"
                  }`}
                >
                  <span className="truncate">{currentReportLabel}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isReportDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isReportDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl shadow-xl py-1 z-50">
                    {reportTypeOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setReportType(opt.id); setIsReportDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${reportType === opt.id ? "bg-blue-600 text-white font-semibold" : "text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {error ? (
          <div className="p-4 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-2xl">{error}</div>
        ) : loading ? (
          <div className="w-full h-96 flex items-center justify-center"><p className="text-gray-500 font-black animate-pulse text-sm uppercase tracking-widest">Compiling Report Analytics...</p></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((s, i) => { const meta = getCardMeta(s.title); return <StatsCard key={i} title={s.title} count={s.count} icon={meta.icon} bgColor={meta.bg} iconColor={meta.text} />; })}
            </div>

            <div className="space-y-6">
              {/* Conditional display block */}
              {(reportType === "All" || reportType === "Project") && (
                <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-200/70 dark:border-slate-800 shadow-sm">
                  <h2 className={`text-lg pb-2 font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-800"}`} >
                     Project Performance Report
                  </h2>
                  <ProjectPerformance projects={projectsPerformanceData} />
                </section>
              )}
              
              {/* Team Analytics */}
              {(reportType === "All" || reportType === "Team") && (
                <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-200/70 dark:border-slate-800 shadow-sm">
                  <h2 className={`text-lg pb-2 font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                   Team Member Performance
                  </h2>
                  <TeamPerformance team={teamPerformanceData} />
                </section>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Report;