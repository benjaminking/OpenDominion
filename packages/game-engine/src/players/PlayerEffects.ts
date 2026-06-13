import { Choice, ChoiceType, EffectChoice } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { Effect } from '../effects/Effect';
import { EffectSource } from '../effects/EffectSource';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import { ExtraTurn } from '../turns/ExtraTurn';
import { Turn } from '../turns/Turn';
import { Player } from './Player';

export class PlayerEffects {
  private activeEffects: Map<EffectTriggerType, Effect[]> = new Map<EffectTriggerType, Effect[]>();
  private blockedAttackIds: Set<string> = new Set<string>();
  private extraTurns: ExtraTurn[] = [];

  public constructor(private readonly player: Player) {}

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

  public async processEffectsByType(
    triggerType: EffectTriggerType,
    triggeringPlayer: Player,
    targetCards: Card | CardCollection | undefined,
    extraInformation = '',
    usedEffectIDs: Set<string> = new Set<string>(),
  ): Promise<void> {
    const allEffects = this.getApplicableEffectsByType(triggerType, triggeringPlayer, targetCards);
    const optionalEffects = allEffects.filter((e: Effect) => !e.isMandatory() && !usedEffectIDs.has(e.getId()));
    const mandatoryEffects = allEffects.filter((e: Effect) => e.isMandatory() && !usedEffectIDs.has(e.getId()));

    const uniqueMandatoryEffectCardNames = new Set<string>(
      mandatoryEffects.map((value: Effect) => value.getOwner().getName()),
    );
    if (optionalEffects.length === 0 && uniqueMandatoryEffectCardNames.size === 1) {
      await mandatoryEffects[0].doAction(this.player.getInstructionExecutor(), targetCards);
      usedEffectIDs.add(mandatoryEffects[0].getId());
      if (mandatoryEffects.length === 1) {
        return;
      } else {
        return this.processEffectsByType(triggerType, triggeringPlayer, targetCards, extraInformation, usedEffectIDs);
      }
    }

    if (mandatoryEffects.length > 0 || optionalEffects.length > 0) {
      let extraMessage = '';
      if (triggerType === EffectTriggerType.WOULD_GAIN && targetCards !== undefined) {
        extraMessage =
          'You would gain ' +
          (targetCards instanceof CardCollection
            ? targetCards.print()
            : CardCollection.fromCards([targetCards]).print()) +
          '.';
      } else if (triggerType === EffectTriggerType.GAIN && targetCards !== undefined) {
        extraMessage =
          'You gained ' +
          (targetCards instanceof CardCollection
            ? targetCards.print()
            : CardCollection.fromCards([targetCards]).print()) +
          '.';
      } else if (triggerType === EffectTriggerType.ATTACK && targetCards !== undefined) {
        extraMessage =
          'An opponent played ' +
          (targetCards instanceof CardCollection
            ? targetCards.print()
            : CardCollection.fromCards([targetCards]).print()) +
          '.';
      }
      const effectsById: Map<string, Effect> = this.createEffectIdMap(optionalEffects, mandatoryEffects);

      const effectChoice: Choice = await this.player
        .getDecisionService()
        .chooseFromMultipleEvents(
          extraMessage,
          this.createEffectChoices(optionalEffects),
          this.createEffectChoices(mandatoryEffects),
        );
      if (effectChoice.type === ChoiceType.Effect) {
        const effect: Effect = effectsById.get((effectChoice as EffectChoice).effectId)!;
        usedEffectIDs.add(effect.getId());

        this.player.getInstructionExecutor().getSharedGameState().pushActiveEffectOntoStack(effect);
        await effect.doAction(this.player.getInstructionExecutor(), targetCards);
        this.player.getInstructionExecutor().getSharedGameState().popActiveEffectOffOfStack();
        return this.processEffectsByType(triggerType, triggeringPlayer, targetCards, extraInformation, usedEffectIDs);
      }
    }
  }

  private createEffectChoices(effects: Effect[]): EffectChoice[] {
    const effectChoices: EffectChoice[] = [];
    for (const effect of effects) {
      effectChoices.push({
        type: ChoiceType.Effect,
        effectName: effect.getOwner().getName(),
        effectId: effect.getId(),
      });
    }
    return effectChoices;
  }

  private createEffectIdMap(optionalEffects: Effect[], mandatoryEffects: Effect[]): Map<string, Effect> {
    const effectIdMap: Map<string, Effect> = new Map<string, Effect>();
    for (const optionalEffect of optionalEffects) {
      effectIdMap.set(optionalEffect.getId(), optionalEffect);
    }
    for (const mandatoryEffect of mandatoryEffects) {
      effectIdMap.set(mandatoryEffect.getId(), mandatoryEffect);
    }
    return effectIdMap;
  }

  private getApplicableEffectsByType(
    trigger: EffectTriggerType,
    triggeringPlayer: Player,
    targetCards: Card | CardCollection | undefined,
  ): Effect[] {
    const allEffects: Effect[] = [];
    allEffects.push(
      ...this.filterEffectsToApplicable(
        this.player.getEffects().getEffectsByType(trigger),
        triggeringPlayer,
        targetCards,
      ),
    );
    allEffects.push(
      ...this.filterEffectsToApplicable(
        this.player.getOwnedCards().getEffectsByType(trigger),
        triggeringPlayer,
        targetCards,
      ),
    );
    if (targetCards !== undefined && targetCards instanceof CardCollection) {
      allEffects.push(
        ...this.filterEffectsToApplicable(targetCards.getEffectsByType(trigger), triggeringPlayer, targetCards, true),
      );
    } else if (targetCards !== undefined) {
      allEffects.push(
        ...this.filterEffectsToApplicable(
          CardCollection.fromCards([targetCards]).getEffectsByType(trigger),
          triggeringPlayer,
          targetCards,
          true,
        ),
      );
    }

    if (trigger === EffectTriggerType.SHUFFLE) {
      allEffects.push(
        ...this.filterEffectsToApplicable(
          this.player.getOwnedCards().getDeckEffectsByType(trigger),
          triggeringPlayer,
          targetCards,
        ),
      );
    }

    return allEffects;
  }

  private filterEffectsToApplicable(
    effects: Effect[],
    triggeringPlayer: Player,
    targetCards: Card | CardCollection | undefined,
    allowSelf = false,
  ): Effect[] {
    const applicableEffects: Effect[] = [];
    for (const effect of effects) {
      if (
        (!effect.isSelf() || (allowSelf && effect.isSelf())) &&
        this.isTriggeringPlayerCompatibleWithSource(effect, triggeringPlayer) &&
        (targetCards === undefined ||
          (targetCards instanceof CardCollection && targetCards.size() === 0) ||
          (targetCards instanceof CardCollection && effect.getCardEligibility().matchesAny(targetCards)) ||
          (targetCards instanceof Card && effect.getCardEligibility().matches(targetCards))) &&
        this.player
          .getInstructionExecutor()
          .getSharedGameState()
          .isTurnEligibilitySatisfied(effect.getTurnEligibility()) &&
        !effect.hasExpired() &&
        effect.areOtherConditionsSatisfied(this.player.getInstructionExecutor())
      ) {
        applicableEffects.push(effect);
      }
    }

    return applicableEffects;
  }

  private isTriggeringPlayerCompatibleWithSource(effect: Effect, triggeringPlayer: Player): boolean {
    if (effect.getSource() === EffectSource.SELF) {
      return this.player.getName() === triggeringPlayer.getName();
    } else if (effect.getSource() === EffectSource.OTHER_PLAYER) {
      return this.player.getName() !== triggeringPlayer.getName();
    }
    return true;
  }
}
