import { Rule } from "./Rule";

export interface RuleSet {
  rules: Rule[];
  requiredCards: string[];
}
