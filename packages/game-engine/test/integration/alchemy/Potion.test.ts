import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

const offeredNames = (cardChoices: { card: { name: string } }[]): string[] =>
  cardChoices.map((choice) => choice.card.name);

describe('Potion', () => {
  it('has a pile of 16 whatever the number of players, only when a kingdom card has a Potion in its cost', () => {
    const withPotionCosts = createGame({ kingdom: ['Golem'], players: ['Alice', 'Bob', 'Cara'] });
    expect(withPotionCosts.hasPile('Potion')).toBe(true);
    expect(withPotionCosts.pileSize('Potion')).toBe(16);

    // Herbalist and Apprentice are Alchemy cards without a Potion in their cost
    const withoutPotionCosts = createGame({ kingdom: ['Herbalist', 'Apprentice'] });
    expect(withoutPotionCosts.hasPile('Potion')).toBe(false);
  });

  it('has a pile of 16 in 2- and 4-player games too', () => {
    expect(createGame({ kingdom: ['Familiar'] }).pileSize('Potion')).toBe(16);
    expect(createGame({ kingdom: ['Familiar'], players: ['Alice', 'Bob', 'Cara', 'Dan'] }).pileSize('Potion')).toBe(16);
  });

  it('is needed to buy a card with a Potion in its cost, and is spent buying it', async () => {
    const game = createGame({ kingdom: ['Golem', 'Familiar'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAllTreasures();
    // $8 but no Potion: no Potion-cost cards
    expect(game.alice.coins).toBe(8);
    const offered = offeredNames(game.expectDecision('buyPhase', 'Alice').cardChoices);
    expect(offered).toContain('Province');
    expect(offered).not.toContain('Golem');
    expect(offered).not.toContain('Familiar');
  });

  it('produces a Potion and no $, and lets one card with a Potion in its cost be bought', async () => {
    const game = createGame({ kingdom: ['Golem', 'Familiar', 'Market'] });
    game.alice.setHand(['Market', 'Potion', 'Gold', 'Gold', 'Silver']);
    game.alice.setDeck(['Copper', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Market');
    await game.playTreasure('Potion');
    expect(game.alice.potions).toBe(1);
    expect(game.alice.coins).toBe(1);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(10);
    await game.buy('Golem');

    // Two Buys and $6 left, but the only Potion has been spent
    const decision = game.expectDecision('buyPhase', 'Alice');
    expect(decision.numPotions).toBe(0);
    expect(decision.numCoins).toBe(6);
    expect(decision.numBuys).toBe(1);
    expect(offeredNames(decision.cardChoices)).not.toContain('Familiar');
    expect(offeredNames(decision.cardChoices)).toContain('Gold');
    await game.endBuyPhase();
    expect(game.alice.discard).toContain('Golem');
  });

  it('is not added to a cost by a cost reduction: $1 off makes Golem $3P and leaves Vineyard at $0P', async () => {
    const game = createGame({ kingdom: ['Golem', 'Vineyard', 'Highway'] });
    game.alice.setHand(['Highway', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Estate', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAllTreasures();

    // $3 and no Potion: Vineyard still needs a Potion
    expect(offeredNames(game.expectDecision('buyPhase', 'Alice').cardChoices)).not.toContain('Vineyard');
  });

  it('can buy Golem for $3 and a Potion when costs are $1 less', async () => {
    const game = createGame({ kingdom: ['Golem', 'Highway'] });
    game.alice.setHand(['Highway', 'Potion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(3);
    await game.buy('Golem');

    expect(game.alice.discard).toContain('Golem');
  });

  it('isn\'t included in a plain "costs up to $4" choice: Workshop can\'t gain cards with a Potion in their cost', async () => {
    const game = createGame({ kingdom: ['Workshop', 'Vineyard', 'University', 'Familiar'] });
    game.alice.setHand(['Workshop', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Workshop');

    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toContain('Potion');
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Vineyard');
    expect(offered).not.toContain('University');
    expect(offered).not.toContain('Familiar');
  });

  it('is included in "costs up to" when the trashed card had one: Remodel on a $3P card can gain a $4P card', async () => {
    const game = createGame({ kingdom: ['Remodel', 'Familiar', 'Golem', 'Vineyard', 'Laboratory', 'Artisan'] });
    game.alice.setHand(['Remodel', 'Familiar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Remodel');
    await game.chooseCard('Familiar');

    // Up to $5P: cards with or without a Potion in their cost
    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toEqual(expect.arrayContaining(['Golem', 'Vineyard', 'Familiar', 'Laboratory', 'Duchy']));
    expect(offered).not.toContain('Artisan');
    await game.chooseCard('Golem');

    expect(game.trash).toEqual(['Familiar']);
    expect(game.alice.discard).toEqual(['Golem']);
  });

  it("isn't included when the trashed card had none: Remodel on a Silver can't gain a card with a Potion in its cost", async () => {
    const game = createGame({ kingdom: ['Remodel', 'Familiar', 'Vineyard', 'Laboratory'] });
    game.alice.setHand(['Remodel', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Remodel');
    await game.chooseCard('Silver');

    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toContain('Laboratory');
    expect(offered).not.toContain('Vineyard');
    expect(offered).not.toContain('Familiar');
  });

  it('keeps the Potion in "exactly $1 more or less": Develop on a $3P Familiar gains a $4P and a $2P card', async () => {
    const game = createGame({ kingdom: ['Develop', 'Familiar', 'Golem', 'University', 'Smithy', 'Cellar'] });
    game.alice.setHand(['Develop', 'Familiar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Familiar');

    // $4P or $2P, but not $4 (Smithy, Develop's own cost is $3) or $2 (Cellar)
    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toContain('Golem');
    expect(offered).toContain('University');
    expect(offered).not.toContain('Smithy');
    expect(offered).not.toContain('Cellar');
    await game.chooseCard('Golem');
    const second = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(second).toContain('University');
    expect(second).not.toContain('Cellar');
    expect(second).not.toContain('Golem');
    await game.chooseCard('University');

    expect(game.alice.deck.slice(0, 2)).toEqual(['University', 'Golem']);
  });

  it("doesn't add a Potion for a card without one: Develop on a Potion ($4) gains a $5 and a $3 card", async () => {
    const game = createGame({ kingdom: ['Develop', 'Golem', 'Familiar', 'Laboratory', 'Village'] });
    game.alice.setHand(['Develop', 'Potion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Potion');

    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toEqual(expect.arrayContaining(['Laboratory', 'Village', 'Silver']));
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Golem');
  });

  it('matches the Potion in "costing exactly the same": Swindler on a Vineyard can give only a $0P card', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Vineyard', 'Familiar'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setDeck(['Vineyard', ...copies('Copper', 5)]);

    await game.start();
    await game.playAction('Swindler');

    // Vineyard ($0P) is the only $0P card: Copper and Curse ($0) aren't offered
    expect(offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices)).toEqual(['Vineyard']);
    await game.chooseCard('Vineyard');

    expect(game.trash).toEqual(['Vineyard']);
    expect(game.bob.discard).toEqual(['Vineyard']);
  });

  it('gives a $3P card for a trashed Familiar with Swindler, not a $3 one', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Familiar', 'Alchemist', 'Village'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setDeck(['Familiar', ...copies('Copper', 5)]);

    await game.start();
    await game.playAction('Swindler');

    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered.sort()).toEqual(['Alchemist', 'Familiar']);
    await game.chooseCard('Alchemist');

    expect(game.trash).toEqual(['Familiar']);
    expect(game.bob.discard).toEqual(['Alchemist']);
  });

  it('keeps the Potion in "exactly $1 more": Upgrade on a $2P Scrying Pool gains a $3P card', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Scrying Pool', 'Familiar', "Philosopher's Stone", 'Village'] });
    game.alice.setHand(['Upgrade', 'Scrying Pool', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Upgrade');
    await game.chooseCard('Scrying Pool');

    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered.sort()).toEqual(['Familiar', "Philosopher's Stone"]);
  });

  it('lets Mine turn a Potion ($4) into a Treasure up to $7 without a Potion, and a $3P card into up to $6P', async () => {
    const game = createGame({ kingdom: ['Mine', "Philosopher's Stone", 'Village'] });
    game.alice.setHand(['Village', 'Mine', 'Mine', 'Potion', "Philosopher's Stone"]);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Mine');
    await game.chooseCard('Potion');
    const fromPotion = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(fromPotion).toEqual(expect.arrayContaining(['Gold', 'Potion', 'Silver']));
    expect(fromPotion).not.toContain("Philosopher's Stone");
    await game.chooseCard('Gold');

    await game.playAction('Mine');
    await game.chooseCard("Philosopher's Stone");
    const fromStone = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(fromStone).toEqual(expect.arrayContaining(['Gold', 'Potion', "Philosopher's Stone"]));
    await game.chooseCard("Philosopher's Stone");

    expect(game.alice.hand).toEqual(['Estate', 'Gold', "Philosopher's Stone"]);
  });

  it('is not reduced below $0P by several cost reductions: three Quarries make Golem $0P, not cheaper', async () => {
    const game = createGame({ kingdom: ['Golem', 'Quarry', 'Festival'] });
    game.alice.setHand(['Festival', 'Quarry', 'Quarry', 'Quarry', 'Potion']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Festival');
    await game.playTreasure('Quarry');
    await game.playTreasure('Quarry');
    await game.playTreasure('Quarry');
    await game.playTreasure('Potion');
    expect(game.alice.coins).toBe(5);
    expect(game.costOf('Golem').coins).toBe(0);
    expect(game.costOf('Golem').potions).toBe(1);
    await game.buy('Golem');

    const decision = game.expectDecision('buyPhase', 'Alice');
    expect(decision.numCoins).toBe(5);
    expect(decision.numPotions).toBe(0);
    expect(game.alice.discard).toContain('Golem');
  });
});
