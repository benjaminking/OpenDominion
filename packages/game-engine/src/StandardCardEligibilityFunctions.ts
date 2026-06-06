import { CardLocation, CardType } from '@dominion/common';

import { Card } from './card/Card';
import { Cost } from './card/Cost';
import { CardEligibilityFunction } from './CardEligibilityFunction';

class AnyCard extends CardEligibilityFunction {
  public constructor() {
    super(() => true);
  }
}

const anyCard: CardEligibilityFunction = new AnyCard();

class NoCard extends CardEligibilityFunction {
  public constructor() {
    super(() => true);
  }
}

const noCard: CardEligibilityFunction = new NoCard();

class MatchesType extends CardEligibilityFunction {
  public constructor(type: CardType) {
    super((c: Card) => c.getTypes().has(type));
  }
}

const isActionCard: CardEligibilityFunction = new MatchesType(CardType.ACTION);
const isTreasureCard: CardEligibilityFunction = new MatchesType(CardType.TREASURE);
const isVictoryCard: CardEligibilityFunction = new MatchesType(CardType.VICTORY);
const isCurseCard: CardEligibilityFunction = new MatchesType(CardType.CURSE);
const isDurationCard: CardEligibilityFunction = new MatchesType(CardType.DURATION);

class IsSimpleTreasure extends CardEligibilityFunction {
  public constructor() {
    super((c: Card) => c.isSimpleTreasure());
  }
}

const isSimpleTreasure: CardEligibilityFunction = new IsSimpleTreasure();

class IsSupplyCard extends CardEligibilityFunction {
  public constructor() {
    super((c: Card) => c.isSupplyCard());
  }
}

const isSupplyCard: CardEligibilityFunction = new IsSupplyCard();

class CostsUpTo extends CardEligibilityFunction {
  public constructor(cost: Cost) {
    super((c: Card) => c.getCost().isLessThanOrEqualTo(cost));
  }
}

const costsUpTo = function (coins: Cost) {
  return new CostsUpTo(coins);
};

class CostsExactly extends CardEligibilityFunction {
  public constructor(cost: Cost) {
    super((c: Card) => c.getCost().isEqualTo(cost));
  }
}

const costsExactly = function (coins: Cost) {
  return new CostsExactly(coins);
};

class CostsTheSameAs extends CardEligibilityFunction {
  public constructor(otherCard: Card) {
    super((c: Card) => c.getCost().isEqualTo(otherCard.getCost()));
  }
}

const costsTheSameAs = function (otherCard: Card) {
  return new CostsTheSameAs(otherCard);
};

class CardNameIs extends CardEligibilityFunction {
  public constructor(cardName: string) {
    super((c: Card) => c.getName().toLowerCase() === cardName.toLowerCase());
  }
}

const cardNameIs = function (cardName: string) {
  return new CardNameIs(cardName);
};

class IsACopyOf extends CardEligibilityFunction {
  public constructor(card: Card) {
    super((c: Card) => c.getName().toLowerCase() === card.getName().toLowerCase());
  }
}

const isACopyOf = function (card: Card) {
  return new IsACopyOf(card);
};

class IsTheSameCardAs extends CardEligibilityFunction {
  public constructor(card: Card) {
    super((c: Card) => c.getId() === card.getId());
  }
}

const isTheSameCardAs = function (card: Card) {
  return new IsTheSameCardAs(card);
};

class Both extends CardEligibilityFunction {
  public constructor(func1: CardEligibilityFunction, func2: CardEligibilityFunction) {
    super((c: Card) => func1.matches(c) && func2.matches(c));
  }
}

const both = function (func1: CardEligibilityFunction, func2: CardEligibilityFunction) {
  return new Both(func1, func2);
};

class Either extends CardEligibilityFunction {
  public constructor(func1: CardEligibilityFunction, func2: CardEligibilityFunction) {
    super((c: Card) => func1.matches(c) || func2.matches(c));
  }
}

const either = function (func1: CardEligibilityFunction, func2: CardEligibilityFunction) {
  return new Either(func1, func2);
};

class Not extends CardEligibilityFunction {
  public constructor(func: CardEligibilityFunction) {
    super((c: Card) => !func.matches(c));
  }
}

const not = function (func: CardEligibilityFunction) {
  return new Not(func);
};

class IsInLocation extends CardEligibilityFunction {
  public constructor(location: CardLocation) {
    super((c: Card) => c.getLocation() === location);
  }
}

const isInLocation = function (location: CardLocation) {
  return new IsInLocation(location);
};

class CanBeDiscardedInCleanup extends CardEligibilityFunction {
  public constructor() {
    super((c: Card) => c.canBeDiscardedInCleanup());
  }
}

const canBeDiscardedInCleanup = new CanBeDiscardedInCleanup();

export {
  anyCard,
  both,
  canBeDiscardedInCleanup,
  cardNameIs,
  costsExactly,
  costsTheSameAs,
  costsUpTo,
  either,
  isACopyOf,
  isActionCard,
  isCurseCard,
  isDurationCard,
  isInLocation,
  isSimpleTreasure,
  isSupplyCard,
  isTheSameCardAs,
  isTreasureCard,
  isVictoryCard,
  noCard,
  not,
};
