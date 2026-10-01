const scoreCV = (cvText) => {
 const bulletRegex = /^[•●▪◦*\-]\s*/;

  const rawLines = cvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const text = cvText.toLowerCase();

  // Score breakdown
  const breakdown = {
    education: 0,
    skills: 0,
    projects: 0,
    experience: 0,
    certifications: 0,
  };
  // 2. Section names
  const sectionNames = {
    education: [
      "education", "academic background", "academic qualifications",
      "qualifications", "educational background", "academic history", "degrees",
    ],
    skills: [
      "skills", "technical skills", "soft skills", "core skills",
      "professional skills", "key skills", "competencies", "core competencies",
      "areas of expertise", "expertise",
    ],
    projects: [
      "projects", "academic projects", "professional projects", "selected projects",
      "key projects", "project experience", "academic project", "major projects",
      "research projects", "portfolio",
    ],
    experience: [
      "experience", "work experience", "professional experience", "employment history",
      "work history", "career history", "internship", "internships",
      "professional history", "employment",
    ],
    certifications: [
      "certifications", "certificates", "professional certifications",
      "licenses & certifications", "licenses and certifications",
      "training & certifications", "training and certifications", "licenses",
      "courses", "professional training", "training",
    ],
  };

  // Normalize section names
  const normalize = value =>
    value.toLowerCase().replace(/[|:]/g, "").replace(/\s+/g, " ").trim();

  // Detect section 
  const getSectionType = line => {
    const normalized = normalize(line.replace(bulletRegex, ""));
    for (const [type, names] of Object.entries(sectionNames)) {
      if (names.includes(normalized)) return type;
    }
    return null;
  };

  // Extract sections
  const extractSections = () => {
    const sections = {
      education: [], skills: [], projects: [], experience: [], certifications: [],
    };
    let currentSection = null;

    rawLines.forEach(line => {
      const sectionType = getSectionType(line);
      if (sectionType) {
        currentSection = sectionType;
        return;
      }
      if (currentSection) sections[currentSection].push(line);
    });

    return sections;
  };

  const sections = extractSections();
  const containsAny = (value, words) => words.some(word => value.includes(word));
  const countMatches = (value, regex) => (value.match(regex) || []).length;
 const splitEntries = sectionLines => {
    if (!sectionLines.length) return [];

    const entries = [];
    let currentEntry = [];
    let prevWasBullet = false;

    sectionLines.forEach(line => {
      const isBullet = bulletRegex.test(line);

      if (!isBullet && prevWasBullet && currentEntry.length) {
        entries.push(currentEntry);
        currentEntry = [];
      }

      currentEntry.push(line);
      prevWasBullet = isBullet;
    });

    if (currentEntry.length) entries.push(currentEntry);
    return entries;
  };

  // ---------------------------------------------------------------
  // 4. Education (25)
  // ---------------------------------------------------------------
  const educationPatterns = [
    /\b(phd|ph\.d|doctorate|doctoral)\b/i,
    /\b(mphil|m\.phil)\b/i,
    /\b(master|master's|masters|msc|m\.sc|ms|m\.s|mba|ma|m\.a|mcom|m\.com|meng|m\.eng)\b/i,
    /\b(bachelor|bachelor's|bachelors|bsc|b\.sc|bs|b\.s|ba|b\.a|bba|bcom|b\.com|beng|b\.eng|be|b\.e|llb|mbbs|md|pharmd)\b/i,
    /\b(associate degree|associate's degree)\b/i,
    /\b(diploma|advanced diploma|higher diploma)\b/i,
  ];

  const educationMatches = educationPatterns.filter(pattern => pattern.test(cvText)).length;

  if (educationMatches >= 2) breakdown.education = 25;
  else if (educationMatches === 1) breakdown.education = 23;
  else if (/\b(education|qualification|academic background|degree)\b/i.test(cvText)) {
    breakdown.education = 10;
  }

  //  Skills (25) 
  const skills = [
    // Communication and Management
    "communication", "verbal communication", "written communication",
    "presentation", "public speaking", "negotiation", "interpersonal skills",
    "teamwork", "collaboration", "leadership", "problem solving",
    "critical thinking", "decision making", "time management", "organization",
    "adaptability", "project management", "project planning", "team management",
    "people management", "operations management", "business development",
    "business analysis", "strategic planning", "risk management",
    "budget management", "stakeholder management", "client management",
    "customer service", "customer relationship management",

    // Marketing and Sales
    "marketing", "digital marketing", "social media marketing",
    "content marketing", "market research", "sales", "sales management",
    "brand management", "seo", "search engine optimization", "advertising",

    // Human Resources
    "human resources", "recruitment", "talent acquisition", "employee relations",
    "performance management", "training and development", "payroll",

    // Finance and Accounting
    "accounting", "financial analysis", "financial reporting", "budgeting",
    "bookkeeping", "auditing", "taxation", "financial management",

    // IT and Software
    "programming", "software development", "web development",
    "database management", "data analysis", "data visualization",
    "data analytics", "machine learning", "artificial intelligence",
    "cyber security", "networking", "cloud computing", "system administration",
    "software testing", "api development", "devops", "data science",

    // Programming Technologies
    "javascript", "python", "java", "c++", "c#", "react", "node.js",
    "express.js", "sql", "mysql", "postgresql", "mongodb", "git", "github",

    // Engineering and Technical
    "engineering", "technical drawing", "autocad", "cad", "quality control",
    "quality assurance", "manufacturing", "production planning",
    "process improvement",

    // Teaching and Research
    "teaching", "lesson planning", "curriculum development",
    "classroom management", "training", "research",

    // Healthcare
    "patient care", "clinical skills", "healthcare management", "medical research",

    // Design and Creative
    "graphic design", "ui design", "ux design", "user experience",
    "visual design", "illustration", "video editing", "photography",
    "content creation", "figma", "adobe photoshop", "adobe illustrator",

    // Office and Professional
    "microsoft office", "microsoft excel", "microsoft word", "powerpoint",
    "documentation", "reporting",
  ];

  const skillCount = skills.filter(skill => text.includes(skill)).length;

  if (skillCount >= 5) breakdown.skills = 25;
  else if (skillCount >= 4) breakdown.skills = 20;
  else if (skillCount >= 3) breakdown.skills = 15;
  else if (skillCount >= 2) breakdown.skills = 10;
  else if (skillCount >= 1) breakdown.skills = 5;

  // 6. Projects (20)
  const projectTypes = [
    "project", "research", "study", "campaign", "initiative", "program", "system",
    "application", "app", "website", "platform", "portal", "dashboard", "software",
    "tool", "mobile", "web", "business plan", "business project", "business analysis",
    "market analysis", "marketing campaign", "marketing strategy", "financial analysis",
    "financial model", "accounting project", "engineering project", "design project",
    "manufacturing project", "production project", "academic project", "teaching project",
    "curriculum project", "research project", "case study", "research study",
    "design portfolio", "branding project", "creative project", "media project",
    "e-learning platform", "android application", "project management system",
  ];

  // Project-specific keywords (from chat)
  const projectKeywords = [
    "project", "final year project", "fyp", "capstone project",
    "academic project", "research project",
  ];

  const projectActions = [
    "developed", "built", "created", "designed", "implemented",
  ];

  const projectEntries = splitEntries(sections.projects || []);
  let validProjects = 0;
  const detectedProjectNames = new Set();

  projectEntries.forEach(entry => {
    const entryText = entry.join(" ").toLowerCase();
    const entryName = entry[0].replace(bulletRegex, "").toLowerCase(); // first line = title

    const hasProjectType = containsAny(entryText, projectTypes);
    const hasProjectKeyword = containsAny(entryText, projectKeywords);
    const hasAction = containsAny(entryText, projectActions);

    if (!(hasProjectType || hasProjectKeyword || hasAction)) return;

    // Avoid counting the same project twice
    if (!detectedProjectNames.has(entryName)) {
      detectedProjectNames.add(entryName);
      validProjects++;
    }
  });

  if (validProjects >= 2) {
    breakdown.projects = 20;
  } else if (validProjects === 1) {
    breakdown.projects = 15;
  } else {
    // Fallback: no proper Projects section, look in the whole CV
    const fallbackProjectEvidence = countMatches(
      text,
      /\b(project|final year project|fyp|capstone project|research project|academic project|business project|engineering project|design project|case study|application|website|system|software|platform|portal|dashboard|e-learning platform|android application|project management system)\b/gi
    );

    if (fallbackProjectEvidence >= 2) breakdown.projects = 20;
    else if (fallbackProjectEvidence === 1) breakdown.projects = 15;
  }
  // 7. Experience (20)
  const experienceRoles = [
    "manager", "management", "director", "supervisor", "coordinator", "administrator",
    "executive", "officer", "consultant", "specialist", "associate", "lead", "leader",
    "developer", "engineer", "analyst", "designer", "architect", "technician", "programmer",
    "sales executive", "sales representative", "marketing executive", "business development",
    "business analyst", "account executive",
    "hr", "human resources", "recruiter", "recruitment", "talent acquisition",
    "accountant", "auditor", "finance officer", "financial analyst", "bookkeeper",
    "teacher", "lecturer", "professor", "instructor", "trainer", "educator",
    "doctor", "physician", "nurse", "pharmacist", "therapist", "medical officer",
    "researcher", "research assistant",
    "assistant", "intern", "trainee", "apprentice", "staff", "employee",
  ];

  const experienceActions = [
    "managed", "developed", "coordinated", "supervised", "led", "implemented",
    "designed", "maintained", "handled", "organized", "responsible for", "worked on",
    "planned", "executed", "analyzed", "conducted", "created", "delivered", "supported",
    "improved", "increased", "reduced", "achieved", "trained", "taught", "researched",
    "prepared", "assisted", "internships",
  ];

  // Support experience dates and durations
  const datePattern =
    /\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:present|current|(?:19|20)\d{2})\b/i;
  const durationPattern =
    /\b\d+(?:\.\d+)?\+?\s*(?:year|years|month|months)\b/i;

  const experienceEntries = splitEntries(sections.experience);
  let validExperience = 0;

  experienceEntries.forEach(entry => {
    const entryText = entry.join(" ").toLowerCase();
    const hasRole = containsAny(entryText, experienceRoles);
    const hasAction = containsAny(entryText, experienceActions);
    const hasDate = datePattern.test(entryText);
    const hasDuration = durationPattern.test(entryText);

    if (
      (hasRole && hasDate) ||
      (hasRole && hasAction) ||
      (hasDate && hasAction) ||
      (hasRole && hasDuration)
    ) {
      validExperience++;
    }
  });

  if (validExperience >= 2) breakdown.experience = 20;
  else if (validExperience === 1) breakdown.experience = 15;
  else {
    // Fallback experience evidence
    const fallbackExperience = countMatches(
      text,
      /\b(internship|internships|employment|work experience|professional experience|career history|work history|experience)\b/gi
    );

    if (fallbackExperience >= 2) breakdown.experience = 15;
    else if (fallbackExperience >= 1) breakdown.experience = 10;
  }

// Certifications
  const certificationEvidence = [
    "certificate", "certification", "certified", "credential", "issued by",
    "credential id", "license", "licensed", "training", "course", "completed",
    "earned", "qualification",
  ];
  const certificationEntries = splitEntries(sections.certifications);
  let validCertifications = 0;

  certificationEntries.forEach(entry => {
    const entryText = entry.join(" ").toLowerCase();
    const hasCertificationWord = containsAny(entryText, certificationEvidence);
    const hasYear = /\b(?:19|20)\d{2}\b/.test(entryText);
    const hasIssuer =
      entryText.includes("issued by") ||
      entryText.includes("provider") ||
      entryText.includes("organization") ||
      entryText.includes("institute") ||
      entryText.includes("academy") ||
      entryText.includes("university");
    const hasDescription = entryText.length >= 15;

    if (
      hasCertificationWord &&
      (hasDescription || hasYear || hasIssuer)
    ) {
      validCertifications++;
    }
  });

  if (validCertifications >= 2) breakdown.certifications = 10;
  else if (validCertifications === 1) breakdown.certifications = 8;
  else {
    // Fallback certification evidence
    const fallbackCertification = countMatches(
      text,
      /\b(certificate|certification|certified|credential|license)\b/gi
    );

    if (fallbackCertification >= 3) breakdown.certifications = 8;
    else if (fallbackCertification >= 2) breakdown.certifications = 5;
    else if (fallbackCertification === 1) breakdown.certifications = 3;
  }
  // 9. Total score
  const totalScore =
    breakdown.education +
    breakdown.skills +
    breakdown.projects +
    breakdown.experience +
    breakdown.certifications;

  return { totalScore, breakdown };
};

module.exports = scoreCV;