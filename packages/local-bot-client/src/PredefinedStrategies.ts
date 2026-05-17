import { RuleSet } from "./RuleSet";

export const SmithyBMBot: RuleSet = {
  rules: [
    { name: "Province", conditions: "moneyInDeck > 15" },
    { name: "Duchy", conditions: "countInPile[Province] <= 4" },
    { name: "Estate", conditions: "countInPile[Province] <= 2" },
    { name: "Gold" },
    { name: "Duchy", conditions: "countInPile[Province] <= 6" },
    {
      name: "Smithy",
      conditions: "countInDeck[Smithy] < countTypeInDeck[Treasure] / 11",
    },
    { name: "Silver" },
  ],
  requiredCards: ["Smithy"],
};

export const MilitiaBMBot: RuleSet = {
  rules: [
    { name: "Province", conditions: "countInDeck[Gold] > 0" },
    { name: "Duchy", conditions: "countInPile[Province] <= 6" },
    { name: "Estate", conditions: "countInPile[Province] <= 2" },
    { name: "Gold" },
    { name: "Militia", conditions: "countInDeck[Militia] < 3" },
    { name: "Silver" },
  ],
  requiredCards: ["Militia"],
};
