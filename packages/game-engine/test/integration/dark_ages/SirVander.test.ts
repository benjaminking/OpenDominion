import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Sir Vander', () => {
  it("gains a Gold for each owner when two Sir Vanders are trashed by one's attack", async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Vander', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Vander', 'Copper', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Sir Vander');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Vander', 'Sir Vander']);
    expect(game.bob.discard).toEqual(['Gold', 'Copper']);
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.pileSize('Gold')).toBe(golds - 2);
  });

  it("gains a Gold for its owner when trashed by another player's Rogue", async () => {
    const game = createGame({ kingdom: ['Knights', 'Rogue'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Estate', 'Sir Vander', ...COPPERS]);

    await game.start();
    await game.playAction('Rogue');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Vander']);
    expect(game.bob.discard).toEqual(['Gold', 'Estate']);
    expect(game.alice.discard).toEqual([]);
  });

  it('gains nothing when trashed while the Gold pile is empty', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Anna', 'Sir Vander', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Dame Anna');
    await game.chooseCards(['Sir Vander']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Vander']);
    expect(game.alice.discard).toEqual([]);
  });

  it('gains a Gold when Procession trashes it, before Procession gains an Action costing $6', async () => {
    const game = createGame({ kingdom: ['Knights', 'Procession', 'Artisan'] });
    game.alice.setHand(['Procession', 'Sir Vander', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Copper', 'Silver', 'Gold', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Sir Vander');

    // Both plays attack; then Procession trashes Sir Vander, which gains a Gold
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.discard).toEqual(['Gold']);
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Artisan']);
    await game.chooseCard('Artisan');

    expect(game.trash).toEqual(['Silver', 'Gold', 'Sir Vander']);
    expect(game.alice.discard).toEqual(['Gold', 'Artisan']);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });
});
