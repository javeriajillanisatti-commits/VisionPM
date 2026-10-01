// Resource Allocation Score Calculator

const normalizeSkill = (value) =>
  value?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "";

const normalizeSkillList = (skills = []) => [
  ...new Set(
    (Array.isArray(skills) ? skills : [skills])
      .flatMap((skill) => skill?.toString().split(/,|\n/) || [])
      .map(normalizeSkill)
      .filter(Boolean)
  ),
];

// Calculate skill match percentage
const calculateSkillMatchScore = (requiredSkills = [], memberSkills = []) => {
  const required = normalizeSkillList(requiredSkills);
  const member = normalizeSkillList(memberSkills);

  return required.length
    ? Math.round(
        (required.filter((skill) => member.includes(skill)).length /
          required.length) *
          100
      )
    : 0;
};

const calculateWorkloadScore = (workload = 0) =>
  Math.round(100 - Math.min(100, Math.max(0, Number(workload) || 0)));

const calculateAvailabilityScore = (availability = "Available") =>
  ({
    Available: 100,
    Busy: 70,
    "At Capacity": 30,
    Overloaded: 0,
  }[availability] ?? 50);

// Calculate final weighted score
const calculateFinalScore = ({
  skillScore = 0,
  workloadScore = 0,
  availabilityScore = 0,
  requiredSkillsProvided = false,
}) =>
  Math.round(
    requiredSkillsProvided
      ? skillScore * 0.6 + availabilityScore * 0.2 + workloadScore * 0.2
      : availabilityScore * 0.5 + workloadScore * 0.5
  );

module.exports = {
  normalizeSkill,
  normalizeSkillList,
  calculateSkillMatchScore,
  calculateWorkloadScore,
  calculateAvailabilityScore,
  calculateFinalScore,
};