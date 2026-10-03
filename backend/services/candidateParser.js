function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}


/*
 * Detect the beginning of each Naukri candidate.
 *
 * Normal candidate:
 *
 * Name
 * Experience
 * Salary
 * Location
 *
 * Example:
 *
 * Alka Singh
 * 4y 8m
 * ₹ 4 Lacs
 * Pune
 *
 *
 * Fresher candidate:
 *
 * Name
 * Fresher
 * Location
 * Education
 *
 * Example:
 *
 * DIYA DOSHI
 * Fresher
 * New Delhi
 * Education
 */
function findCandidateStarts(lines) {
  const starts = [];

  for (let i = 0; i < lines.length - 3; i++) {
    const name = lines[i].trim();
    const secondLine = lines[i + 1].trim();
    const thirdLine = lines[i + 2].trim();
    const fourthLine = lines[i + 3]?.trim() || "";

    /*
     * Make sure this line looks like a candidate name.
     */
    const looksLikeName =
      name.length > 2 &&
      !/^(Current|Previous|Education|Pref\.? locations?|Key skills|May also know|candidate (default )?profile)$/i.test(
        name
      );

    if (!looksLikeName) {
      continue;
    }

    /*
     * ----------------------------------------
     * NORMAL CANDIDATE
     * ----------------------------------------
     *
     * Name
     * Experience
     * Salary
     * Location
     */

    const looksLikeExperience =
      /^\d+\s*y(?:\s*\d+\s*m)?$/i.test(secondLine);

    const looksLikeSalary =
      /^₹\s*[\d,.]+(?:\s*(?:Lacs?|Lakhs?|Cr))?$/i.test(
        thirdLine
      );

    if (
      looksLikeExperience &&
      looksLikeSalary &&
      fourthLine.length > 1
    ) {
      starts.push(i);
      continue;
    }

    /*
     * ----------------------------------------
     * FRESHER CANDIDATE
     * ----------------------------------------
     *
     * Name
     * Fresher
     * Location
     * Education
     */

    const isFresher =
      /^fresher$/i.test(secondLine);

    const looksLikeLocation =
      thirdLine.length > 1 &&
      !/^(Current|Previous|Education|Pref\.? locations?|Key skills|May also know|candidate (default )?profile)$/i.test(
        thirdLine
      );

    const nextIsEducation =
      /^education$/i.test(fourthLine);

    if (
      isFresher &&
      looksLikeLocation &&
      nextIsEducation
    ) {
      starts.push(i);
    }
  }

  return starts;
}


/*
 * Split the entire Naukri text
 * into individual candidate blocks.
 */
function splitCandidates(text) {
  const cleanedText = cleanText(text);

  if (!cleanedText) {
    return [];
  }

  const lines = cleanedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const starts = findCandidateStarts(lines);

  const candidates = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];

    const end =
      i + 1 < starts.length
        ? starts[i + 1]
        : lines.length;

    const candidateLines = lines.slice(start, end);

    candidates.push(candidateLines);
  }

  return candidates;
}


/*
 * Parse basic candidate information.
 *
 * Normal candidate:
 *
 * Name
 * Experience
 * Salary
 * Location
 *
 *
 * Fresher:
 *
 * Name
 * Fresher
 * Location
 * Education
 */
function parseBasicInfo(lines) {
  const name = lines[0] || null;
  const secondLine = lines[1] || null;
  const thirdLine = lines[2] || null;
  const fourthLine = lines[3] || null;

  /*
   * Fresher candidate
   */
  if (/^fresher$/i.test(secondLine || "")) {
    return {
      name,
      experience: "Fresher",
      current_salary: null,
      location: thirdLine || null,
    };
  }

  /*
   * Normal candidate
   */
  return {
    name,
    experience: secondLine || null,
    current_salary: thirdLine || null,
    location: fourthLine || null,
  };
}


/*
 * Find the line index of a section label.
 */
function findSection(lines, sectionName) {
  return lines.findIndex(
    (line) =>
      line.toLowerCase().trim() ===
      sectionName.toLowerCase()
  );
}


/*
 * Parse the Current section.
 *
 * Example:
 *
 * Current
 * Travel Executive at Cheers Travel
 */
function parseCurrent(lines) {
  const index = findSection(lines, "Current");

  if (index === -1 || !lines[index + 1]) {
    return {
      current_designation: null,
      current_company: null,
    };
  }

  const value = lines[index + 1];

  const parts = value.split(/\s+at\s+/i);

  return {
    current_designation:
      parts[0]?.trim() || null,

    current_company:
      parts.slice(1).join(" at ").trim() || null,
  };
}


