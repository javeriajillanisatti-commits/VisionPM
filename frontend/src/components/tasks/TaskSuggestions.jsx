import React, { useState } from "react";

const TaskSuggestions = ({
  invitedMembers = [],
  assignees = [],
  onSelectMember,
  onBack,
  onConfirm,
}) => {
  const [detailMember, setDetailMember] = useState(null);

  // Format member initials
  const initials = (name) => {
    if (!name) return "?";
    const p = name.trim().split(/\s+/);
    return (p[0][0] + (p[1]?.[0] || "")).toUpperCase();
  };

  // Get availability badge
  const availabilityColor = (status) =>
    ({
      Available: "bg-green-100 text-green-700 border-green-200",
      Busy: "bg-amber-100 text-amber-700 border-amber-200",
      "At Capacity": "bg-orange-100 text-orange-700 border-orange-200",
      Overloaded: "bg-red-100 text-red-700 border-red-200",
    }[status] || "bg-gray-100 text-gray-700 border-gray-200");

  // Get score badge
  const scoreColor = (score) =>
    score >= 90
      ? "bg-green-50 text-green-700 border-green-200"
      : score >= 70
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : score >= 50
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-red-50 text-red-700 border-red-200";

  // Render avatar
  const Avatar = ({ member }) =>
    member.profilePic ? (
      <img
        src={`${process.env.REACT_APP_API_URL}${member.profilePic}`}
        alt={member.fullName}
        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 bg-white shrink-0"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[11px] font-black border border-blue-700 shrink-0 shadow-sm tracking-wider">
        {initials(member.fullName)}
      </div>
    );

  // Render skill badges
  const Skills = ({ skills, type }) =>
    skills?.length ? (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {skills.map((skill, i) => (
          <span
            key={`${skill}-${i}`}
            className={
              type === "matched"
                ? "px-2 py-1 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[9px] font-semibold"
                : type === "missing"
                ? "px-2 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[9px] font-semibold"
                : "px-1.5 py-0.5 rounded-md text-[8px] font-medium bg-gray-200/60 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200/20 dark:border-slate-600"
            }
          >
            {type === "matched" ? "✓ " : type === "missing" ? "✕ " : ""}
            {skill}
          </span>
        ))}
      </div>
    ) : null;

  const first = invitedMembers[0];
  const hasSkills = Boolean(first?.requiredSkillsProvided || first?.requiredSkillsCount > 0);
  const requiredSkills = Array.isArray(first?.requiredSkills) ? first.requiredSkills : [];
  const requiredCount = first?.requiredSkillsCount || 0;

  // Select member from details
  const selectDetail = (id) => {
    onSelectMember(id);
    setDetailMember(null);
  };

  return (
    <div className="relative h-full min-h-0 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full mx-auto p-1">
      {/* Summary */}
      <div className="shrink-0 space-y-2">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
          System analyzed project members, active workloads, availability, and the task requirements. Members are ranked from best to least suitable.
        </p>

        {hasSkills ? (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                Required Skills ({requiredCount})
              </span>
              {requiredSkills.map((skill, i) => (
                <span key={`${skill}-${i}`} className="px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[9px] font-semibold text-blue-700 dark:text-blue-300">
                  {skill}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1">
              Ranking: Skills 60% · Availability 20% · Workload 20%
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-3 py-2">
            <p className="text-[12px] text-slate-700 dark:text-slate-300 font-semibold">
              No required skills entered
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Ranking uses only Availability 50% + Workload 50%. Skill scoring is excluded.
            </p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="min-h-0 flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {!invitedMembers.length ? (
          <p className="text-xs text-center text-gray-400 dark:text-slate-500 py-8">
            No suggestions found.
          </p>
        ) : (
          invitedMembers.map((member, index) => {
            const id = member.memberId;
            const selected = assignees.includes(id);
            const required = member.requiredSkillsCount ?? requiredCount;
            const matched = member.matchedSkillsCount ?? member.matchedSkills?.length ?? 0;

            return (
              <div key={id} className={`rounded-2xl border p-3 sm:p-3.5 transition-all ${selected ? "border-blue-300 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm" : "bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700/60 hover:bg-gray-100/70 dark:hover:bg-slate-700/60"}`}>
                <div className="flex items-start gap-3">
                  <Avatar member={member} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-gray-800 dark:text-slate-200 truncate">{member.fullName}</p>
                      {index === 0 && member.finalScore > 0 && (
                        <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0">Best Match</span>
                      )}
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border shrink-0 ${availabilityColor(member.availability)}`}>
                        {member.availability}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400 dark:text-slate-400 truncate mt-0.5">{member.email}</p>

                    {member.skills?.length ? (
                      <div className="max-h-10 overflow-hidden"><Skills skills={member.skills} /></div>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5">No skills listed</p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {hasSkills && (
                        <span className="text-[9px] font-bold text-gray-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                          Skills {matched}/{required}
                        </span>
                      )}
                      {[
                        `Workload ${member.workload}%`,
                        `Availability ${member.availabilityScore ?? "-"}`,
                      ].map((text) => (
                        <span key={text} className="text-[9px] font-bold text-gray-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                          {text}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">RSA Score</p>
                    <p className="text-sm font-black text-gray-800 dark:text-white">{member.finalScore} / 100</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2.5 pt-2 border-t border-gray-200/70 dark:border-slate-700/70">
                  <button type="button" onClick={() => setDetailMember(member)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer">
                    View Details
                  </button>
                  <button type="button" onClick={() => onSelectMember(id)} className={`text-[10px] px-4 py-1.5 rounded-lg transition-all font-bold shadow-sm active:scale-95 cursor-pointer ${selected ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                    {selected ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex justify-between items-center gap-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 mt-0.5">
        <button type="button" onClick={onBack} className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition cursor-pointer">
          Back to Form
        </button>
        <button type="button" onClick={onConfirm} className="text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-indigo-400 transition cursor-pointer">
          Confirm
        </button>
      </div>

      {/* Details modal */}
      {detailMember && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-slate-950/35 backdrop-blur-[1px] p-3">
          <div className="w-full max-w-md max-h-[82%] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col">
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar member={detailMember} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{detailMember.fullName}</h3>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border ${availabilityColor(detailMember.availability)}`}>
                      {detailMember.availability}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 dark:text-slate-500 truncate">{detailMember.email}</p>
                </div>
              </div>
              <button type="button" onClick={() => setDetailMember(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 text-lg leading-none cursor-pointer" aria-label="Close member details">
                &times;
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
              {/* Member skills */}
              <section>
                <p className="text-[12px] font-black text-gray-400 dark:text-slate-500 mb-1.5">Member Skills</p>
                {detailMember.skills?.length ? <Skills skills={detailMember.skills} /> : <p className="text-[10px] text-gray-400 dark:text-slate-500">No skills listed.</p>}
              </section>

              {/* Skill matching */}
              {hasSkills ? (
                <section className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2.5">
                  <div className="flex justify-between items-center gap-3">
                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">Skill Match</p>
                    <p className="text-sm font-black text-blue-700 dark:text-blue-300">{detailMember.skillMatch ?? 0} / 100</p>
                  </div>

                  {[
                    ["Matched Skills", detailMember.matchedSkillsCount ?? detailMember.matchedSkills?.length ?? 0, detailMember.matchedSkills, "matched", "None of the required skills matched."],
                    ["Missing Skills", detailMember.missingSkillsCount ?? detailMember.missingSkills?.length ?? 0, detailMember.missingSkills, "missing", "No missing skills. All required skills matched."],
                  ].map(([title, count, skills, type, empty]) => (
                    <div key={title}>
                      <p className={`text-[10px] font-bold mb-1 ${type === "matched" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {title} ({count})
                      </p>
                      {skills?.length ? <Skills skills={skills} type={type} /> : <p className={`text-[9px] ${type === "matched" ? "text-green-700/70 dark:text-green-400/70" : "text-red-600/70 dark:text-red-400/70"}`}>{empty}</p>}
                    </div>
                  ))}
                </section>
              ) : (
                <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-200">No required skills specified</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                    Skill scoring is not applicable. This member is ranked using availability and current workload.
                  </p>
                </section>
              )}

              {/* Availability and workload */}
              <section className="grid grid-cols-2 gap-2">
                {[
                  ["Availability", detailMember.availability, detailMember.availabilityScore],
                  ["Current Workload", `${detailMember.workload}%`, detailMember.workloadScore],
                ].map(([title, value, score]) => (
                  <div key={title} className="rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/70 p-2.5">
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">{title}</p>
                    <p className="text-xs font-black text-gray-800 dark:text-white mt-0.5">{value}</p>
                    <p className="text-[9px] text-gray-500 dark:text-slate-400 mt-1">Score: <span className="font-black">{score ?? "-"}/100</span></p>
                  </div>
                ))}
              </section>

              {/* Final score */}
              <section className={`rounded-xl border p-3 ${scoreColor(detailMember.finalScore)}`}>
                <div className="flex justify-between items-center gap-3">
                  <p className="text-[11px] font-black">Final Recommendation Score</p>
                  <p className="text-sm font-black">{detailMember.finalScore} / 100</p>
                </div>
                <div className="h-1.5 bg-white/70 dark:bg-slate-950/30 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-current transition-all" style={{ width: `${Math.max(0, Math.min(100, detailMember.finalScore || 0))}%` }} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 text-[8px] font-bold">
                  {hasSkills ? (
                    <><span>Skills 60%</span><span>·</span><span>Availability 20%</span><span>·</span><span>Workload 20%</span></>
                  ) : (
                    <><span>Availability 50%</span><span>·</span><span>Workload 50%</span></>
                  )}
                </div>
              </section>

              {detailMember.recommendationReason && (
                <p className="text-[9px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 px-2.5 py-2 rounded-lg border border-gray-100 dark:border-slate-700">
                  {detailMember.recommendationReason}
                </p>
              )}
            </div>

            {/* Modal actions */}
            <div className="shrink-0 flex justify-end gap-2 px-4 py-3 border-t border-gray-100 dark:border-slate-800">
              <button type="button" onClick={() => setDetailMember(null)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                Close
              </button>
              <button type="button" onClick={() => selectDetail(detailMember.memberId)} className={`text-[10px] font-bold px-4 py-1.5 rounded-lg text-white cursor-pointer ${assignees.includes(detailMember.memberId) ? "bg-green-500" : "bg-blue-600 hover:bg-blue-700"}`}>
                {assignees.includes(detailMember.memberId) ? "Selected" : "Select"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskSuggestions;