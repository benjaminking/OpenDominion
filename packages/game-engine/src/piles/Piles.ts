import { CardChoice, ChoiceType } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import { Cost } from '../card/Cost';
import { CostSortingFunction } from '../CardSortingFunctions';
import { CardCostCache } from '../game-state/CardCostCache';
import { costsUpTo } from '../StandardCardEligibilityFunctions';
import { Pile } from './Pile';
import { PileGroup } from './PileGroup';

export class Piles {
  private _basicTreasurePiles: PileGroup = new PileGroup();
  public get basicTreasurePiles(): PileGroup {
    return this._basicTreasurePiles;
  }
  private _basicVictoryPiles: PileGroup = new PileGroup();
  public get basicVictoryPiles(): PileGroup {
    return this._basicVictoryPiles;
  }
  private _kingdomPiles: PileGroup = new PileGroup();
  public get kingdomPiles(): PileGroup {
    return this._kingdomPiles;
  }
  private _supplyPiles: PileGroup = new PileGroup();
  public get supplyPiles(): PileGroup {
    return this._supplyPiles;
  }
  private _allPiles: PileGroup = new PileGroup();
  public get allPiles(): PileGroup {
    return this._allPiles;
  }
  private _otherSupplyPiles: PileGroup = new PileGroup();
  public get otherSupplyPiles(): PileGroup {
    return this._otherSupplyPiles;
  }
  private _nonSupplyPiles: PileGroup = new PileGroup();
  public get nonSupplyPiles(): PileGroup {
    return this._nonSupplyPiles;
  }
  private _landscapes: PileGroup = new PileGroup();
  public get landscapes(): PileGroup {
    return this._landscapes;
  }

  public get numEmptySupplyPiles(): number {
    let numEmptySupplyPiles = 0;
    for (const pile of this.supplyPiles) {
      if (pile.isEmpty()) {
        numEmptySupplyPiles++;
      }
    }
    return numEmptySupplyPiles;
  }

  public addBasicTreasurePile(pile: Pile): void {
    this.basicTreasurePiles.addPile(pile);
    this.supplyPiles.addPile(pile);
    this.allPiles.addPile(pile);
  }

  public addBasicVictoryPile(pile: Pile): void {
    this.basicVictoryPiles.addPile(pile);
    this.supplyPiles.addPile(pile);
    this.allPiles.addPile(pile);
  }

  public addKingdomPile(pile: Pile): void {
    this.kingdomPiles.addPile(pile);
    this.supplyPiles.addPile(pile);
    this.allPiles.addPile(pile);
  }

  public getTopCardsOfSupplyPiles(): CardCollection {
    return this.supplyPiles.getTopCards();
  }

  public isPileEmpty(pileName: string): boolean {
    return this.allPiles.hasPile(pileName) && this.allPiles.getPileByName(pileName)!.size() === 0;
  }

  public getTopCardOfPile(pileName: string): Card | undefined {
    if (this.allPiles.hasPile(pileName) && this.allPiles.getPileByName(pileName)!.size() > 0) {
      return this.allPiles.getPileByName(pileName)!.getTopCard();
    }
  }

  public removeTopCardFromPile(pileName: string): Card | undefined {
    if (this.allPiles.hasPile(pileName) && this.allPiles.getPileByName(pileName)!.size() > 0) {
      return this.allPiles.getPileByName(pileName)!.removeTopCard();
    }
  }

  public removeCardFromPile(card: Card): Card | undefined {
    if (this.allPiles.hasPile(card.getPileName())) {
      return this.allPiles.getPileByName(card.getPileName())!.removeCard(card)!;
    }
  }

  public getPileSizeByName(pileName: string): number {
    if (this.allPiles.hasPile(pileName)) {
      return this.allPiles.getPileByName(pileName)!.size();
    }
    return 0;
  }

  public isSupplyPile(pileName: string): boolean {
    return this.supplyPiles.hasPile(pileName);
  }

  public isPile(pileName: string): boolean {
    return this.allPiles.hasPile(pileName);
  }

  public returnCardToPile(card: Card): void {
    this.allPiles.getPileByName(card.getPileName())?.addCard(card);
  }

  public getEligibleCardChoicesToBuy(coins: number): CardChoice[] {
    const choices: CardChoice[] = [];
    for (const topCard of this.getTopCardsOfSupplyPiles()
      .getMatchingCardsUnique(costsUpTo(Cost.Simple(coins)))
      .sorted(new CostSortingFunction())) {
      choices.push({
        type: ChoiceType.Card,
        card: topCard.getMetadata(),
      });
    }
    return choices;
  }

  public replaceCardsInPiles(cardName: string, replacementCardName: string, cardFactory: CardFactory): void {
    for (const pile of this.allPiles) {
      pile.replaceCardsInPile(cardName, replacementCardName, cardFactory);
    }
  }

  public getGainsNeededToEnd(): number {
    const numProvincesToEnd = this.supplyPiles.getPileByName('Province')!.size();

    let pileLengths: number[] = [];
    for (const pileName of this.supplyPiles.pileNames) {
      pileLengths.push(this.supplyPiles.getPileByName(pileName)!.size());
    }
    pileLengths = pileLengths.sort((a, b) => a - b);
    const numCardsToEnd = pileLengths[0] + pileLengths[1] + pileLengths[2];

    return Math.min(numProvincesToEnd, numCardsToEnd);
  }

  public areGameEndingConditionsMet(): boolean {
    return this.supplyPiles.getPileByName('Province')!.isEmpty() || this.numEmptySupplyPiles >= 3;
    //return (this.supplyPiles.getPileByName('Province')?.size() ?? 0) < 8 || this.numEmptySupplyPiles >= 3;
  }

  public reportCardCosts(cardCostCache: CardCostCache): void {
    for (const pile of this.supplyPiles) {
      pile.reportCardCosts(cardCostCache);
      if (cardCostCache.haveCostsChanged()) {
        break;
      }
    }
  }

  public communicateInitialState(): void {
    for (const pile of this.allPiles) {
      pile.communicateInitialState();
    }
  }

  public forceFullBroadcast(): void {
    for (const pile of this.allPiles) {
      pile.forceBroadcast();
    }
  }
}
