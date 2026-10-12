import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Workshop', () => {
  it('offers only non-empty piles costing up to $4, and gaining is mandatory', async () => {
    const game = createGame({ kingdom: ['Workshop', 'Smithy', 'Village', 'Market'] });
    game.alice.setHand(['Workshop', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);

    await game.start();
    await game.playAction('Workshop');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(false);
    const offered = decision.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Smithy', 'Silver', 'Workshop']));
    expect(offered).not.toContain('Village');
    expect(offered).not.toContain('Market');
    await game.chooseCard('Smithy');

    expect(game.alice.discard).toEqual(['Smithy']);
  });

  it('can gain a card made cheaper by Bridge', async () => {
    const game = createGame({ kingdom: ['Workshop', 'Bridge', 'Festival', 'Market'] });
    game.alice.setHand(['Festival', 'Bridge', 'Workshop', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Bridge');
    await game.playAction('Workshop');
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Market', 'Duchy']));
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Market');

    expect(game.alice.discard).toEqual(['Market']);
  });

  it("does not see Peddler's Buy-phase cost reduction in the Action phase", async () => {
    const game = createGame({ kingdom: ['Workshop', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Village', 'Village', 'Workshop', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Workshop');

    // 4 Actions in play, but Peddler only costs $2 less per Action during the Buy phase
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)).not.toContain(
      'Peddler',
    );
  });

  it('emptying a third Supply pile ends the game only after the turn, which carries on as normal', async () => {
    const game = createGame({ kingdom: ['Workshop', 'Smithy', 'Village'] });
    game.alice.setHand(['Workshop', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Curse', 0);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 1);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Smithy');

    // Three empty Supply piles, but Alice's turn goes on: she can still play Treasures and buy
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Smithy', 'Silver']));
  });

  it("can gain only the top card of the Knights pile, judged by that card's own cost", async () => {
    const game = createGame({ kingdom: ['Workshop', 'Knights', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Workshop', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPile('Knights', ['Sir Martin', 'Dame Anna', 'Sir Bailey']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Workshop');
    // Sir Martin costs $4
    const first = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(first).toContain('Sir Martin');
    expect(first).not.toContain('Dame Anna');
    await game.chooseCard('Sir Martin');
    // Now Dame Anna ($5) is on top, so no Knight can be gained
    const second = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(second).not.toContain('Dame Anna');
    expect(second).not.toContain('Sir Bailey');
    await game.chooseCard('Silver');

    expect(game.alice.discard.sort()).toEqual(['Silver', 'Sir Martin']);
    expect(game.pileCards('Knights')).toEqual(['Dame Anna', 'Sir Bailey']);
  });

  it('stacks Bridge played twice with Highway ($3 off), never taking a cost below $0', async () => {
    const game = createGame({ kingdom: ['Workshop', 'Throne Room', 'Bridge', 'Highway', 'Festival', "King's Court"] });
    game.alice.setHand(['Festival', 'Throne Room', 'Bridge', 'Highway', 'Workshop']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAction('Highway');
    await game.playAction('Workshop');

    // Gold $6 - $3 = $3 and King's Court $7 - $3 = $4 can be gained; Province $8 - $3 = $5 can't
    const offeredNames = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(offeredNames).toEqual(expect.arrayContaining(['Gold', "King's Court", 'Duchy']));
    expect(offeredNames).not.toContain('Province');
    expect(game.costOf('Estate').coins).toBe(0);
    expect(game.costOf('Copper').coins).toBe(0);
    expect(game.costOf('Province').coins).toBe(5);
    await game.chooseCard("King's Court");

    expect(game.alice.discard).toEqual(["King's Court"]);
  });

  it("sees Quarry and Peddler's Buy-phase reduction when Coronet plays it in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Workshop', 'Quarry', 'Peddler', 'Laboratory'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Workshop', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Workshop');

    // Actions cost $2 less (Quarry). Peddler also costs $2 less per Action in play (Coronet and Workshop):
    // $8 - $4 - $2 = $2. Laboratory costs $3; Duchy ($5) isn't an Action
    const offeredNames = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(offeredNames).toEqual(expect.arrayContaining(['Peddler', 'Laboratory']));
    expect(offeredNames).not.toContain('Duchy');
    expect(game.costOf('Peddler').coins).toBe(2);
    await game.chooseCard('Peddler');
    await game.chooseCard('Laboratory');

    expect(game.alice.discard.sort()).toEqual(['Laboratory', 'Peddler']);
  });

  it('cannot gain a card costing a Potion, but can gain the Potion itself', async () => {
    const game = createGame({ kingdom: ['Workshop', 'Vineyard', 'Familiar', 'Golem', 'Herbalist'] });
    game.alice.setHand(['Workshop', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Workshop');

    // Vineyard costs $0 plus a Potion, which is more than $4
    const offeredNames = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(offeredNames).toEqual(expect.arrayContaining(['Potion', 'Herbalist', 'Silver']));
    expect(offeredNames).not.toContain('Vineyard');
    expect(offeredNames).not.toContain('Familiar');
    expect(offeredNames).not.toContain('Golem');
    await game.chooseCard('Potion');

    expect(game.alice.discard).toEqual(['Potion']);
  });

  it('cannot gain a card from a non-Supply pile, but can gain the top Ruins', async () => {
    const game = createGame({ kingdom: ['Workshop', 'Marauder', 'Hermit', 'Urchin', 'Joust'] });
    game.alice.setHand(['Workshop', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPile('Ruins', ['Ruined Market', 'Survivors']);

    await game.start();
    await game.playAction('Workshop');

    // Spoils, Madman, Mercenary and the Rewards cost $0 (or $0*), but aren't in the Supply
    const offeredNames = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(offeredNames).toContain('Ruined Market');
    expect(offeredNames).not.toContain('Survivors');
    for (const nonSupply of ['Spoils', 'Madman', 'Mercenary', 'Coronet', 'Courser']) {
      expect(offeredNames).not.toContain(nonSupply);
    }
    await game.chooseCard('Ruined Market');

    expect(game.alice.discard).toEqual(['Ruined Market']);
    expect(game.pileCards('Ruins')).toEqual(['Survivors']);
  });
});
