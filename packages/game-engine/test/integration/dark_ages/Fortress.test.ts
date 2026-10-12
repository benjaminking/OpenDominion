import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { anyCard } from '../../../src/StandardCardEligibilityFunctions';
import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Fortress', () => {
  it('returns to hand when Death Cart trashes it, and Death Cart still gives +$5', async () => {
    const game = createGame({ kingdom: ['Fortress', 'Death Cart'] });
    game.alice.setHand(['Death Cart', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Death Cart');
    await game.chooseCard('Fortress');

    expect(game.alice.coins).toBe(5);
    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.inPlay).toEqual(['Death Cart']);
  });

  it("goes to its owner's hand when trashed by another player's Knight", async () => {
    const game = createGame({ kingdom: ['Fortress', 'Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Fortress', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual([]);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', 'Fortress']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.currentPlayerName).toBe('Alice');
  });
});

describe('Fortress: interactions', () => {
  it('returns to hand when Chapel trashes it along with other cards', async () => {
    const game = createGame({ kingdom: ['Fortress', 'Chapel'] });
    game.alice.setHand(['Chapel', 'Fortress', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Fortress', 'Copper', 'Estate', 'Estate']);

    expect(game.trash).toEqual(['Copper', 'Estate', 'Estate']);
    expect(game.alice.hand).toEqual(['Fortress']);
  });

  it('goes into your hand when Lurker trashes it from the Supply, without being gained', async () => {
    const game = createGame({ kingdom: ['Fortress', 'Lurker'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const fortresses = game.pileSize('Fortress');

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption('Trash an Action card from the Supply');
    await game.chooseCard('Fortress', CardLocation.PILE);

    expect(game.trash).toEqual([]);
    expect(game.pileSize('Fortress')).toBe(fortresses - 1);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.player.getTurnTracker().numMatchingCardsGainedThisTurn(anyCard)).toBe(0);
    // Lurker's +1 Action lets Alice play it now
    await game.playAction('Fortress');
    expect(game.alice.actions).toBe(2);
  });

  it('played twice by Procession: is trashed into hand, and Procession still gains an Action costing exactly $5', async () => {
    const game = createGame({ kingdom: ['Fortress', 'Procession', 'Market', 'Laboratory'] });
    game.alice.setHand(['Procession', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Fortress');

    // +2 Cards, +4 Actions; then Fortress is trashed and returns to hand
    game.expectDecision('chooseCard', 'Alice');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Market');
    expect(offered).toContain('Laboratory');
    expect(offered).not.toContain('Fortress');
    await game.chooseCard('Market', CardLocation.PILE);

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.inPlay).toEqual(['Procession']);
    expect(game.alice.discard).toEqual(['Market']);
    expect(game.alice.actions).toBe(4);
  });

  it('played twice by Throne Room gives +2 Cards and +4 Actions', async () => {
    const game = createGame({ kingdom: ['Fortress', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Fortress', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Fortress');

    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Silver', 'Gold']);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Fortress']);
  });

  it('trashed by Sentry from the cards it looks at goes into hand, and the other card is handled normally', async () => {
    const game = createGame({ kingdom: ['Fortress', 'Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Fortress', 'Estate', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards(['Fortress', 'Estate']);

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.deck[0]).toBe('Silver');
    // Sentry's +1 Action lets Alice play it
    await game.playAction('Fortress');
    expect(game.alice.actions).toBe(2);
  });

  it('draws nothing with an empty deck and discard pile, but still gives +2 Actions', async () => {
    const game = createGame({ kingdom: ['Fortress'] });
    game.alice.setHand(['Fortress', 'Copper']);

    await game.start();
    await game.playAction('Fortress');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.actions).toBe(2);
  });
});
