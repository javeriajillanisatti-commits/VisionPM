import React from "react";

// Skeleton shown while a page's code or data is loading.
// Works in light and dark mode (no spinner).
const block = "rounded-xl animate-pulse bg-gray-200 dark:bg-[#111936]";
const card =
  "rounded-[1.25rem] border border-gray-100 bg-white dark:border-[#263149] dark:bg-[#11182B]";

const PageSkeleton = ({ fullScreen = false }) => (
  <div
    className={`w-full space-y-6 px-3 sm:px-5 md:px-6 lg:px-10 pt-3 pb-6 ${
      fullScreen ? "min-h-screen bg-gray-50 dark:bg-[#05091D]" : ""
    }`}
    aria-busy="true"
    aria-label="Loading"
  >
    <div className="space-y-3">
      <div className={`${block} h-9 w-48 max-w-full`} />
      <div className={`${block} h-4 w-72 max-w-full`} />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={`${card} p-4 space-y-3`}>
          <div className={`${block} h-4 w-1/2`} />
          <div className={`${block} h-8 w-1/3`} />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[0, 1].map(i => (
        <div key={i} className={`${card} p-5 space-y-4`}>
          <div className={`${block} h-5 w-40`} />
          <div className={`${block} h-48 w-full`} />
        </div>
      ))}
    </div>
  </div>
);

export default PageSkeleton;
