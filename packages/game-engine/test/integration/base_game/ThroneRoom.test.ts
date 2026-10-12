import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';
import { offered, revealMoat } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

const inPlayIds = (game: GameHarness, playerName: string): string[] =>
  game
    .player(playerName)
    .cards(CardLocation.IN_PLAY)
    .map((card) => card.getId());

/** Resolves any start-of-turn prompts (e.g. several Duration effects) until a normal turn decision is pending. */
const resolveStartOfTurnEffects = async (game: GameHarness, cardName: string): Promise<void> => {
  while (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect(cardName);
  }
};

describe('Throne Room', () => {
  it('plays a Duration twice: double the effect now, and both cards stay in play until the next turn is over', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Wharf'] });
    const [throneRoom, wharf] = game.alice.setHand(['Throne Room', 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Wharf');
    expect(game.alice.hand).toHaveLength(3 + 4);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();

    // Rule: a Throne Room that plays a Duration stays in play as long as the Duration does
    expect(inPlayIds(game, 'Alice').sort()).toEqual([throneRoom.getId(), wharf.getId()].sort());
    expect(game.currentPlayerName).toBe('Bob');
    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay.sort()).toEqual(['Throne Room', 'Wharf']);

    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Throne Room', 'Wharf']));
  });

  it('gives the next-turn effect of a Throne-Roomed Duration twice', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Wharf'] });
    game.alice.setHand(['Throne Room', 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Wharf');
    await game.endTurn();
    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');

    // Start of turn: +2 Cards +1 Buy, twice
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5 + 4);
    expect(game.alice.buys).toBe(1 + 2);
  });

  it('keeps only the Throne Room that played a Duration in play when a Throne Room plays a Throne Room', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Wharf', 'Village'] });
    const [firstThroneRoom, secondThroneRoom, wharf, village] = game.alice.setHand([
      'Throne Room',
      'Throne Room',
      'Wharf',
      'Village',
      'Copper',
    ]);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction(firstThroneRoom);
    await game.chooseCard(secondThroneRoom);
    // The second Throne Room's first play: Wharf twice
    await game.chooseCard(wharf);
    // Its second play: Village twice
    await game.chooseCard(village);
    expect(game.alice.hand).toHaveLength(1 + 4 + 2);
    expect(game.alice.actions).toBe(4);
    await game.endTurn();

    // Only the card that directly played the Duration extra times stays out (Seaside rulebook; wiki Duration page).
    // The first Throne Room played a non-Duration (the other Throne Room), so it is discarded, as is Village.
    expect(inPlayIds(game, 'Alice').sort()).toEqual([secondThroneRoom.getId(), wharf.getId()].sort());
    expect(game.alice.discard.filter((name) => name !== 'Copper').sort()).toEqual(['Throne Room', 'Village']);

    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('discards a Throne Room that played a Throne Room playing only non-Duration cards', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Village', 'Smithy'] });
    const [firstThroneRoom, secondThroneRoom] = game.alice.setHand([
      'Throne Room',
      'Throne Room',
      'Village',
      'Smithy',
      'Copper',
    ]);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction(firstThroneRoom);
    await game.chooseCard(secondThroneRoom);
    await game.chooseCard('Village');
    await game.chooseCard('Smithy');
    // Village twice (+2 Cards, +4 Actions) and Smithy twice (+6 Cards)
    expect(game.alice.hand).toHaveLength(1 + 2 + 6);
    expect(game.alice.actions).toBe(4);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toHaveLength(4 + 9);
  });

  it('does nothing and asks nothing when there is no other Action card in hand', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Throne Room', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');

    // Straight on to the Treasure phase, with Throne Room in play and the hand unchanged
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Throne Room']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Estate']);
    expect(game.alice.actions).toBe(0);
  });

  it('may decline to play an Action card', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(true);
    expect(decision.cardChoices.map((choice) => choice.card.name)).toEqual(['Village']);
    await game.chooseNone();

    expect(game.alice.hand).toContain('Village');
    expect(game.alice.inPlay).toEqual(['Throne Room']);
    // Throne Room used the only Action, so Village can't be played afterwards
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('plays a card that trashes itself twice, but only gets the bonus for trashing it once', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Mining Village'] });
    game.alice.setHand(['Throne Room', 'Mining Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mining Village');
    await game.chooseOption('Yes');
    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.coins).toBe(2);

    // The second play still happens (+1 Card, +2 Actions), but Mining Village can't be trashed again
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('Yes');
    }
    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toHaveLength(3 + 2);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
  });

  it('lets other players react to an Attack it plays', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Militia', 'Beggar'] });
    game.alice.setHand(['Throne Room', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Militia');

    // Militia is played, so Bob may first discard Beggar (as he can when Militia is played from hand)
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Beggar']);
  });

  it('makes each other player discard down to 3 once per play when it plays Militia', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Militia'] });
    game.alice.setHand(['Throne Room', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Militia');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    // Second play: Bob already has 3 cards, so he isn't asked again
    expect(game.pending.playerName).toBe('Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.coins).toBe(4);
  });

  it('reshuffles in the middle of the second play, without shuffling in the cards in play', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Smithy'] });
    game.alice.setHand(['Throne Room', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Gold']);
    game.alice.setDiscard(['Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Smithy');

    // First play: the 3 Silvers. Second play: Gold, then a reshuffle of the 3 Estates for the last 2 cards
    expect(game.alice.hand.sort()).toEqual(
      ['Copper', 'Copper', 'Copper', 'Estate', 'Estate', 'Gold', 'Silver', 'Silver', 'Silver'].sort(),
    );
    expect(game.alice.deck).toEqual(['Estate']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Smithy']);
  });

  it('lets a target reveal Moat separately for each play of an Attack', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Militia', 'Moat'] });
    game.alice.setHand(['Throne Room', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Militia');
    // First play: Bob reveals Moat and is unaffected
    await revealMoat(game, 'Bob');
    expect(game.bob.hand).toHaveLength(5);
    // Second play: Bob may reveal Moat again (wiki, Moat: you may reveal it for as many Attacks as you want),
    // but declines, so he discards down to 3
    expect(game.expectDecision('chooseFromMultipleEvents', 'Bob').optionalEffects.map((e) => e.effectName)).toEqual([
      'Moat',
    ]);
    await game.declineEffects();
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Moat', 'Copper', 'Copper']);
    expect(game.alice.coins).toBe(4);
  });

  it('is fully blocked by a Moat revealed for both plays of an Attack', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Witch', 'Moat'] });
    game.alice.setHand(['Throne Room', 'Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    const cursesBefore = game.pileSize('Curse');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Witch');
    await revealMoat(game, 'Bob');
    await revealMoat(game, 'Bob');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.pileSize('Curse')).toBe(cursesBefore);
    expect(game.bob.discard).toEqual([]);
    expect(game.alice.hand).toHaveLength(3 + 4);
  });

  it('plays Library twice: the second play draws nothing when the first filled the hand to 7', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Library', 'Village'] });
    game.alice.setHand(['Throne Room', 'Library', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Village', 'Gold', 'Gold', 'Silver', 'Estate', 'Village']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Library');
    await game.chooseOption('Set it aside');

    // The second play doesn't look at any card (the next Village would otherwise be offered)
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Gold', 'Gold', 'Silver']);
    expect(game.alice.discard).toEqual(['Village']);
    expect(game.alice.deck).toEqual(['Estate', 'Village']);
  });

  it('plays Library twice: the second play draws back up to 7 after the first play is resolved', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Library', 'Village'] });
    game.alice.setHand(['Throne Room', 'Library', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Silver', 'Gold']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Library');

    // Hand of 3, so the first play draws 4; the second play finds a hand of 7 and draws nothing
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.deck).toEqual(['Gold']);
  });

  it('plays Mine twice: the second play can only gain what is left once the first emptied a pile', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Mine'] });
    game.alice.setHand(['Throne Room', 'Mine', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Silver', 1);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mine');
    await game.chooseCard('Copper');
    await game.chooseCard('Silver');
    expect(game.pileSize('Silver')).toBe(0);

    // Second play: trash the other Copper; Silver is gone, so only Copper (up to $3) can be gained
    const trashDecision = game.expectDecision('chooseCard', 'Alice');
    expect(offered(trashDecision).sort()).toEqual(['Copper', 'Silver']);
    await game.chooseCard('Copper');
    const gainDecision = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gainDecision)).toEqual(['Copper']);
    await game.chooseCard('Copper');

    expect(game.trash).toEqual(['Copper', 'Copper']);
    expect(game.alice.hand.sort()).toEqual(['Copper', 'Estate', 'Silver']);
  });

  it('plays Remodel twice with only one card in hand: the second play has nothing to trash', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Remodel'] });
    game.alice.setHand(['Throne Room', 'Remodel', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Remodel');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');

    expect(game.pending.kind).toBe('buyPhase');
    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('played by Throne Room, plays one Action twice and then finds no Action left to play twice', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Throne Room', 'Village', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Throne Room');
    await game.chooseCard('Village');

    // No Action card left in hand, so the action phase ends
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Throne Room', 'Village']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toHaveLength(2 + 2);
  });

  it("played three times by King's Court, plays three different Actions twice each", async () => {
    const game = createGame({ kingdom: ['Throne Room', "King's Court", 'Village', 'Smithy', 'Laboratory'] });
    game.alice.setHand(["King's Court", 'Throne Room', 'Village', 'Smithy', 'Copper']);
    game.alice.setDeck(['Laboratory', ...coppers(20)]);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Throne Room');
    await game.chooseCard('Village');
    // Village drew the Laboratory, which the third Throne Room play can choose
    await game.chooseCard('Smithy');
    await game.chooseCard('Laboratory');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(["King's Court", 'Throne Room', 'Village', 'Smithy', 'Laboratory']);
    // Copper, +2 (Village twice) -Laboratory, +6 (Smithy twice), +4 (Laboratory twice)
    expect(game.alice.hand).toHaveLength(1 + 2 - 1 + 6 + 4);
    expect(game.alice.actions).toBe(4 + 2);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('plays Witch twice in a 3-player game: each play gives Curses in turn order while they last', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Witch'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Throne Room', 'Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Curse', 3);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Witch');

    expect(game.bob.discard).toEqual(['Curse', 'Curse']);
    expect(game.player('Cara').discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('plays Bureaucrat twice: two Silvers onto the deck and two Victory cards onto each target deck', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Bureaucrat'] });
    game.alice.setHand(['Throne Room', 'Bureaucrat', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    game.bob.setHand(['Estate', 'Duchy', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Bureaucrat');
    await game.chooseCard('Duchy');
    // Second play: Estate is the only Victory card left in Bob's hand
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Estate');
    }

    expect(game.alice.deck.slice(0, 3)).toEqual(['Silver', 'Silver', 'Gold']);
    expect(game.bob.deck).toEqual(['Estate', 'Duchy', 'Gold']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
  });

  it('plays Harbinger twice: the second play draws the card the first put on the deck', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Harbinger'] });
    game.alice.setHand(['Throne Room', 'Harbinger', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.alice.setDiscard(['Gold', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Harbinger');
    await game.chooseCard('Gold');
    // Second play draws the Gold, then may put the Silver on the deck
    expect(game.alice.hand).toContain('Gold');
    await game.chooseCard('Silver');

    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Copper', 'Estate', 'Gold']);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(2);
  });

  it('plays Poacher twice, discarding for each empty Supply pile each time', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Poacher'] });
    game.alice.setHand(['Throne Room', 'Poacher', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Curse', 'Copper', ...coppers(10)]);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Poacher');
    await game.chooseCards(['Curse']);
    await game.chooseCards(['Estate']);

    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.discard.sort()).toEqual(['Curse', 'Estate']);
    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Estate']);
  });

  it('is discarded this turn with a Duration that had nothing to do on either play (Haven with no card to set aside)', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Haven'] });
    game.alice.setHand(['Throne Room', 'Haven']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Haven');
    await game.endTurn();

    // Seaside rulebook: Durations stay in play only until the Clean-up of the last turn they do something.
    // Both were discarded, then shuffled into the new deck and drawn by Clean-up
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.hand.sort()).toEqual(['Haven', 'Throne Room']);
  });

  it('stays in play with a Duration when only its first play has something to do next turn (Haven)', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Haven'] });
    game.alice.setHand(['Throne Room', 'Haven', 'Gold']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Haven');
    // First play: sets the Gold aside. Second play: nothing left to set aside
    await game.chooseCard('Gold');
    expect(game.pending.kind).toBe('buyPhase');
    expect(game.alice.setAside).toEqual(['Gold']);
    await game.endTurn();

    expect(game.alice.inPlay.sort()).toEqual(['Haven', 'Throne Room']);
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toContain('Gold');
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it("plays Library twice: the first play's set-aside cards are discarded before the second play, which may reshuffle them", async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Library', 'Village'] });
    game.alice.setHand(['Throne Room', 'Library', 'Copper']);
    game.alice.setDeck(['Village', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Library');
    // First play: Village set aside, Silver drawn, the deck runs out and the Village is discarded
    await game.chooseOption('Set it aside');
    // Second play: the discard pile (just the Village) is shuffled into a new deck and the Village revealed again
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain('Village');
    await game.chooseOption('Draw it into your hand');

    expect(game.alice.hand.sort()).toEqual(['Copper', 'Silver', 'Village']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.setAside).toEqual([]);
  });

  it('played in the Buy phase by Coronet, plays Actions twice there', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Smithy', 'Village'] });
    game.alice.setHand(['Coronet', 'Throne Room', 'Smithy', 'Village']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Throne Room');
    // First Throne Room play: Smithy twice; second: Village twice
    await game.chooseCard('Smithy');
    await game.chooseCard('Village');
    // Coronet's Treasure: a Copper twice
    await game.chooseCard('Copper');

    expect(game.alice.inPlay).toEqual(['Coronet', 'Throne Room', 'Smithy', 'Village', 'Copper']);
    expect(game.alice.hand).toHaveLength(6 + 2 - 1);
    expect(game.alice.coins).toBe(2);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(2 + 7);
  });

  it('offers every Action card in hand, whatever its other types, and no card that is not an Action', async () => {
    const game = createGame({
      kingdom: ['Throne Room', 'Mill', 'Moat', 'Knights', 'Marauder', 'Farm', "Fool's Gold", 'Tunnel'],
      useShelters: true,
    });
    game.alice.setHand([
      'Throne Room',
      'Coronet',
      'Mill',
      'Moat',
      'Necropolis',
      'Dame Josephine',
      'Abandoned Mine',
      'Farm',
      "Fool's Gold",
      'Tunnel',
      'Hovel',
      'Copper',
    ]);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(offered(decision).sort()).toEqual([
      'Abandoned Mine',
      'Coronet',
      'Dame Josephine',
      'Mill',
      'Moat',
      'Necropolis',
    ]);
    // Necropolis (Action-Shelter): +2 Actions, twice
    await game.chooseCard('Necropolis');

    expect(game.alice.actions).toBe(4);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Necropolis']);
  });
});
