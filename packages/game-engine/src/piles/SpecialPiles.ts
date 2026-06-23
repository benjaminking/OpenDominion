import { CardInfoLookup } from '@dominion/card-info';
import { CardInfo, CardType, PileCategory } from '@dominion/common';

export enum SpecialPileType {
  REWARDS = 'rewards',
  LOOT = 'loot',
  KNIGHTS = 'knights',
  CASTLES = 'castles',
  ENCAMPMENT_PLUNDER = 'encampment_plunder',
  PATRICIAN_EMPORIUM = 'patrician_emporium',
  SETTLERS_BUSTLING_VILLAGE = 'settles_bustling_village',
  CATAPULT_ROCKS = 'catapult_rocks',
  GLADIATOR_FORTUNE = 'gladiator_fortune',
  TOWNSFOLK = 'townsfolk',
  AUGURS = 'augurs',
  ODYSSEYS = 'odysseys',
  WIZARDS = 'wizards',
  CLASHES = 'clashes',
  FORTS = 'forts',
}

interface RawSpecialPileSpecification {
  pileName: string;
  cardNames: string[];
  pileCategories: PileCategory[];
  isShuffled: boolean;
}

const specialPileSpecifications = new Map<SpecialPileType, RawSpecialPileSpecification>();
specialPileSpecifications.set(SpecialPileType.REWARDS, {
  pileName: 'Rewards',
  cardNames: [
    'Coronet',
    'Coronet',
    'Courser',
    'Courser',
    'Demesne',
    'Demesne',
    'Housecarl',
    'Housecarl',
    'Huge Turnip',
    'Huge Turnip',
    'Renown',
    'Renown',
  ],
  pileCategories: [PileCategory.NON_SUPPLY],
  isShuffled: false,
});

specialPileSpecifications.set(SpecialPileType.LOOT, {
  pileName: 'Loot',
  cardNames: [
    'Amphora',
    'Doubloons',
    'Endless Chalice',
    'Figurehead',
    'Hammer',
    'Insignia',
    'Jewels',
    'Orb',
    'Prize Goat',
    'Puzzle Box',
    'Sextant',
    'Shield',
    'Spell Scroll',
    'Staff',
    'Sword',
  ],
  pileCategories: [PileCategory.NON_SUPPLY],
  isShuffled: true,
});

export interface SpecialPileSpecification {
  pileName: string;
  cardInfos: CardInfo[];
  pileTypes: Set<CardType>;
  pileCategories: Set<PileCategory>;
  isShuffled: boolean;
}

function compileSpecialPileSpecification(rawSpec: RawSpecialPileSpecification): SpecialPileSpecification {
  const cardInfos = rawSpec.cardNames.map((name) => CardInfoLookup.lookUpCardInfo(name));
  const pileTypes = new Set<CardType>();
  for (const cardInfo of cardInfos) {
    for (const type of cardInfo.types) {
      pileTypes.add(type);
    }
  }

  return {
    pileName: rawSpec.pileName,
    cardInfos,
    pileTypes,
    pileCategories: new Set<PileCategory>(rawSpec.pileCategories),
    isShuffled: rawSpec.isShuffled,
  };
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
