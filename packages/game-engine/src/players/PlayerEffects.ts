import { Card } from '../card/Card';
import { Effect } from '../effects/Effect';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import { ExtraTurn } from '../turns/ExtraTurn';
import { Turn } from '../turns/Turn';
import { Player } from './Player';

export class PlayerEffects {
  private activeEffects: Map<EffectTriggerType, Effect[]> = new Map<EffectTriggerType, Effect[]>();
  private blockedAttackIds: Set<string> = new Set<string>();
  private extraTurns: ExtraTurn[] = [];

  public addEffect(effect: Effect): void {
    if (!this.activeEffects.has(effect.getTrigger())) {
      this.activeEffects.set(effect.getTrigger(), []);
    }
    this.activeEffects.get(effect.getTrigger())!.push(effect);
  }

  public addExtraTurn(extraTurn: ExtraTurn): void {
    this.extraTurns.push(extraTurn);
  }

  public getEffectsByType(type: EffectTriggerType): Effect[] {
    if (this.activeEffects.has(type)) {
      return this.activeEffects.get(type)!;
    }
    return [];
  }

  public registerStartOfPlayersTurn(player: Player, turn: Turn): void {
    for (const effects of this.activeEffects.values()) {
      for (const effect of effects) {
        effect.registerStartOfPlayersTurn(player, turn);
      }
    }
  }

  public registerEndOfPlayersTurn(player: Player, turn: Turn): void {
    for (const effects of this.activeEffects.values()) {
      for (const effect of effects) {
        effect.registerEndOfPlayersTurn(player, turn);
      }
    }
  }

  public removeExpiredEffects(): void {
    for (const type of this.activeEffects.keys()) {
      this.activeEffects.set(
        type,
        this.activeEffects.get(type)!.filter((item) => !item.hasExpired()),
      );
    }
  }

  public removeIneligibleEffectsByTurn(turn: Turn): void {
    for (const type of this.activeEffects.keys()) {
      this.activeEffects.set(
        type,
        this.activeEffects.get(type)!.filter((item) => item.getTurnEligibility().matches(turn)),
      );
    }
  }

  public clearBlocksForAttackCard(attackCard: Card): void {
    this.blockedAttackIds.delete(attackCard.getId());
  }

  public blockAttack(attackCard: Card): void {
    this.blockedAttackIds.add(attackCard.getId());
  }

  public isAttackBlocked(attackCard: Card): boolean {
    return this.blockedAttackIds.has(attackCard.getId());
  }

  public hasExtraTurnsQueued(): boolean {
    return this.extraTurns.length > 0;
  }

  public clearExtraTurns(): void {
    this.extraTurns = [];
  }

  public removeExtraTurnFromQueue(extraTurn: ExtraTurn): void {
    const indexOfExtraTurn: number = this.extraTurns.findIndex((et: ExtraTurn) => et.doInitiatorsMatch(extraTurn));
    if (indexOfExtraTurn >= 0) {
      this.extraTurns.splice(indexOfExtraTurn, 1);
    }
  }

  public findValidExtraTurns(previousTurns: Turn[]): ExtraTurn[] {
    return this.extraTurns.filter((extraTurn: ExtraTurn) => extraTurn.canExtraTurnHappen(previousTurns));
  }
}
