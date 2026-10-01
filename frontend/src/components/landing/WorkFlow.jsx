import React from "react";

const WorkflowCard = ({ step, image, title, desc, color }) => {
  return (
<div className="relative w-full py-2 md:py-4">
        {/* TIMELINE ROW */}
      <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_90px_1fr] items-center gap-8">
        {/* LEFT CONTENT */}
        <div className="order-2 md:order-none flex justify-center md:justify-end">
          <div className="group relative w-full max-w-[500px] h-[290px] md:h-[340px] rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-blue-50   border border-slate-200  shadow-[0_20px_60px_rgba(15,23,42,0.08)]  overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_70px_rgba(37,99,235,0.15)]">
            {/* Background Glow */}
            <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-blue-200/40  blur-3xl"></div>

            <div className="absolute -bottom-24 -right-16 w-56 h-56 rounded-full bg-indigo-200/30  blur-3xl"></div>

            {/* Small decorative dots */}
            <div className="absolute top-6 left-7 flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 "></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-200 "></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 "></span>
            </div>

            {/* Image */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
              <img src={image} alt={title} className="max-w-full max-h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110" />
            </div>
          </div>
        </div>

        {/* CENTER TIMELINE */}
        <div className="hidden md:flex relative h-full min-h-[340px] items-center justify-center">
          {/* Vertical Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-blue-300 to-transparent"></div>

          {/* Step Circle */}
          <div className="relative z-20">
            {/* Outer Glow */}
            <div className="absolute inset-[-10px] rounded-[22px] bg-blue-400/10 blur-md transition-all duration-500 group-hover:bg-blue-400/20"></div>
            <div className="relative w-16 h-16 rounded-[20px] bg-blue-600 flex items-center justify-center text-white text-lg font-black border-[5px] border-white  shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition-transform duration-300 hover:scale-110">
              {String(step).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="order-1 md:order-none flex flex-col items-start text-left">
          {/* Mobile Step */}
          <div className="flex md:hidden items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600  text-white flex items-center justify-center font-black shadow-lg">
              {String(step).padStart(2, "0")}
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 ">Step {step}</span>
          </div>

          {/* Desktop Step Label */}
          <div className="hidden md:flex items-center gap-3 mb-5">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600 ">
              Step {String(step).padStart(2, "0")}
            </span>

            <div className="w-12 h-px bg-blue-300 "></div>
          </div>

          {/* Title */}
          <h3 className="text-3xl md:text-4xl lg:text-[42px] font-black text-slate-900  leading-[1.08] tracking-tight max-w-lg mb-5">
            {title}
          </h3>

          {/* Accent */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-16 h-1.5 rounded-full bg-blue-600 "></div>
            <div className="w-3 h-1.5 rounded-full bg-blue-200 "></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-100 "></div>
          </div>

          {/* Description */}
          <p className="text-base md:text-lg text-slate-500 leading-7 md:leading-8 max-w-xl font-medium">{desc}</p>
        </div>
      </div>
      <div className="md:hidden flex justify-center mt-10">
        <div className="w-[2px] h-12 bg-gradient-to-b from-blue-400 to-transparent "></div>
      </div>
    </div>
  );
};

export default WorkflowCard;