import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Knights', () => {
  it('trashes the attacking Knight as well when the attack trashes a Knight', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Sylvia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Sir Destry', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Sylvia');

    expect(game.trash).toEqual(['Sir Destry', 'Dame Sylvia']);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.coins).toBe(2);
    expect(game.bob.discard).toEqual(['Copper']);

    // The trashed Knight is not discarded in Clean-up
    await game.endTurn();
    expect(game.alice.discard).not.toContain('Dame Sylvia');
  });

  it('attacks each other player in turn order, and the attacking Knight is trashed only once', async () => {
    const game = createGame({ kingdom: ['Knights'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Dame Molly', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Bailey', 'Silver', ...COPPERS]);
    game.player('Cara').setDeck(['Dame Anna', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Molly');

    // Bob (to Alice's left) chooses first
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Sir Bailey');
    expect(game.alice.inPlay).toEqual([]);

    // Cara is still attacked after Dame Molly has been trashed
    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Dame Anna');

    expect(game.trash).toEqual(['Sir Bailey', 'Dame Molly', 'Dame Anna']);
    // Trashing Dame Anna can't trash Dame Molly again
    expect(game.alice.log).toContain('Alice has lost track of Dame Molly');
    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.player('Cara').discard).toEqual(['Gold']);
    expect(game.alice.actions).toBe(2);
  });

  it('reveals only what a target has when they have fewer than 2 cards in deck and discard', async () => {
    const game = createGame({ kingdom: ['Knights'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Gold']);
    // Cara has no cards at all to reveal

    await game.start();
    await game.playAction('Sir Martin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.deck).toEqual([]);
    expect(game.bob.discard).toEqual([]);
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Sir Martin']);
    expect(game.alice.buys).toBe(3);
  });

  it('shuffles the target discard pile (but not the card already revealed) when the deck has only 1 card', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver']);
    game.bob.setDiscard(['Copper']);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.bob.deck).toEqual([]);
  });

  it('does not trash a card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Golem', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual([]);
    expect(game.bob.discard).toEqual(['Golem', 'Copper']);
  });

  it('uses current costs, so a Silver costs $2 and is not trashed after Bridge', async () => {
    const game = createGame({ kingdom: ['Knights', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Bridge', 'Sir Martin', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Duchy', 'Silver', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Sir Martin');

    // Duchy costs $4 this turn and is the only card costing $3-$6
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Duchy']);
    expect(game.bob.discard).toEqual(['Silver']);
  });

  it('attacks again when played a second time by Throne Room after trashing itself', async () => {
    const game = createGame({ kingdom: ['Knights', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Sir Destry', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Martin', 'Copper', 'Silver', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sir Destry');

    // First play trashes Sir Martin and so Sir Destry; the second play still draws and attacks
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Martin', 'Sir Destry', 'Silver']);
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
    expect(game.bob.discard).toEqual(['Copper', 'Estate']);
  });

  it('has lost track of itself when its second Throne Room play trashes another Knight, and still discards the rest', async () => {
    const game = createGame({ kingdom: ['Knights', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Dame Sylvia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Martin', 'Copper', 'Dame Anna', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Dame Sylvia');

    // The first play trashes Sir Martin and so Dame Sylvia. The second play trashes Dame Anna, but Dame Sylvia has
    // already left play, so it can't trash itself again
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.log).toContain('Alice has lost track of Dame Sylvia');
    expect(game.trash).toEqual(['Sir Martin', 'Dame Sylvia', 'Dame Anna']);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
    expect(game.bob.discard).toEqual(['Copper', 'Estate']);
    expect(game.alice.coins).toBe(4);
  });

  it("trashes itself only once when played three times by King's Court, and every play still attacks", async () => {
    const game = createGame({ kingdom: ['Knights', "King's Court"] });
    game.alice.setHand(["King's Court", 'Dame Molly', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Martin', 'Copper', 'Sir Bailey', 'Copper', 'Silver', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Dame Molly');

    // The first play trashes Sir Martin and so Dame Molly; the others still attack and give +2 Actions
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Martin', 'Dame Molly', 'Sir Bailey', 'Silver']);
    expect(game.alice.actions).toBe(6);
    expect(game.alice.inPlay).toEqual(["King's Court"]);
    expect(game.bob.discard).toEqual(['Copper', 'Copper', 'Estate']);
  });

  it('cannot trash the Knight that Band of Misfits plays from the Supply, which stays on the Knights pile', async () => {
    const game = createGame({ kingdom: ['Knights', 'Band Of Misfits'] });
    game.setPile('Knights', ['Sir Martin', 'Dame Anna', 'Sir Destry']);
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Bailey', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Band Of Misfits');
    // Sir Martin ($4) on top of the Knights pile costs less than Band of Misfits ($5)
    await game.chooseCard('Sir Martin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Bailey']);
    expect(game.pileCards('Knights')).toEqual(['Sir Martin', 'Dame Anna', 'Sir Destry']);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    expect(game.alice.buys).toBe(3);
  });

  it('uses current costs: after two Bridges Sir Martin costs $2 and is safe, while Sir Bailey costs $3', async () => {
    const game = createGame({ kingdom: ['Knights', 'Bridge', 'Village', 'Throne Room'] });
    game.alice.setHand(['Village', 'Throne Room', 'Bridge', 'Dame Sylvia', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Martin', 'Sir Bailey', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAction('Dame Sylvia');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Bailey', 'Dame Sylvia']);
    expect(game.bob.discard).toEqual(['Sir Martin']);
    expect(game.alice.coins).toBe(4);
  });

  it('can still trash Sir Martin while Highway makes it cost $3', async () => {
    const game = createGame({ kingdom: ['Knights', 'Highway'] });
    game.alice.setHand(['Highway', 'Sir Destry', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Sir Martin', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Sir Destry');

    // Silver costs $2 now, so Sir Martin is the only card costing $3-$6
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Martin', 'Sir Destry']);
    expect(game.bob.discard).toEqual(['Silver']);
  });

  it('counts the Knights pile as a Supply pile, so emptying it can end the game', async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Smithy'] });
    game.setPile('Knights', ['Sir Martin']);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Sir Martin');

    expect(game.pileSize('Knights')).toBe(0);
    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toContain('Sir Martin');
  });

  it('lets Moat be revealed separately for each Throne Room play, so declining it the second time is attacked', async () => {
    const game = createGame({ kingdom: ['Knights', 'Throne Room', 'Moat'] });
    game.alice.setHand(['Throne Room', 'Sir Martin', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sir Martin');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');

    // Second play: Bob keeps Moat in hand this time
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.declineEffects();
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.alice.buys).toBe(5);
  });

  it('reveals the Silver that Beggar put onto the deck in reaction to the Knight', async () => {
    const game = createGame({ kingdom: ['Knights', 'Beggar'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Beggar', 'Silver', 'Copper']);
  });

  it("lets the attacker's Market Square react when the attacking Knight trashes itself", async () => {
    const game = createGame({ kingdom: ['Knights', 'Market Square'] });
    game.alice.setHand(['Dame Sylvia', 'Market Square', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Destry', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Sylvia');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Destry', 'Dame Sylvia']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
  });

  it('is upgraded by Procession after trashing itself on the first play: the second play attacks and a $6 Action is gained', async () => {
    const game = createGame({ kingdom: ['Knights', 'Procession', 'Artisan'] });
    game.alice.setHand(['Procession', 'Sir Destry', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Dame Anna', 'Copper', 'Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Sir Destry');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $6');
    await game.chooseCard('Artisan');

    expect(game.trash).toEqual(['Dame Anna', 'Sir Destry', 'Silver']);
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.discard).toEqual(['Artisan']);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it("ignores a revealed Squire ($2) and Overgrown Estate ($1), and resolves another player's Hunting Grounds when trashed", async () => {
    const game = createGame({
      kingdom: ['Knights', 'Squire', 'Hunting Grounds', 'Militia'],
      players: ['Alice', 'Bob', 'Cara'],
    });
    const cara = game.player('Cara');
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Squire', 'Overgrown Estate', ...COPPERS]);
    cara.setDeck(['Hunting Grounds', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    // Nothing of Bob's is trashed, so neither when-trashed ability triggers; Cara chooses for Hunting Grounds
    game.expectDecision('chooseOneOption', 'Cara');
    expect(game.bob.discard).toEqual(['Squire', 'Overgrown Estate']);
    await game.chooseOption('Gain 3 Estates');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Hunting Grounds']);
    expect(cara.discard).toEqual(['Estate', 'Estate', 'Estate', 'Copper']);
    expect(game.bob.hand).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Sir Martin']);
  });

  it("sees Peddler's Buy-phase cost when Coronet plays it in the Buy phase ($8 minus $2 per Action in play)", async () => {
    const game = createGame({ kingdom: ['Knights', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Sir Martin', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Peddler', 'Copper', 'Peddler', 'Copper', ...COPPERS]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Sir Martin');
    // Coronet and Sir Martin are Actions in play, so each Peddler costs $4
    await game.chooseNone();

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.trash).toEqual(['Peddler', 'Peddler']);
    expect(game.bob.discard).toEqual(['Copper', 'Copper']);
    expect(game.alice.buys).toBe(5);
  });

  it('does not trash a Peddler in the Action phase, when it costs $8', async () => {
    const game = createGame({ kingdom: ['Knights', 'Peddler'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Peddler', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual([]);
    expect(game.bob.discard).toEqual(['Peddler', 'Copper']);
  });

  it('attacks Bob, Cara and Dan in turn order in a 4-player game; each chooses, and later targets are attacked after the Knight is trashed', async () => {
    const game = createGame({ kingdom: ['Knights'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Dame Sylvia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    cara.setDeck(['Sir Martin', 'Duchy', ...COPPERS]);
    dan.setDeck(['Laboratory', 'Smithy', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Sylvia');

    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Silver');
    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Sir Martin');
    expect(game.alice.inPlay).toEqual([]);
    game.expectDecision('chooseCard', 'Dan');
    await game.chooseCard('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Silver', 'Sir Martin', 'Dame Sylvia', 'Smithy']);
    expect(game.bob.discard).toEqual(['Gold']);
    expect(cara.discard).toEqual(['Duchy']);
    expect(dan.discard).toEqual(['Laboratory']);
    expect(game.alice.coins).toBe(2);
  });

  it('uses stacked cost reductions: with Bridge and Highway in play a Province costs $6 and is trashed, a Silver costs $1', async () => {
    const game = createGame({ kingdom: ['Knights', 'Bridge', 'Highway', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Sir Martin', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Province', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Sir Martin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.costOf('Province').coins).toBe(6);
    expect(game.trash).toEqual(['Province']);
    expect(game.bob.discard).toEqual(['Silver']);
  });

  it("sees Quarry's reduction on Action cards only when Coronet plays it in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Knights', 'Quarry'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Sir Martin', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    // First play: Smithy costs $2 and Gold still $6; second play: Laboratory costs $3
    game.bob.setDeck(['Smithy', 'Gold', 'Laboratory', 'Copper', ...COPPERS]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Sir Martin');
    await game.chooseNone();

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.trash).toEqual(['Gold', 'Laboratory']);
    expect(game.bob.discard).toEqual(['Smithy', 'Copper']);
  });

  it('lets the target pick a non-Knight over a revealed Knight, so the attacking Knight stays in play', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Bailey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Dame Josephine', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Bailey');
    const trash = game.expectDecision('chooseCard', 'Bob');
    expect(trash.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Dame Josephine', 'Gold']);
    await game.chooseCard('Gold');

    game.expectDecision(['actionPhase', 'treasurePhase'], 'Alice');
    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.discard).toEqual(['Dame Josephine']);
    expect(game.alice.inPlay).toEqual(['Sir Bailey']);
  });
});
