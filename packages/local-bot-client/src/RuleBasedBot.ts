import { ClientGameState } from '@dominion/client-common';
import {
  CardChoice,
  CardMetadata,
  ChoiceType,
  EndActionPhaseChoice,
  EndBuyPhaseChoice,
  EndTreasurePhaseChoice,
  SimpleTreasuresChoice,
} from '@dominion/common';

import {
  attacks,
  cantrips,
  discardingTreasures,
  doublers,
  doublingTreasures,
  drawToX,
  gainers,
  nonTerminalDraw,
  nonTerminalMoney,
  otherNonTerminals,
  remodelers,
  ruins,
  sifters,
  terminalDraw,
  terminalMoney,
  trashFromDeck,
  trashFromHand,
  trashingTreasures,
  treasureCoins,
  villages,
} from './CardHeuristics';
import { ParsedRule } from './ParsedRule';
import { RuleBasedStrategy } from './RuleBasedStrategy';
import { RuleParser } from './RuleParser';
import { RuleSet } from './RuleSet';

export class RuleBasedBot {
  private gameState: ClientGameState | undefined;
  private chosenStrategy: RuleBasedStrategy;
  private _requiredCardNames: string[] = [];

  public constructor(rules: RuleSet) {
    this.chosenStrategy = this.parseRules(rules);
    this._requiredCardNames = rules.requiredCards;
  }

  public useGameState(gameState: ClientGameState): void {
    this.gameState = gameState;
  }

  private parseRules(rules: RuleSet): RuleBasedStrategy {
    const strategy: RuleBasedStrategy = new RuleBasedStrategy();

    const ruleParser: RuleParser = new RuleParser();
    for (const rule of rules.rules) {
      const parsedRule: ParsedRule = ruleParser.parseRule(rule);
      strategy.addRule(parsedRule);
    }

    return strategy;
  }

  public chooseActionCardToPlay(options: CardChoice[]): CardChoice | EndActionPhaseChoice {
    let bestChoice: CardChoice | EndActionPhaseChoice = {
      type: ChoiceType.EndActionPhase,
    };
    let bestScore = -100;
    for (const cardOption of options) {
      let score = 0;

      score += 1 * this.getHeuristicScore(cardOption.card, terminalMoney);
      score += 2 * this.getHeuristicScore(cardOption.card, gainers);
      score += 4 * this.getHeuristicScore(cardOption.card, remodelers);
      score += 8 * this.getHeuristicScore(cardOption.card, trashFromHand);
      score += 8 * this.getHeuristicScore(cardOption.card, trashFromDeck);
      score += 16 * this.getHeuristicScore(cardOption.card, attacks);
      score += 32 * this.getHeuristicScore(cardOption.card, terminalDraw);
      score += 64 * this.getHeuristicScore(cardOption.card, sifters);
      score += 128 * this.getHeuristicScore(cardOption.card, nonTerminalDraw);
      score += 256 * this.getHeuristicScore(cardOption.card, drawToX);
      score += 512 * this.getHeuristicScore(cardOption.card, otherNonTerminals);
      score += 1024 * this.getHeuristicScore(cardOption.card, nonTerminalMoney);
      score += 2048 * this.getHeuristicScore(cardOption.card, cantrips);
      score += 4096 * this.getHeuristicScore(cardOption.card, villages);
      score += 8192 * this.getHeuristicScore(cardOption.card, doublers);
      score -= 10000 * this.getHeuristicScore(cardOption.card, ruins); // don't play ruins

      /*if(this.botName === 'SleighTreasureTroveBot' && v.getName() === 'sleigh' && this.gameLogic.numMatchingCardsInCollection(this._getGameState().hand, function(card) {
                                                                                                                                return card.getName() === 'treasure_trove';
                                                                                                                            })) {
                score -= 1000;
            }*/

      if (score > bestScore) {
        bestScore = score;
        bestChoice = cardOption;
      }
    }

    return bestChoice;
  }

  public chooseTreasureCardToPlay(
    options: CardChoice[],
    simpleTreasuresOption: SimpleTreasuresChoice | undefined,
  ): CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice {
    let bestChoice: CardChoice | EndTreasurePhaseChoice = { type: ChoiceType.EndTreasurePhase };
    let bestScore = 0;

    for (const option of options) {
      const cardOption: CardChoice = option;

      let score = 0;

      score += 1 * this.getHeuristicScore(cardOption.card, discardingTreasures);
      score += 2 * this.getHeuristicScore(cardOption.card, trashingTreasures);
      score += 4 * this.getHeuristicScore(cardOption.card, doublingTreasures);

      if (score > bestScore) {
        bestScore = score;
        bestChoice = cardOption;
      }
    }

    if (bestChoice.type === ChoiceType.Card) {
      return bestChoice;
    }

    if (simpleTreasuresOption !== undefined && simpleTreasuresOption.coins > 0) {
      return simpleTreasuresOption;
    }

    bestScore = -100;
    for (const option of options) {
      const cardOption: CardChoice = option;
      let score = 0;

      score = this.getHeuristicScore(cardOption.card, treasureCoins);
      if (cardOption.card.name === 'cursed_gold') {
        score -= 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestChoice = cardOption;
      }
    }

    return bestChoice;
  }

  private getHeuristicScore(v: CardMetadata, heuristic: Map<string, number>): number {
    if (heuristic.has(v.name)) {
      return heuristic.get(v.name)!;
    }
    return 0;
  }

  public makeBuyPhaseChoice(
    options: CardChoice[],
    _numBuys: number,
    _numCoins: number,
  ): CardChoice | EndBuyPhaseChoice {
    const choice: CardChoice | undefined = this.chosenStrategy.getFirstApplicableRule(this.gameState!, options);

    if (choice !== undefined) {
      return choice;
    }
    return {
      type: ChoiceType.EndBuyPhase,
    };
  }

  public get requiredCardNames(): string[] {
    return this._requiredCardNames;
  }
}
