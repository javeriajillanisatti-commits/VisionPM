import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const DEFAULT_START = 7 * 60, DEFAULT_END = 21 * 60, PX_PER_MIN = 50 / 60;
const priorityBorderColor = { High: "#ef4444", Medium: "#eab308", Low: "#22c55e" };

const toMinutes = time => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const formatHourLabel = m => `${Math.floor(m / 60) % 12 || 12} ${Math.floor(m / 60) >= 12 ? "PM" : "AM"}`;
const formatCurrentTime = date => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const PlannerCalendar = ({ scheduledPlans = [], onRemove, onEdit, onAddTimeBlock }) => {
  const { isDarkMode } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Keep current time updated
  useEffect(() => {
    const update = () => setCurrentTime(new Date());
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const starts = scheduledPlans.filter(p => p.startTime).map(p => Math.floor(toMinutes(p.startTime) / 60) * 60);
  const ends = scheduledPlans.filter(p => p.endTime).map(p => Math.ceil(toMinutes(p.endTime) / 60) * 60);
  const dayStart = Math.min(DEFAULT_START, ...starts);
  const dayEnd = Math.max(DEFAULT_END, ...ends);

  const hours = Array.from({ length: Math.floor((dayEnd - dayStart) / 60) + 1 }, (_, i) => dayStart + i * 60);
  const timeSlots = Array.from({ length: Math.ceil((dayEnd - dayStart) / 30) }, (_, i) => {
    const start = dayStart + i * 30;
    return { start, end: Math.min(start + 30, dayEnd) };
  });

  const totalHeight = (dayEnd - dayStart) * PX_PER_MIN;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentTimeVisible = currentMinutes >= dayStart && currentMinutes <= dayEnd;
  const currentTimeTop = (currentMinutes - dayStart) * PX_PER_MIN;

  // Add a new time block
  const handleAddBlock = slot => onAddTimeBlock?.(null, minutesToTime(slot.start), minutesToTime(slot.end));

  return (
    <div className={`w-full min-w-0 h-full rounded-2xl p-4 sm:p-5 shadow-sm border transition-colors duration-300 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
        <h3 className={`text-s font-black  ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Today's Schedule</h3>
      </div>

      {/* Calendar */}
      {!scheduledPlans.length ? (
        <div className="min-h-[300px] w-full flex items-center justify-center">
          <div className="text-center px-4">
            <h3 className={`text-sm sm:text-base font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>No Task Scheduled Yet</h3>
            <p className={`mt-1 text-xs sm:text-sm   ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Add a Time block.</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto overflow-y-hidden">
          <div className="relative flex min-w-[460px] sm:min-w-[520px] w-full" style={{ height: totalHeight }}>
            {/* Time labels */}
            <div className="w-14 flex-shrink-0 relative">
              {hours.map(minute => (
                <div key={minute} className={`absolute left-0 -translate-y-1/2 text-[10px] font-semibold whitespace-nowrap ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} style={{ top: (minute - dayStart) * PX_PER_MIN }}>
                  {formatHourLabel(minute)}
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className={`relative flex-1 border-l ${isDarkMode ? "border-[#263149]" : "border-gray-100"}`}>
              {hours.map(minute => (
                <div key={minute} className={`absolute left-0 right-0 w-full border-t pointer-events-none ${isDarkMode ? "border-white/5" : "border-gray-100"}`} style={{ top: (minute - dayStart) * PX_PER_MIN }} />
              ))}

              {/* Drop slots */}
              {timeSlots.map(slot => {
                const top = (slot.start - dayStart) * PX_PER_MIN;
                const height = (slot.end - slot.start) * PX_PER_MIN;
                const hovered = hoveredSlot === slot.start;
                const dragOver = dragOverSlot === slot.start;

                return (
                  <div
                    key={slot.start}
                    className={`absolute left-0 right-0 group transition-all duration-200 ${dragOver ? isDarkMode ? "bg-purple-500/20 ring-1 ring-inset ring-purple-500/30" : "bg-purple-100/70 ring-1 ring-inset ring-purple-200" : hovered ? isDarkMode ? "bg-blue-500/10" : "bg-blue-50/80" : ""}`}
                    style={{ top, height }}
                    onMouseEnter={() => setHoveredSlot(slot.start)}
                    onMouseLeave={() => { setHoveredSlot(null); setDragOverSlot(null); }}
                    onDragLeave={e => e.currentTarget === e.target && setDragOverSlot(null)}
                  >
                    <button
                      type="button"
                      onClick={() => handleAddBlock(slot)}
                      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${hovered || dragOver ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"} ${isDarkMode ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                    >
                      <Plus size={12} /> Add Time Block
                    </button>
                  </div>
                );
              })}

              {/* Current time */}
              {currentTimeVisible && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: currentTimeTop }}>
                  <div className="absolute -top-3 left-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold shadow-sm">{formatCurrentTime(currentTime)}</div>
                  <div className="w-full h-[2px] bg-red-500" />
                </div>
              )}

              {/* Scheduled plans */}
              {scheduledPlans.map(plan => {
                const start = toMinutes(plan.startTime), end = toMinutes(plan.endTime);
                const top = Math.max(0, (start - dayStart) * PX_PER_MIN);
                const height = Math.max(28, (end - start) * PX_PER_MIN);
                const taskTitle = plan.task?.taskTitle || plan.task?.title || "Untitled Task";
                const priority = plan.task?.priority || "Medium";

                return (
                  <div
                    key={plan._id}
                    onClick={() => onEdit(plan)}
                    className={`absolute left-2 right-2 z-10 rounded-xl px-3 py-2 cursor-pointer group shadow-sm hover:shadow-md transition-all border-l-4 ${isDarkMode ? "bg-[#1A2338]" : "bg-white"}`}
                    style={{ top, height, borderLeftColor: priorityBorderColor[priority] || "#9ca3af" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>{taskTitle}</p>
                        <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{plan.startTime} - {plan.endTime}</p>
                        {plan.note && <p className={`text-[10px] italic mt-0.5 truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{plan.note}</p>}
                      </div>

                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onRemove(plan._id); }}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${isDarkMode ? "text-gray-500 hover:text-red-400 hover:bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}
                        title="Remove from schedule"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerCalendar;