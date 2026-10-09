import { CardCategory, CardType, Expansion, ScoringElementType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { Cost } from '../../src/card/Cost';
import { Effect } from '../../src/effects/Effect';
import { EffectAction } from '../../src/effects/EffectAction';
import { EffectSource } from '../../src/effects/EffectSource';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import { Game } from '../../src/Game';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { Player } from '../../src/players/Player';
import { PlayerEffects } from '../../src/players/PlayerEffects';

const createCard = (name: string, id: string, type: CardType = CardType.VICTORY): Card => {
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
    types: [type],
    expansion: Expansion.TESTING,
    mechanics: [],
  });
  card.setId(id);
  return card;
};

const createPlayer = () => {
  const sharedGameState = {
    isTurnEligibilitySatisfied: vi.fn(() => true),
    pushActiveEffectOntoStack: vi.fn(),
    popActiveEffectOffOfStack: vi.fn(),
  };
  const broadcaster = {
    updateStatistic: vi.fn(),
    updatePlayerCards: vi.fn(),
  };
  const game = {
    getGameState: () => sharedGameState,
    getMessageBroadcaster: () => broadcaster,
    getLogger: () => ({ gameMessage: vi.fn() }),
  } as unknown as Game;
  const decisionService = {
    chooseFromMultipleEvents: vi.fn(),
  };
  const client = {
    getDecisionService: () => decisionService,
    sendLogMessage: vi.fn(),
  };

  const player = new Player('Alice', game, client as never, true);
  return { player, game, client, decisionService, sharedGameState, broadcaster };
};

describe('Player', () => {
  it('exposes its name, game, client, and bot status', () => {
    const { player, game, client, decisionService } = createPlayer();
    const logMessage = { messages: [] } as never;

    player.transmitLogMessage(logMessage);

    expect(player.getName()).toBe('Alice');
    expect(player.getGame()).toBe(game);
    expect(player.getClient()).toBe(client);
    expect(player.isBotPlayer()).toBe(true);
    expect(player.getDecisionService()).toBe(decisionService);
    expect(client.sendLogMessage).toHaveBeenCalledWith(logMessage);
  });

  it('binds its effects to itself so effect actions run with its own instruction executor', async () => {
    const { player } = createPlayer();
    const action = vi.fn();
    const effect = new Effect.Builder()
      .from(createCard('Watchtower', 'watchtower-0', CardType.ACTION))
      .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
      .makeMandatory()
      .action(new EffectAction(action))
      .build();

    expect(player.getEffects()).toBeInstanceOf(PlayerEffects);
    player.getEffects().addEffect(effect);
    await player.getEffects().processEffectsByType(EffectTriggerType.GAIN, player, undefined);

    expect(action).toHaveBeenCalledWith(player.getInstructionExecutor());
    expect(player.getInstructionExecutor().getSharedGameState()).toBe(player.getGame().getGameState());
  });

  it('calculates its score from its cards plus VP chips and records the total', () => {
    const { player, broadcaster } = createPlayer();
    const duchy = createCard('Duchy', 'duchy-0');
    vi.spyOn(duchy, 'score').mockReturnValue(3);
    const curse = createCard('Curse', 'curse-0', CardType.CURSE);
    vi.spyOn(curse, 'score').mockReturnValue(-1);
    player.getOwnedCards().addCardToHand(duchy);
    player.getOwnedCards().addCardToDiscard(curse);
    player.getStatistics().addVP(4);

    const report = player.calculateScore();

    expect(report.total).toBe(6);
    expect(report.elements).toContainEqual({
      type: ScoringElementType.CARD,
      cardName: 'Duchy',
      count: 1,
      totalPoints: 3,
    });
    expect(report.elements).toContainEqual({ type: ScoringElementType.VP_CHIP, totalPoints: 4 });
    expect(player.getStatistics().getScore()).toBe(6);
    expect(broadcaster.updateStatistic).toHaveBeenCalled();
  });

  it('starts with a fresh pre-game turn tracker and per-player statistics', () => {
    const { player } = createPlayer();

    expect(player.getTurnTracker().getCurrentTurn().getOwner()).toBe(player);
    expect(player.getTurnTracker().getCurrentTurn().getNumber()).toBe(0);
    expect(player.getStatistics().getCoffers()).toBe(0);
    expect(player.getStatistics().getPotions()).toBe(0);
  });
});
