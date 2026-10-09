import { CardCategory, CardType, ChoiceType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { Effect } from '../../src/effects/Effect';
import { EffectAction } from '../../src/effects/EffectAction';
import { EffectCondition } from '../../src/effects/EffectCondition';
import { EffectSource } from '../../src/effects/EffectSource';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import { OneTimeEffectExpirtation } from '../../src/effects/StandardEffectExpirations';
import { TurnEligibility } from '../../src/effects/TurnEligibility';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { Player } from '../../src/players/Player';
import { PlayerEffects } from '../../src/players/PlayerEffects';
import { cardNameIs } from '../../src/StandardCardEligibilityFunctions';
import { Turn } from '../../src/turns/Turn';

interface TestEffect {
  getTrigger: ReturnType<typeof vi.fn>;
  hasExpired: ReturnType<typeof vi.fn>;
  getTurnEligibility: ReturnType<typeof vi.fn>;
  registerStartOfPlayersTurn: ReturnType<typeof vi.fn>;
  registerEndOfPlayersTurn: ReturnType<typeof vi.fn>;
}

const createEffect = (options: { trigger: EffectTriggerType; expired?: boolean; eligible?: boolean }): TestEffect => {
  return {
    getTrigger: vi.fn(() => options.trigger),
    hasExpired: vi.fn(() => options.expired ?? false),
    getTurnEligibility: vi.fn(() => ({
      matches: vi.fn(() => options.eligible ?? true),
    })),
    registerStartOfPlayersTurn: vi.fn(),
    registerEndOfPlayersTurn: vi.fn(),
  };
};

const createAttackCard = (id: string) => {
  return {
    getId: vi.fn(() => id),
  } as never;
};

const createExtraTurn = (options: { ownerKey: string; valid: boolean }) => {
  return {
    canExtraTurnHappen: vi.fn(() => options.valid),
    doInitiatorsMatch: vi.fn((other) => other.ownerKey === options.ownerKey),
    ownerKey: options.ownerKey,
  } as never;
};

const createCard = (name: string, id: string): Card => {
  const sharedGameState = {
    cost: vi.fn(() => Cost.Simple(0)),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
  const card = new Card(sharedGameState, {
    category: CardCategory.CARD,
    name,
    text: `${name} text`,
    font_size: 'small',
    cost: { coins: 0 },
    types: [CardType.ACTION],
    expansion: Expansion.TESTING,
    mechanics: [],
  });
  card.setId(id);
  return card;
};

const buildEffect = (options: {
  owner: Card;
  trigger?: EffectTriggerType;
  source?: EffectSource;
  mandatory?: boolean;
  self?: boolean;
  cardEligibility?: CardEligibilityFunction;
  turnEligibility?: TurnEligibility;
  condition?: EffectCondition;
  expiration?: OneTimeEffectExpirtation;
  action?: (...args: unknown[]) => Promise<void> | void;
}): Effect => {
  const builder = new Effect.Builder()
    .from(options.owner)
    .triggerOn(options.trigger ?? EffectTriggerType.GAIN, options.source ?? EffectSource.ANYONE)
    .action(new EffectAction(options.action ?? vi.fn()));
  if (options.mandatory) {
    builder.makeMandatory();
  }
  if (options.self) {
    builder.self();
  }
  if (options.cardEligibility !== undefined) {
    builder.whereCardIs(options.cardEligibility);
  }
  if (options.turnEligibility !== undefined) {
    builder.onTurn(options.turnEligibility);
  }
  if (options.condition !== undefined) {
    builder.addCondition(options.condition);
  }
  if (options.expiration !== undefined) {
    builder.withExpiration(options.expiration);
  }
  return builder.build();
};

const createEffectOwner = (name: string) => {
  const sharedGameState = {
    isTurnEligibilitySatisfied: vi.fn((turnEligibility: TurnEligibility) => turnEligibility.matches({} as Turn)),
    pushActiveEffectOntoStack: vi.fn(),
    popActiveEffectOffOfStack: vi.fn(),
  };
  const instructionExecutor = {
    getSharedGameState: () => sharedGameState,
  };
  const ownedCardEffects: Effect[] = [];
  const deckEffects: Effect[] = [];
  const ownedCards = {
    getEffectsByType: vi.fn((trigger: EffectTriggerType) => ownedCardEffects.filter((e) => e.getTrigger() === trigger)),
    getDeckEffectsByType: vi.fn((trigger: EffectTriggerType) => deckEffects.filter((e) => e.getTrigger() === trigger)),
  };
  const decisionService = {
    chooseFromMultipleEvents: vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ type: ChoiceType.None })),
  };
  const player = {
    getName: () => name,
    getInstructionExecutor: () => instructionExecutor,
    getOwnedCards: () => ownedCards,
    getDecisionService: () => decisionService,
  } as unknown as Player;
  const playerEffects = new PlayerEffects(player);
  player.getEffects = () => playerEffects;

  const offeredEffectNames = (callIndex: number): { optional: string[]; mandatory: string[] } => {
    const [, optional, mandatory] = decisionService.chooseFromMultipleEvents.mock.calls[callIndex] as [
      string,
      { effectName: string }[],
      { effectName: string }[],
    ];
    return {
      optional: optional.map((choice) => choice.effectName),
      mandatory: mandatory.map((choice) => choice.effectName),
    };
  };

  return {
    player,
    playerEffects,
    instructionExecutor,
    sharedGameState,
    ownedCardEffects,
    deckEffects,
    ownedCards,
    decisionService,
    offeredEffectNames,
  };
};

