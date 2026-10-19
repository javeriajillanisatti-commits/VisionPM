const Project = require("../models/Project");
const { calculateWorkloadForMember } = require("../utils/workloadCalculator");
const {
  normalizeSkill,
  normalizeSkillList,
  calculateSkillMatchScore,
  calculateWorkloadScore,
  calculateAvailabilityScore,
  calculateFinalScore,
} = require("../utils/resourceallocationScoreCalculator");

// Get live resource allocation suggestions
const getSuggestedMembers = async (serviceData) => {
  const { projectId } = serviceData;
  const rawSkills = serviceData?.requiredSkills ?? [];
  const requiredSkills = normalizeSkillList(rawSkills);
  const requiredLabels = (Array.isArray(rawSkills) ? rawSkills : [rawSkills])
    .flatMap((skill) => skill?.toString().split(/,|\n/) || [])
    .map((skill) => skill.trim())
    .filter(Boolean);

  const hasSkills = requiredSkills.length > 0;
  const requiredCount = requiredSkills.length;

  const project = await Project.findById(projectId).populate({
    path: "members",
    select: "fullName email profilePic skills role",
  });

  if (!project)
    return { status: 404, message: "Project not found" };

  const members = project.members.filter(
    (member) =>
      member.role?.toString().trim().toLowerCase().replace(/\s+/g, "-") ===
      "team-member"
  );

  if (!members.length)
    return {
      status: 404,
      message: "No team members found assigned to this project.",
    };

  // Keep original skill labels for UI display
  const displaySkills = new Map();

  requiredLabels.forEach((skill) => {
    const key = normalizeSkill(skill);
    if (key && !displaySkills.has(key))
      displaySkills.set(key, skill);
  });

  const suggestions = await Promise.all(
    members.map(async (member) => {
      const workloadData = await calculateWorkloadForMember(member._id);
      const workload = workloadData.workload;
      const availability = workloadData.availability;
      const memberSkills = normalizeSkillList(member.skills || []);

      const skillMatch = hasSkills
        ? calculateSkillMatchScore(requiredSkills, member.skills || [])
        : null;

      const matchedKeys = hasSkills
        ? requiredSkills.filter((skill) => memberSkills.includes(skill))
        : [];

      const missingKeys = hasSkills
        ? requiredSkills.filter((skill) => !memberSkills.includes(skill))
        : [];

      const matchedSkills = matchedKeys.map(
        (skill) => displaySkills.get(skill) || skill
      );
      const missingSkills = missingKeys.map(
        (skill) => displaySkills.get(skill) || skill
      );

      const workloadScore = calculateWorkloadScore(workload);
      const availabilityScore =
        calculateAvailabilityScore(availability);

      const finalScore = calculateFinalScore({
        skillScore: skillMatch ?? 0,
        workloadScore,
        availabilityScore,
        requiredSkillsProvided: hasSkills,
      });

      const scoreBreakdown = hasSkills
        ? {
            mode: "skills",
            skillMatch: skillMatch,
            skillWeight: 60,
            availabilityScore,
            availabilityWeight: 20,
            workloadScore,
            workloadWeight: 20,
          }
        : {
            mode: "workload-availability",
            skillMatch: null,
            skillWeight: 0,
            availabilityScore,
            availabilityWeight: 50,
            workloadScore,
            workloadWeight: 50,
          };

      const reasonParts = [];

      if (hasSkills) {
        reasonParts.push(
          matchedSkills.length === requiredCount
            ? `All ${requiredCount} required skills matched.`
            : `${matchedSkills.length} of ${requiredCount} required skills matched.`
        );
      } else {
        reasonParts.push(
          "No required skills entered. Ranking uses availability and workload."
        );
      }

      reasonParts.push(
        workload <= 40
          ? "Low workload."
          : workload <= 74
          ? "Moderate workload."
          : "High workload."
      );

      if (availability === "Available")
        reasonParts.push("Currently available.");
      else if (availability === "Busy")
        reasonParts.push("Currently active on tasks.");

      return {
        memberId: member._id,
        fullName: member.fullName,
        email: member.email,
        profilePic: member.profilePic,
        skills: member.skills || [],
        requiredSkillsProvided: hasSkills,
        requiredSkillsCount: requiredCount,
        requiredSkills: requiredLabels,
        matchedSkillsCount: matchedSkills.length,
        missingSkillsCount: missingSkills.length,
        matchedSkills,
        missingSkills,
        skillMatch,
        workload,
        workloadScore,
        availability,
        availabilityScore,
        finalScore,
        scoreBreakdown,
        recommendationReason: reasonParts.join(" "),
      };
    })
  );

  suggestions.sort((a, b) => b.finalScore - a.finalScore);

  return {
    status: 200,
    requiredSkillsProvided: hasSkills,
    requiredSkillsCount: requiredCount,
    requiredSkills: requiredLabels,
    suggestions,
  };
};

module.exports = {
  getSuggestedMembers,
};