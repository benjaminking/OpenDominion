import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] =>
  game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);

describe('Swindler', () => {
  it('trashes the top card of each other player in turn order and gives each a card with the same cost', async () => {
    const game = createGame({ kingdom: ['Swindler'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setDeck(['Silver', 'Copper']);
    cara.setDeck(['Copper', 'Silver']);

    await game.start();
    await game.playAction('Swindler');
    expect(game.alice.coins).toBe(2);

    // Bob (to Alice's left) first: Silver costs $3
    const forBob = game.expectDecision('chooseCard', 'Alice');
    const bobOffered = forBob.cardChoices.map((choice) => choice.card.name);
    expect(bobOffered).toContain('Silver');
    expect(bobOffered).toContain('Village');
    expect(bobOffered).not.toContain('Estate');
    expect(bobOffered).not.toContain('Smithy');
    expect(forBob.noneAllowed).toBe(false);
    await game.chooseCard('Village');

    // Then Cara: Copper costs $0, so Curse is an option
    const caraOffered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect([...caraOffered].sort()).toEqual(['Copper', 'Curse']);
    await game.chooseCard('Curse');

    expect(game.trash).toEqual(['Silver', 'Copper']);
    expect(game.bob.discard).toEqual(['Village']);
    expect(game.bob.deck).toEqual(['Copper']);
    expect(cara.discard).toEqual(['Curse']);
    expect(cara.deck).toEqual(['Silver']);
  });

  it('gives nothing when no card in the Supply has the trashed card cost', async () => {
    // Nothing in this kingdom costs $7
    const game = createGame({ kingdom: ['Swindler'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setDeck(["King's Court", 'Copper']);

    await game.start();
    await game.playAction('Swindler');

    expect(game.trash).toEqual(["King's Court"]);
    expect(game.bob.discard).toEqual([]);
    expect(game.currentPlayerName).toBe('Alice');
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('does not offer a card from an empty pile even if it is the only one with that cost', async () => {
    const game = createGame({ kingdom: ['Swindler'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setDeck(['Gold', 'Copper']);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Swindler');

    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('shuffles the discard pile when the deck is empty, and does nothing when both are empty', async () => {
    const game = createGame({ kingdom: ['Swindler'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setDeck([]);
    game.bob.setDiscard(['Estate']);
    game.player('Cara').setDeck([]);
    game.player('Cara').setDiscard([]);

    await game.start();
    await game.playAction('Swindler');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.bob.discard).toEqual(['Estate']);
    expect(game.player('Cara').discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('matches costs as reduced by Bridge', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Bridge'] });
    game.alice.setHand(['Bridge', 'Swindler', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.alice.addToHand('Village');
    game.bob.setDeck(['Silver', 'Copper']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Swindler');

    // Silver costs $2 this turn, the same as $3 cards; Estate and Cellar cost $1
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Silver');
    expect(offered).toContain('Village');
    expect(offered).toContain('Swindler');
    expect(offered).not.toContain('Estate');
    expect(offered).not.toContain('Cellar');
    expect(offered).not.toContain('Bridge');
  });

  it('gives a card with the same Potion cost for a trashed Potion-cost card, and none for a plain $3 card', async () => {
    const game = createGame({
      kingdom: ['Swindler', 'Familiar', 'Alchemist', 'Golem'],
      players: ['Alice', 'Bob', 'Cara'],
    });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Familiar', 'Copper']);
    game.player('Cara').setDeck(['Silver', 'Copper']);

    await game.start();
    await game.playAction('Swindler');

    // Familiar costs $3P: only $3P cards
    expect([...offeredNames(game)].sort()).toEqual(['Alchemist', 'Familiar']);
    await game.chooseCard('Alchemist');
    // Silver costs $3: no Potion-cost cards
    const forCara = offeredNames(game);
    expect(forCara).toContain('Silver');
    expect(forCara).not.toContain('Familiar');
    expect(forCara).not.toContain('Alchemist');
    await game.chooseCard('Silver');

    expect(game.bob.discard).toEqual(['Alchemist']);
    expect(game.player('Cara').discard).toEqual(['Silver']);
  });

  it('treats a trashed Potion as costing $4, so Potion-cost cards are not offered', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Golem'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Potion', 'Copper']);

    await game.start();
    await game.playAction('Swindler');

    const offered = offeredNames(game);
    expect(offered).toContain('Potion');
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Golem');
  });

  it('matches costs as reduced by Highway', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Highway'] });
    game.alice.setHand(['Highway', 'Swindler', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Duchy', 'Copper']);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Swindler');

    // Duchy costs $4 this turn, like the printed-$5 cards
    const offered = offeredNames(game);
    expect(offered).toContain('Duchy');
    expect(offered).toContain('Market');
    expect(offered).not.toContain('Smithy');
    expect(offered).not.toContain('Gold');
  });

  it("resolves the trashed card's when-trash ability before the attacker chooses (Fortress goes back to hand)", async () => {
    const game = createGame({ kingdom: ['Swindler', 'Fortress'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Fortress', 'Copper']);

    await game.start();
    await game.playAction('Swindler');

    // Fortress is already back in Bob's hand when Alice chooses a $4 card for him
    game.expectDecision('chooseCard', 'Alice');
    expect(game.bob.hand).toContain('Fortress');
    expect(game.trash).toEqual([]);
    expect(offeredNames(game)).toContain('Fortress');
    await game.chooseCard('Smithy');

    expect(game.bob.discard).toEqual(['Smithy']);
    expect(game.bob.deck).toEqual(['Copper']);
  });

  it("lets the attacked player's Market Square react to the trash before the attacker chooses", async () => {
    const game = createGame({ kingdom: ['Swindler', 'Market Square'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Market Square', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Copper']);

    await game.start();
    await game.playAction('Swindler');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Market Square');
    expect(game.bob.discard).toEqual(['Market Square', 'Gold']);

    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Silver');
    expect(game.bob.discard).toEqual(['Market Square', 'Gold', 'Silver']);
    expect(game.trash).toEqual(['Silver']);
  });

  it('does not trash the top card of a player who reveals Moat', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Copper']);
    game.player('Cara').setDeck(['Silver', 'Copper']);

    await game.start();
    await game.playAction('Swindler');
    await game.chooseEffect('Moat');

    // Only Cara is attacked
    game.expectDecision('chooseCard', 'Alice');
    expect(game.trash).toEqual(['Silver']);
    await game.chooseCard('Village');
    expect(game.bob.deck).toEqual(['Gold', 'Copper']);
    expect(game.player('Cara').discard).toEqual(['Village']);
  });

  it('gives the card to the attacked player, whose Watchtower can then trash it', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Watchtower'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Copper', 'Copper']);

    await game.start();
    await game.playAction('Swindler');
    await game.chooseCard('Curse');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Copper', 'Curse']);
    expect(game.bob.discard).toEqual([]);
  });

  it('can give the top Knight of the Knights pile, but not one underneath', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Knights'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Smithy', 'Copper']);
    game.setPile('Knights', ['Sir Martin', 'Dame Anna', 'Sir Bailey']);

    await game.start();
    await game.playAction('Swindler');

    // Sir Martin costs $4 like Smithy
    const offered = offeredNames(game);
    expect(offered).toContain('Sir Martin');
    expect(offered).not.toContain('Dame Anna');
    await game.chooseCard('Sir Martin');
    expect(game.bob.discard).toEqual(['Sir Martin']);
    expect(game.pileCards('Knights')).toEqual(['Dame Anna', 'Sir Bailey']);
  });

  it('does not affect a player with a Lighthouse in play from their last turn', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Lighthouse'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Swindler', ...coppers(14)]);
    game.bob.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.playAction('Lighthouse');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    const bobDeck = game.bob.deck;
    await game.playAction('Swindler');

    expect(game.trash).toEqual([]);
    expect(game.bob.deck).toEqual(bobDeck);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it("uses Peddler's $8 Action-phase cost for a trashed Peddler", async () => {
    const game = createGame({ kingdom: ['Swindler', 'Peddler'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Peddler', 'Copper']);

    await game.start();
    await game.playAction('Swindler');

    expect([...offeredNames(game)].sort()).toEqual(['Peddler', 'Province']);
  });

  it('attacks when played from the Supply by Band of Misfits, and Moat can be revealed against it', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Band Of Misfits', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Copper']);
    game.player('Cara').setDeck(['Band Of Misfits', 'Copper']);
    const swindlers = game.pileSize('Swindler');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Swindler');
    await game.chooseEffect('Moat');

    // Cara's Band of Misfits costs $5
    const offered = offeredNames(game);
    expect(offered).toContain('Band Of Misfits');
    expect(offered).toContain('Duchy');
    await game.chooseCard('Duchy');

    expect(game.alice.coins).toBe(2);
    expect(game.pileSize('Swindler')).toBe(swindlers);
    expect(game.trash).toEqual(['Band Of Misfits']);
    expect(game.bob.deck).toEqual(['Gold', 'Copper']);
    expect(game.player('Cara').discard).toEqual(['Duchy']);
  });

  it("removes the trashed card from the attacked player's cards and score", async () => {
    const game = createGame({ kingdom: ['Swindler'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Duchy', 'Copper']);

    await game.start();
    expect(game.bob.score).toBe(3);
    await game.playAction('Swindler');
    expect(game.trash).toEqual(['Duchy']);
    expect(game.bob.score).toBe(0);
    await game.chooseCard('Market');

    expect(game.bob.score).toBe(0);
    expect(
      game.bob.player
        .getOwnedCards()
        .getAllCards()
        .map((card) => card.getName()),
    ).not.toContain('Duchy');
  });

  it('floors stacked Bridge reductions at $0: a trashed Estate matches every card that now costs $0', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Bridge', 'Swindler', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Estate', 'Copper']);

    await game.start(() => {
      game.alice.player.getStatistics().addActions(1);
    });
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Bridge');
    await game.playAction('Swindler');

    // Estate, Cellar ($2) and Copper, Curse ($0) all cost $0; Silver costs $1
    const offered = offeredNames(game);
    expect(offered).toContain('Copper');
    expect(offered).toContain('Curse');
    expect(offered).toContain('Estate');
    expect(offered).toContain('Cellar');
    expect(offered).not.toContain('Silver');
    expect(offered).not.toContain('Village');
  });

  it("uses Quarry's reduction on Action cards only when played by Coronet in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Swindler', 'Quarry'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Swindler']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver', 'Village', 'Copper']);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Swindler');

    // Silver still costs $3, the same as printed-$5 Action cards now
    const offered = offeredNames(game);
    expect(offered).toContain('Silver');
    expect(offered).toContain('Market');
    expect(offered).not.toContain('Village');
    expect(offered).not.toContain('Duchy');
    await game.chooseCard('Market');

    // Second play: Village costs $1, like the other printed-$3 Action cards
    const second = offeredNames(game);
    expect(second).toContain('Village');
    expect(second).toContain('Swindler');
    expect(second).not.toContain('Silver');
    expect(second).not.toContain('Estate');
    await game.chooseCard('Village');
    expect(game.bob.discard).toEqual(['Market', 'Village']);
  });

  it('can give only the top Ruins card for a trashed $0 card', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Cultist'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Copper', 'Copper']);
    game.setPile('Ruins', ['Survivors', 'Ruined Village']);

    await game.start();
    await game.playAction('Swindler');

    expect([...offeredNames(game)].sort()).toEqual(['Copper', 'Curse', 'Survivors']);
    await game.chooseCard('Survivors');
    expect(game.bob.discard).toEqual(['Survivors']);
    expect(game.pileCards('Ruins')).toEqual(['Ruined Village']);
  });

  it('can give the last card of a third Supply pile, which ends the game after the turn', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Village', 'Smithy', 'Market'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver', ...coppers(10)]);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 0);
    game.setPileSize('Village', 1);

    await game.start();
    await game.playAction('Swindler');
    await game.chooseCard('Village');

    expect(game.bob.discard).toEqual(['Village']);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it('attacks the other players in turn order in a 4-player game', async () => {
    const game = createGame({ kingdom: ['Swindler'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver', 'Copper']);
    game.player('Cara').setDeck(['Estate', 'Copper']);
    game.player('Dan').setDeck(['Gold', 'Copper']);
    game.setPileSize('Silver', 1);

    await game.start();
    await game.playAction('Swindler');
    expect(game.trash).toEqual(['Silver']);
    await game.chooseCard('Silver');
    expect(game.trash).toEqual(['Silver', 'Estate']);
    await game.chooseCard('Estate');
    expect(game.trash).toEqual(['Silver', 'Estate', 'Gold']);
    await game.chooseCard('Gold');

    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.player('Cara').discard).toEqual(['Estate']);
    expect(game.player('Dan').discard).toEqual(['Gold']);
    expect(game.pileSize('Silver')).toBe(0);
  });

  it('does not give non-Supply cards ($0* Rewards, Madman, Mercenary, Spoils) for a trashed $0 card', async () => {
    const game = createGame({ kingdom: ['Swindler', 'Joust', 'Hermit', 'Urchin', 'Bandit Camp'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Copper', 'Copper']);

    await game.start();
    await game.playAction('Swindler');

    expect([...offeredNames(game)].sort()).toEqual(['Copper', 'Curse']);
  });
});
