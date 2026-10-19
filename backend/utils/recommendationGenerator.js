const generateRecommendation = (score) => {

  if (score >= 85) {
    return "higly Recommended";
  }
   else if (score >= 65) {
    return "Recommended";
  }

  return "Not Recommended";
};

module.exports = generateRecommendation;