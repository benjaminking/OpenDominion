import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { CardCollection } from '../src/card/CardCollection';
import { Cost } from '../src/card/Cost';
import { CostModifier } from '../src/effects/CostModifier';
import { EffectSource } from '../src/effects/EffectSource';
import { EffectTriggerType } from '../src/effects/EffectTriggerType';
import { Player } from '../src/players/Player';
import { SharedGameState } from '../src/game-state/SharedGameState';

const createPlayerStub = (
  name: string,
  options?: { score?: number; turnNumber?: number; unofficialTurnNumber?: number },
) => {
  const instructionExecutor = {
    processEffectsByType: vi.fn(async () => undefined),
  };
  const effects = {
    clearBlocksForAttackCard: vi.fn(),
    isAttackBlocked: vi.fn(() => false),
  };
  const statistics = {
    getTurnNumber: vi.fn(() => options?.turnNumber ?? 1),
    getUnofficialTurnNumber: vi.fn(() => options?.unofficialTurnNumber ?? 1),
    getScore: vi.fn(() => options?.score ?? 0),
  };

  const player = {
    getName: vi.fn(() => name),
    getInstructionExecutor: vi.fn(() => instructionExecutor),
    getEffects: vi.fn(() => effects),
    getStatistics: vi.fn(() => statistics),
  } as unknown as Player;

  return {
    player,
    instructionExecutor,
    effects,
    statistics,
  };
};

const createSharedGameState = (playerStubs: ReturnType<typeof createPlayerStub>[]) => {
  const players = playerStubs.map((stub) => stub.player);
  const playersCollection = {
    numTotalPlayers: vi.fn(() => players.length),
    getPlayerAtIndex: vi.fn((index: number) => players[index]),
    getPlayerByName: vi.fn((name: string) => players.find((player) => player.getName() === name)),
    getAllPlayers: vi.fn(() => players),
    [Symbol.iterator]: () => players[Symbol.iterator](),
  };

  const game = {
    getMessageBroadcaster: vi.fn(() => ({
      updateSharedCards: vi.fn(),
    })),
    getLogger: vi.fn(() => ({
      gameMessage: vi.fn(),
    })),
    getPlayers: vi.fn(() => playersCollection),
    getPlayerIndex: vi.fn((player: unknown) => players.indexOf(player as never)),
  };

  return new SharedGameState(game as never);
};

const findPlayerNameByInstructionExecutor = (
  playerStubs: ReturnType<typeof createPlayerStub>[],
  instructionExecutor: object,
) => {
  const matchingStub = playerStubs.find((stub) => stub.instructionExecutor === instructionExecutor);
  if (matchingStub === undefined) {
    throw new Error('Instruction executor did not map to a known player stub.');
  }
  return matchingStub.player.getName();
};

