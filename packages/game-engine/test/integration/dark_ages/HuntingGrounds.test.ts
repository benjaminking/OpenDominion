import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('HuntingGrounds', () => {
  it('when trashed by your own card, gains a Duchy or 3 Estates, your choice', async () => {
    const game = createGame({ kingdom: ['Hunting Grounds', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Hunting Grounds', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Hunting Grounds');

    game.expectDecision('chooseOneOption', 'Alice');
    expect(game.pending.options).toEqual(['Gain a Duchy', 'Gain 3 Estates']);
    await game.chooseOption('Gain 3 Estates');

    expect(game.trash).toEqual(['Hunting Grounds']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate', 'Estate']);
  });

  it("when trashed by another player's Rogue, lets its owner choose", async () => {
    const game = createGame({ kingdom: ['Hunting Grounds', 'Rogue'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Hunting Grounds', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Rogue');

    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Gain a Duchy');

    expect(game.trash).toEqual(['Hunting Grounds']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Duchy', 'Copper']));
    expect(game.bob.discard).toHaveLength(2);
    expect(game.alice.coins).toBe(2);
  });

  it('can choose a Duchy even when the Duchy pile is empty, gaining nothing', async () => {
    const game = createGame({ kingdom: ['Hunting Grounds', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Hunting Grounds', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Duchy', 0);
    const estates = game.pileSize('Estate');

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Hunting Grounds');
    await game.chooseOption('Gain a Duchy');

    expect(game.alice.discard).toEqual([]);
    expect(game.pileSize('Estate')).toBe(estates);
  });
});

describe('HuntingGrounds: interactions', () => {
  it('when Lurker trashes it from the Supply, you gain a Duchy or 3 Estates', async () => {
    const game = createGame({ kingdom: ['Hunting Grounds', 'Lurker'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption('Trash an Action card from the Supply');
    await game.chooseCard('Hunting Grounds', CardLocation.PILE);

    game.expectDecision('chooseOneOption', 'Alice');
    await game.chooseOption('Gain a Duchy');

    expect(game.trash).toEqual(['Hunting Grounds']);
    expect(game.alice.discard).toEqual(['Duchy']);
  });

  it('gaining the last 2 Estates as the third empty Supply pile ends the game', async () => {
    const game = createGame({ kingdom: ['Hunting Grounds', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Hunting Grounds', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Estate', 2);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Hunting Grounds');
    await game.chooseOption('Gain 3 Estates');

    expect(game.alice.discard).toEqual(['Estate', 'Estate']);
    expect(game.pileSize('Estate')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it('draws as many as it can when the deck and discard pile hold fewer than 4 cards, reshuffling mid-draw', async () => {
    const game = createGame({ kingdom: ['Hunting Grounds'] });
    game.alice.setHand(['Hunting Grounds', 'Copper']);
    game.alice.setDeck(['Gold', 'Gold']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Hunting Grounds');

    expect(game.alice.hand).toEqual(['Copper', 'Gold', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });
});
