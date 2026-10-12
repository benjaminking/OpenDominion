import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Carnival', () => {
  it('shuffles to reveal 4 cards when the deck is short', async () => {
    const game = createGame({ kingdom: ['Carnival'] });
    game.alice.setHand(['Carnival']);
    game.alice.setDeck(['Copper', 'Copper']);
    game.alice.setDiscard(['Silver', 'Silver']);

    await game.start();
    await game.playAction('Carnival');

    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    expect(game.alice.discard).toEqual(['Copper', 'Silver']);
    expect(game.alice.deck).toEqual([]);
  });

  it('only compares the revealed cards with each other, not with the hand', async () => {
    const game = createGame({ kingdom: ['Carnival'] });
    game.alice.setHand(['Carnival', 'Gold']);
    game.alice.setDeck(['Gold', 'Gold', 'Silver', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Carnival');

    expect(game.alice.hand).toEqual(['Gold', 'Gold', 'Silver', 'Estate']);
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.deck).toEqual(['Copper']);
  });

  it('a revealed duplicate Tunnel is discarded other than in Clean-up, so it can gain a Gold', async () => {
    const game = createGame({ kingdom: ['Carnival', 'Tunnel'] });
    game.alice.setHand(['Carnival']);
    game.alice.setDeck(['Tunnel', 'Tunnel', 'Copper', 'Estate', 'Silver']);

    await game.start();
    await game.playAction('Carnival');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect(game.alice.hand).toEqual(['Tunnel', 'Copper', 'Estate']);
    expect([...game.alice.discard].sort()).toEqual(['Gold', 'Tunnel']);
    expect(game.alice.deck).toEqual(['Silver']);
  });

  it('with no cards in the deck or discard pile, does nothing', async () => {
    const game = createGame({ kingdom: ['Carnival'] });
    game.alice.setHand(['Carnival', 'Copper']);

    await game.start();
    await game.playAction('Carnival');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.discard).toEqual([]);
  });

  it('with 1 card in the deck and 1 in the discard pile, reveals just those 2 after shuffling', async () => {
    const game = createGame({ kingdom: ['Carnival'] });
    game.alice.setHand(['Carnival']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Carnival');

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.deck).toEqual([]);
  });

  it('treats differently named Ruins and Knights as different cards', async () => {
    const game = createGame({ kingdom: ['Carnival'] });
    game.alice.setHand(['Carnival']);
    game.alice.setDeck(['Ruined Library', 'Ruined Market', 'Ruined Library', 'Sir Martin', 'Dame Anna']);

    await game.start();
    await game.playAction('Carnival');

    expect(game.alice.hand).toEqual(['Ruined Library', 'Ruined Market', 'Sir Martin']);
    expect(game.alice.discard).toEqual(['Ruined Library']);
    expect(game.alice.deck).toEqual(['Dame Anna']);
  });

  it('played twice by Throne Room, reveals 4 new cards the second time', async () => {
    const game = createGame({ kingdom: ['Carnival', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Carnival']);
    game.alice.setDeck(['Copper', 'Copper', 'Silver', 'Silver', 'Gold', 'Estate', 'Gold', 'Duchy', 'Province']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Carnival');

    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Gold', 'Estate', 'Duchy']);
    expect([...game.alice.discard].sort()).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual(['Province']);
  });
});
