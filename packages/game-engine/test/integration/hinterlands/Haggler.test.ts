import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './hinterlandsHelpers';

const KINGDOM = ['Haggler', 'Throne Room', 'Village', 'Workshop', 'Smithy', 'Cellar', 'Laboratory', 'Farmland'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Haggler', () => {
  it('gains a cheaper non-Victory card when you buy a card', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Haggler', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    await game.buy('Gold');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Laboratory', 'Smithy', 'Silver', 'Copper', 'Curse']));
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Farmland');
    expect(offered).not.toContain('Duchy');
    expect(offered).not.toContain('Estate');
    await game.chooseCard('Laboratory');

    expect(game.alice.discard.slice(0, 2)).toEqual(['Gold', 'Laboratory']);
  });

  it('does not trigger for gains that were not bought, including its own gain', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Haggler', 'Workshop', 'Silver', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Haggler');
    await game.playAction('Workshop');
    // Workshop's gain is not a buy: no Haggler gain
    await game.chooseCard('Smithy');
    expect(game.alice.discard).toEqual(['Smithy']);

    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
    await game.buy('Silver');
    // Only one Haggler gain: the Cellar it gains is not bought, so it doesn't trigger Haggler again
    await game.chooseCard('Cellar');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard.slice(0, 3)).toEqual(['Smithy', 'Silver', 'Cellar']);
  });

  it('gains nothing when there is no cheaper card, such as when buying a Copper', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Haggler', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Haggler');
    await game.buy('Copper');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard[0]).toBe('Copper');
    expect(game.alice.discard).not.toContain('Curse');
  });

  it('is cumulative: two Hagglers gain two cheaper cards per card bought', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Haggler', 'Haggler', 'Gold', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Haggler');
    await game.playAction('Haggler');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    await game.buy('Gold');
    await game.chooseCard('Laboratory');
    await game.chooseCard('Silver');

    expect(game.alice.discard.slice(0, 3)).toEqual(['Gold', 'Laboratory', 'Silver']);
  });

  it('is cumulative when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Haggler', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Haggler');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    await game.buy('Gold');
    await game.chooseCard('Laboratory');

    const secondGain = game.expectDecision('chooseCard', 'Alice');
    expect(secondGain.cardChoices.map((choice) => choice.card.name)).toContain('Silver');
    await game.chooseCard('Silver');

    expect(game.alice.discard.slice(0, 3)).toEqual(['Gold', 'Laboratory', 'Silver']);
  });

  it("lets you choose the order of its gain and the bought card's own on-gain ability", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Haggler', 'Gold', 'Gold', 'Estate', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    await game.buy('Farmland');

    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.mandatoryEffects.map((effect) => effect.effectName).sort()).toEqual(['Farmland', 'Haggler']);
    await game.chooseEffect('Farmland');
    // Farmland: trash Estate, gain a $4 card
    await game.chooseCard('Estate');
    await game.chooseCard('Smithy');
    // Then Haggler: a non-Victory card costing less than Farmland
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).not.toContain('Gold');
    await game.chooseCard('Laboratory');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard.slice(0, 3)).toEqual(['Farmland', 'Smithy', 'Laboratory']);
  });

  it('stops working at the end of the turn it was played', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Haggler', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Silver', 'Copper', 'Copper', 'Copper', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Haggler');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();
    await game.buy('Silver');

    // No Haggler gain this turn
    expect(game.currentPlayerName).toBe('Bob');
    // Turn 1's 5 cards, the bought Silver, then turn 2's 5 cards: no extra gained card
    expect(game.alice.discard).toHaveLength(11);
    expect(game.alice.discard[5]).toBe('Silver');
  });

  it('gains a non-Victory card for a bought Victory card, whose own on-gain ability then resolves', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Border Village'] });
    game.alice.setHand(['Haggler', 'Gold', 'Gold', 'Gold', 'Silver']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    await game.buy('Province');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Gold', 'Border Village', 'Laboratory']));
    expect(offered).not.toContain('Duchy');
    expect(offered).not.toContain('Farmland');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Border Village');

    // Border Village's on-gain: a card costing less than $6. It wasn't bought, so there is no more Haggler gain
    await game.chooseCard('Smithy');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard.slice(0, 3)).toEqual(['Province', 'Border Village', 'Smithy']);
  });

  it('can gain a Berserker, which is played since Haggler is an Action in play', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Berserker'] });
    game.alice.setHand(['Haggler', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    await game.buy('Gold');
    await game.chooseCard('Berserker');

    // Berserker is played: a card costing less than $5, then Bob discards down to 3
    await game.chooseCard('Silver');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Gold', 'Silver', 'Berserker', 'Haggler']));
  });

  it('still gains a card cheaper than the bought card after Trader has exchanged it', async () => {
    const game = createGame({ kingdom: [...KINGDOM.filter((name) => name !== 'Farmland'), 'Trader'] });
    game.alice.setHand(['Haggler', 'Trader', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    await game.buy('Gold');

    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    expect(order.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Haggler']);
    await game.chooseEffect('Trader');
    expect(game.pileSize('Gold')).toBe(golds);

    // Haggler: a non-Victory card costing less than the $6 Gold
    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Laboratory');
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Laboratory');
    // Trader could exchange the Laboratory too
    await game.declineEffects();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard.slice(0, 2)).toEqual(['Silver', 'Laboratory']);
  });

  it('compares the Buy-phase costs with Quarry, which makes only Actions cheaper', async () => {
    const game = createGame({ kingdom: ['Haggler', 'Quarry', "King's Court", 'Festival', 'Laboratory', 'Smithy'] });
    game.alice.setHand(['Festival', 'Haggler', 'Quarry', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Haggler');
    await game.playTreasure('Quarry');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(14);

    // Gold ($6): King's Court costs $5 now
    await game.buy('Gold');
    const first = game.expectDecision('chooseCard', 'Alice');
    expect(offered(first)).toContain("King's Court");
    expect(offered(first)).not.toContain('Gold');
    await game.chooseCard("King's Court");

    // Laboratory ($3 now): Silver ($3) is not cheaper, Smithy ($2) is
    await game.buy('Laboratory');
    const second = game.expectDecision('chooseCard', 'Alice');
    expect(offered(second)).toEqual(expect.arrayContaining(['Smithy', 'Copper']));
    expect(offered(second)).not.toContain('Silver');
    expect(offered(second)).not.toContain('Estate');
    await game.chooseCard('Smithy');

    expect(game.alice.discard.slice(0, 4)).toEqual(['Gold', "King's Court", 'Laboratory', 'Smithy']);
  });

  it("compares with Peddler's Buy-phase cost, both as the bought card and as the gained card", async () => {
    const game = createGame({ kingdom: ['Haggler', 'Peddler', 'Festival', 'Village', 'Smithy'] });
    game.alice.setHand(['Festival', 'Haggler', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Haggler');
    await game.playAllTreasures();
    // Two Actions in play: Peddler costs $4
    expect(game.costOf('Peddler').coins).toBe(4);

    await game.buy('Gold');
    const first = game.expectDecision('chooseCard', 'Alice');
    expect(offered(first)).toContain('Peddler');
    await game.chooseCard('Peddler');

    await game.buy('Peddler');
    const second = game.expectDecision('chooseCard', 'Alice');
    expect(offered(second)).toEqual(expect.arrayContaining(['Silver', 'Village']));
    expect(offered(second)).not.toContain('Smithy');
    expect(offered(second)).not.toContain('Peddler');
    await game.chooseCard('Village');

    expect(game.alice.discard.slice(0, 4)).toEqual(['Gold', 'Peddler', 'Peddler', 'Village']);
  });

  it('gains nothing for a card that costs $0 after cost reductions', async () => {
    const game = createGame({ kingdom: ['Haggler', 'Quarry', 'Smithy'] });
    game.alice.setHand(['Haggler', 'Quarry', 'Quarry', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Haggler');
    await game.playTreasure('Quarry');
    await game.playTreasure('Quarry');
    expect(game.costOf('Smithy').coins).toBe(0);
    await game.buy('Smithy');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard[0]).toBe('Smithy');
    expect(game.alice.discard).toHaveLength(6);
  });

  it('never gains a card with the Victory type, whatever its other types', async () => {
    const game = createGame({ kingdom: ['Haggler', 'Mill', 'Nobles', 'Farm', 'Tunnel', 'Knights'] });
    game.alice.setHand(['Haggler', 'Gold', 'Gold', 'Gold', 'Silver']);
    game.alice.setDeck(COPPERS);
    game.setPile('Knights', ['Dame Josephine', 'Dame Anna']);

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    await game.buy('Province');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(expect.arrayContaining(['Gold', 'Silver', 'Haggler']));
    for (const victory of ['Mill', 'Nobles', 'Farm', 'Tunnel', 'Dame Josephine', 'Duchy', 'Estate']) {
      expect(offered(gain)).not.toContain(victory);
    }
    await game.chooseCard('Gold');
  });

  it('can gain the Knight revealed by buying the one above it, since it gains after the bought card', async () => {
    const game = createGame({ kingdom: ['Haggler', 'Knights'] });
    game.alice.setHand(['Haggler', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPile('Knights', ['Dame Anna', 'Sir Martin', 'Sir Bailey']);

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    await game.buy('Dame Anna');

    // Sir Martin ($4) is now on top, and is cheaper than Dame Anna ($5)
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toContain('Sir Martin');
    expect(offered(gain)).not.toContain('Sir Bailey');
    await game.chooseCard('Sir Martin');

    expect(game.alice.discard.slice(0, 2)).toEqual(['Dame Anna', 'Sir Martin']);
    expect(game.pileCards('Knights')).toEqual(['Sir Bailey']);
  });

  it('compares the costs when it resolves: playing a bought Trail first makes Peddler cheaper', async () => {
    const kingdom = ['Haggler', 'Peddler', 'Trail', 'Village'];
    const setUp = async (): Promise<ReturnType<typeof createGame>> => {
      const game = createGame({ kingdom });
      game.alice.setHand(['Village', 'Haggler', 'Gold', 'Copper', 'Copper']);
      game.alice.setDeck(COPPERS);
      await game.start();
      await game.playAction('Village');
      await game.playAction('Haggler');
      await game.playAllTreasures();
      await game.buy('Trail');
      return game;
    };

    // Haggler first: two Actions in play, so Peddler costs $4, the same as Trail
    const hagglerFirst = await setUp();
    await hagglerFirst.chooseEffect('Haggler');
    expect(offered(hagglerFirst.expectDecision('chooseCard', 'Alice'))).not.toContain('Peddler');

    // Trail first: it is played, so with three Actions in play Peddler costs $2
    const trailFirst = await setUp();
    await trailFirst.chooseEffect('Trail');
    expect(trailFirst.alice.inPlay).toContain('Trail');
    const gain = trailFirst.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toContain('Peddler');
    await trailFirst.chooseCard('Peddler');
    expect(trailFirst.alice.discard[0]).toBe('Peddler');
  });

  it("does not trigger for another player's gain on your turn, e.g. a Gold from Fool's Gold", async () => {
    const game = createGame({ kingdom: ['Haggler', "Fool's Gold", 'Village'] });
    game.alice.setHand(['Haggler', 'Gold', 'Gold', 'Silver', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Haggler');
    await game.playAllTreasures();
    await game.buy('Province');
    await game.chooseCard('Gold');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect("Fool's Gold");

    // Only Alice's one Haggler gain; Bob's Gold triggers nothing
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.deck[0]).toBe('Gold');
    expect(game.pileSize('Gold')).toBe(golds - 2);
    expect(game.alice.discard.slice(0, 2)).toEqual(['Province', 'Gold']);
  });
});
