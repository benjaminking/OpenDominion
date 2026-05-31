import { CardLocation, CardType, Expansion } from '@dominion/common';

import { Card } from './card/Card';
import { CardCollection } from './card/CardCollection';
import { Cost } from './card/Cost';
import { KingdomCard } from './card/KingdomCard';
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
const isAttackCard: CardEligibilityFunction = new MatchesType(CardType.ATTACK);
const isCommandCard: CardEligibilityFunction = new MatchesType(CardType.COMMAND);
const isKnightCard: CardEligibilityFunction = new MatchesType(CardType.KNIGHT);
const isRuinsCard: CardEligibilityFunction = new MatchesType(CardType.RUINS);
const isShelterCard: CardEligibilityFunction = new MatchesType(CardType.SHELTER);
const isTreasureCard: CardEligibilityFunction = new MatchesType(CardType.TREASURE);
const isVictoryCard: CardEligibilityFunction = new MatchesType(CardType.VICTORY);
const isCurseCard: CardEligibilityFunction = new MatchesType(CardType.CURSE);
const isDurationCard: CardEligibilityFunction = new MatchesType(CardType.DURATION);
const isRewardCard: CardEligibilityFunction = new MatchesType(CardType.REWARD);

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

class IsFromExpansion extends CardEligibilityFunction {
  public constructor(expansion: Expansion) {
    super((c: Card) => c instanceof KingdomCard && c.isFromExpansion(expansion));
  }
}

class IsKingdomCard extends CardEligibilityFunction {
  public constructor() {
    super((c: Card) => c instanceof KingdomCard);
  }
}

const isKingdomCard: CardEligibilityFunction = new IsKingdomCard();

const isFromExpansion = function (expansion: Expansion) {
  return new IsFromExpansion(expansion);
};

class CostsUpTo extends CardEligibilityFunction {
  public constructor(cost: Cost) {
    super((c: Card) => c.getCost().isLessThanOrEqualTo(cost));
  }
}

const costsUpTo = function (coins: Cost) {
  return new CostsUpTo(coins);
};

class CostsAtLeast extends CardEligibilityFunction {
  public constructor(cost: Cost) {
    super((c: Card) => cost.isLessThanOrEqualTo(c.getCost()));
  }
}

const costsAtLeast = function (coins: Cost) {
  return new CostsAtLeast(coins);
};

class CostsLessThan extends CardEligibilityFunction {
  public constructor(cost: Cost) {
    super((c: Card) => c.getCost().isLessThan(cost));
  }
}

const costsLessThan = function (coins: Cost) {
  return new CostsLessThan(coins);
};

class CostsLessThanCard extends CardEligibilityFunction {
  public constructor(otherCard: Card) {
    super((c: Card) => c.getCost().isLessThan(otherCard.getCost()));
  }
}

const costsLessThanCard = function (otherCard: Card) {
  return new CostsLessThanCard(otherCard);
};

class CostsAtLeast extends CardEligibilityFunction {
  public constructor(cost: Cost) {
    super((c: Card) => cost.isLessThanOrEqualTo(c.getCost()));
  }
}

const costsAtLeast = function (coins: Cost) {
  return new CostsAtLeast(coins);
};

class CostsExactly extends CardEligibilityFunction {
  public constructor(cost: Cost) {
    super((c: Card) => c.getCost().isEqualTo(cost));
  }
}

const costsExactly = function (coins: Cost) {
  return new CostsExactly(coins);
};

class CostsTheSameAsCard extends CardEligibilityFunction {
  public constructor(otherCard: Card) {
    super((c: Card) => c.getCost().isEqualTo(otherCard.getCost()));
  }
}

const costsTheSameAsCard = function (otherCard: Card) {
  return new CostsTheSameAsCard(otherCard);
};

class CostsTheSameOrLessThanCard extends CardEligibilityFunction {
  public constructor(otherCard: Card) {
    super((c: Card) => c.getCost().isLessThanOrEqualTo(otherCard.getCost()));
  }
}

const costsTheSameOrLessThanCard = function (otherCard: Card) {
  return new CostsTheSameOrLessThanCard(otherCard);
};

class CostsExactlyNMoreThanCard extends CardEligibilityFunction {
  public constructor(otherCard: Card, n: number) {
    super((c: Card) => c.getCost().isEqualTo(otherCard.getCost().plus(n)));
  }
}

const costsExactlyNMoreThanCard = function (otherCard: Card, n: number) {
  return new CostsExactlyNMoreThanCard(otherCard, n);
};

class CostsUpToNMoreThanCard extends CardEligibilityFunction {
  public constructor(otherCard: Card, n: number) {
    super((c: Card) => c.getCost().isLessThanOrEqualTo(otherCard.getCost().plus(n)));
  }
}

const costsUpToNMoreThanCard = function (otherCard: Card, n: number) {
  return new CostsUpToNMoreThanCard(otherCard, n);
};

class CostsExactlyNLessThanCard extends CardEligibilityFunction {
  public constructor(otherCard: Card, n: number) {
    super(
      // Implemented this way because the Cost class does not allow for negative costs
      (c: Card) =>
        c.getCost().coins === otherCard.getCost().coins - n &&
        c.getCost().potions === otherCard.getCost().potions &&
        c.getCost().debt === otherCard.getCost().debt,
    );
  }
}

const costsExactlyNLessThanCard = function (otherCard: Card, n: number) {
  return new CostsExactlyNLessThanCard(otherCard, n);
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

class IsDuplicateWith extends CardEligibilityFunction {
  public constructor(cardCollection: CardCollection) {
    super((c: Card) => cardCollection.numMatchingCards(isACopyOf(c)) === 0);
  }
}

const isDuplicateWith = function (cardCollection: CardCollection) {
  return new IsDuplicateWith(cardCollection);
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
  costsAtLeast,
  costsExactly,
  costsExactlyNLessThanCard,
  costsExactlyNMoreThanCard,
  costsLessThan,
  costsLessThanCard,
  costsTheSameAsCard,
  costsTheSameOrLessThanCard,
  costsUpTo,
  costsUpToNMoreThanCard,
  either,
  isACopyOf,
  isActionCard,
  isAttackCard,
  isCommandCard,
  isCurseCard,
  isDuplicateWith,
  isDurationCard,
  isFromExpansion,
  isInLocation,
  isKingdomCard,
  isKnightCard,
  isRewardCard,
  isRuinsCard,
  isShelterCard,
  isSimpleTreasure,
  isSupplyCard,
  isTheSameCardAs,
  isTreasureCard,
  isVictoryCard,
  noCard,
  not,
};
