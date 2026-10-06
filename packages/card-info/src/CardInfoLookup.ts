import { CardInfo, CardType, Expansion, RandomizerRequirements } from '@dominion/common';

import { adventures } from './Adventures';
import { alchemy } from './Alchemy';
import { allies } from './Allies';
import { base_game as baseGame } from './BaseGame';
import { basic_cards as basicCards } from './BasicCards';
import { cornucopiaAndGuilds } from './CornucopiaAndGuilds';
import { darkAges } from './DarkAges';
import { deprecated } from './Deprecated';
import { empires } from './Empires';
import { hinterlands } from './Hinterlands';
import { intrigue } from './Intrigue';
import { menagerie } from './Menagerie';
import { nocturne } from './Nocturne';
import { plunder } from './Plunder';
import { promo } from './Promo';
import { prosperity } from './Prosperity';
import { renaissance } from './Renaissance';
import { risingSun } from './RisingSun';
import { seaside } from './Seaside';

export class CardInfoLookup {
  private static instance: CardInfoLookup | undefined = undefined;
  private cardInfoByName = new Map<string, CardInfo>();
  private allRandomizerNames = new Set<string>();
  private cardNamesByExpansion = new Map<Expansion, Set<string>>();
  private cardNamesByCoinCost = new Map<number, Set<string>>();
  private cardNamesByType = new Map<CardType, Set<string>>();

  private constructor() {
    this.addCardInfoToMap(basicCards);
    this.addCardInfoToMap(baseGame);
    this.addCardInfoToMap(intrigue);
    this.addCardInfoToMap(seaside);
    this.addCardInfoToMap(alchemy);
    this.addCardInfoToMap(prosperity);
    this.addCardInfoToMap(cornucopiaAndGuilds);
    this.addCardInfoToMap(hinterlands);
    this.addCardInfoToMap(darkAges);
    //this.addCardInfoToMap(adventures);
    //this.addCardInfoToMap(empires);
    //this.addCardInfoToMap(nocturne);
    //this.addCardInfoToMap(renaissance);
    //this.addCardInfoToMap(menagerie);
    //this.addCardInfoToMap(allies);
    //this.addCardInfoToMap(plunder);
    //this.addCardInfoToMap(risingSun);
    //this.addCardInfoToMap(promo);
    //this.addCardInfoToMap(deprecated);
  }

  private addCardInfoToMap(cardInfoList: CardInfo[]): void {
    for (const cardInfo of cardInfoList) {
      if (cardInfo.has_randomizer) {
        this.allRandomizerNames.add(cardInfo.name);
      }

      this.cardInfoByName.set(cardInfo.name, cardInfo);
      if (!this.cardNamesByExpansion.has(cardInfo.expansion)) {
        this.cardNamesByExpansion.set(cardInfo.expansion, new Set());
      }
      this.cardNamesByExpansion.get(cardInfo.expansion)!.add(cardInfo.name);

      if (!cardInfo.cost.potions && !cardInfo.cost.debt) {
        const coinCost = cardInfo.cost.coins;
        if (!this.cardNamesByCoinCost.has(coinCost)) {
          this.cardNamesByCoinCost.set(coinCost, new Set());
        }
        this.cardNamesByCoinCost.get(coinCost)!.add(cardInfo.name);
      }

      for (const type of cardInfo.types) {
        if (!this.cardNamesByType.has(type)) {
          this.cardNamesByType.set(type, new Set());
        }
        this.cardNamesByType.get(type)!.add(cardInfo.name);
      }
    }
  }

  public static lookUpCardInfo(cardName: string): CardInfo {
    const instance = CardInfoLookup.getInstance();
    if (!instance.cardInfoByName.has(cardName)) {
      throw new Error('Requested card info for unknown card: ' + cardName);
    }
    return instance.cardInfoByName.get(cardName)!;
  }

  public static findMatchingRandomizerName(
    randomizerRequirements?: RandomizerRequirements,
    usedCardNames?: Set<string>,
  ): string | undefined {
    const instance = CardInfoLookup.getInstance();
    let matchingRandomizerNames = instance.allRandomizerNames;

    if (randomizerRequirements?.requiredExpansions && randomizerRequirements.requiredExpansions.length > 0) {
      for (const expansion of randomizerRequirements.requiredExpansions) {
        const namesForExpansion = instance.cardNamesByExpansion.get(expansion)!;
        matchingRandomizerNames = matchingRandomizerNames.intersection(namesForExpansion);
      }
    }

    if (randomizerRequirements?.requiredCoinCosts && randomizerRequirements.requiredCoinCosts.length > 0) {
      for (const coinCost of randomizerRequirements.requiredCoinCosts) {
        const namesForCoinCost = instance.cardNamesByCoinCost.get(coinCost)!;
        matchingRandomizerNames = matchingRandomizerNames.intersection(namesForCoinCost);
      }
    }

    if (randomizerRequirements?.requiredTypes && randomizerRequirements.requiredTypes.length > 0) {
      for (const cardType of randomizerRequirements.requiredTypes) {
        const namesForCardType = instance.cardNamesByType.get(cardType)!;
        matchingRandomizerNames = matchingRandomizerNames.intersection(namesForCardType);
      }
    }

    if (usedCardNames) {
      matchingRandomizerNames = matchingRandomizerNames.difference(usedCardNames);
    }

    if (matchingRandomizerNames.size === 0) {
      return undefined;
    }

    const randomCardName = [...matchingRandomizerNames][Math.floor(Math.random() * matchingRandomizerNames.size)];
    return randomCardName;
  }

  // TODO: see if these two methods are still required
  public static getAllCardNames(): string[] {
    const instance = CardInfoLookup.getInstance();
    return [...instance.cardInfoByName.keys()].sort();
  }

  public static getKingdomCardNames(): string[] {
    const instance = CardInfoLookup.getInstance();
    return [...instance.cardInfoByName.entries()]
      .filter(([, info]) => info.has_randomizer === true)
      .map(([name]) => name)
      .sort();
  }

  private static getInstance(): CardInfoLookup {
    CardInfoLookup.instance ??= new CardInfoLookup();
    return CardInfoLookup.instance;
  }
}
