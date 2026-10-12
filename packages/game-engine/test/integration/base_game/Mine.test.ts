import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Mine', () => {
  it('asks nothing when there is no Treasure in hand', async () => {
    const game = createGame({ kingdom: ['Mine'] });
    game.alice.setHand(['Mine', 'Estate', 'Estate', 'Curse']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mine');

    expect(game.pending.kind).toBe('buyPhase');
    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Curse']);
  });

  it('offers only Treasures to trash, and trashing is optional', async () => {
    const game = createGame({ kingdom: ['Mine'] });
    game.alice.setHand(['Mine', 'Copper', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mine');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(true);
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Silver']);
    await game.chooseNone();

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Estate']);
  });

  it('must gain a Treasure costing up to $3 more into hand, which can be played the same turn', async () => {
    const game = createGame({ kingdom: ['Mine', 'Village'] });
    game.alice.setHand(['Mine', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mine');
    await game.chooseCard('Copper');
    const decision = game.expectDecision('chooseCard', 'Alice');
    // Village costs $3 but is not a Treasure; Gold costs $6
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Silver']);
    expect(decision.noneAllowed).toBe(false);
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.hand).toEqual(['Estate', 'Silver']);
    await game.playTreasure('Silver');
    expect(game.alice.coins).toBe(2);
  });

  it('does not offer a Treasure whose pile is empty', async () => {
    const game = createGame({ kingdom: ['Mine'] });
    game.alice.setHand(['Mine', 'Silver']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Mine');
    await game.chooseCard('Silver');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Silver']);
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.hand).toEqual(['Silver']);
  });

  it('can turn a Silver into a Gold while Bridge makes both cost $1 less', async () => {
    const game = createGame({ kingdom: ['Mine', 'Bridge', 'Festival'] });
    game.alice.setHand(['Festival', 'Bridge', 'Mine', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Bridge');
    await game.playAction('Mine');
    await game.chooseCard('Silver');
    // Silver costs $2, so up to $5: Gold costs $5
    await game.chooseCard('Gold');

    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.hand).toEqual(['Gold']);
  });

  it('can gain a kingdom Treasure that is also a Victory card (Farm)', async () => {
    const game = createGame({ kingdom: ['Mine', 'Farm'] });
    game.alice.setHand(['Mine', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mine');
    await game.chooseCard('Silver');
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered.sort()).toEqual(['Copper', 'Farm', 'Gold', 'Silver']);
    await game.chooseCard('Farm');

    expect(game.alice.hand).toEqual(['Farm']);
  });

  it('trashes the Treasure and gains nothing when every Treasure it could gain is gone', async () => {
    const game = createGame({ kingdom: ['Mine'] });
    game.alice.setHand(['Mine', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Copper', 0);
    game.setPileSize('Silver', 0);

    await game.start();
    await game.playAction('Mine');
    await game.chooseCard('Copper');

    // Nothing to gain and no Treasure left in hand
    expect(game.pending.kind).toBe('buyPhase');
    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.hand).toEqual(['Estate']);
  });

  it("keeps the Potion in a cost: Potion ($4) can't become Philosopher's Stone ($3P), which can become a Potion", async () => {
    const game = createGame({ kingdom: ['Mine', 'Throne Room', "Philosopher's Stone"] });
    game.alice.setHand(['Throne Room', 'Mine', 'Potion', "Philosopher's Stone"]);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mine');
    await game.chooseCard('Potion');
    // Potion costs $4: a Treasure costing up to $7, which doesn't include a cost with a Potion in it
    const first = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(first.sort()).toEqual(['Copper', 'Gold', 'Potion', 'Silver']);
    await game.chooseCard('Gold');

    await game.chooseCard("Philosopher's Stone");
    // Philosopher's Stone costs $3P: up to $6P
    const second = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(second.sort()).toEqual(['Copper', 'Gold', "Philosopher's Stone", 'Potion', 'Silver']);
    await game.chooseCard('Potion');

    expect(game.trash.sort()).toEqual(["Philosopher's Stone", 'Potion']);
    expect(game.alice.hand.sort()).toEqual(['Gold', 'Potion']);
  });

  it('can trash any Treasure, whatever its other types, and never gains a non-Supply Treasure', async () => {
    const game = createGame({ kingdom: ['Mine', 'Marauder', "Fool's Gold", 'Farm', 'Mill'] });
    game.alice.setHand(['Mine', 'Coronet', "Fool's Gold", 'Farm', 'Spoils', 'Mill', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mine');
    const trashDecision = game.expectDecision('chooseCard', 'Alice');
    expect(offered(trashDecision).sort()).toEqual(['Coronet', 'Farm', "Fool's Gold", 'Spoils']);
    await game.chooseCard('Spoils');

    // Spoils costs $0: a Treasure costing up to $3, but not a Spoils, which isn't in the Supply
    const gainDecision = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gainDecision).sort()).toEqual(['Copper', "Fool's Gold", 'Silver']);
    await game.chooseCard("Fool's Gold");

    expect(game.trash).toEqual(['Spoils']);
    expect(game.alice.hand.sort()).toEqual(['Coronet', 'Estate', 'Farm', "Fool's Gold", "Fool's Gold", 'Mill']);
  });
});
