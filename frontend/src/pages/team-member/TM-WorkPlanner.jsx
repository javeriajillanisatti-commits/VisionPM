import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useCallback, useEffect, useState } from "react";
import { getMyTasks } from "../../services/memberService";
import {
  getMyWorkPlan,
  createWorkPlan,
  updateWorkPlan,
  deleteWorkPlan,
} from "../../services/workPlanService";
import PlannerHeader from "../../components/Planner/PlannerHeader";
import AssignedTasksPanel from "../../components/Planner/AssignedTasksPanel";
import PlannerCalendar from "../../components/Planner/PlannerCalendar";
import PlannerSummary from "../../components/Planner/PlannerSummary";
import ScheduleTaskModal from "../../components/Planner/ScheduleTaskModal";
import { useTheme } from "../../context/ThemeContext";


//  Skeleton loader 
const Skeleton = ({ dark, className = "" }) => (
  <div className={`${className} rounded-md ${dark ? "bg-slate-800" : "bg-gray-200"}`} />
);

const PlannerBodySkeleton = ({ isDarkMode }) => {
  const card = `rounded-2xl border ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`;
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 animate-pulse">
      {/* Unplanned tasks panel */}
      <div className={`${card} p-5 space-y-4`}><Skeleton dark={isDarkMode} className="h-6 w-40 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`rounded-xl border p-4 space-y-2 ${isDarkMode ? "border-[#263149]" : "border-gray-100"}`}>
            <Skeleton dark={isDarkMode} className="h-4 w-3/4" />
            <Skeleton dark={isDarkMode} className="h-3 w-1/2" /></div>))}
      </div>
      {/* Calendar */}
      <div className={`${card} p-5 lg:col-span-2 space-y-3`}>
        <Skeleton dark={isDarkMode} className="h-6 w-48 rounded-lg" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton dark={isDarkMode} className="h-4 w-12 shrink-0" />
            <Skeleton dark={isDarkMode} className="h-12 flex-1 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};
// Format date as YYYY-MM-DD
const toDateString = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const emptyModal = {
  isOpen: false,
  mode: "create",
  task: null,
  plan: null,
  initialStart: "",
  initialEnd: "",
  initialNote: "",
};

const workPlannerTasksCache = new Map();
const workPlannerPlansCache = new Map();

