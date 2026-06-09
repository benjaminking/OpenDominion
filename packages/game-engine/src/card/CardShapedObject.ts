import { Mechanic } from '@dominion/common';

import { CardInfo } from '../../../common/dist/index.cjs';
import { Effect } from '../effects/Effect';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import { SharedGameState } from '../game-state/SharedGameState';
import { convertToClassName, convertToFileName } from '../NameUtils';
import { MechanicsInUse } from '../game-state/MechanicsInUse';

export abstract class CardShapedObject {
  protected readonly _properName: string;
  protected readonly _filename: string;
  protected readonly _className: string;
  private readonly _mechanics: Set<Mechanic>;
  protected _id = 'default_id';
  private _effects: Effect[] = [];

  public constructor(
    protected readonly sharedGameState: SharedGameState,
    cardShapedObjectInfo: CardInfo,
  ) {
    this._properName = cardShapedObjectInfo.name;
    this._filename = convertToFileName(this._properName);
    this._className = convertToClassName(this._properName);
    this._mechanics = new Set(cardShapedObjectInfo.mechanics);
  }

  public equals(otherCardShapedObject: CardShapedObject): boolean {
    return this._id === otherCardShapedObject._id;
  }

  public getFilename(): string {
    return this._filename;
  }

  public getName(): string {
    return this._properName;
  }

  public getDisplayName(): string {
    return this._properName;
  }

  public getClassName(): string {
    return this._className;
  }

  public getId(): string {
    return this._id;
  }
  public setId(value: string): void {
    this._id = value;
  }

  public usesMechanic(mechanic: Mechanic): boolean {
    return this._mechanics.has(mechanic);
  }

  public registerUsedMechanics(mechanicsInUse: MechanicsInUse): void {
    mechanicsInUse.addAll(this._mechanics);
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
}
