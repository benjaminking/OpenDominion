import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Remodel', () => {
  it('asks nothing and gains nothing when the hand is empty', async () => {
    const game = createGame({ kingdom: ['Remodel'] });
    game.alice.setHand(['Remodel']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remodel');

    expect(game.pending.kind).toBe('buyPhase');
    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('must trash a card, then must gain a card costing up to $2 more into the discard pile', async () => {
    const game = createGame({ kingdom: ['Remodel', 'Smithy', 'Market'] });
    game.alice.setHand(['Remodel', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remodel');
    const trashDecision = game.expectDecision('chooseCard', 'Alice');
    expect(trashDecision.noneAllowed).toBe(false);
    expect(trashDecision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Estate']);
    await game.chooseCard('Estate');

    const gainDecision = game.expectDecision('chooseCard', 'Alice');
    expect(gainDecision.noneAllowed).toBe(false);
    const offered = gainDecision.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Smithy', 'Silver', 'Estate', 'Copper', 'Curse']));
    expect(offered).not.toContain('Market');
    expect(offered).not.toContain('Duchy');
    await game.chooseCard('Smithy');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Smithy']);
    expect(game.alice.hand).toEqual(['Copper']);
  });

  it('uses the reduced costs of both cards while Bridge is in effect', async () => {
    const game = createGame({ kingdom: ['Remodel', 'Bridge', 'Festival', 'Smithy', 'Market'] });
    game.alice.setHand(['Festival', 'Bridge', 'Remodel', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Bridge');
    await game.playAction('Remodel');
    await game.chooseCard('Estate');

    // Estate costs $1, so Remodel gains a card costing up to $3: Smithy ($4 - $1) but not Market ($5 - $1)
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Market');
    expect(offered).not.toContain('Duchy');
    await game.chooseCard('Smithy');
    expect(game.alice.discard).toEqual(['Smithy']);
  });

  it('turns a Gold into a Province while Bridge makes both cost $1 less', async () => {
    const game = createGame({ kingdom: ['Remodel', 'Bridge', 'Festival'] });
    game.alice.setHand(['Festival', 'Bridge', 'Remodel', 'Gold']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Bridge');
    await game.playAction('Remodel');
    await game.chooseCard('Gold');
    // Gold costs $5, so up to $7: Province costs $7
    await game.chooseCard('Province');

    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Province']);
  });

  it("uses Peddler's full cost in the Action phase, whatever is in play", async () => {
    const game = createGame({ kingdom: ['Remodel', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Village', 'Remodel', 'Silver', 'Gold']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Remodel');
    await game.chooseCard('Silver');
    // Silver: up to $5. Peddler costs $8 outside the Buy phase, even with 3 Actions in play
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)).not.toContain(
      'Peddler',
    );
  });

  it('trashes a card and gains nothing when no card costs little enough', async () => {
    const game = createGame({ kingdom: ['Remodel'] });
    game.alice.setHand(['Remodel', 'Curse', 'Copper']);
    game.alice.setDeck(coppers(10));
    // Every pile costing up to $2: Curse, Copper, Estate and the $2 fillers (Cellar, Chapel)
    for (const pile of ['Curse', 'Copper', 'Estate', 'Cellar', 'Chapel']) {
      game.setPileSize(pile, 0);
    }

    await game.start();
    await game.playAction('Remodel');
    await game.chooseCard('Curse');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.discard).toEqual([]);
  });

  it('gaining the last Province ends the game after the turn, not immediately', async () => {
    const game = createGame({ kingdom: ['Remodel'] });
    game.alice.setHand(['Remodel', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Remodel');
    await game.chooseCard('Gold');
    await game.chooseCard('Province');

    expect(game.pileSize('Province')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Gold');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Province', 'Gold']));
  });

  it('keeps the Potion in a cost: a $4P card gains up to $6P, while a $6 card gains nothing that costs a Potion', async () => {
    const game = createGame({ kingdom: ['Remodel', 'Throne Room', 'Golem', 'Familiar', 'Vineyard'] });
    game.alice.setHand(['Throne Room', 'Remodel', 'Golem', 'Gold']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Remodel');
    await game.chooseCard('Golem');
    // Golem costs $4P: up to $6P
    const first = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(first).toEqual(expect.arrayContaining(['Gold', 'Golem', 'Familiar', 'Vineyard', 'Potion']));
    expect(first).not.toContain('Province');
    await game.chooseCard('Familiar');

    await game.chooseCard('Gold');
    // Gold costs $6: up to $8, but no card with a Potion in its cost
    const second = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(second).toEqual(expect.arrayContaining(['Province', 'Gold', 'Potion']));
    for (const potionCard of ['Golem', 'Familiar', 'Vineyard']) {
      expect(second).not.toContain(potionCard);
    }
    await game.chooseCard('Province');

    expect(game.trash.sort()).toEqual(['Gold', 'Golem']);
    expect(game.alice.discard.sort()).toEqual(['Familiar', 'Province']);
  });

  it('still gains a card costing up to $2 more than a trashed Fortress that has gone back to the hand', async () => {
    const game = createGame({ kingdom: ['Remodel', 'Fortress', 'Laboratory'] });
    game.alice.setHand(['Remodel', 'Fortress', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remodel');
    await game.chooseCard('Fortress');
    // Fortress: when you trash this, put it into your hand
    expect(game.alice.hand.sort()).toEqual(['Estate', 'Fortress']);
    const offeredNames = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(offeredNames).toEqual(expect.arrayContaining(['Gold', 'Laboratory']));
    expect(offeredNames).not.toContain('Province');
    await game.chooseCard('Gold');

    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Gold']);
  });
});
