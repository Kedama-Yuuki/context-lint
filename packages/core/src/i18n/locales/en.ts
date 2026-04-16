export default {
  rules: {
    // M1: Contradiction
    "M1-001": {
      description: "Same token/variable name must not have different values across definitions",
      message: 'Conflicting values for "{{name}}": {{locations}}.',
    },
    "M1-002": {
      description: "Contradictory positive/negative constraints must not coexist",
      message: "Potential contradiction detected: line {{lineA}} vs line {{lineB}}.",
    },
    "M1-003": {
      description: "Referenced file paths must actually exist",
      message: 'File path or command "{{ref}}" at line {{line}} may not exist.',
    },

    // M2: Duplication
    "M2-001": {
      description: "Same content must not be duplicated across multiple sections",
      message: 'Section "{{sectionB}}" is {{similarity}}% similar to "{{sectionA}}" (line {{line}}). Consider consolidating.',
    },
    "M2-002": {
      description: "Same concept must not be referred to by multiple different names",
      message: '"{{nameB}}" may refer to the same concept as "{{nameA}}". Use a consistent name.',
    },

    // M3: Clarity
    "M3-001": {
      description: "Ambiguous words must not be used",
      message: 'Ambiguous word "{{word}}" found at line {{line}}. Be specific.',
    },
    "M3-002": {
      description: "Negative constraints should not be overused",
      message: "Excessive use of negative patterns ({{count}} occurrences). Prefer positive instructions.",
    },
    "M3-003": {
      description: "Values must have explicit units or types (e.g., 8px not 8)",
      message: 'Value "{{value}}" at line {{line}} has no unit or type.',
    },

    // M4: Lost in the Middle
    "M4-001": {
      description: "CRITICAL constraints must appear in the top 20% of the file",
      message: 'Critical constraint "{{keyword}}" found at line {{line}} (below top 20%). Move important constraints to the beginning.',
    },
    "M4-002": {
      description: "File token count must be within the recommended limit (8,000 tokens)",
      message: "File has ~{{count}} estimated tokens, exceeding the recommended limit of 8,000. Consider splitting.",
    },
    "M4-003": {
      description: "Important references should be consolidated in the opening section",
      message: "{{count}} file references found outside the top 20%, but none in the opening section. Add a reference summary at the top.",
    },
  },

  scorer: {
    ranks: {
      "AI-Ready": "AI-Ready",
      "Mostly Ready": "Mostly Ready (minor fixes recommended)",
      "Needs Work": "Needs Work (AI may rely on assumptions)",
      "Not AI-Ready": "Not AI-Ready (risk of AI misinterpretation)",
    },
  },

  reporter: {
    summary: "{{count}} problem(s) found",
    score: "Score: {{score}}/100 ({{rank}})",
    noIssues: "No issues found. Your file is AI-Ready!",
    filePath: "File: {{path}}",
  },
} as const;
