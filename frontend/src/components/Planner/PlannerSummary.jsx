import React from "react";
import { Clock3, CalendarCheck2, ListTodo } from "lucide-react";
import StatsCard from "../cards/StatsCard";

const toMinutes = time => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatDuration = minutes => {
  const hours = Math.floor(minutes / 60), mins = minutes % 60;
  if (!hours && !mins) return "0 hours";
  if (!hours) return `${mins} minutes`;
  if (!mins) return `${hours} hours`;
  return `${hours}h ${mins}m`;
};

const PlannerSummary = ({ scheduledPlans = [], unplannedCount = 0 }) => {
  // Calculate planned work time
  const plannedMinutes = scheduledPlans.reduce((total, plan) => {
    const duration = toMinutes(plan?.endTime) - toMinutes(plan?.startTime);
    return total + (duration > 0 ? duration : 0);
  }, 0);

  const stats = [
    {
      title: "Planned Time",
      count: <span className="whitespace-nowrap text-base sm:text-lg">{formatDuration(plannedMinutes)}</span>,
      icon: <Clock3 />,
      bgColor: "bg-blue-50 dark:bg-blue-500/15",
      iconColor: "text-blue-600 dark:text-blue-400",
      subText: "Scheduled work time",
    },
    {
      title: "Scheduled",
      count: scheduledPlans.length,
      icon: <CalendarCheck2 />,
      bgColor: "bg-green-50 dark:bg-green-500/15",
      iconColor: "text-green-600 dark:text-green-400",
      subText: "Tasks scheduled",
    },
    {
      title: "Unplanned",
      count: unplannedCount,
      icon: <ListTodo />,
      bgColor: "bg-orange-50 dark:bg-orange-500/15",
      iconColor: "text-orange-600 dark:text-orange-400",
      subText: "Tasks waiting to be planned",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 w-full min-w-0">
      {stats.map(stat => (
        <div key={stat.title} className="min-w-0 w-full">
          <StatsCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default PlannerSummary;