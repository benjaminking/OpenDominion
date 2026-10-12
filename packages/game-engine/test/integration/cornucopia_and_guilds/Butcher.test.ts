import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (cardChoices: { card: { name: string } }[]): string[] =>
  cardChoices.map((choice) => choice.card.name);

describe('Butcher', () => {
  it('can spend the Coffers it just gave to gain a card costing up to $1 more per Coffers spent', async () => {
    const game = createGame({ kingdom: ['Butcher'] });
    game.alice.setHand(['Butcher', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Butcher');
    await game.chooseCard('Estate');
    expect(game.pending.options).toEqual(['0', '1', '2']);
    await game.chooseOption('2');

    // Estate ($2) + 2 Coffers: up to $4
    expect(offeredNames(game.pending.cardChoices)).toContain('Smithy');
    expect(offeredNames(game.pending.cardChoices)).not.toContain('Market');
    await game.chooseCard('Smithy');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Smithy']);
    expect(game.alice.coffers).toBe(0);
    // Spending Coffers this way doesn't give $
    expect(game.alice.coins).toBe(0);
  });

  it('spending no Coffers gains a card costing up to the cost of the trashed card', async () => {
    const game = createGame({ kingdom: ['Butcher'] });
    game.alice.setHand(['Butcher', 'Butcher', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Butcher');
    await game.chooseCard('Butcher');
    await game.chooseOption('0');

    expect(offeredNames(game.pending.cardChoices)).toContain('Duchy');
    expect(offeredNames(game.pending.cardChoices)).not.toContain('Gold');
    await game.chooseCard('Duchy');

    expect(game.alice.discard).toEqual(['Duchy']);
    expect(game.alice.coffers).toBe(2);
  });

  it("can also spend the Coffers from Baker's setup", async () => {
    const game = createGame({ kingdom: ['Butcher', 'Baker'] });
    game.alice.setHand(['Butcher', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Butcher');
    await game.chooseCard('Estate');
    expect(game.pending.options).toEqual(['0', '1', '2', '3']);
    await game.chooseOption('3');
    await game.chooseCard('Baker');

    expect(game.alice.discard).toEqual(['Baker']);
    expect(game.alice.coffers).toBe(0);
  });

  it('only gives +2 Coffers with an empty hand', async () => {
    const game = createGame({ kingdom: ['Butcher'] });
    game.alice.setHand(['Butcher']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Butcher');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.coffers).toBe(2);
    expect(game.trash).toEqual([]);
  });

  it('must gain a card once it has trashed one', async () => {
    const game = createGame({ kingdom: ['Butcher'] });
    game.alice.setHand(['Butcher', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Butcher');
    await game.chooseCard('Estate');
    await game.chooseOption('0');

    // Rule (Butcher FAQ): if you trashed a card, you gain a card costing up to its cost plus the Coffers spent
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Estate');
    expect(game.alice.discard).toEqual(['Estate']);
  });

  it('trashing a Fortress returns it to hand, and still gains a card', async () => {
    const game = createGame({ kingdom: ['Butcher', 'Fortress'] });
    game.alice.setHand(['Butcher', 'Fortress']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Butcher');
    await game.chooseCard('Fortress');
    await game.chooseOption('1');
    // Fortress ($4) + 1 Coffers: up to $5
    expect(offeredNames(game.pending.cardChoices)).toContain('Market');
    await game.chooseCard('Market');

    expect(game.alice.hand).toEqual(['Fortress']);
    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Market']);
    expect(game.alice.coffers).toBe(1);
  });

  it('with Bridge in play, compares reduced costs: an Estate ($1) plus 1 Coffers gains a card costing up to $2', async () => {
    const game = createGame({ kingdom: ['Butcher', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Butcher', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Butcher');
    await game.chooseCard('Estate');
    await game.chooseOption('1');

    // Silver ($3) and Village ($3) cost $2; Smithy ($4) costs $3
    expect(offeredNames(game.pending.cardChoices)).toEqual(expect.arrayContaining(['Silver', 'Village']));
    expect(offeredNames(game.pending.cardChoices)).not.toContain('Smithy');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.coffers).toBe(1);
  });

  it('with two Bridges, costs are floored at $0: a Copper with no Coffers spent gains only a card costing $0', async () => {
    const game = createGame({ kingdom: ['Butcher', 'Bridge', 'Throne Room'] });
    game.alice.setHand(['Village', 'Throne Room', 'Bridge', 'Butcher', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAction('Butcher');
    await game.chooseCard('Copper');
    await game.chooseOption('0');

    // Estate ($2) costs $0; Silver ($3) costs $1
    expect(offeredNames(game.pending.cardChoices)).toEqual(expect.arrayContaining(['Estate', 'Copper', 'Curse']));
    expect(offeredNames(game.pending.cardChoices)).not.toContain('Silver');
    await game.chooseCard('Estate');
    expect(game.alice.discard).toEqual(['Estate']);
  });

  it('compares Potion costs: Coffers add only $, so a $2P card can become a $3P card but a $3 card cannot', async () => {
    const game = createGame({ kingdom: ['Butcher', 'University', 'Alchemist', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Butcher', 'University', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Butcher');
    await game.chooseCard('University');
    await game.chooseOption('1');
    expect(offeredNames(game.pending.cardChoices)).toEqual(expect.arrayContaining(['Alchemist', 'Silver']));
    expect(offeredNames(game.pending.cardChoices)).not.toContain('Smithy');
    await game.chooseCard('Alchemist');

    // Second play: +2 more Coffers (3 left), then Silver ($3) and 1 Coffers: up to $4, but no Potion in the cost
    expect(game.alice.coffers).toBe(3);
    await game.chooseCard('Silver');
    await game.chooseOption('1');
    expect(offeredNames(game.pending.cardChoices)).toEqual(expect.arrayContaining(['Smithy', 'Potion']));
    expect(offeredNames(game.pending.cardChoices)).not.toContain('Alchemist');
    expect(offeredNames(game.pending.cardChoices)).not.toContain('University');
    await game.chooseCard('Potion');

    expect(game.alice.discard).toEqual(['Alchemist', 'Potion']);
    expect(game.alice.coffers).toBe(2);
  });

  it("played in the Buy phase by Coronet, uses Peddler's Buy-phase cost", async () => {
    const game = createGame({ kingdom: ['Butcher', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Butcher', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Butcher');
    // Coronet and Butcher are Actions in play: Peddler costs $4
    await game.chooseCard('Silver');
    await game.chooseOption('1');
    expect(offeredNames(game.pending.cardChoices)).toContain('Peddler');
    await game.chooseCard('Peddler');
    // Second Butcher play: +2 Coffers; decline to trash
    await game.chooseNone();

    expect(game.alice.discard).toEqual(['Peddler']);
    expect(game.alice.coffers).toBe(3);
    expect(game.alice.hand).toEqual(['Estate']);
  });
});
