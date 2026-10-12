import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('Forge', () => {
  it('gains nothing when no card costs exactly the total of the trashed cards', async () => {
    const game = createGame({ kingdom: ['Forge'] });
    game.alice.setHand(['Forge', 'Gold', 'Duchy', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Forge');
    await game.chooseCards(['Gold', 'Duchy', 'Estate']);

    // $6 + $5 + $2 = $13: nothing costs that, so Alice moves on to her Buy phase
    expect([...game.trash].sort()).toEqual(['Duchy', 'Estate', 'Gold']);
    expect(game.alice.discard).toEqual([]);
    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
  });

  it("ignores Potion in the trashed cards' costs and can't gain a card with Potion in its cost", async () => {
    const game = createGame({ kingdom: ['Forge', 'Familiar'] });
    game.alice.setHand(['Forge', 'Familiar', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Forge');
    await game.chooseCards(['Familiar']);

    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).toContain('Village');
    expect(offeredNames(game)).not.toContain('Familiar');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('gains a card costing exactly $0 when nothing is trashed', async () => {
    const game = createGame({ kingdom: ['Forge'] });
    game.alice.setHand(['Forge', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Forge');
    await game.chooseCards([]);

    expect([...offeredNames(game)].sort()).toEqual(['Copper', 'Curse']);
    await game.chooseCard('Curse');
    expect(game.alice.discard).toEqual(['Curse']);
    expect(game.trash).toEqual([]);
  });

  it('adds up the current costs of the trashed cards, e.g. reduced by Highway', async () => {
    const game = createGame({ kingdom: ['Forge', 'Highway', 'Village'] });
    game.alice.setHand(['Highway', 'Forge', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Forge');
    await game.chooseCards(['Estate', 'Estate']);

    // Each Estate costs $1 this turn, so the total is $2: Silver and Village cost $2 now
    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).toContain('Village');
    expect(offeredNames(game)).not.toContain('Estate');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('counts a trashed Fortress that goes back into your hand', async () => {
    const game = createGame({ kingdom: ['Forge', 'Fortress'] });
    game.alice.setHand(['Forge', 'Fortress', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Forge');
    await game.chooseCards(['Fortress', 'Estate']);

    // $4 + $2 = $6
    expect(game.alice.hand).toContain('Fortress');
    expect(game.trash).toEqual(['Estate']);
    expect(offeredNames(game)).toContain('Gold');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('counts the full $8 of a trashed Peddler in the Action phase, even with Actions in play', async () => {
    const game = createGame({ kingdom: ['Forge', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Forge', 'Peddler', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Forge');
    await game.chooseCards(['Peddler']);

    expect(offeredNames(game)).toContain('Province');
    expect(offeredNames(game)).not.toContain('Gold');
    await game.chooseCard('Province');
    expect(game.alice.discard).toEqual(['Province']);
  });

  it('treats each trashed card that stacked reductions take below $0 as costing $0 before adding them up', async () => {
    const game = createGame({ kingdom: ['Forge', 'Highway', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Highway', 'Bridge', 'Forge', 'Estate', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Forge');
    await game.chooseCards(['Estate', 'Silver']);

    // Everything costs $3 less: Estate $0 and Silver $0 make $0, so Estate and Village ($0 now) can be gained
    expect(offeredNames(game)).toContain('Estate');
    expect(offeredNames(game)).toContain('Village');
    expect(offeredNames(game)).not.toContain('Duchy');
    await game.chooseCard('Village');
    expect(game.alice.discard).toEqual(['Village']);
  });

  it("in the Buy phase (via Crystal Ball), counts a trashed Peddler's reduced cost and can gain a Peddler", async () => {
    const game = createGame({ kingdom: ['Forge', 'Peddler', 'Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Peddler', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Forge', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.chooseCards(['Peddler']);

    // With Forge in play, Peddler costs $6
    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).toContain('Peddler');
    expect(offeredNames(game)).not.toContain('Province');
    await game.chooseCard('Peddler');
    expect(game.alice.discard).toEqual(['Peddler']);
  });

  it("uses Quarry's reduction on trashed and gained Action cards", async () => {
    const game = createGame({ kingdom: ['Forge', 'Quarry', 'Crystal Ball', 'Grand Market', 'Smithy'] });
    game.alice.setHand(['Quarry', 'Crystal Ball', 'Smithy', 'Estate', 'Estate']);
    game.alice.setDeck(['Forge', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.chooseCards(['Smithy', 'Estate']);

    // Smithy $2 + Estate $2 = $4: Grand Market costs $4 this turn; Gold doesn't
    expect(offeredNames(game)).toContain('Grand Market');
    expect(offeredNames(game)).not.toContain('Gold');
    expect(offeredNames(game)).not.toContain('Smithy');
    await game.chooseCard('Grand Market');
    expect(game.alice.discard).toEqual(['Grand Market']);
  });
});
