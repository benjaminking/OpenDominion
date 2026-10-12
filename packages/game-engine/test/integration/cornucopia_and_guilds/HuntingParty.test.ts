import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Hunting Party', () => {
  it('shuffles the discard pile when the deck runs out before finding a card not in hand', async () => {
    const game = createGame({ kingdom: ['Hunting Party'] });
    game.alice.setHand(['Hunting Party', 'Copper', 'Estate']);
    game.alice.setDeck(['Silver', 'Copper', 'Estate', 'Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Hunting Party');

    expect(game.alice.hand).toEqual(['Copper', 'Estate', 'Silver', 'Gold']);
    expect(game.alice.discard).toEqual(['Copper', 'Estate', 'Silver']);
    expect(game.alice.deck).toEqual([]);
  });

  it('discards every revealed card and adds nothing to hand when all of them are duplicates', async () => {
    const game = createGame({ kingdom: ['Hunting Party'] });
    game.alice.setHand(['Hunting Party', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Hunting Party');

    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    expect(game.alice.discard).toEqual(['Copper', 'Copper']);
    expect(game.alice.actions).toBe(1);
  });

  it('played twice by Throne Room, the second play compares with the hand including the card the first one found', async () => {
    const game = createGame({ kingdom: ['Hunting Party', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Hunting Party', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper', 'Estate', 'Silver', 'Silver', 'Gold', 'Duchy', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Hunting Party');

    // First play: draws Estate, skips Copper and Estate, finds Silver.
    // Second play: draws the other Silver, and finds Gold.
    expect(game.alice.hand).toEqual(['Copper', 'Estate', 'Silver', 'Silver', 'Gold']);
    expect(game.alice.discard).toEqual(['Copper', 'Estate']);
    expect(game.alice.deck).toEqual(['Duchy', 'Copper']);
    expect(game.alice.actions).toBe(2);
  });

  it('revealed cards set aside during the search are not shuffled into the new deck', async () => {
    const game = createGame({ kingdom: ['Hunting Party'] });
    game.alice.setHand(['Hunting Party', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper', 'Estate']);
    game.alice.setDiscard(['Copper', 'Estate']);

    await game.start();
    await game.playAction('Hunting Party');

    // Every card is a copy of one in hand: the reshuffled Copper and Estate are revealed too, and all are discarded
    expect(game.alice.hand).toEqual(['Copper', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect([...game.alice.discard].sort()).toEqual(['Copper', 'Copper', 'Estate', 'Estate']);
  });

  it('with no cards in the deck or discard pile, only gives +1 Action', async () => {
    const game = createGame({ kingdom: ['Hunting Party'] });
    game.alice.setHand(['Hunting Party']);

    await game.start();
    await game.playAction('Hunting Party');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it('treats differently named Ruins and Knights as different cards', async () => {
    const game = createGame({ kingdom: ['Hunting Party'] });
    game.alice.setHand(['Hunting Party', 'Ruined Library', 'Sir Martin']);
    game.alice.setDeck(['Copper', 'Ruined Library', 'Copper', 'Dame Anna', 'Ruined Market']);

    await game.start();
    await game.playAction('Hunting Party');

    // Draws Copper; then Ruined Library and Copper are copies, Dame Anna isn't
    expect(game.alice.hand).toEqual(['Ruined Library', 'Sir Martin', 'Copper', 'Dame Anna']);
    expect(game.alice.discard).toEqual(['Ruined Library', 'Copper']);
    expect(game.alice.deck).toEqual(['Ruined Market']);
  });
});
