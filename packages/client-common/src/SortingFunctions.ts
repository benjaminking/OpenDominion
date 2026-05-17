import {
  CardChoice,
  CardMetadata,
  CardType,
  Choice,
  ChoiceType,
  EffectChoice,
  MultiCardChoice,
  NamedChoice,
} from '@dominion/common';

import { CardGroup } from './CardGroup';

export interface CardGroupSortingFunction {
  order: (cardGroupA: CardGroup, cardGroupB: CardGroup) => number;
  getBoundOrderingFunction: () => (cardGroupA: CardGroup, cardGroupB: CardGroup) => number;
}

export class DefaultCardGroupSortingFunction implements CardGroupSortingFunction {
  public order(groupA: CardGroup, groupB: CardGroup): number {
    return cardGroupScore(groupA) - cardGroupScore(groupB);
  }

  public getBoundOrderingFunction(): (cardGroupA: CardGroup, cardGroupB: CardGroup) => number {
    return this.order.bind(this);
  }
}

export interface ChoiceSortingFunction {
  order: (choiceA: Choice, choiceB: Choice) => number;
  getBoundOrderingFunction: () => (choiceA: Choice, choiceB: Choice) => number;
}

export class DefaultChoiceSortingFunction implements ChoiceSortingFunction {
  public order(choiceA: Choice, choiceB: Choice): number {
    return choiceScore(choiceA) - choiceScore(choiceB);
  }

  public getBoundOrderingFunction(): (choiceA: Choice, choiceB: Choice) => number {
    return this.order.bind(this);
  }
}

export class SupplyChoiceSortingFunction implements ChoiceSortingFunction {
  public order(choiceA: Choice, choiceB: Choice): number {
    return choiceScore(choiceA, cardMetadataSupplyScore) - choiceScore(choiceB, cardMetadataSupplyScore);
  }

  public getBoundOrderingFunction(): (choiceA: Choice, choiceB: Choice) => number {
    return this.order.bind(this);
  }
}

function choiceScore(choice: Choice, cardScoringFunction = cardMetadataScore): number {
  const CHOICE_TYPE_WEIGHT = 50000;

  let val = 0;

  switch (choice.type) {
    case ChoiceType.Card: {
      val += cardScoringFunction((choice as CardChoice).card);
      break;
    }
    case ChoiceType.MultiCard: {
      val += cardScoringFunction((choice as MultiCardChoice).cards[0]);
      break;
    }
    case ChoiceType.ChooseOne: {
      val += nameScore((choice as NamedChoice).name);
      break;
    }
    case ChoiceType.Effect: {
      val += nameScore((choice as EffectChoice).effectName);
      break;
    }
    case ChoiceType.SimpleTreasures: {
      val += 10 * CHOICE_TYPE_WEIGHT;
      break;
    }
    case ChoiceType.EndActionPhase: {
      val += 20 * CHOICE_TYPE_WEIGHT;
      break;
    }
    case ChoiceType.EndTreasurePhase: {
      val += 40 * CHOICE_TYPE_WEIGHT;
      break;
    }
    case ChoiceType.EndBuyPhase: {
      val += 60 * CHOICE_TYPE_WEIGHT;
      break;
    }
    case ChoiceType.EndTurn: {
      val += 80 * CHOICE_TYPE_WEIGHT;
      break;
    }
    case ChoiceType.None: {
      val += 100 * CHOICE_TYPE_WEIGHT;
      break;
    }
  }
  return val;
}

function cardMetadataScore(cardMetadata: CardMetadata): number {
  const ACTION_VICTORY_WEIGHT = 20000;

  let val = 0;

  if (cardMetadata.types.includes(CardType.ACTION)) {
    val -= ACTION_VICTORY_WEIGHT;
  } else if (cardMetadata.types.includes(CardType.TREASURE)) {
    //
  } else {
    val += ACTION_VICTORY_WEIGHT;
  }
  val += reverseCostScore(cardMetadata.cost.coins);
  val += nameScore(cardMetadata.name) / 20000;
  return val;
}

function cardMetadataSupplyScore(cardMetadata: CardMetadata): number {
  const ACTION_VICTORY_WEIGHT = 20000;

  let val = 0;

  if (cardMetadata.types.includes(CardType.ACTION)) {
    val -= ACTION_VICTORY_WEIGHT;
  } else if (cardMetadata.types.includes(CardType.TREASURE)) {
    //
  } else {
    val += ACTION_VICTORY_WEIGHT;
  }
  val += costScore(cardMetadata.cost.coins);
  val += nameScore(cardMetadata.name) / 20000;
  return val;
}

function cardGroupScore(cardGroup: CardGroup): number {
  const ACTION_VICTORY_WEIGHT = 20000;

  let val = 0;
  if (cardGroup.hasType(CardType.ACTION)) {
    val -= ACTION_VICTORY_WEIGHT;
  } else if (cardGroup.hasType(CardType.TREASURE)) {
    //
  } else {
    val += ACTION_VICTORY_WEIGHT;
  }
  val += reverseCostScore(cardGroup.exemplar.cost.coins);
  val += nameScore(cardGroup.name) / 20000;
  return val;
}

function nameScore(name: string): number {
  const FIRST_LETTER_WEIGHT = 676;
  const SECOND_LETTER_WEIGHT = 26;

  let val = 0;
  val += FIRST_LETTER_WEIGHT * (name.charCodeAt(0) - 'k'.charCodeAt(0));
  val += SECOND_LETTER_WEIGHT * (name.charCodeAt(1) - 'k'.charCodeAt(0));
  val += name.charCodeAt(2) - 'k'.charCodeAt(0);
  return val;
}

function costScore(cost: number): number {
  return cost;
}

function reverseCostScore(cost: number): number {
  return 8 - cost;
}
