import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Clock, CheckCircle, XCircle, X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import CVDetailsModal from "../../components/approvaltable/CVDetailsModal";
import approvalService from "../../services/approvalService";
import { useTheme } from "../../context/ThemeContext";
import StatsCard from "../../components/cards/StatsCard";

const PAGE_SIZE = 5;

const AVATAR_COLORS = [
  ["bg-blue-100", "text-blue-700", "bg-blue-500/15", "text-blue-300"],
  ["bg-emerald-100", "text-emerald-700", "bg-emerald-500/15", "text-emerald-300"],
  ["bg-amber-100", "text-amber-700", "bg-amber-500/15", "text-amber-300"],
  ["bg-purple-100", "text-purple-700", "bg-purple-500/15", "text-purple-300"],
  ["bg-teal-100", "text-teal-700", "bg-teal-500/15", "text-teal-300"],
  ["bg-rose-100", "text-rose-700", "bg-rose-500/15", "text-rose-300"],
];

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/60",
  Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/60",
  Rejected: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/60",
};

const STATUS_DARK = {
  Pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
};

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitial = (name) => name?.trim()[0]?.toUpperCase() || "?";
const StatusDropdown = ({ currentStatus, onRequestChange, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const styles = isDarkMode ? STATUS_DARK : STATUS_STYLES;
  const isFinalStatus = currentStatus === "Approved" || currentStatus === "Rejected";

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const options = isFinalStatus
    ? [{ value: currentStatus, label: currentStatus === "Approved" ? "Approved " : "Rejected" }]
    : [{ value: "Pending", label: "Pending" }, { value: "Approved", label: "Approve" }, { value: "Rejected", label: "Rejected" }, ];

  const selected = options.find((o) => o.value === currentStatus)?.label || "Select";

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <button type="button" disabled={isFinalStatus} onClick={() => !isFinalStatus && setOpen(!open)} className={`w-auto min-w-[90px] max-w-[110px] flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-left outline-none transition-all ${isFinalStatus ? "cursor-not-allowed opacity-80" : "cursor-pointer active:scale-95"}
       ${styles[currentStatus] || (isDarkMode ? "bg-white/5 text-gray-400 border border-white/10" : "bg-gray-100 text-gray-600 border border-gray-200")}`}>
        <span className="truncate">{selected}</span>
        {!isFinalStatus && <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && !isFinalStatus && (
        <div className={`absolute  left-0 right-0  top-full mt-1 z-50 rounded-xl border shadow-xl overflow-hidden ${isDarkMode ? "bg-[#18223A] border-[#263149]" : "bg-white border-gray-200"}`}>
          {options.map((option) => (
            <button key={option.value} type="button" onClick={() => { onRequestChange(option.value); setOpen(false); }} className={`w-full px-3 py-2.5 text-left text-xs font-semibold truncate transition-colors cursor-pointer ${currentStatus === option.value ? "bg-blue-600 text-white" : isDarkMode ? "text-gray-200 hover:bg-[#263149]" : "text-gray-700 hover:bg-slate-100"}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Skeleton = ({ dark, className }) => (
  <div className={`${className} rounded-md ${dark ? "bg-slate-800" : "bg-gray-200"}`} />
);

const FullPageSkeleton = ({ isDarkMode }) => (
  <div className="w-full space-y-6 animate-pulse">
    <div className="space-y-2 mb-2 -mt-3">
      <Skeleton dark={isDarkMode} className="h-9 w-64 rounded-lg" />
      <Skeleton dark={isDarkMode} className="h-4 w-80" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`rounded-2xl border p-5 flex items-center justify-between ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
          <div className="space-y-2">
            <Skeleton dark={isDarkMode} className="h-4 w-24" />
            <Skeleton dark={isDarkMode} className="h-8 w-12 rounded-lg" />
          </div>
          <Skeleton dark={isDarkMode} className="w-11 h-11 rounded-xl" />
        </div>
      ))}
    </div>

    <div className={`rounded-2xl border shadow-sm p-6 space-y-5 ${isDarkMode ? "bg-[#11182B]/90 border-[#263149]" : "bg-white border-gray-200"}`}>
      <div className="space-y-4">
        <Skeleton dark={isDarkMode} className="h-7 w-32 rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} dark={isDarkMode} className="h-8 w-24 rounded-lg" />)}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`grid grid-cols-1 md:grid-cols-[2.5fr_1.3fr_1.2fr_1fr] gap-4 items-center px-5 py-3.5 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-[#263149]" : "bg-[#FDFDFD] border-gray-100"}`}>
            <div className="flex items-center gap-3">
              <Skeleton dark={isDarkMode} className="w-9 h-9 rounded-full" />
              <Skeleton dark={isDarkMode} className="h-4 w-32" />
            </div>
            <Skeleton dark={isDarkMode} className="h-6 w-20" />
            <Skeleton dark={isDarkMode} className="h-7 w-24 rounded-full" />
            <Skeleton dark={isDarkMode} className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CVModalSkeleton = ({ isDarkMode }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 px-4">
    <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-pulse ${isDarkMode ? "bg-[#11182B] border border-[#263149]" : "bg-white"}`}>
      <div className="flex items-center gap-4">
        <Skeleton dark={isDarkMode} className="w-14 h-14 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton dark={isDarkMode} className="h-5 w-40" />
          <Skeleton dark={isDarkMode} className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-2 pt-4">
        <Skeleton dark={isDarkMode} className="h-4 w-full" />
        <Skeleton dark={isDarkMode} className="h-4 w-5/6" />
        <Skeleton dark={isDarkMode} className="h-4 w-4/6" />
      </div>
    </div>
  </div>
);

const FilterButton = ({ item, active, count, isDarkMode, onClick }) => (
  <button
    key={item}
    type="button"
    onClick={onClick}
    className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border active:scale-95 ${active
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/50 shadow-md shadow-blue-500/20"
      : isDarkMode
        ? "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"}`}
  >
    {item === "Rejected" ? "Denied" : item}
    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${active
      ? "bg-white/20 text-white"
      : isDarkMode
        ? "bg-white/10 text-gray-400"
        : "bg-gray-100 text-gray-600"}`}>
      {count}
    </span>
  </button>
);

const RequestRow = ({ request, isDarkMode, onStatusChange, onViewCV }) => {
  const name = request.name || request.fullName || "Unknown";
  const avatar = getAvatarColor(name);

  return (
    <div
      key={request._id}
      className={`grid grid-cols-[2.5fr_1.3fr_1.2fr_1fr] min-w-[700px] md:min-w-0 gap-2 md:gap-4 items-center px-5 py-3.5 rounded-xl border transition-all duration-200 ${isDarkMode
        ? "bg-white/[0.03] border-[#263149] hover:bg-white/[0.07] hover:border-slate-700"
        : "bg-[#FDFDFD] border-gray-100 hover:bg-slate-50 hover:border-slate-200"}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs ${isDarkMode ? `${avatar[2]} ${avatar[3]}` : `${avatar[0]} ${avatar[1]}`}`}>
          {getInitial(name)}
        </div>
        <span className={`font-semibold capitalize truncate ${isDarkMode ? "text-gray-100" : "text-[#0D1B2A]"}`}>
          {name}
        </span>
      </div>
      <div>
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${isDarkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
          {request.role || "N/A"}
        </span>
      </div>

      <div>
        <StatusDropdown currentStatus={request.accountStatus}
          onRequestChange={(status) => onStatusChange(request, status)}
          isDarkMode={isDarkMode}
        />
      </div>

      <div>
        <button type="button" onClick={() => onViewCV(request)}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-xs shadow-blue-500/20" >View Details</button> </div>
    </div>
  );
};

const PaginationBar = ({ currentPage, totalPages, setCurrentPage, isDarkMode }) => (
  <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 ${isDarkMode ? "border-[#263149]" : "border-gray-200"}`}>
    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
      Page {currentPage} of {totalPages}
    </p>

    <div className="flex items-center gap-3">
      {[
        ["Previous", ChevronLeft, currentPage === 1, () => setCurrentPage((p) => Math.max(p - 1, 1))],
        ["Next", ChevronRight, currentPage === totalPages, () => setCurrentPage((p) => Math.min(p + 1, totalPages))],
      ].map(([label, Icon, disabled, action]) => (
        <button key={label} type="button"
          disabled={disabled}
          onClick={action}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${disabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-sm"} ${isDarkMode ? "bg-white/5 border-[#263149] text-gray-300 hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          {label === "Previous" && <Icon size={16} />}
          {label}
          {label === "Next" && <Icon size={16} />}
        </button>
      ))}
    </div>
  </div>
);
const ConfirmationModal = ({ isDarkMode, pendingChange, onCancel, onConfirm, isSubmitting }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 px-4">
<div className={`rounded-2xl shadow-2xl max-w-sm w-full p-6 transition-colors duration-300 ${isDarkMode ? "bg-[#11182B] border border-[#263149]" : "bg-white"}`}>      <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-[#0D1B2A]"}`}> Confirm status change </h3>
      <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
         Are you sure you want to mark  <span className={`text-sm  mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{pendingChange.userName} </span> 
            as  <span className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{pendingChange.newStatus === "Approved" ? "Approved" : "Rejected"}</span>?</p>
<p className={`text-xs mt-3 font-medium ${
    isDarkMode ? "text-emerald-400" : "text-emerald-600"
  }`}>You can change the status only once. Once you approve or reject this request, the status cannot be changed again.
</p>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button type="button" disabled={isSubmitting}
          onClick={onCancel}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isSubmitting ? "opacity-50 cursor-not-allowed" : "active:scale-95"} ${isDarkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"}`} >Cancel
        </button>

        <button type="button" disabled={isSubmitting}
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-md ${isSubmitting ? "opacity-60 cursor-not-allowed" : "active:scale-95"} ${pendingChange.newStatus === "Approved"
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20"
            : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/20"}`}>
          {isSubmitting ? "Processing..." : "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

const ToastBanner = ({ toast, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {toast.message}
    <button type="button" onClick={onClose}>
      <X size={16} />
    </button>
  </div>
);

const Approvals = () => {
  const { isDarkMode } = useTheme();
  const liveTick = useLiveTick({ resources: ["users", "approvals"] });
  const [requests, setRequests] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cvLoading, setCvLoading] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [pendingChange, setPendingChange] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchRequests = useCallback(async (isFirstLoad = false) => {
    if (isFirstLoad) setInitialLoading(true);

    try {
      const response = await approvalService.getPendingRequests();
      setRequests(response.users || []);
    } catch (error) {
      console.error(" Fetch Requests Error:", error.response?.data || error.message || error);
      showToast( error.response?.data?.message || error.message || "Unable to load requests", "error" );
    } finally {
      if (isFirstLoad) setInitialLoading(false);
    }
  }, [showToast]);

  // Initial load of approval requests
  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests, liveTick]);

  useEffect(() => setCurrentPage(1), [statusFilter]);
  const requestStatusChange = (request, newStatus) => {
    if (newStatus === request.accountStatus) return;
    if (request.accountStatus === "Approved" || request.accountStatus === "Rejected") {
      showToast("This request has already been finalized and cannot be changed.", "error");
      return;
    }
    if (request.accountStatus !== "Pending") return;
    setPendingChange({ userId: request._id, userName: request.name || request.fullName || "this user",
      currentStatus: request.accountStatus,
      newStatus,
    });
  };

  const confirmStatusChange = async () => {
    if (!pendingChange || isSubmittingStatus) return;
    const { userId, newStatus, userName, currentStatus } = pendingChange;
    // Frontend protection before sending request
    if (currentStatus !== "Pending") {
      showToast("This request has already been finalized.", "error");
      setPendingChange(null);
      return;
    }

    if (newStatus !== "Approved" && newStatus !== "Rejected") {
      showToast("Invalid status change.", "error");
      setPendingChange(null);
      return;
    }

    try {
      setIsSubmittingStatus(true);
      if (newStatus === "Approved") {
        await approvalService.approveRequest(userId);
        showToast(`${userName} approved successfully`);
      }
      if (newStatus === "Rejected") {
        await approvalService.rejectRequest(userId);
        showToast(`${userName} rejected successfully`, "error");
      }
      await fetchRequests(false);
      setPendingChange(null);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || "Something went wrong", "error");
      console.error("Status Change Error:", error.response?.data || error);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Load CV details
  const handleViewCV = async (request) => {
    setCvLoading(true);
    try {
      const cvData = await approvalService.getCVDetails(request._id);
      setSelectedRequest(cvData);
      setShowCVModal(true);
    } catch (error) {
      console.error("CV Details Error:", error.response?.data || error.message || error);
      showToast(error.response?.data?.message || error.message || "Unable to load CV details", "error");
    } finally {
      setCvLoading(false);
    }
  };

  const totalReq = requests.length;
  const pendingReq = requests.filter((r) => r.accountStatus === "Pending").length;
  const approvedReq = requests.filter((r) => r.accountStatus === "Approved").length;
  const deniedCount = requests.filter((r) => r.accountStatus === "Rejected").length;

  const filteredRequests = requests.filter((r) => statusFilter === "All" || r.accountStatus === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const visibleRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filterCounts = { All: totalReq, Pending: pendingReq, Approved: approvedReq, Rejected: deniedCount };

  const stats = [
    ["Total Request", totalReq, <FileText size={20} />, isDarkMode ? "bg-blue-500/10" : "bg-blue-50", "text-blue-500"],
    ["Pending", pendingReq, <Clock size={20} />, isDarkMode ? "bg-orange-500/10" : "bg-orange-50", "text-orange-500"],
    ["Approved", approvedReq, <CheckCircle size={20} />, isDarkMode ? "bg-green-500/10" : "bg-green-50", "text-green-500"],
    ["Denied", deniedCount, <XCircle size={20} />, isDarkMode ? "bg-red-500/10" : "bg-red-50", "text-red-500"],
  ];

  const filters = ["All", "Pending", "Approved", "Rejected"];

  return (
    <div className={`w-full p-3 sm:p-5 lg:p-6 space-y-6 transition-colors duration-300 ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"}`}>
      {initialLoading ? <FullPageSkeleton isDarkMode={isDarkMode} /> : (
        <>
          <div className="space-y-1">
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}> Approval Requests </h1>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}> Manage and review account approval requests</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map(([title, count, icon, bg, color]) => ( <StatsCard key={title} title={title} count={count} icon={icon} bgColor={bg} iconColor={color} />
            ))}
          </div>

          <div className={`rounded-2xl border shadow-sm backdrop-blur-md overflow-hidden transition-all duration-300 ${isDarkMode ? "bg-[#11182B]/90 border-[#263149]" : "bg-white/95 border-gray-200/90"}`}>
            <div className={`px-5 sm:px-6 py-5 border-b ${isDarkMode ? "border-[#263149]" : "border-gray-200"}`}>
              <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : "text-[#0D1B2A]"}`}>Requests</h2>

<div className="flex flex-nowrap sm:flex-wrap items-center gap-2 mt-4 overflow-x-auto sm:overflow-visible pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  {filters.map((item) => (
    <FilterButton key={item} item={item}
      active={statusFilter === item}
      count={filterCounts[item]}
      isDarkMode={isDarkMode}
      onClick={() => setStatusFilter(item)}
    />
  ))}
</div>
            </div>

            <div className={`hidden md:grid grid-cols-[2.5fr_1.3fr_1.2fr_1fr] gap-4 px-6 py-3.5 text-[10px]] font-bold tracking-wider border-b ${isDarkMode ? "bg-[#182238] text-gray-300 border-[#263149]" : "bg-slate-100/80 text-slate-600 border-gray-200"}`}>
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>CV</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-transparent max-h-[520px] overflow-x-auto overflow-y-auto p-3 sm:p-4 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/60 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/60">
              {!visibleRequests.length ? (
                <div className={`py-14 text-center text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}> No requests found.</div>
              ) : ( visibleRequests.map((request) => (
                  <RequestRow key={request._id} request={request}
                    isDarkMode={isDarkMode}
                    onStatusChange={requestStatusChange}
                    onViewCV={handleViewCV}
                  />
                ))
              )}
            </div>

            {filteredRequests.length > PAGE_SIZE && (
              <PaginationBar currentPage={currentPage} totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </>
      )}

      {cvLoading && <CVModalSkeleton isDarkMode={isDarkMode} />}

      {showCVModal && !cvLoading && (
        <CVDetailsModal data={selectedRequest} onClose={() => setShowCVModal(false)} />
      )}

      {pendingChange && (
        <ConfirmationModal isDarkMode={isDarkMode} pendingChange={pendingChange}
          isSubmitting={isSubmittingStatus}
          onCancel={() => { if (!isSubmittingStatus) setPendingChange(null); }}onConfirm={confirmStatusChange}
        />
      )}
 {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Approvals;
