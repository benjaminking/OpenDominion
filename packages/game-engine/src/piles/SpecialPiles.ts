import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, CardType, Expansion, PileCategory } from '@dominion/common';

export enum SpecialPileType {
  REWARDS = 'Rewards',
  KNIGHTS = 'Knights',
  RUINS = 'Ruins',
  CASTLES = 'Castles',
  CASTLES_MULTIPLAYER = 'Castles_multiplayer',
  ENCAMPMENT_PLUNDER = 'Encampment_plunder',
  PATRICIAN_EMPORIUM = 'Patrician/Emporium',
  SETTLERS_BUSTLING_VILLAGE = 'Settlers/Bustling Village',
  CATAPULT_ROCKS = 'Catapult/Rocks',
  GLADIATOR_FORTUNE = 'Gladiator/Fortune',
  TOWNSFOLK = 'Townsfolk',
  AUGURS = 'Augurs',
  ODYSSEYS = 'Odysseys',
  WIZARDS = 'Wizards',
  CLASHES = 'Clashes',
  FORTS = 'Forts',
  SAUNA_AVANTO = 'Sauna/Avanto',
}

interface SpecialPileCardCount {
  cardName: string;
  count: number;
}

interface RawSpecialPileSpecification {
  pileName: string;
  cardNames: SpecialPileCardCount[];
  pileCategories: PileCategory[];
  isShuffled: boolean;
}

