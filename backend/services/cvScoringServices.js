const fs = require("fs");

const calculateCVScore = (filename) => {
  let score = 0;

  const lowerName = filename.toLowerCase();

  // Rule 1
  if (lowerName.includes("cv")) {
    score += 10;
  }

  // Rule 2
  if (lowerName.includes("resume")) {
    score += 10;
  }

  // Rule 3
  score += 30;

  // Rule 4
  score += 20;

  return Math.min(score, 100);
};

module.exports = calculateCVScore;