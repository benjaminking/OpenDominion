import { CardInfo } from '@dominion/common';

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
    this.addCardInfoToMap(adventures);
    this.addCardInfoToMap(empires);
    this.addCardInfoToMap(nocturne);
    this.addCardInfoToMap(renaissance);
    this.addCardInfoToMap(menagerie);
    this.addCardInfoToMap(allies);
    this.addCardInfoToMap(plunder);
    this.addCardInfoToMap(risingSun);
    this.addCardInfoToMap(promo);
    this.addCardInfoToMap(deprecated);
  }

  private addCardInfoToMap(cardInfoList: CardInfo[]): void {
    for (const cardInfo of cardInfoList) {
      this.cardInfoByName.set(cardInfo.name, cardInfo);
    }
  }

  public static lookUpCardInfo(cardName: string): CardInfo {
    const instance = CardInfoLookup.getInstance();
    if (!instance.cardInfoByName.has(cardName)) {
      throw new Error('Requested card info for unknown card: ' + cardName);
    }
    return instance.cardInfoByName.get(cardName)!;
  }

  public static getAllCardNames(): string[] {
    const instance = CardInfoLookup.getInstance();
    return [...instance.cardInfoByName.keys()].sort();
  }

  public static getKingdomCardNames(): string[] {
    const instance = CardInfoLookup.getInstance();
    return [...instance.cardInfoByName.entries()]
      .filter(([, info]) => info.is_kingdom === true)
      .map(([name]) => name)
      .sort();
  }

  private static getInstance(): CardInfoLookup {
    CardInfoLookup.instance ??= new CardInfoLookup();
    return CardInfoLookup.instance;
  }
}
