import PileCategory from '@dominion/common';
import { CardInfo, CardInfoLookup } from '@dominion/card-info';

import { PileFactory } from "./PileFactory";
import { Pile } from './Pile';

export enum SpecialPileType {
    REWARDS = 'rewards',
    KNIGHTS = 'knights',
    CASTLES = 'castles',
    ENCAMPMENT_PLUNDER = "encampment_plunder",
    PATRICIAN_EMPORIUM = "patrician_emporium",
    SETTLERS_BUSTLING_VILLAGE = "settles_bustling_village",
    CATAPULT_ROCKS = "catapult_rocks",
    GLADIATOR_FORTUNE = "gladiator_fortune",
    TOWNSFOLK = "townsfolk",
    AUGURS = "augurs",
    ODYSSEYS = "odysseys",
    WIZARDS = "wizards",
    CLASHES = "clashes",
    FORTS = "forts"
}

interface RawSpecialPileSpecification {
    pileName: string,
    cardNames: string[],
    pileCategories: PileCategory[],
    isShuffled: boolean 
}

const specialPileSpecifications: Map<SpecialPileType, RawSpecialPileSpecification> = new Map();
specialPileSpecifications.set(SpecialPileType.REWARDS, {
    pileName: 'Rewards',
    cardNames: ['Coronet', 'Coronet', 'Courser', 'Courser', 'Demesne', 'Demesne', 'Housecarl', 'Housecarl', 'Huge Turnip', 'Huge Turnip', 'Renown', 'Renown'],
    pileCategories: [PileCategory.NON_SUPPLY],
    isShuffled: false
});

export interface SpecialPileSpecification {
    pileName: string,
    randomizerCardInfo: CardInfo,
    cardInfos: CardInfo[],
    pileCategories: Set<PileCategory>,
    isShuffled: boolean
}

const cardInfoLookup = new CardInfoLookup();
function compileSpecialPileSpecification(rawSpec: RawSpecialPileSpecification): SpecialPileSpecification {
    return {
        pileName: rawSpec.pileName,
        randomizerCardInfo: cardInfoLookup.lookUpCardInfo(rawSpec.pileName),
        cardInfos: rawSpec.cardNames.map((name) => cardInfoLookup.lookUpCardInfo(name)),
        pileCategories: new Set<PileCategory>(rawSpec.pileCategories),
        isShuffled: rawSpec.isShuffled
    }
}

export class SpecialPileLookup {
    public lookUpSpecialPile(specialPileType: SpecialPileType): SpecialPileSpecification {
        const specialPileSpecification = specialPileSpecifications.get(specialPileType);
        if (specialPileSpecification === undefined) {
            throw new Error("Tried to construct an unknown special pile: " + specialPileType);
        }
        return compileSpecialPileSpecification(specialPileSpecification);
    }
}