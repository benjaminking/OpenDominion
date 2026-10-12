import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('WishingWell', () => {
  it('shuffles the discard pile to reveal when the deck is empty after drawing', async () => {
    const game = createGame({ kingdom: ['Wishing Well'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Wishing Well');
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it('leaves a revealed card that was not named on top of the deck', async () => {
    const game = createGame({ kingdom: ['Wishing Well'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Wishing Well');
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.deck).toEqual(['Gold', 'Copper']);
  });

  it('reveals nothing when the deck and discard pile are empty', async () => {
    const game = createGame({ kingdom: ['Wishing Well'] });
    game.alice.setHand(['Wishing Well', 'Copper']);

    await game.start();
    await game.playAction('Wishing Well');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Gold');
    }

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.actions).toBe(1);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('lets the player name a card whose Supply pile is empty', async () => {
    const game = createGame({ kingdom: ['Wishing Well'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper', 'Gold', 'Copper']);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Wishing Well');
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
  });

  it('can name an individual Knight, which is put into hand when it is on top', async () => {
    const game = createGame({ kingdom: ['Wishing Well', 'Knights'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper', 'Sir Martin', 'Copper']);

    await game.start();
    await game.playAction('Wishing Well');
    const names = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(names).toContain('Sir Martin');
    expect(names).toContain('Dame Anna');
    await game.chooseCard('Sir Martin');

    expect(game.alice.hand).toEqual(['Copper', 'Sir Martin']);
    expect(game.alice.deck).toEqual(['Copper']);
  });

  it('can name an individual Ruins card', async () => {
    const game = createGame({ kingdom: ['Wishing Well', 'Cultist'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper', 'Ruined Village', 'Copper']);

    await game.start();
    await game.playAction('Wishing Well');
    await game.chooseCard('Ruined Village');

    expect(game.alice.hand).toEqual(['Copper', 'Ruined Village']);
  });

  it('can name a non-Supply card (Madman) and a card that is only in the trash', async () => {
    const game = createGame({ kingdom: ['Wishing Well', 'Hermit'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper', 'Madman', 'Copper']);
    game.setTrash(['Fortress']);

    await game.start();
    await game.playAction('Wishing Well');
    const names = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(names).toContain('Fortress');
    await game.chooseCard('Madman');

    expect(game.alice.hand).toEqual(['Copper', 'Madman']);
  });

  it('names a card twice when played by Throne Room, each time checking the current top card', async () => {
    const game = createGame({ kingdom: ['Wishing Well', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Wishing Well']);
    game.alice.setDeck(['Copper', 'Gold', 'Silver', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Wishing Well');
    // First play draws Copper and names the Gold
    await game.chooseCard('Gold');
    // Second play draws Silver; Estate is on top, but Duchy is named
    await game.chooseCard('Duchy');

    expect(game.alice.hand).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual(['Estate', 'Copper']);
    expect(game.alice.actions).toBe(2);
  });

  it('puts a named Rats on top into hand, which does not trigger anything', async () => {
    const game = createGame({ kingdom: ['Wishing Well', 'Rats'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper', 'Rats', 'Copper']);
    const rats = game.pileSize('Rats');

    await game.start();
    await game.playAction('Wishing Well');
    await game.chooseCard('Rats');

    expect(game.alice.hand).toEqual(['Copper', 'Rats']);
    expect(game.alice.deck).toEqual(['Copper']);
    expect(game.pileSize('Rats')).toBe(rats);
  });

  it('counts a named Victory card put into hand only once', async () => {
    const game = createGame({ kingdom: ['Wishing Well'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck(['Copper', 'Duchy', 'Copper']);

    await game.start();
    await game.playAction('Wishing Well');
    await game.chooseCard('Duchy');

    expect(game.alice.hand).toEqual(['Copper', 'Duchy']);
    expect(game.alice.score).toBe(3);
  });

  it('reveals nothing after drawing the only card left by reshuffling', async () => {
    const game = createGame({ kingdom: ['Wishing Well'] });
    game.alice.setHand(['Wishing Well']);
    game.alice.setDeck([]);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Wishing Well');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Gold');
    }

    expect(game.alice.hand).toEqual(['Silver']);
    expect(game.alice.actions).toBe(1);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });
});
