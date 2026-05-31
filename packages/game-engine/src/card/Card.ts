import { CardInfo, CardLocation, CardMetadata, CardType, Mechanic } from '@dominion/common';

import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { Effect } from '../effects/Effect';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import { convertToClassName, convertToFileName } from '../NameUtils';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { SharedGameState } from '../SharedGameState';
import { CardCollection } from './CardCollection';
import { Cost } from './Cost';

export class Card {
  private readonly _properName: string;
  private readonly _cost: Cost;
  private readonly _types: Set<CardType>;
  private readonly _filename: string;
  private readonly _className: string;
  private readonly _pileName: string;
  private readonly _mechanics: Set<Mechanic>;
  private _id = 'default_id';
  private _originalCost: Cost;
  private _location: CardLocation = CardLocation.PILE;
  private _isSimpleTreasure = false;
  private _isSupplyCard = false;
  private _coins = 0;
  private _effects: Effect[] = [];
  private hasThingsLeftToDo = false;

  public constructor(
    protected readonly sharedGameState: SharedGameState,
    cardInfo: CardInfo,
  ) {
    this._properName = cardInfo.name;
    this._cost = Cost.fromCommonCost(cardInfo.cost);
    this._types = new Set(cardInfo.types);
    this._filename = convertToFileName(this._properName);
    this._className = convertToClassName(this._properName);
    this._pileName = this._properName;
    this._originalCost = this._cost;
    this._mechanics = new Set(cardInfo.mechanics);
  }

  public equals(otherCard: Card): boolean {
    return this._id === otherCard._id;
  }

  public getFilename(): string {
    return this._filename;
  }

  public getName(): string {
    return this._properName;
  }

  public getClassName(): string {
    return this._className;
  }

  public getPileName(): string {
    return this._pileName;
  }

  public getId(): string {
    return this._id;
  }
  public setId(value: string): void {
    this._id = value;
  }

  public getOriginalCost(): Cost {
    return this._originalCost;
  }

  public getCost(): Cost {
    return this.sharedGameState.cost(this);
  }

  public adjustCost(cost: Cost, _ie: InstructionExecutor): Cost {
    return cost;
  }

  public getTypes(): Set<CardType> {
    return this._types;
  }

  public usesMechanic(mechanic: Mechanic): boolean {
    return this._mechanics.has(mechanic);
  }

  public getLocation(): CardLocation {
    return this._location;
  }
  public setLocation(value: CardLocation): void {
    this._location = value;
  }

  public isSimpleTreasure(): boolean {
    return this._isSimpleTreasure;
  }
  protected markAsSimpleTreasure(): void {
    this._isSimpleTreasure = true;
  }

  public isSupplyCard(): boolean {
    return this._isSupplyCard;
  }
  public markAsSupplyCard(): void {
    this._isSupplyCard = true;
  }

  public getCoins(): number {
    return this._coins;
  }
  protected setCoins(value: number): void {
    this._coins = value;
  }

  public getEffects(): Effect[] {
    return this._effects;
  }
  public addEffect(effect: Effect): void {
    this._effects.push(effect);
    this.sharedGameState.registerEffectTrigger(effect.getTrigger(), effect.getSource());
  }
  public removeEffectsByType(type: EffectTriggerType): void {
    this._effects = this._effects.filter((x: Effect) => x.getTrigger() !== type);
  }
  public async play(_ie: InstructionExecutor) {
    //
  }

  public canBeBought(_ie: InstructionExecutor): boolean {
    return true;
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 0;
  }

  public canBeDiscardedInCleanup(): boolean {
    return !this.hasThingsLeftToDo;
  }

  public markAsUnfinished(): void {
    this.hasThingsLeftToDo = true;
  }

  public markAsFinished(): void {
    this.hasThingsLeftToDo = false;
  }

  public hasType(type: CardType): boolean {
    return this._types.has(type);
  }

  /*public async interaction() {
    //
  }

  protected async sendInteractionMessage() {
    await this.gameLogic.messageService.sendGameMessageToEachOpponentAndWaitForResume(
      {
        command: Command.INTERACTION,
        content: this.metadata,
      }
    );
  }*/

  public matches(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return cardEligibilityFunction.matches(this);
  }

  public getMetadata(): CardMetadata {
    const currentCost = this.getCost();
    return {
      name: this._properName,
      id: this._id,
      location: this._location,
      types: Array.from(this._types),
      cost: {
        coins: currentCost.coins,
        potions: currentCost.potions,
        debt: currentCost.debt,
      },
    };
  }
}
