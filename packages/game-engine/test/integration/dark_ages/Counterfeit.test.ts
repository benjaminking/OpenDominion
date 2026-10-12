import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Counterfeit', () => {
  it('plays a Spoils twice for $7 in total; the Spoils returns to its pile and is not trashed', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Marauder'] });
    game.alice.setHand(['Counterfeit', 'Spoils', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playTreasure('Counterfeit');
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(true);
    await game.chooseCard('Spoils');

    expect(game.alice.coins).toBe(7);
    expect(game.alice.buys).toBe(2);
    expect(game.trash).toEqual([]);
    expect(game.pileSize('Spoils')).toBe(spoils + 1);
    expect(game.alice.inPlay).toEqual(['Counterfeit']);
    expect(game.alice.log).toContain('Alice has lost track of Spoils');
  });

  it('plays another Counterfeit twice; each play can play a Treasure twice and trash it', async () => {
    const game = createGame({ kingdom: ['Counterfeit'] });
    game.alice.setHand(['Counterfeit', 'Counterfeit', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Counterfeit');
    // The second Counterfeit's first play
    await game.chooseCard('Silver');
    // Its second play
    await game.chooseCard('Copper');

    // $1 (first) + 2 x ($1 + 1 Buy) (second) + Silver twice + Copper twice
    expect(game.alice.coins).toBe(1 + 1 + 1 + 4 + 2);
    expect(game.alice.buys).toBe(4);
    expect(game.trash).toEqual(['Silver', 'Copper', 'Counterfeit']);
    expect(game.alice.inPlay).toEqual(['Counterfeit']);
    expect(game.alice.hand).toEqual(['Estate']);
  });

  it('does not offer non-Treasures, and can play nothing', async () => {
    const game = createGame({ kingdom: ['Counterfeit'] });
    game.alice.setHand(['Counterfeit', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');

    // Nothing to play twice: no prompt
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(game.trash).toEqual([]);
  });
});

describe('Counterfeit: interactions', () => {
  it('cannot play a Duration Treasure (Astrolabe)', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Astrolabe'] });
    game.alice.setHand(['Counterfeit', 'Astrolabe', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');

    // Astrolabe is the only other Treasure, so there is nothing to choose
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Astrolabe', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.coins).toBe(1);
    expect(game.trash).toEqual([]);
  });

  it('plays a Coronet twice, each Coronet playing a Treasure twice, then trashes the Coronet', async () => {
    const game = createGame({ kingdom: ['Counterfeit'] });
    game.alice.setHand(['Counterfeit', 'Coronet', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Coronet');
    // First Coronet play: no Action in hand; play Silver twice
    await game.chooseCard('Silver');
    // Second Coronet play: play Copper twice
    await game.chooseCard('Copper');

    // $1 (Counterfeit) + $4 (Silver twice) + $2 (Copper twice)
    expect(game.alice.coins).toBe(7);
    expect(game.alice.buys).toBe(2);
    expect(game.trash).toEqual(['Coronet']);
    expect(game.alice.inPlay).toEqual(['Counterfeit', 'Silver', 'Copper']);
  });

  it("plays a Fool's Gold twice: the second play is not the first Fool's Gold played this turn, so it gives $4", async () => {
    const game = createGame({ kingdom: ['Counterfeit', "Fool's Gold"] });
    game.alice.setHand(['Counterfeit', "Fool's Gold", 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard("Fool's Gold");

    expect(game.alice.coins).toBe(1 + 1 + 4);
    expect(game.trash).toEqual(["Fool's Gold"]);
  });

  it('plays a Hoard twice: after it is trashed, buying a Victory card still gains a Gold for each play', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Hoard'] });
    game.alice.setHand(['Counterfeit', 'Hoard', 'Silver', 'Silver', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Hoard');
    expect(game.trash).toEqual(['Hoard']);
    await game.playAllTreasures();

    // $1 + $2 x 2 + $2 + $2 + $1
    expect(game.alice.coins).toBe(10);
    await game.buy('Province');

    expect(game.pileSize('Gold')).toBe(golds - 2);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Province', 'Gold', 'Gold']));
  });

  it('trashing the Treasure it played lets Market Square in hand be discarded for a Gold', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Market Square'] });
    game.alice.setHand(['Counterfeit', 'Silver', 'Market Square', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Silver');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    expect(game.alice.coins).toBe(5);
    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
  });

  it('does not trash a Spoils that returned to its pile, so Market Square is not offered', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Marauder', 'Market Square'] });
    game.alice.setHand(['Counterfeit', 'Spoils', 'Market Square', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Spoils');

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toContain('Market Square');
    expect(game.alice.coins).toBe(7);
  });

  it('plays a Collection twice: gaining an Action card this turn then gives +2 VP', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Collection', 'Smithy'] });
    game.alice.setHand(['Counterfeit', 'Collection', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Collection');
    expect(game.trash).toEqual(['Collection']);
    await game.playTreasure('Copper');

    // $1 + $2 x 2 + $1; 1 + 1 + 1 Buys
    expect(game.alice.coins).toBe(6);
    expect(game.alice.buys).toBe(4);
    await game.buy('Smithy');

    expect(game.alice.vpTokens).toBe(2);
  });

  it("playing a Silver twice under another player's Corsair: it is trashed after the first play but still played again", async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Corsair'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Counterfeit', 'Silver', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Silver');

    // $1 (Counterfeit) + $2 + $2: Corsair trashes the Silver after its first play
    expect(game.bob.coins).toBe(5);
    expect(game.bob.buys).toBe(2);
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.inPlay).toEqual(['Counterfeit']);
    // Counterfeit can't trash the Silver again: it has left play
    expect(game.bob.log).toContain('Bob has lost track of Silver');
  });

  it('with Charlatan in the game, plays a Curse (a Treasure) twice for $2 and trashes it', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Charlatan'] });
    game.alice.setHand(['Counterfeit', 'Charlatan Curse', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Charlatan Curse']);
    await game.chooseCard('Charlatan Curse');

    expect(game.alice.coins).toBe(1 + 2);
    expect(game.trash).toEqual(['Charlatan Curse']);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate']);
  });

  it('plays a Treasure-Victory card (Farm) twice for $4 and trashes it', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Farm'] });
    game.alice.setHand(['Counterfeit', 'Farm', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Farm');

    expect(game.alice.coins).toBe(1 + 4);
    expect(game.trash).toEqual(['Farm']);
    expect(game.alice.inPlay).toEqual(['Counterfeit']);
  });

  it('plays a Potion twice for 2 Potions and trashes it', async () => {
    const game = createGame({ kingdom: ['Counterfeit', 'Familiar'] });
    game.alice.setHand(['Counterfeit', 'Potion', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Potion');

    expect(game.alice.potions).toBe(2);
    expect(game.alice.coins).toBe(1);
    expect(game.trash).toEqual(['Potion']);
  });
});