describe('PlayerEffects', () => {
  it('stores effects by trigger and forwards turn lifecycle registration to each active effect', () => {
    const playerEffects = new PlayerEffects({} as Player);
    const turnStartEffect = createEffect({ trigger: EffectTriggerType.TURN_START });
    const turnEndEffect = createEffect({ trigger: EffectTriggerType.TURN_END });
    const player = {} as Player;
    const turn = {} as Turn;

    playerEffects.addEffect(turnStartEffect as unknown as Effect);
    playerEffects.addEffect(turnEndEffect as unknown as Effect);

    expect(playerEffects.getEffectsByType(EffectTriggerType.TURN_START)).toEqual([turnStartEffect]);
    expect(playerEffects.getEffectsByType(EffectTriggerType.NEVER)).toEqual([]);

    playerEffects.registerStartOfPlayersTurn(player, turn);
    playerEffects.registerEndOfPlayersTurn(player, turn);

    expect(turnStartEffect.registerStartOfPlayersTurn).toHaveBeenCalledWith(player, turn);
    expect(turnEndEffect.registerStartOfPlayersTurn).toHaveBeenCalledWith(player, turn);
    expect(turnStartEffect.registerEndOfPlayersTurn).toHaveBeenCalledWith(player, turn);
    expect(turnEndEffect.registerEndOfPlayersTurn).toHaveBeenCalledWith(player, turn);
  });

  it('removes expired and turn-ineligible effects without affecting eligible ones', () => {
    const playerEffects = new PlayerEffects({} as Player);
    const expiredEffect = createEffect({ trigger: EffectTriggerType.TURN_START, expired: true });
    const ineligibleEffect = createEffect({ trigger: EffectTriggerType.TURN_START, eligible: false });
    const keptEffect = createEffect({ trigger: EffectTriggerType.TURN_START });

    playerEffects.addEffect(expiredEffect as unknown as Effect);
    playerEffects.addEffect(ineligibleEffect as unknown as Effect);
    playerEffects.addEffect(keptEffect as unknown as Effect);

    playerEffects.removeExpiredEffects();
    expect(playerEffects.getEffectsByType(EffectTriggerType.TURN_START)).toEqual([ineligibleEffect, keptEffect]);

    playerEffects.removeIneligibleEffectsByTurn({} as Turn);
    expect(playerEffects.getEffectsByType(EffectTriggerType.TURN_START)).toEqual([keptEffect]);
  });

  it('tracks attack blocks by card id', () => {
    const playerEffects = new PlayerEffects({} as Player);
    const militia = createAttackCard('militia-id');

    expect(playerEffects.isAttackBlocked(militia)).toBe(false);

    playerEffects.blockAttack(militia);
    expect(playerEffects.isAttackBlocked(militia)).toBe(true);

    playerEffects.clearBlocksForAttackCard(militia);
    expect(playerEffects.isAttackBlocked(militia)).toBe(false);
  });

  it('queues, filters, removes, and clears extra turns', () => {
    const playerEffects = new PlayerEffects({} as Player);
    const validExtraTurn = createExtraTurn({ ownerKey: 'alice', valid: true });
    const invalidExtraTurn = createExtraTurn({ ownerKey: 'bob', valid: false });

    expect(playerEffects.hasExtraTurnsQueued()).toBe(false);

    playerEffects.addExtraTurn(validExtraTurn);
    playerEffects.addExtraTurn(invalidExtraTurn);

    expect(playerEffects.hasExtraTurnsQueued()).toBe(true);
    expect(playerEffects.findValidExtraTurns([])).toEqual([validExtraTurn]);

    playerEffects.removeExtraTurnFromQueue({ ownerKey: 'alice' } as never);
    expect(playerEffects.findValidExtraTurns([])).toEqual([]);
    expect(playerEffects.hasExtraTurnsQueued()).toBe(true);

    playerEffects.clearExtraTurns();
    expect(playerEffects.hasExtraTurnsQueued()).toBe(false);
  });

  describe('processEffectsByType', () => {
    it('only offers effects whose source is compatible with the triggering player', async () => {
      const { player, playerEffects, offeredEffectNames } = createEffectOwner('Alice');
      const bob = { getName: () => 'Bob' } as unknown as Player;
      playerEffects.addEffect(buildEffect({ owner: createCard('Watchtower', 'self-0'), source: EffectSource.SELF }));
      playerEffects.addEffect(buildEffect({ owner: createCard('Moat', 'other-0'), source: EffectSource.OTHER_PLAYER }));
      playerEffects.addEffect(
        buildEffect({ owner: createCard('Fools Gold', 'anyone-0'), source: EffectSource.ANYONE }),
      );

      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, player, undefined);
      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, bob, undefined);

      expect(offeredEffectNames(0).optional).toEqual(['Watchtower', 'Fools Gold']);
      expect(offeredEffectNames(1).optional).toEqual(['Moat', 'Fools Gold']);
    });

    it('resolves mandatory effects from a single card without prompting', async () => {
      const { player, playerEffects, decisionService, instructionExecutor } = createEffectOwner('Alice');
      const firstAction = vi.fn();
      const secondAction = vi.fn();
      playerEffects.addEffect(
        buildEffect({ owner: createCard('Merchant', 'merchant-0'), mandatory: true, action: firstAction }),
      );
      playerEffects.addEffect(
        buildEffect({ owner: createCard('Merchant', 'merchant-1'), mandatory: true, action: secondAction }),
      );
      const silver = createCard('Silver', 'silver-0');

      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, player, silver);

      expect(firstAction).toHaveBeenCalledTimes(1);
      expect(firstAction).toHaveBeenCalledWith(instructionExecutor, silver);
      expect(secondAction).toHaveBeenCalledTimes(1);
      expect(decisionService.chooseFromMultipleEvents).not.toHaveBeenCalled();
    });

    it('lets the player order mandatory effects from different cards and resolves each exactly once', async () => {
      const { player, playerEffects, decisionService, sharedGameState, offeredEffectNames } =
        createEffectOwner('Alice');
      const resolved: string[] = [];
      const haven = buildEffect({
        owner: createCard('Haven', 'haven-0'),
        trigger: EffectTriggerType.TURN_START,
        mandatory: true,
        action: () => {
          resolved.push('Haven');
        },
      });
      const wharf = buildEffect({
        owner: createCard('Wharf', 'wharf-0'),
        trigger: EffectTriggerType.TURN_START,
        mandatory: true,
        action: () => {
          resolved.push('Wharf');
          expect(sharedGameState.pushActiveEffectOntoStack).toHaveBeenCalledWith(wharf);
          expect(sharedGameState.popActiveEffectOffOfStack).not.toHaveBeenCalled();
        },
      });
      playerEffects.addEffect(haven);
      playerEffects.addEffect(wharf);
      decisionService.chooseFromMultipleEvents.mockResolvedValueOnce({
        type: ChoiceType.Effect,
        effectName: 'Wharf',
        effectId: wharf.getId(),
      });

      await playerEffects.processEffectsByType(EffectTriggerType.TURN_START, player, undefined);

      expect(resolved).toEqual(['Wharf', 'Haven']);
      expect(decisionService.chooseFromMultipleEvents).toHaveBeenCalledTimes(1);
      expect(decisionService.chooseFromMultipleEvents.mock.calls[0][0]).toBe('');
      expect(offeredEffectNames(0)).toEqual({ optional: [], mandatory: ['Haven', 'Wharf'] });
      expect(sharedGameState.popActiveEffectOffOfStack).toHaveBeenCalledTimes(1);
    });

    it('re-offers the remaining optional effects after one is chosen until the player declines', async () => {
      const { player, playerEffects, decisionService, offeredEffectNames } = createEffectOwner('Alice');
      const watchtowerAction = vi.fn();
      const watchtower = buildEffect({ owner: createCard('Watchtower', 'watchtower-0'), action: watchtowerAction });
      const traderAction = vi.fn();
      playerEffects.addEffect(watchtower);
      playerEffects.addEffect(buildEffect({ owner: createCard('Trader', 'trader-0'), action: traderAction }));
      decisionService.chooseFromMultipleEvents
        .mockResolvedValueOnce({ type: ChoiceType.Effect, effectName: 'Watchtower', effectId: watchtower.getId() })
        .mockResolvedValueOnce({ type: ChoiceType.None });

      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, player, createCard('Curse', 'curse-0'));

      expect(watchtowerAction).toHaveBeenCalledTimes(1);
      expect(traderAction).not.toHaveBeenCalled();
      expect(offeredEffectNames(0).optional).toEqual(['Watchtower', 'Trader']);
      expect(offeredEffectNames(1).optional).toEqual(['Trader']);
    });

    it('describes the triggering cards for gain, would-gain, and attack prompts', async () => {
      const { player, playerEffects, decisionService } = createEffectOwner('Alice');
      for (const trigger of [EffectTriggerType.GAIN, EffectTriggerType.WOULD_GAIN, EffectTriggerType.ATTACK]) {
        playerEffects.addEffect(buildEffect({ owner: createCard('Watchtower', `watchtower-${trigger}`), trigger }));
      }
      const silver = createCard('Silver', 'silver-0');
      const militia = createCard('Militia', 'militia-0');

      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, player, silver);
      await playerEffects.processEffectsByType(
        EffectTriggerType.WOULD_GAIN,
        player,
        CardCollection.fromCards([silver]),
      );
      await playerEffects.processEffectsByType(EffectTriggerType.ATTACK, player, militia);

      expect(decisionService.chooseFromMultipleEvents.mock.calls.map((call) => call[0])).toEqual([
        'You gained a Silver.',
        'You would gain a Silver.',
        'An opponent played a Militia.',
      ]);
    });

    it('skips effects that do not match the target, have expired, fail a condition, or are not eligible this turn', async () => {
      const { player, playerEffects, decisionService } = createEffectOwner('Alice');
      const skippedAction = vi.fn();
      const usedExpiration = new OneTimeEffectExpirtation();
      usedExpiration.registerUse();
      playerEffects.addEffect(
        buildEffect({
          owner: createCard('Trader', 'wrong-target'),
          cardEligibility: cardNameIs('Gold'),
          mandatory: true,
          action: skippedAction,
        }),
      );
      playerEffects.addEffect(
        buildEffect({
          owner: createCard('Trader', 'expired'),
          expiration: usedExpiration,
          mandatory: true,
          action: skippedAction,
        }),
      );
      playerEffects.addEffect(
        buildEffect({
          owner: createCard('Trader', 'condition-fails'),
          condition: new EffectCondition(() => false),
          mandatory: true,
          action: skippedAction,
        }),
      );
      playerEffects.addEffect(
        buildEffect({
          owner: createCard('Trader', 'wrong-turn'),
          turnEligibility: { matches: () => false },
          mandatory: true,
          action: skippedAction,
        }),
      );
      const eligibleAction = vi.fn();
      playerEffects.addEffect(
        buildEffect({ owner: createCard('Trader', 'eligible'), mandatory: true, action: eligibleAction }),
      );

      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, player, createCard('Silver', 'silver-0'));

      expect(skippedAction).not.toHaveBeenCalled();
      expect(eligibleAction).toHaveBeenCalledTimes(1);
      expect(decisionService.chooseFromMultipleEvents).not.toHaveBeenCalled();
    });

    it('applies self effects only from the target cards themselves', async () => {
      const { player, playerEffects, ownedCardEffects } = createEffectOwner('Alice');
      const handCardAction = vi.fn();
      ownedCardEffects.push(
        buildEffect({
          owner: createCard('Border Village', 'in-hand'),
          self: true,
          mandatory: true,
          action: handCardAction,
        }),
      );
      const gainedCard = createCard('Border Village', 'gained');
      const gainedCardAction = vi.fn();
      gainedCard.addEffect(buildEffect({ owner: gainedCard, self: true, mandatory: true, action: gainedCardAction }));

      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, player, gainedCard);

      expect(gainedCardAction).toHaveBeenCalledWith(expect.anything(), gainedCard);
      expect(handCardAction).not.toHaveBeenCalled();
    });

    it('includes effects from cards in the deck only for shuffle triggers', async () => {
      const { player, playerEffects, deckEffects, ownedCards } = createEffectOwner('Alice');
      const deckAction = vi.fn();
      deckEffects.push(
        buildEffect({
          owner: createCard('Stash', 'stash-0'),
          trigger: EffectTriggerType.SHUFFLE,
          mandatory: true,
          action: deckAction,
        }),
      );

      await playerEffects.processEffectsByType(EffectTriggerType.GAIN, player, undefined);
      expect(ownedCards.getDeckEffectsByType).not.toHaveBeenCalled();

      await playerEffects.processEffectsByType(EffectTriggerType.SHUFFLE, player, undefined);
      expect(deckAction).toHaveBeenCalledTimes(1);
    });
  });
});
