import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Resolves start-of-turn Duration effects, which may or may not need a prompt
const resolveStartOfTurnEffects = async (game: GameHarness, ownerCardName: string): Promise<void> => {
  while (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect(ownerCardName);
  }
};

describe("King's Court", () => {
  it('stays in play with a Duration card it played until that card is discarded', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Wharf'] });
    game.alice.setHand(["King's Court", 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Wharf');
    // Wharf three times: +6 Cards, +3 Buys
    expect(game.alice.hand).toHaveLength(9);
    expect(game.alice.buys).toBe(4);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(["King's Court", 'Wharf']);
    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(["King's Court", 'Wharf']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('resolves the next-turn effect of each of the three plays of a Duration card', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Wharf'] });
    game.alice.setHand(["King's Court", 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Wharf');
    await game.endTurn();
    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');

    // 5 cards from clean-up, then +2 Cards and +1 Buy three times
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(11);
    expect(game.alice.buys).toBe(4);
  });

  it('offers to play nothing, and leaves the Action in hand when declined', async () => {
    const game = createGame({ kingdom: ["King's Court"] });
    game.alice.setHand(["King's Court", 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(true);
    await game.chooseNone();

    expect(game.alice.inPlay).toEqual(["King's Court"]);
    expect(game.alice.hand).toContain('Village');
    expect(game.alice.actions).toBe(0);
    // No Actions left, so Alice moves on to her Buy phase
    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
  });

  it('does nothing when there is no other Action card in hand', async () => {
    const game = createGame({ kingdom: ["King's Court"] });
    game.alice.setHand(["King's Court", 'Copper', 'Copper', 'Estate', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");

    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
    expect(game.alice.inPlay).toEqual(["King's Court"]);
    expect(game.alice.hand).toHaveLength(4);
  });

  it("plays King's Court three times, so three different Actions are each played three times", async () => {
    const game = createGame({ kingdom: ["King's Court", 'Village', 'Festival', 'Smithy'] });
    game.alice.setHand(["King's Court", "King's Court", 'Village', 'Festival', 'Smithy']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard("King's Court");
    await game.chooseCard('Village');
    // The second play of the inner King's Court can't pick the Village again
    expect(
      game
        .expectDecision('chooseCard', 'Alice')
        .cardChoices.map((choice) => choice.card.name)
        .sort(),
    ).toEqual(['Festival', 'Smithy']);
    await game.chooseCard('Festival');
    await game.chooseCard('Smithy');

    // Village x3: +3 Cards, +6 Actions. Festival x3: +6 Actions, +3 Buys, +$6. Smithy x3: +9 Cards
    expect(game.alice.hand).toEqual(coppers(12));
    expect(game.alice.actions).toBe(12);
    expect(game.alice.buys).toBe(4);
    expect(game.alice.coins).toBe(6);
    expect([...game.alice.inPlay].sort()).toEqual(['Festival', "King's Court", "King's Court", 'Smithy', 'Village']);
  });

  it('plays a card that trashes itself three times, but it can only be trashed once', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Mining Village'] });
    game.alice.setHand(["King's Court", 'Mining Village', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Mining Village');
    await game.chooseOption('Yes');
    // Mining Village is played a second and third time even though it is now in the trash
    while (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('Yes');
    }

    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(6);
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.inPlay).toEqual(["King's Court"]);
  });

  it('plays a card that returns itself to its pile three times, but it only returns once', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Hermit'] });
    game.alice.setHand(["King's Court", 'Madman', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    const madmenBefore = game.pileSize('Madman');

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Madman');

    // First play: +2 Actions, returned, +1 Card per card in hand (3). Later plays: +2 Actions only
    expect(game.pileSize('Madman')).toBe(madmenBefore + 1);
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(6);
    expect(game.alice.inPlay).toEqual(["King's Court"]);
  });

  it('plays an Attack three times; a target who drops below 5 cards is not affected again', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Clerk'] });
    game.alice.setHand(["King's Court", 'Clerk', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    // Decline playing Clerk at the start of the turn
    await game.declineEffects();
    await game.playAction("King's Court");
    await game.chooseCard('Clerk');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Estate');

    expect(game.bob.hand).toHaveLength(4);
    expect(game.bob.deck[0]).toBe('Estate');
    expect(game.alice.coins).toBe(6);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('lets other players react to an Attack card it plays', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Clerk', 'Guard Dog'] });
    game.alice.setHand(["King's Court", 'Clerk', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Guard Dog', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.declineEffects();
    await game.playAction("King's Court");
    await game.chooseCard('Clerk');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toContain('Guard Dog');
  });

  it("played by King's Court, only the King's Court that played the Duration card stays in play", async () => {
    const game = createGame({ kingdom: ["King's Court", 'Wharf', 'Village'] });
    const [outerKingsCourt, innerKingsCourt, wharf] = game.alice.setHand([
      "King's Court",
      "King's Court",
      'Wharf',
      'Village',
      'Copper',
    ]);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction(outerKingsCourt);
    await game.chooseCard(innerKingsCourt);
    // The inner King's Court plays Wharf three times, then Village three times, then has nothing left to play
    await game.chooseCard('Wharf');
    await game.chooseCard('Village');
    expect(game.alice.inPlay).toHaveLength(4);
    await game.endTurn();

    const inPlayIds = game.alice.cards(CardLocation.IN_PLAY).map((card) => card.getId());
    expect([...inPlayIds].sort()).toEqual([innerKingsCourt.getId(), wharf.getId()].sort());
  });

  it('played on Outpost gives only one extra turn, and both stay in play until its clean-up', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Outpost'] });
    game.alice.setHand(["King's Court", 'Outpost', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(3);
    expect(game.alice.inPlay).toEqual(["King's Court", 'Outpost']);
    await game.endTurn();

    // No second or third extra turn
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(["King's Court", 'Outpost']));
  });

  it('played on Treasure Map with two more in hand: only the first play trashes two Maps and gains 4 Golds', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Treasure Map'] });
    game.alice.setHand(["King's Court", 'Treasure Map', 'Treasure Map', 'Treasure Map', 'Copper']);
    game.alice.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Treasure Map');
    // First play: the played Map and one from hand
    await game.chooseCard('Treasure Map');
    expect(game.alice.deck.slice(0, 4)).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    // Second play: the played Map is already in the trash, so trashing the last one from hand gains nothing
    await game.chooseCard('Treasure Map');

    expect(game.trash).toEqual(['Treasure Map', 'Treasure Map', 'Treasure Map']);
    expect(game.pileSize('Gold')).toBe(goldsBefore - 4);
    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.inPlay).toEqual(["King's Court"]);
  });

  it('played on Mint gains a copy of a revealed Treasure each time, without trashing anything', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Mint'] });
    game.alice.setHand(["King's Court", 'Mint', 'Gold', 'Silver', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Mint');
    await game.chooseCard('Gold');
    await game.chooseCard('Gold');
    await game.chooseCard('Silver');

    expect(game.alice.discard).toEqual(['Gold', 'Gold', 'Silver']);
    expect(game.alice.hand).toEqual(['Gold', 'Silver', 'Copper']);
    expect(game.trash).toEqual([]);
  });

  it('played on Tactician discards the hand once; the later plays do nothing, and it stays in play with it', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Tactician'] });
    game.alice.setHand(["King's Court", 'Tactician', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Tactician');
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper', 'Estate', 'Estate']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(["King's Court", 'Tactician']);
    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Tactician');
    }

    // Only one +5 Cards, +1 Action and +1 Buy
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(10);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it("played on Throne Room that plays two Durations: Throne Room stays in play with them, King's Court does not", async () => {
    const game = createGame({ kingdom: ["King's Court", 'Throne Room', 'Wharf'] });
    const [kingsCourt, throneRoom, firstWharf, secondWharf] = game.alice.setHand([
      "King's Court",
      'Throne Room',
      'Wharf',
      'Wharf',
      'Copper',
    ]);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction(kingsCourt);
    await game.chooseCard(throneRoom);
    await game.chooseCard(firstWharf);
    await game.chooseCard(secondWharf);
    // Third play of Throne Room: no Action left in hand
    expect(game.alice.hand).toHaveLength(9);
    expect(game.alice.buys).toBe(5);
    await game.endTurn();

    const inPlayIds = game.alice.cards(CardLocation.IN_PLAY).map((card) => card.getId());
    expect([...inPlayIds].sort()).toEqual([throneRoom.getId(), firstWharf.getId(), secondWharf.getId()].sort());
    expect(game.alice.discard).toContain("King's Court");

    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Wharf');
    }
    // Four next-turn Wharf effects: +8 Cards, +4 Buys
    expect(game.alice.hand).toHaveLength(13);
    expect(game.alice.buys).toBe(5);
  });

  it("can't play a Treasure, e.g. Spoils, even when it is the only other card in hand", async () => {
    const game = createGame({ kingdom: ["King's Court", 'Bandit Camp'] });
    game.alice.setHand(["King's Court", 'Spoils', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");

    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
    expect(game.alice.hand).toEqual(['Spoils', 'Copper']);
    expect(game.pileSize('Spoils')).toBe(15);
  });

  it('played on Smithy with a short deck, shuffles once and then draws only what is left', async () => {
    const game = createGame({ kingdom: ["King's Court", 'Smithy'] });
    game.alice.setHand(["King's Court", 'Smithy', 'Estate']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Smithy');

    // 3 + 1 from the deck, then shuffle and 2 + 1 from the discard pile, then nothing for the third play
    expect([...game.alice.hand].sort()).toEqual([
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Estate',
      'Silver',
      'Silver',
      'Silver',
    ]);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });
});
