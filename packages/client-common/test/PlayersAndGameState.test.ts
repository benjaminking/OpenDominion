import { CardLocation, CardType, NumberType, StatusAction } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { ClientGameState } from '../src/ClientGameState';
import { Players } from '../src/Players';
import { createCardMetadata } from './TestFixtures';

describe('Players', () => {
  it('creates players and routes statistic/card updates by owner name', () => {
    const players = new Players();

    players.createMainPlayer('Alice');
    players.addOpponent('Bob');

    expect(players.mainPlayer?.getPlayerName()).toBe('Alice');
    expect(players.otherPlayers.map((player) => player.name)).toEqual(['Bob']);

    players.updateStatistic('Alice', NumberType.COINS, 5);
    players.updateStatistic('Bob', NumberType.BUYS, 2);
    players.updateCards('Alice', CardLocation.HAND, [
      createCardMetadata('Village', { coins: 3, types: [CardType.ACTION] }),
      createCardMetadata('Village', { coins: 3, types: [CardType.ACTION], id: 'village-b' }),
    ]);

    expect(players.mainPlayer?.statistics.numCoins).toBe(5);
    expect(players.mainPlayer?.hand.getCardGroups().map((group) => [group.name, group.numCards])).toEqual([
      ['Village', 2],
    ]);
    expect(players.otherPlayers[0].statistics.numBuys).toBe(2);
  });
});

describe('ClientGameState', () => {
  it('applies game messages to observable client state', () => {
    const state = new ClientGameState();

    state.sendMainPlayerName('Alice');
    state.sendOpponentNames(['Bob']);
    state.sendTurnStartMessage('Alice');
    state.sendStatisticUpdate('Alice', NumberType.ACTIONS, 3);
    state.sendCardsUpdate('Alice', CardLocation.HAND, [
      createCardMetadata('Copper', { coins: 0, types: [CardType.TREASURE] }),
      createCardMetadata('Estate', { coins: 2, types: [CardType.VICTORY] }),
    ]);
    state.sendSharedCardsUpdate(CardLocation.TRASH, [
      createCardMetadata('Curse', { coins: 0, types: [CardType.CURSE] }),
    ]);
    state.sendPileMetadata({
      name: 'Village',
      size: 10,
      categories: [],
      cost: { coins: 3, debt: 0, potions: 0 },
      topCard: createCardMetadata('Village', { coins: 3, types: [CardType.ACTION] }),
      types: [CardType.ACTION],
    });
    state.sendBotCoins(6);
    state.sendBotCardCounts([
      { name: 'Copper', count: 5, card: createCardMetadata('Copper', { types: [CardType.TREASURE] }) },
    ]);

    expect(state.players.mainPlayer?.statistics.numActions).toBe(3);
    expect(state.players.mainPlayer?.hand.getCardGroups().map((group) => group.name)).toEqual(['Copper', 'Estate']);
    expect(state.trash.getCardGroups().map((group) => group.name)).toEqual(['Curse']);
    expect(state.piles.getCountInPile('Village')).toBe(10);
    expect(state.botStatistics.getCoinsInDeck()).toBe(6);
    expect(state.botStatistics.getCountInDeck('Copper')).toBe(5);
    expect(state.botStatistics.getCountInPile('Village')).toBe(10);
  });

  it('manages status stack for replace, push, and pop actions', () => {
    const state = new ClientGameState();

    state.sendStatus('loading', StatusAction.REPLACE);
    state.sendStatus('waiting', StatusAction.PUSH);
    state.sendStatus('active', StatusAction.REPLACE);
    state.sendStatus('ignored', StatusAction.POP);

    const internalState = state as unknown as { statusStack: string[] };
    expect(internalState.statusStack).toEqual(['loading']);

    state.sendStatus('ignored', StatusAction.POP);
    expect(internalState.statusStack).toEqual([]);

    state.sendStatus('no-op', StatusAction.POP);
    expect(internalState.statusStack).toEqual([]);
  });
});
