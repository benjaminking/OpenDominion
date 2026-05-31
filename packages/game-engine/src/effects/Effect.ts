import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardShapedObject } from '../card/CardShapedObject';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { Player } from '../players/Player';
import { anyCard } from '../StandardCardEligibilityFunctions';
import { Turn } from '../turns/Turn';
import { EffectAction } from './EffectAction';
import { EffectCondition } from './EffectCondition';
import { EffectExpiration } from './EffectExpiration';
import { EffectSource } from './EffectSource';
import { EffectTriggerType } from './EffectTriggerType';
import { NoEffectExpiration } from './StandardEffectExpirations';
import { AnyTurnEligibility } from './StandardTurnEligibilityFunctions';
import { TurnEligibility } from './TurnEligibility';

export class Effect {
  private _id = '';
  private _numTimesUsed = 0;
  private owner: CardShapedObject | Card | undefined = undefined;
  private expiration: EffectExpiration = new NoEffectExpiration();
  private type: EffectTriggerType = EffectTriggerType.NEVER;
  private source: EffectSource = EffectSource.ANYONE;
  private turnEligibility: TurnEligibility = new AnyTurnEligibility();
  private _isMandatory = false;
  private isMultiple = false;
  private _isSelf = false;
  private cardEligibility: CardEligibilityFunction = anyCard;
  private conditions: EffectCondition[] = [];
  private action: EffectAction = new EffectAction((_ie: InstructionExecutor) => Promise.resolve());

  public registerStartOfPlayersTurn(player: Player, turn: Turn): void {
    this.expiration.registerStartOfPlayersTurn(player, turn);
  }

  public registerEndOfPlayersTurn(player: Player, turn: Turn): void {
    this.expiration.registerEndOfPlayersTurn(player, turn);
  }

  public registerUse(): void {
    this.expiration.registerUse();
  }

  public getId(): string {
    return this._id;
  }

  public getOwner(): CardShapedObject | Card {
    return this.owner!;
  }

  public getTrigger(): EffectTriggerType {
    return this.type;
  }

  public getSource(): EffectSource {
    return this.source;
  }

  public getExpiration(): EffectExpiration {
    return this.expiration;
  }

  public hasExpired(): boolean {
    return this.expiration.hasExpired();
  }

  public getTurnEligibility(): TurnEligibility {
    return this.turnEligibility;
  }

  public isMandatory(): boolean {
    return this._isMandatory;
  }

  public isSelf(): boolean {
    return this._isSelf;
  }

  public getCardEligibility(): CardEligibilityFunction {
    return this.cardEligibility;
  }

  public getNumTimesUsed() {
    return this._numTimesUsed;
  }

  public areOtherConditionsSatisfied(ie: InstructionExecutor): boolean {
    return this.conditions.every((v) => v.isSatisfied(ie));
  }

  public async doAction(ie: InstructionExecutor, targetCards: Card | CardCollection | undefined): Promise<void> {
    this._numTimesUsed++;
    await this.action.performAction(ie, targetCards);
    this.expiration.registerUse();
  }

  public static Builder = class {
    effect: Effect = new Effect();

    public from(owner: CardShapedObject | Card): this {
      this.effect.owner = owner;
      return this;
    }

    public withExpiration(expiration: EffectExpiration): this {
      this.effect.expiration = expiration;
      return this;
    }

    public onTurn(turnEligibility: TurnEligibility): this {
      this.effect.turnEligibility = turnEligibility;
      return this;
    }

    public triggerOn(trigger: EffectTriggerType, source: EffectSource = EffectSource.SELF): this {
      this.effect.type = trigger;
      this.effect.source = source;
      return this;
    }

    public makeMandatory(): this {
      this.effect._isMandatory = true;
      return this;
    }

    public makeMultiple(): this {
      this.effect.isMultiple = true;
      return this;
    }

    public self(): this {
      this.effect._isSelf = true;
      return this;
    }

    public whereCardIs(cardEligibility: CardEligibilityFunction): this {
      this.effect.cardEligibility = cardEligibility;
      return this;
    }

    public addCondition(condition: EffectCondition): this {
      this.effect.conditions.push(condition);
      return this;
    }

    public action(actionFunction: EffectAction): this {
      this.effect.action = actionFunction;
      return this;
    }

    public build(): Effect {
      if (this.effect.owner === undefined) {
        throw new Error('Effect must have a source');
      }
      this.effect._id = this.effect.owner.getId() + '_' + this.effect.type;
      return this.effect;
    }
  };
}