const specialPileSpecifications = new Map<SpecialPileType, RawSpecialPileSpecification>();
specialPileSpecifications.set(SpecialPileType.REWARDS, {
  pileName: 'Rewards',
  cardNames: [
    {
      cardName: 'Coronet',
      count: 2,
    },
    {
      cardName: 'Courser',
      count: 2,
    },
    {
      cardName: 'Demesne',
      count: 2,
    },
    {
      cardName: 'Housecarl',
      count: 2,
    },
    {
      cardName: 'Huge Turnip',
      count: 2,
    },
    {
      cardName: 'Renown',
      count: 2,
    },
  ],
  pileCategories: [PileCategory.NON_SUPPLY],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.KNIGHTS, {
  pileName: 'Knights',
  cardNames: [
    {
      cardName: 'Dame Anna',
      count: 1,
    },
    {
      cardName: 'Dame Josephine',
      count: 1,
    },
    {
      cardName: 'Dame Molly',
      count: 1,
    },
    {
      cardName: 'Dame Natalie',
      count: 1,
    },
    {
      cardName: 'Dame Sylvia',
      count: 1,
    },
    {
      cardName: 'Sir Bailey',
      count: 1,
    },
    {
      cardName: 'Sir Destry',
      count: 1,
    },
    {
      cardName: 'Sir Martin',
      count: 1,
    },
    {
      cardName: 'Sir Michael',
      count: 1,
    },
    {
      cardName: 'Sir Vander',
      count: 1,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: true,
});
specialPileSpecifications.set(SpecialPileType.RUINS, {
  pileName: 'Ruins',
  cardNames: [
    {
      cardName: 'Abandoned Mine',
      count: 10,
    },
    {
      cardName: 'Ruined Library',
      count: 10,
    },
    {
      cardName: 'Ruined Market',
      count: 10,
    },
    {
      cardName: 'Ruined Village',
      count: 10,
    },
    {
      cardName: 'Survivors',
      count: 10,
    },
  ],
  pileCategories: [PileCategory.SUPPLY],
  isShuffled: true,
});
specialPileSpecifications.set(SpecialPileType.CASTLES, {
  pileName: 'Castles',
  cardNames: [
    {
      cardName: 'Humble Castle',
      count: 1,
    },
    {
      cardName: 'Crumbling Castle',
      count: 1,
    },
    {
      cardName: 'Small Castle',
      count: 1,
    },
    {
      cardName: 'Haunted Castle',
      count: 1,
    },
    {
      cardName: 'Opulent Castle',
      count: 1,
    },
    {
      cardName: 'Sprawling Castle',
      count: 1,
    },
    {
      cardName: 'Grand Castle',
      count: 1,
    },
    {
      cardName: "King's Castle",
      count: 1,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.CASTLES_MULTIPLAYER, {
  pileName: 'Castles',
  cardNames: [
    {
      cardName: 'Humble Castle',
      count: 2,
    },
    {
      cardName: 'Crumbling Castle',
      count: 1,
    },
    {
      cardName: 'Small Castle',
      count: 2,
    },
    {
      cardName: 'Haunted Castle',
      count: 1,
    },
    {
      cardName: 'Opulent Castle',
      count: 2,
    },
    {
      cardName: 'Sprawling Castle',
      count: 1,
    },
    {
      cardName: 'Grand Castle',
      count: 1,
    },
    {
      cardName: "King's Castle",
      count: 2,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.ENCAMPMENT_PLUNDER, {
  pileName: 'Encampment/Plunder',
  cardNames: [
    {
      cardName: 'Encampment',
      count: 5,
    },
    {
      cardName: 'Plunder',
      count: 5,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.PATRICIAN_EMPORIUM, {
  pileName: 'Patrician/Emporium',
  cardNames: [
    {
      cardName: 'Patrician',
      count: 5,
    },
    {
      cardName: 'Emporium',
      count: 5,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.SETTLERS_BUSTLING_VILLAGE, {
  pileName: 'Settlers/Bustling Village',
  cardNames: [
    {
      cardName: 'Settlers',
      count: 5,
    },
    {
      cardName: 'Bustling Village',
      count: 5,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.CATAPULT_ROCKS, {
  pileName: 'Catapult/Rocks',
  cardNames: [
    {
      cardName: 'Catapult',
      count: 5,
    },
    {
      cardName: 'Rocks',
      count: 5,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.GLADIATOR_FORTUNE, {
  pileName: 'Gladiator/Fortune',
  cardNames: [
    {
      cardName: 'Gladiator',
      count: 5,
    },
    {
      cardName: 'Fortune',
      count: 5,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.TOWNSFOLK, {
  pileName: 'Townsfolk',
  cardNames: [
    {
      cardName: 'Town Crier',
      count: 4,
    },
    {
      cardName: 'Blacksmith',
      count: 4,
    },
    {
      cardName: 'Miller',
      count: 4,
    },
    {
      cardName: 'Elder',
      count: 4,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.AUGURS, {
  pileName: 'Augurs',
  cardNames: [
    {
      cardName: 'Herb Gatherer',
      count: 4,
    },
    {
      cardName: 'Acolyte',
      count: 4,
    },
    {
      cardName: 'Sorceress',
      count: 4,
    },
    {
      cardName: 'Sibyl',
      count: 4,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.ODYSSEYS, {
  pileName: 'Odysseys',
  cardNames: [
    {
      cardName: 'Old Map',
      count: 4,
    },
    {
      cardName: 'Voyage',
      count: 4,
    },
    {
      cardName: 'Sunken Treasure',
      count: 4,
    },
    {
      cardName: 'Distant Shore',
      count: 4,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.WIZARDS, {
  pileName: 'Wizards',
  cardNames: [
    {
      cardName: 'Student',
      count: 4,
    },
    {
      cardName: 'Conjurer',
      count: 4,
    },
    {
      cardName: 'Sorcerer',
      count: 4,
    },
    {
      cardName: 'Lich',
      count: 4,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.CLASHES, {
  pileName: 'Clashes',
  cardNames: [
    {
      cardName: 'Battle Plan',
      count: 4,
    },
    {
      cardName: 'Archer',
      count: 4,
    },
    {
      cardName: 'Warlord',
      count: 4,
    },
    {
      cardName: 'Territory',
      count: 4,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.FORTS, {
  pileName: 'Forts',
  cardNames: [
    {
      cardName: 'Tent',
      count: 4,
    },
    {
      cardName: 'Garrison',
      count: 4,
    },
    {
      cardName: 'Hill Fort',
      count: 4,
    },
    {
      cardName: 'Stronghold',
      count: 4,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});
specialPileSpecifications.set(SpecialPileType.SAUNA_AVANTO, {
  pileName: 'Sauna/Avanto',
  cardNames: [
    {
      cardName: 'Sauna',
      count: 5,
    },
    {
      cardName: 'Avanto',
      count: 5,
    },
  ],
  pileCategories: [PileCategory.SUPPLY, PileCategory.KINGDOM],
  isShuffled: false,
});

export interface SpecialPileSpecification {
  pileName: string;
  randomizerCardInfo: CardInfo;
  cardInfos: CardInfo[];
  pileCategories: Set<PileCategory>;
  isShuffled: boolean;
}

function compileSpecialPileSpecification(rawSpec: RawSpecialPileSpecification): SpecialPileSpecification {
  const cardInfo = findCardInfoForPileName(rawSpec.pileName);

  return {
    pileName: rawSpec.pileName,
    randomizerCardInfo: cardInfo,
    cardInfos: rawSpec.cardNames.flatMap((cardCount) => {
      const cardInfo = CardInfoLookup.lookUpCardInfo(cardCount.cardName);
      return Array(cardCount.count).fill(cardInfo);
    }),
    pileCategories: new Set<PileCategory>(rawSpec.pileCategories),
    isShuffled: rawSpec.isShuffled,
  };
}

function findCardInfoForPileName(pileName: string): CardInfo {
  if (pileName === 'Ruins') {
    return {
      name: 'Ruins',
      category: CardCategory.CARD,
      text: '',
      font_size: 'medium',
      cost: {
        coins: 0,
      },
      types: [CardType.ACTION, CardType.RUINS],
      expansion: Expansion.DARK_AGES,
      has_randomizer: false,
    };
  } else if (pileName === 'Rewards') {
    return {
      name: 'Rewards',
      category: CardCategory.CARD,
      text: '',
      font_size: 'medium',
      cost: {
        coins: 0,
      },
      types: [CardType.ACTION],
      expansion: Expansion.CORNUCOPIA_AND_GUILDS,
      has_randomizer: false,
    };
  }

  return CardInfoLookup.lookUpCardInfo(pileName);
}

export class SpecialPileLookup {
  public lookUpSpecialPile(specialPileType: SpecialPileType): SpecialPileSpecification {
    const specialPileSpecification = specialPileSpecifications.get(specialPileType);
    if (specialPileSpecification === undefined) {
      throw new Error('Tried to construct an unknown special pile: ' + specialPileType);
    }
    return compileSpecialPileSpecification(specialPileSpecification);
  }
}
