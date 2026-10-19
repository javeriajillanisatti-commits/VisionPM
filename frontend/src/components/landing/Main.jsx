import React from "react";
import headimg from "../../components/assets/HR.jpeg";
import { CheckCircle2 } from "lucide-react";

const Main = () => {
  const statusChip = (extraClass = "") => (
    <div className={`px-3 py-2 lg:px-4 lg:py-3 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center gap-2 whitespace-nowrap ${extraClass}`}>
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      <span className="text-xs md:text-sm font-bold text-slate-700">
        Project On Track
      </span>
    </div>
  );


  return (
    <div className="relative w-full min-h-[calc(100vh-105px)] overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/70">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[450px] h-[450px] rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-[38%] w-20 h-20 rounded-full border border-blue-100 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto min-h-[calc(100vh-105px)] px-6 md:px-10 lg:px-16 pt-28 md:pt-24 lg:pt-20 pb-8 md:pb-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">

          {/* Left side */}
          <div className="w-full max-w-2xl text-left">

            {/* Mobile badge*/}
            <div className="inline-flex lg:hidden items-center gap-2.5 px-4 py-2.5 mb-5 rounded-full bg-white/90 backdrop-blur-sm border border-blue-100 shadow-[0_8px_24px_rgba(37,99,235,0.15)] whitespace-nowrap">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-blue-500 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-blue-600" />
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold text-blue-700 tracking-widest">
                SMART PROJECT MANAGEMENT
              </span>
            </div>

            {/* Desktop badge (unchanged) */}
            <div className="hidden lg:inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-full bg-blue-50 border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              <span className="text-xs md:text-sm font-bold text-blue-700 tracking-wide">
                SMART PROJECT MANAGEMENT
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-black leading-[1.05] tracking-tight text-slate-900 mb-5">
              Manage Projects Smarter, <br />
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                Deliver Results Faster.
              </span>
            </h1>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-16 h-1.5 rounded-full bg-blue-600" />
              <div className="w-5 h-1.5 rounded-full bg-blue-300" />
              <div className="w-2 h-1.5 rounded-full bg-blue-100" />
            </div>
            <p className="text-base md:text-lg lg:text-xl text-slate-600 mb-2 lg:mb-7 max-w-xl font-medium leading-8">
             Plan projects, manage tasks, track progress, collaborate with your team, and make informed decisions with intelligent project management features.

            </p>
          </div>

          {/* Right side: image */}
          <div className="relative flex flex-col items-center justify-center w-full mt-2 lg:mt-0">

            <div className="absolute w-[360px] h-[360px] md:w-[480px] md:h-[480px] rounded-full bg-blue-200/40 blur-3xl" />
            <div className="relative z-10 w-full max-w-[560px] rounded-[34px] bg-white/80 backdrop-blur-sm border border-white shadow-[0_25px_80px_rgba(30,64,175,0.12)] overflow-hidden p-4 md:p-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_90px_rgba(30,64,175,0.18)]">
              <div className="relative w-full aspect-[4/3] rounded-[26px] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <img src={headimg} alt="VisionPM Project Management" className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
              </div>
            </div>
            <div className="absolute z-20 bottom-4 left-2 md:left-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center rotate-[-6deg]">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>

            <div className="hidden lg:block absolute z-20 top-3 right-2">
              {statusChip()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Main;