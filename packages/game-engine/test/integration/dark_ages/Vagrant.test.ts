import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Vagrant', () => {
  it('draws the last card of the deck, then shuffles to reveal and takes a Victory card', async () => {
    const game = createGame({ kingdom: ['Vagrant'] });
    game.alice.setHand(['Vagrant', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Estate']);

    await game.start();
    await game.playAction('Vagrant');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it.each(['Dame Josephine', 'Overgrown Estate', 'Hovel'])('puts a revealed %s into hand', async (cardName) => {
    const game = createGame({ kingdom: ['Vagrant', 'Knights'] });
    game.alice.setHand(['Vagrant', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', cardName, ...COPPERS]);

    await game.start();
    await game.playAction('Vagrant');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', cardName]);
  });

  it.each(['Ruined Library', 'Curse', 'Necropolis', 'Mill'])('puts a revealed %s into hand', async (cardName) => {
    const game = createGame({ kingdom: ['Vagrant', 'Cultist', 'Mill'] });
    game.alice.setHand(['Vagrant', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', cardName, ...COPPERS]);

    await game.start();
    await game.playAction('Vagrant');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', cardName]);
    expect(game.alice.deck[0]).toBe('Copper');
  });

  it('leaves a revealed Action-Treasure (Coronet) on top of the deck', async () => {
    const game = createGame({ kingdom: ['Vagrant'] });
    game.alice.setHand(['Vagrant', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Coronet', ...COPPERS]);

    await game.start();
    await game.playAction('Vagrant');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.deck[0]).toBe('Coronet');
  });
  it.each(['Farm', 'Nobles', 'Tunnel', 'Feodum'])(
    'puts a revealed %s (a Victory card with other types) into hand',
    async (cardName) => {
      const game = createGame({ kingdom: ['Vagrant', 'Farm', 'Nobles', 'Tunnel', 'Feodum'] });
      game.alice.setHand(['Vagrant', 'Copper', 'Copper', 'Copper', 'Copper']);
      game.alice.setDeck(['Silver', cardName, ...COPPERS]);

      await game.start();
      await game.playAction('Vagrant');

      expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', cardName]);
    },
  );

  it("leaves a revealed Fool's Gold (Treasure-Reaction) on top of the deck", async () => {
    const game = createGame({ kingdom: ['Vagrant', "Fool's Gold"] });
    game.alice.setHand(['Vagrant', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', "Fool's Gold", ...COPPERS]);

    await game.start();
    await game.playAction('Vagrant');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.deck[0]).toBe("Fool's Gold");
  });

  it('draws the last card and reveals nothing when the discard pile is empty', async () => {
    const game = createGame({ kingdom: ['Vagrant'] });
    game.alice.setHand(['Vagrant', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate']);

    await game.start();
    await game.playAction('Vagrant');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });
});
