const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function normalizeDesignations(designations) {
  if (!designations || designations.length === 0) {
    return {};
  }

  const prompt = `
You are an expert recruitment data normalization system.

Your task is to convert raw candidate job titles into
SEARCH-FRIENDLY STANDARDIZED DESIGNATIONS.

The purpose is to make the dataset easier for recruiters to:
- search candidates
- filter candidates
- group similar candidates
- match candidates to job requirements

The standardized designation should group genuinely related
job titles, but MUST NOT become so broad that different
functions are incorrectly merged.

==================================================
MOST IMPORTANT PRINCIPLE
==================================================

BALANCE GENERALIZATION AND SPECIFICITY.

Group titles when they represent the same or very closely
related recruitment function.

However, DO NOT force every designation into a broad category
such as:

Operations
Management
Business
Administration
Sales
Other

unless that is genuinely the role's function.

The standardized designation should be the most useful
SEARCH CATEGORY for that role.

==================================================
EXAMPLES OF CORRECT GENERALIZATION
==================================================

Senior Area Sales Manager
-> Sales

Area Sales Manager
-> Sales

Regional Sales Manager
-> Sales

Zonal Sales Manager
-> Sales

Assistant Sales Manager
-> Sales

Senior Sales Executive
-> Sales

Sales Executive
-> Sales

Sales Officer
-> Sales

Sales Representative
-> Sales


Relationship Officer
-> Relationship Management

Senior Relationship Officer
-> Relationship Management

Relationship Executive
-> Relationship Management

Relationship Manager
-> Relationship Management

Senior Relationship Manager
-> Relationship Management

Assistant Relationship Manager
-> Relationship Management

Client Relationship Manager
-> Relationship Management

Customer Relationship Manager
-> Relationship Management


==================================================
TRAVEL / TOURISM
==================================================

Travel roles should remain under a specific Travel category.

Travel Executive
-> Travel

Senior Travel Executive
-> Travel

Corporate Travel Executive
-> Travel

Travel Consultant
-> Travel

Senior Travel Consultant
-> Travel

Travel Coordinator
-> Travel

Travel Agent
-> Travel

Corporate Travel Consultant
-> Travel

DO NOT convert Travel Consultant into "Consulting".

The word "Consultant" does not automatically mean the
Consulting job family.

The actual function is Travel.


==================================================
TICKETING
==================================================

Ticketing roles should remain separate from generic Operations.

Ticketing Associate
-> Ticketing

Ticketing Executive
-> Ticketing

Senior Ticketing Executive
-> Ticketing

Ticketing Agent
-> Ticketing

Air Ticketing Executive
-> Ticketing

Flight Ticketing Executive
-> Ticketing

DO NOT convert Ticketing roles into Operations.


==================================================
OPERATIONS
==================================================

Use Operations only when the actual role is primarily
an operations role.

Operations Executive
-> Operations

Senior Operations Executive
-> Operations

Operations Manager
-> Operations

Operations Coordinator
-> Operations

Operations Head
-> Operations

DO NOT classify Travel, Ticketing, Logistics or Procurement
roles as Operations merely because they involve operational work.


==================================================
LOGISTICS
==================================================

Logistics roles should remain under Logistics.

Logistics Executive
-> Logistics

Senior Logistics Executive
-> Logistics

Logistics Manager
-> Logistics

Logistics Coordinator
-> Logistics

Warehouse Executive
-> Logistics

Warehouse Manager
-> Logistics


==================================================
PROCUREMENT
==================================================

Procurement roles should remain under Procurement.

Procurement Executive
-> Procurement

Procurement Manager
-> Procurement

Purchase Executive
-> Procurement

Purchase Manager
-> Procurement

Purchasing Executive
-> Procurement


==================================================
ACCOUNT / CLIENT MANAGEMENT
==================================================

Account-management roles should be grouped together.

Account Executive
-> Account Management

Senior Account Executive
-> Account Management

Account Manager
-> Account Management

Key Account Manager
-> Account Management

Senior Account Manager
-> Account Management

Key Account Executive
-> Account Management

Client Account Manager
-> Account Management


IMPORTANT:

Do NOT confuse Account Management with Accounting.

Accountant
-> Accounting & Finance

Accounts Executive
-> Accounting & Finance

Senior Accounts Officer
-> Accounting & Finance

Accounts Officer
-> Accounting & Finance

Accounting Executive
-> Accounting & Finance


==================================================
ACCOUNTING & FINANCE
==================================================

Accounting roles:

Accountant
-> Accounting & Finance

Senior Accountant
-> Accounting & Finance

Accounts Executive
-> Accounting & Finance

Accounts Officer
-> Accounting & Finance

Senior Accounts Officer (AP)
-> Accounting & Finance

Accounts Assistant
-> Accounting & Finance

Accounting Executive
-> Accounting & Finance


==================================================
FINANCE
==================================================

Finance-specific roles should remain Finance.

Finance Executive
-> Finance

Finance Manager
-> Finance

Senior Finance Manager
-> Finance

Financial Analyst
-> Finance

Senior Financial Analyst
-> Finance

Investment Analyst
-> Finance

Financial Controller
-> Finance


==================================================
CONSULTING
==================================================

Use Consulting when the role is genuinely a consulting role.

Consultant
-> Consulting

Senior Consultant
-> Consulting

Management Consultant
-> Consulting

Business Consultant
-> Consulting

Strategy Consultant
-> Consulting

IT Consultant
-> Consulting


IMPORTANT:

Do NOT classify a role as Consulting simply because its title
contains the word "Consultant".

Example:

Travel Consultant
-> Travel

Recruitment Consultant
-> Human Resources

Sales Consultant
-> Sales

The actual functional area takes priority.


==================================================
MARKETING
==================================================

Marketing Executive
-> Marketing

Senior Marketing Executive
-> Marketing

Digital Marketing Executive
-> Marketing

Digital Marketing Manager
-> Marketing

Marketing Manager
-> Marketing

Assistant Marketing Manager
-> Marketing

Brand Manager
-> Marketing


==================================================
BUSINESS DEVELOPMENT
==================================================

Business Development Executive
-> Business Development

Senior Business Development Executive
-> Business Development

Business Development Manager
-> Business Development

Assistant Business Development Manager
-> Business Development

Regional Business Development Manager
-> Business Development

Business Development Head
-> Business Development


==================================================
HUMAN RESOURCES
==================================================

HR Executive
-> Human Resources

Senior HR Executive
-> Human Resources

HR Manager
-> Human Resources

Assistant HR Manager
-> Human Resources

HR Head
-> Human Resources

Recruitment Executive
-> Human Resources

Recruitment Manager
-> Human Resources

Talent Acquisition Executive
-> Human Resources

Talent Acquisition Manager
-> Human Resources

Recruitment Consultant
-> Human Resources


==================================================
INFORMATION TECHNOLOGY
==================================================

Software Engineer
-> Information Technology

Software Developer
-> Information Technology

Developer
-> Information Technology

IT Executive
-> Information Technology

IT Manager
-> Information Technology

System Administrator
-> Information Technology

Network Engineer
-> Information Technology

Technical Support Engineer
-> Information Technology


==================================================
TERRITORY MANAGEMENT
==================================================

Territory Manager is a recognized role.

Territory Manager
-> Territory Management

Senior Territory Manager
-> Territory Management

Assistant Territory Manager
-> Territory Management


==================================================
GENERIC BUT VALID DESIGNATIONS
==================================================

A designation can be generic but still be a legitimate job title.

DO NOT return "Other" simply because the title does not
provide enough information to identify a specific industry.

Examples:

Associate
-> Associate

Sr. Associate
-> Associate

Senior Associate
-> Associate

Junior Associate
-> Associate

Assistant
-> Assistant

Executive
-> Executive

Senior Executive
-> Executive

Officer
-> Officer

Senior Officer
-> Officer

Coordinator
-> Coordinator

Senior Coordinator
-> Coordinator

Supervisor
-> Supervisor

Senior Supervisor
-> Supervisor

Analyst
-> Analyst

Senior Analyst
-> Analyst

Specialist
-> Specialist

Senior Specialist
-> Specialist

These are valid standardized designations.


==================================================
SENIORITY RULE
==================================================

Normally remove seniority modifiers when they do not represent
a different functional family.

Examples:

Senior Sales Executive
-> Sales

Senior Area Sales Manager
-> Sales

Assistant Sales Manager
-> Sales

Senior Consultant
-> Consulting

Senior Relationship Manager
-> Relationship Management

Senior Associate
-> Associate

Sr. Associate
-> Associate

Junior Analyst
-> Analyst


==================================================
GEOGRAPHIC / SCOPE MODIFIERS
==================================================

Normally ignore:

Area
Regional
Zonal
National
Local

when they only describe the scope of the same function.

Examples:

Area Sales Manager
-> Sales

Regional Sales Manager
-> Sales

Zonal Sales Manager
-> Sales

National Sales Manager
-> Sales


However, do NOT blindly remove words that form part of
a recognized functional role.

Example:

Territory Manager
-> Territory Management


==================================================
DO NOT OVER-GENERALIZE
==================================================

This is extremely important.

Do NOT do this:

Travel Executive
-> Operations

Travel Consultant
-> Consulting

Ticketing Associate
-> Operations

Logistics Executive
-> Operations

Procurement Executive
-> Operations

Marketing Executive
-> Business

Accountant
-> Account Management


Instead:

Travel Executive
-> Travel

Travel Consultant
-> Travel

Ticketing Associate
-> Ticketing

Logistics Executive
-> Logistics

Procurement Executive
-> Procurement

Marketing Executive
-> Marketing

Accountant
-> Accounting & Finance


==================================================
DO NOT OVER-SPLIT
==================================================

Do not create unnecessary categories for small variations.

For example:

Senior Area Sales Manager
Area Sales Manager
Regional Sales Manager
Assistant Sales Manager
Sales Executive
Sales Officer
Sales Representative

should all become:

Sales


Similarly:

Relationship Officer
Relationship Executive
Relationship Manager
Senior Relationship Manager
Assistant Relationship Manager

should all become:

Relationship Management


==================================================
INVALID DESIGNATIONS
==================================================

Use "Other" ONLY when the value is clearly NOT a usable
job designation.

Examples:

"kridha laminate Pvt Ltd"
-> Other

"Brunel"
-> Other

"New Delhi"
-> Other

Random corrupted text
-> Other

A company name
-> Other

A location
-> Other

An unintelligible value
-> Other


IMPORTANT:

Do NOT use "Other" merely because a designation is generic.

For example:

Sr. Associate
-> Associate

Associate
-> Associate

Executive
-> Executive

Officer
-> Officer

Analyst
-> Analyst


==================================================
FUNCTION HAS PRIORITY
==================================================

When a title contains multiple words, identify the actual
functional role before assigning the category.

Examples:

Travel Consultant
-> Travel

Sales Consultant
-> Sales

Recruitment Consultant
-> Human Resources

Financial Analyst
-> Finance

Ticketing Associate
-> Ticketing

Travel Executive
-> Travel

Accounts Executive
-> Accounting & Finance

Marketing Executive
-> Marketing

HR Executive
-> Human Resources


==================================================
CONTEXT
==================================================

If a designation is ambiguous, use the available designation
itself and the other designations in the dataset to maintain
consistent classification.

Do not invent an unrelated job function.

If a generic title such as "Associate" cannot be made more
specific, preserve it as:

Associate

Do NOT return:

Other


==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Use exactly this format:

{
  "mapping": {
    "EXACT ORIGINAL DESIGNATION": "STANDARDIZED DESIGNATION"
  }
}

The key MUST exactly match the original designation provided.

Return exactly ONE mapping for EVERY designation provided.

Here are the designations:

${JSON.stringify(designations, null, 2)}
`;

  try {
    console.log("\n========== SENDING TO GEMINI ==========");
    console.log(
      `Normalizing ${designations.length} unique designations`
    );
    console.log(JSON.stringify(designations, null, 2));
    console.log("=======================================\n");

    const response = await ai.models.generateContent({
      model:
        process.env.GEMINI_MODEL ||
        "gemini-3.5-flash-lite",

      contents: prompt,

      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 4000,
      },
    });

    console.log("\n========== GEMINI RESPONSE ==========");
    console.log(response.text);
    console.log("=====================================\n");

    const result = JSON.parse(response.text);

    const rawMapping = result.mapping || {};

    console.log("\n========== RAW MAPPING ==========");
    console.log(
      JSON.stringify(rawMapping, null, 2)
    );
    console.log("=================================\n");

    // Normalize mapping keys for reliable matching
    const normalizedMapping = {};

    Object.entries(rawMapping).forEach(
      ([original, standardized]) => {
        if (!original) return;

        normalizedMapping[
          original.trim().toLowerCase()
        ] = standardized;
      }
    );

    // Build final mapping using the ORIGINAL
    // designation as the exact key.
    const finalMapping = {};

    designations.forEach((designation) => {
      const original = designation.trim();

      const standardized =
        normalizedMapping[
          original.toLowerCase()
        ];

      finalMapping[original] =
        standardized &&
        typeof standardized === "string"
          ? standardized.trim()
          : original || "Other";
    });

    console.log(
      "\n========== FINAL MAPPING =========="
    );

    console.log(
      JSON.stringify(finalMapping, null, 2)
    );

    console.log(
      "===================================\n"
    );

    return finalMapping;

  } catch (error) {
    console.error(
      "\nGemini designation normalization error:",
      error
    );

    // Safe fallback:
    // preserve the original designation rather
    // than modifying any candidate data.
    const fallbackMapping = {};

    designations.forEach((designation) => {
      const original = designation.trim();

      fallbackMapping[original] =
        original || "Other";
    });

    return fallbackMapping;
  }
}

module.exports = {
  normalizeDesignations,
};