/*
 * Parse the Previous section.
 */
function parsePrevious(lines) {
  const index = findSection(lines, "Previous");

  if (index === -1 || !lines[index + 1]) {
    return {
      previous_designation: null,
      previous_company: null,
    };
  }

  const value = lines[index + 1];

  const parts = value.split(/\s+at\s+/i);

  return {
    previous_designation:
      parts[0]?.trim() || null,

    previous_company:
      parts.slice(1).join(" at ").trim() || null,
  };
}


/*
 * Parse Education.
 */
function parseEducation(lines) {
  const index = findSection(lines, "Education");

  if (index === -1 || !lines[index + 1]) {
    return null;
  }

  return lines[index + 1];
}


/*
 * Parse Preferred Locations.
 *
 * Example:
 *
 * Pref. locations
 * Delhi / NCR,
 * Remote,
 * Pune
 */
function parsePreferredLocations(lines) {
  const index = lines.findIndex(
    (line) =>
      line
        .toLowerCase()
        .startsWith("pref. location")
  );

  if (index === -1) {
    return [];
  }

  const locations = [];

  for (
    let i = index + 1;
    i < lines.length;
    i++
  ) {
    const line = lines[i];

    /*
     * Stop when the next major section begins.
     */
    if (
      [
        "Key skills",
        "May also know",
        "candidate profile",
        "candidate default profile",
        "Current",
        "Previous",
        "Education",
      ].includes(line)
    ) {
      break;
    }

    const cleaned = line
      .replace(/\+\s*.*more/i, "")
      .replace(/,$/, "")
      .trim();

    if (cleaned) {
      locations.push(cleaned);
    }
  }

  return locations;
}


/*
 * Parse Key Skills.
 */
function parseKeySkills(lines) {
  const index = findSection(
    lines,
    "Key skills"
  );

  if (index === -1) {
    return [];
  }

  const skills = [];

  for (
    let i = index + 1;
    i < lines.length;
    i++
  ) {
    const line = lines[i];

    if (
      line === "May also know" ||
      line === "candidate profile" ||
      line === "candidate default profile"
    ) {
      break;
    }

    const parts = line
      .split("|")
      .map((skill) => skill.trim())
      .filter(Boolean);

    skills.push(...parts);
  }

  return skills;
}


/*
 * Parse "May also know" skills.
 */
function parseAdditionalSkills(lines) {
  const index = findSection(
    lines,
    "May also know"
  );

  if (index === -1) {
    return [];
  }

  const skills = [];

  for (
    let i = index + 1;
    i < lines.length;
    i++
  ) {
    const line = lines[i];

    if (
      line === "candidate profile" ||
      line === "candidate default profile"
    ) {
      break;
    }

    const parts = line
      .split("|")
      .map((skill) => skill.trim())
      .filter(Boolean);

    skills.push(...parts);
  }

  return skills;
}


/*
 * Parse candidate profile.
 *
 * Supports both:
 *
 * candidate profile
 *
 * and
 *
 * candidate default profile
 */
function parseProfile(lines) {
  let index = findSection(
    lines,
    "candidate profile"
  );

  if (index === -1) {
    index = findSection(
      lines,
      "candidate default profile"
    );
  }

  if (
    index === -1 ||
    !lines[index + 1]
  ) {
    return null;
  }

  return lines[index + 1];
}


/*
 * Find Indian mobile number.
 */
function parsePhone(lines) {
  for (const line of lines) {
    const match = line.match(
      /\b[6-9]\d{9}\b/
    );

    if (match) {
      return match[0];
    }
  }

  return null;
}


/*
 * Parse one complete candidate.
 */
function parseCandidate(lines) {
  const basic =
    parseBasicInfo(lines);

  const current =
    parseCurrent(lines);

  const previous =
    parsePrevious(lines);

  return {
    ...basic,

    ...current,

    ...previous,

    education:
      parseEducation(lines),

    preferred_locations:
      parsePreferredLocations(lines),

    key_skills:
      parseKeySkills(lines),

    additional_skills:
      parseAdditionalSkills(lines),

    profile:
      parseProfile(lines),

    phone:
      parsePhone(lines),
  };
}


/*
 * Export functions.
 */
module.exports = {
  cleanText,
  splitCandidates,
  parseCandidate,
};