const TMWorkPlanner = () => {
  const liveTick = useLiveTick({ resources: ["tasks", "work-plans"] });
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const taskCacheKey = "my-tasks";
  const planCacheKey = selectedDate;

  const cachedTasks = workPlannerTasksCache.get(taskCacheKey);
  const cachedPlans = workPlannerPlansCache.get(planCacheKey);

  const [allTasks, setAllTasks] = useState(cachedTasks || []);
  const [scheduledPlans, setScheduledPlans] = useState(cachedPlans || []);
  const [loading, setLoading] = useState(!cachedPlans);
  const [modalState, setModalState] = useState(emptyModal);

  const fetchPlans = useCallback(async (showLoader = false) => {
    const cachedData = workPlannerPlansCache.get(planCacheKey);

    if (cachedData) {
      setScheduledPlans(cachedData);
      setLoading(false);
    } else if (showLoader) {
      setLoading(true);
    }

    try {
      const data = await getMyWorkPlan(selectedDate);
      const freshPlans = data.plans || [];

      workPlannerPlansCache.set(planCacheKey, freshPlans);
      setScheduledPlans(freshPlans);
    } catch (error) {
      console.error("Error fetching work plan:", error);

      if (!cachedData) {
        setScheduledPlans([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, planCacheKey]);

  const fetchTasks = useCallback(async () => {
    const cachedData = workPlannerTasksCache.get(taskCacheKey);

    if (cachedData) {
      setAllTasks(cachedData);
    }

    try {
      const data = await getMyTasks();
      const freshTasks = data.tasks || data || [];

      workPlannerTasksCache.set(taskCacheKey, freshTasks);
      setAllTasks(freshTasks);
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);

      if (!cachedData) {
        setAllTasks([]);
      }
    }
  }, [taskCacheKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, liveTick]);

  useEffect(() => {
    const cachedData = workPlannerPlansCache.get(planCacheKey);

    if (cachedData) {
      setScheduledPlans(cachedData);
      setLoading(false);
      fetchPlans(false);
    } else {
      fetchPlans(true);
    }
  }, [fetchPlans, planCacheKey, liveTick]);

  // Remove completed tasks from planner
  const isCompleted = task =>
    String(task?.status || "").trim().toLowerCase() === "completed";

  const activeTasks = allTasks.filter(task => !isCompleted(task));
  const activePlans = scheduledPlans.filter(plan => !isCompleted(plan.task));
  const scheduledIds = activePlans.map(plan => plan.task?._id).filter(Boolean);
  const unplannedTasks = activeTasks.filter(task => !scheduledIds.includes(task._id));

  // Open create/edit modal
  const openCreateModal = (task, startTime = "", endTime = "") =>
    setModalState({
      isOpen: true,
      mode: "create",
      task: task || null,
      plan: null,
      initialStart: startTime,
      initialEnd: endTime,
      initialNote: "",
    });

  const openEditModal = plan =>
    setModalState({
      isOpen: true,
      mode: "edit",
      task: plan.task,
      plan,
      initialStart: plan.startTime || "",
      initialEnd: plan.endTime || "",
      initialNote: plan.note || "",
    });

  const closeModal = () => setModalState(emptyModal);

  // Save schedule
  const handleModalSave = async (startTime, endTime, note) => {
    try {
      if (modalState.mode === "edit" && modalState.plan) {
        await updateWorkPlan(modalState.plan._id, { startTime, endTime, note });
      } else {
        if (!modalState.task?._id) {
          console.error("No task selected for this time block.");
          return false;
        }
        await createWorkPlan({
          task: modalState.task._id,
          date: selectedDate,
          startTime,
          endTime,
          note,
        });
      }
      await fetchPlans();
      closeModal();
      return true;
    } catch (error) {
      console.error("Error saving schedule:", error.response?.data || error.message);
      return false;
    }
  };

  // Delete schedule
  const handleModalDelete = async () => {
    if (!modalState.plan?._id) return;
    try {
      await deleteWorkPlan(modalState.plan._id);
      await fetchPlans();
      closeModal();
    } catch (error) {
      console.error("Error removing schedule:", error);
    }
  };

  const handleQuickRemove = async planId => {
    try {
      await deleteWorkPlan(planId);
      await fetchPlans();
    } catch (error) {
      console.error("Error removing schedule:", error);
    }
  };

  // Change planner date
  const changeDateBy = days => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(toDateString(date));
  };

  return (
    <div
      className={`w-full min-h-screen min-w-0 px-3 sm:px-5 lg:px-8 py-3 sm:py-5 lg:py-6 space-y-4 sm:space-y-5 lg:space-y-6 overflow-x-hidden transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#05091D] text-white"
          : "bg-gray-50/50 text-gray-900"
      }`}
    >
      <PlannerHeader
        selectedDate={selectedDate}
        onPrev={() => changeDateBy(-1)}
        onNext={() => changeDateBy(1)}
        onToday={() => setSelectedDate(toDateString(new Date()))}
      />

      <PlannerSummary
        scheduledPlans={activePlans}
        unplannedCount={unplannedTasks.length}
      />

      {loading ? (
                <PlannerBodySkeleton isDarkMode={isDarkMode} />
      ) : (
        <div className="w-full min-w-0 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          <div className="min-w-0 w-full lg:h-full">
            <AssignedTasksPanel
              unplannedTasks={unplannedTasks}
              onScheduleClick={openCreateModal}
            />
          </div>

          <div className="min-w-0 w-full lg:col-span-2 lg:h-full">
            <PlannerCalendar
              scheduledPlans={activePlans}
              onRemove={handleQuickRemove}
              onEdit={openEditModal}
              onAddTimeBlock={openCreateModal}
            />
          </div>
        </div>
      )}

      <ScheduleTaskModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        task={modalState.task}
        initialStart={modalState.initialStart}
        initialEnd={modalState.initialEnd}
        initialNote={modalState.initialNote}
        onClose={closeModal}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </div>
  );
};

export default TMWorkPlanner;