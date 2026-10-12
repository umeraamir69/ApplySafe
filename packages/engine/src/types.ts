export type RuleWeight = "hard" | "soft";

export type Rule = {
  id: string;
  weight: RuleWeight;
  family: string;
  source_url: string;
  patterns: string[];
  all_of: string[];
  suppress: string[];
};

export type Highlight = {
  span: string;
  rule_id: string;
  start: number;
  end: number;
};

export type Verdict = "scam" | "risky" | "unclear" | "looks_ok";

export type ScanResult = {
  verdict: Verdict;
  score: number;
  highlights: Highlight[];
  families: string[];
  confidence: "high" | "medium" | "low";
  rules: {
    hits: string[];
    score: number;
  };
  engine: "rules_v1";
  disclaimer: string;
};