describe('SharedGameState', () => {
  it('rotates the current player, reports left-of-current, and builds turn order from the active seat', () => {
    const alice = createPlayerStub('Alice', { score: 5, turnNumber: 2, unofficialTurnNumber: 3 });
    const bob = createPlayerStub('Bob', { score: 8, turnNumber: 4, unofficialTurnNumber: 6 });
    const cara = createPlayerStub('Cara', { score: 3, turnNumber: 1, unofficialTurnNumber: 2 });
    const state = createSharedGameState([alice, bob, cara]);

    expect(state.getCurrentPlayer()).toBe(alice.player);
    expect(state.getPlayerLeftOfCurrent()).toBe(bob.player);

    state.switchCurrentPlayer();

    expect(state.getCurrentPlayer()).toBe(bob.player);
    expect(state.getPlayerLeftOfCurrent()).toBe(cara.player);
    expect(state.getCurrentTurnOrder()).toEqual([bob.player, cara.player, alice.player]);

    state.switchToPlayer(cara.player);

    const turn = state.getCurrentTurn();
    expect(state.getCurrentPlayer()).toBe(cara.player);
    expect(turn.getOwner()).toBe(cara.player);
    expect(turn.getNumber()).toBe(1);
    expect(turn.getUnofficialNumber()).toBe(2);
  });

  it('executes shared callbacks in current turn order and can exclude the current player', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const cara = createPlayerStub('Cara');
    const playerStubs = [alice, bob, cara];
    const state = createSharedGameState(playerStubs);
    const allPlayersVisited: string[] = [];
    const otherPlayersVisited: string[] = [];

    state.switchToPlayer(bob.player);

    await state.executeForEachPlayer(async (instructionExecutor) => {
      allPlayersVisited.push(findPlayerNameByInstructionExecutor(playerStubs, instructionExecutor));
    });
    await state.executeForEachOtherPlayer(async (instructionExecutor) => {
      otherPlayersVisited.push(findPlayerNameByInstructionExecutor(playerStubs, instructionExecutor));
    });

    expect(allPlayersVisited).toEqual(['Bob', 'Cara', 'Alice']);
    expect(otherPlayersVisited).toEqual(['Cara', 'Alice']);
  });

  it('looks up scores by player name and defaults missing players to 0', () => {
    const alice = createPlayerStub('Alice', { score: 11 });
    const bob = createPlayerStub('Bob', { score: 7 });
    const state = createSharedGameState([alice, bob]);

    expect(state.getScoreByName('Alice')).toBe(11);
    expect(state.getScoreByName('Missing')).toBe(0);
  });

  it('identifies shared locations and exposes only shared card areas', () => {
    const state = createSharedGameState([createPlayerStub('Alice')]);

    expect(state.isSharedLocation(CardLocation.PILE)).toBe(true);
    expect(state.isSharedLocation(CardLocation.TRASH)).toBe(true);
    expect(state.isSharedLocation(CardLocation.HAND)).toBe(false);

    expect(state.getCardsFromArea(CardLocation.TRASH)).toBe(state.trash);
    expect(state.getCardsFromArea(CardLocation.PILE).isEmpty()).toBe(true);
    expect(() => state.getCardsFromArea(CardLocation.HAND)).toThrow(
      'Trying to get a player-owned card collection from the shared game state',
    );
  });

  it('routes triggered effects to the correct player set based on the registered effect source', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const cara = createPlayerStub('Cara');
    const state = createSharedGameState([alice, bob, cara]);
    const cards = new CardCollection();

    await state.triggerEffect(EffectTriggerType.BUY, cards);

    expect(alice.instructionExecutor.processEffectsByType).not.toHaveBeenCalled();
    expect(bob.instructionExecutor.processEffectsByType).not.toHaveBeenCalled();
    expect(cara.instructionExecutor.processEffectsByType).not.toHaveBeenCalled();

    state.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.SELF);
    await state.triggerEffect(EffectTriggerType.BUY, cards);

    expect(alice.instructionExecutor.processEffectsByType).toHaveBeenCalledTimes(1);
    expect(alice.instructionExecutor.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, cards);
    expect(bob.instructionExecutor.processEffectsByType).not.toHaveBeenCalled();
    expect(cara.instructionExecutor.processEffectsByType).not.toHaveBeenCalled();

    vi.clearAllMocks();

    const otherPlayersOnlyState = createSharedGameState([alice, bob, cara]);
    otherPlayersOnlyState.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.OTHER_PLAYER);
    await otherPlayersOnlyState.triggerEffect(EffectTriggerType.BUY, cards);

    expect(alice.instructionExecutor.processEffectsByType).not.toHaveBeenCalled();
    expect(bob.instructionExecutor.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, cards);
    expect(cara.instructionExecutor.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, cards);

    vi.clearAllMocks();

    const allPlayersState = createSharedGameState([alice, bob, cara]);
    allPlayersState.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.SELF);
    allPlayersState.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.OTHER_PLAYER);
    await allPlayersState.triggerEffect(EffectTriggerType.BUY, cards);

    expect(alice.instructionExecutor.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, cards);
    expect(bob.instructionExecutor.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, cards);
    expect(cara.instructionExecutor.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, cards);
  });

  it('applies added cost modifiers in order using the current turn', () => {
    const alice = createPlayerStub('Alice', { turnNumber: 4, unofficialTurnNumber: 6 });
    const state = createSharedGameState([alice]);
    const card = {
      getOriginalCost: vi.fn(() => Cost.Simple(8)),
    };
    const firstModifier: Pick<CostModifier, 'apply'> = {
      apply: vi.fn((receivedCard, receivedCost, receivedTurn) => {
        expect(receivedCard).toBe(card);
        expect(receivedCost.coins).toBe(8);
        expect(receivedTurn.getOwner()).toBe(alice.player);
        expect(receivedTurn.getNumber()).toBe(4);
        expect(receivedTurn.getUnofficialNumber()).toBe(6);
        return receivedCost.plus(-2);
      }),
    };
    const secondModifier: Pick<CostModifier, 'apply'> = {
      apply: vi.fn((_receivedCard, receivedCost) => receivedCost.plus(-1)),
    };

    state.addCostModifier(firstModifier as CostModifier);
    state.addCostModifier(secondModifier as CostModifier);

    const cost = state.cost(card as never);

    expect(firstModifier.apply).toHaveBeenCalledTimes(1);
    expect(secondModifier.apply).toHaveBeenCalledTimes(1);
    expect(cost.coins).toBe(5);
  });

  it('tracks the active effect stack in LIFO order and exposes the attack-blocked flag', () => {
    const state = createSharedGameState([createPlayerStub('Alice')]);
    const firstEffect = { id: 'first' } as never;
    const secondEffect = { id: 'second' } as never;

    expect(state.attackWasBlocked).toBe(false);

    state.attackWasBlocked = true;
    state.pushActiveEffectOntoStack(firstEffect);
    state.pushActiveEffectOntoStack(secondEffect);

    expect(state.attackWasBlocked).toBe(true);
    expect(state.popActiveEffectOffOfStack()).toBe(secondEffect);
    expect(state.popActiveEffectOffOfStack()).toBe(firstEffect);
    expect(() => state.popActiveEffectOffOfStack()).toThrow(
      'Tried to pop an effect off the global stack when it was empty.',
    );
  });

  it('clears attack blocks for each player in turn order and only attacks unblocked opponents', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const cara = createPlayerStub('Cara');
    const state = createSharedGameState([alice, bob, cara]);
    const attackCard = {
      getId: vi.fn(() => 'militia-id'),
    };
    const clearedPlayers: string[] = [];
    const attackedPlayers: string[] = [];

    bob.effects.clearBlocksForAttackCard.mockImplementation(() => {
      clearedPlayers.push('Bob');
    });
    cara.effects.clearBlocksForAttackCard.mockImplementation(() => {
      clearedPlayers.push('Cara');
    });
    alice.effects.clearBlocksForAttackCard.mockImplementation(() => {
      clearedPlayers.push('Alice');
    });
    bob.effects.isAttackBlocked.mockReturnValue(true);
    cara.effects.isAttackBlocked.mockReturnValue(false);

    state.switchToPlayer(bob.player);
    state.clearBlocksForAttackCard(attackCard as never);
    await state.performAttack(bob.player, attackCard as never, async (attackedPlayer) => {
      attackedPlayers.push(attackedPlayer.getName());
    });

    expect(clearedPlayers).toEqual(['Bob', 'Cara', 'Alice']);
    expect(attackedPlayers).toEqual(['Cara', 'Alice']);
  });
});
