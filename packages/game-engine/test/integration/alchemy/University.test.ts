import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

const offeredNames = (cardChoices: { card: { name: string } }[]): string[] =>
  cardChoices.map((choice) => choice.card.name).sort();

describe('University', () => {
  it('offers only Action cards costing up to $5 without a Potion in the cost, and may gain nothing', async () => {
    const game = createGame({
      kingdom: ['University', 'Golem', 'Familiar', 'Apprentice', 'Laboratory', 'Village', 'Artisan', 'Gardens', 'Mill'],
    });
    game.alice.setHand(['University', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('University');

    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(true);
    // Mill is an Action-Victory card costing $4; the filler Smithy is the 10th kingdom card
    expect(offeredNames(decision.cardChoices)).toEqual(['Apprentice', 'Laboratory', 'Mill', 'Smithy', 'Village']);
    await game.chooseNone();

    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(2);
  });

  it('offers a $6 Action whose cost has been reduced to $5, but still no card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['University', 'Highway', 'Golem', 'Artisan'] });
    game.alice.setHand(['Highway', 'University', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Highway');
    await game.playAction('University');

    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toContain('Artisan');
    expect(offered).not.toContain('Golem');
    expect(offered).not.toContain('University');
    await game.chooseCard('Artisan');

    expect(game.alice.discard).toEqual(['Artisan']);
  });

  it("doesn't offer an Action whose pile is empty", async () => {
    const game = createGame({ kingdom: ['University', 'Laboratory'] });
    game.setPileSize('Laboratory', 0);
    game.alice.setHand(['University', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('University');

    expect(offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices)).not.toContain('Laboratory');
  });

  it('gains an Action card each time when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['University', 'Throne Room', 'Laboratory', 'Village'] });
    game.alice.setHand(['Throne Room', 'University', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('University');
    await game.chooseCard('Laboratory');
    await game.chooseCard('Village');

    expect(game.alice.discard.sort()).toEqual(['Laboratory', 'Village']);
    expect(game.alice.actions).toBe(4);
  });

  it('gains nothing, without asking, when the only Actions left have a Potion in their cost', async () => {
    const game = createGame({
      kingdom: [
        'University',
        'Golem',
        'Familiar',
        'Alchemist',
        'Apothecary',
        'Scrying Pool',
        'Vineyard',
        "Philosopher's Stone",
        'Apprentice',
        'Herbalist',
      ],
    });
    game.setPileSize('Apprentice', 0);
    game.setPileSize('Herbalist', 0);
    game.alice.setHand(['University', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('University');

    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(2);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it("doesn't offer a Peddler in the Action phase, where it still costs $8 whatever is in play", async () => {
    const game = createGame({ kingdom: ['University', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Village', 'University', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('University');

    expect(offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices)).not.toContain('Peddler');
    expect(game.costOf('Peddler').coins).toBe(8);
  });

  it('offers a Peddler at its Buy-phase cost when Coronet plays it in the Buy phase ($8 minus $2 per Action in play)', async () => {
    const game = createGame({ kingdom: ['University', 'Peddler', 'Artisan'] });
    game.alice.setHand(['Coronet', 'University', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('University');

    // Coronet and University are Actions in play: Peddler costs $4; Artisan still costs $6
    expect(game.costOf('Peddler').coins).toBe(4);
    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toContain('Peddler');
    expect(offered).not.toContain('Artisan');
    await game.chooseCard('Peddler');
    // Second play
    await game.chooseNone();

    expect(game.alice.discard).toEqual(['Peddler']);
    expect(game.alice.actions).toBe(5);
  });

  it('offers a $7 Action once Bridge and Quarry together make it cost $4, but still no card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['University', 'Bridge', 'Quarry', "King's Court", 'Golem'] });
    game.alice.setHand(['Bridge', 'Quarry', 'Coronet', 'University', 'Estate']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Bridge');
    // Quarry and Coronet in the Buy phase; Coronet plays University twice
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('University');

    expect(game.costOf("King's Court").coins).toBe(4);
    expect(game.costOf('Golem').coins).toBe(1);
    expect(game.costOf('Golem').potions).toBe(1);
    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toContain("King's Court");
    expect(offered).not.toContain('Golem');
    await game.chooseCard("King's Court");
    await game.chooseCard("King's Court");

    expect(game.alice.discard).toEqual(["King's Court", "King's Court"]);
  });

  it('can gain the last card of the third pile to empty; the game ends only after the turn', async () => {
    const game = createGame({ kingdom: ['University', 'Laboratory', 'Village', 'Smithy'] });
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Laboratory', 1);
    game.alice.setHand(['University', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('University');
    await game.chooseCard('Laboratory');

    expect(game.pileSize('Laboratory')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Laboratory', 'Silver']));
  });

  it('offers only the top Knight and the top Ruins, and no Action outside the Supply (Madman, Mercenary, Rewards)', async () => {
    const game = createGame({ kingdom: ['University', 'Knights', 'Marauder', 'Hermit', 'Urchin', 'Joust'] });
    game.setPile('Knights', ['Dame Anna', 'Sir Martin']);
    game.setPile('Ruins', ['Ruined Village', 'Survivors']);
    game.alice.setHand(['University', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('University');

    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toEqual(expect.arrayContaining(['Dame Anna', 'Ruined Village', 'Hermit', 'Urchin', 'Marauder']));
    for (const notOffered of ['Sir Martin', 'Survivors', 'Madman', 'Mercenary', 'Courser', 'Coronet']) {
      expect(offered).not.toContain(notOffered);
    }
    await game.chooseCard('Dame Anna');

    expect(game.alice.discard).toEqual(['Dame Anna']);
    expect(game.pileCards('Knights')).toEqual(['Sir Martin']);
  });
});
