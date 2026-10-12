import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

const inPlayIds = (game: GameHarness): string[] => game.alice.cards(CardLocation.IN_PLAY).map((card) => card.getId());

/** Resolves start-of-turn prompts (e.g. several Duration effects) until a normal turn decision is pending. */
const resolveStartOfTurnEffects = async (game: GameHarness, cardName: string): Promise<void> => {
  while (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect(cardName);
  }
};

describe('Coronet', () => {
  it('playing an Attack twice lets other players react to it', async () => {
    const game = createGame({ kingdom: ['Militia', 'Beggar'] });
    game.alice.setHand(['Coronet', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Militia');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toContain('Beggar');
  });

  it('played in the Buy phase, can play a Treasure twice', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Coronet', 'Silver', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Silver');

    expect(game.alice.inPlay).toEqual(['Coronet', 'Silver']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(1);
  });

  it('played in the Buy phase, can still play a non-Reward Action twice without using Actions', async () => {
    const game = createGame({ kingdom: ['Smithy'] });
    game.alice.setHand(['Coronet', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Smithy']);
    await game.chooseCard('Smithy');
    // Decline Coronet's optional Treasure play
    await game.chooseNone();

    expect(game.alice.inPlay).toEqual(['Coronet', 'Smithy']);
    expect(game.alice.hand).toHaveLength(8);
    expect(game.alice.actions).toBe(1);
  });

  it('plays the Action before the Treasure, and both are optional', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Coronet', 'Village', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseNone();
    await game.chooseCard('Silver');

    expect(game.alice.inPlay).toEqual(['Coronet', 'Silver']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.hand).toEqual(['Village']);
  });

  it('playing a Duration Action twice keeps Coronet in play until the Duration is discarded', async () => {
    const game = createGame({ kingdom: ['Wharf'] });
    const [coronet, wharf] = game.alice.setHand(['Coronet', 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Wharf');
    expect(game.alice.hand).toHaveLength(3 + 4);
    expect(game.alice.buys).toBe(3);
    // Decline Coronet's optional Treasure play
    await game.chooseNone();
    await game.endTurn();

    // Rule: a card that plays a Duration more than once stays in play while the Duration does
    expect(inPlayIds(game).sort()).toEqual([coronet.getId(), wharf.getId()].sort());
    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');

    // Both Wharf plays resolve at the start of the next turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5 + 4);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.inPlay.sort()).toEqual(['Coronet', 'Wharf']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Coronet', 'Wharf']));
  });

  it('playing a Duration Treasure twice keeps Coronet in play until the Duration is discarded', async () => {
    const game = createGame({ kingdom: ['Astrolabe'] });
    game.alice.setHand(['Coronet', 'Astrolabe', 'Estate']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction('Coronet');
    // There is no Action in hand, so Coronet goes straight to the Treasure
    await game.chooseCard('Astrolabe');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay.sort()).toEqual(['Astrolabe', 'Coronet']);
    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Astrolabe');

    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('played twice by Throne Room, plays an Action and a Treasure twice each time, and only Coronet stays for a Duration', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Wharf'] });
    const [, coronet, wharf] = game.alice.setHand(['Throne Room', 'Coronet', 'Wharf', 'Village', 'Silver', 'Gold']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Coronet');
    // First Coronet play
    await game.chooseCard('Wharf');
    await game.chooseCard('Silver');
    // Second Coronet play
    await game.chooseCard('Village');
    await game.chooseCard('Gold');

    expect(game.alice.coins).toBe(4 + 6);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.actions).toBe(4);
    // 4 Cards from Wharf, 2 from Village
    expect(game.alice.hand).toEqual(coppers(6));
    await game.endTurn();

    // Throne Room played Coronet (not a Duration), so only Coronet stays out with Wharf
    expect(inPlayIds(game).sort()).toEqual([coronet.getId(), wharf.getId()].sort());
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Throne Room', 'Village', 'Silver', 'Gold']));
  });

  it('can play Throne Room twice, which plays two different Actions twice each', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Coronet', 'Throne Room', 'Village', 'Smithy', 'Copper']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Throne Room');
    await game.chooseCard('Village');
    await game.chooseCard('Smithy');
    await game.chooseNone();

    expect(game.alice.inPlay).toEqual(['Coronet', 'Throne Room', 'Village', 'Smithy']);
    // 1 Copper + 2 Cards from Village + 6 from Smithy
    expect(game.alice.hand).toHaveLength(9);
    // Coronet used the only Action; playing cards with it doesn't use Actions
    expect(game.alice.actions).toBe(4);
  });

  it('played in the Buy phase, can play a Treasure that the Action it played drew, but no more Actions', async () => {
    const game = createGame({ kingdom: ['Laboratory'] });
    game.alice.setHand(['Coronet', 'Laboratory', 'Village', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Estate', 'Estate', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Laboratory');
    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Silver', 'Gold', 'Estate', 'Estate']);
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Gold', 'Silver']);
    await game.chooseCard('Gold');

    expect(game.alice.coins).toBe(6);
    // Still the Buy phase: the +Actions from Laboratory can't be used to play Village
    game.expectDecision('treasurePhase', 'Alice');
    const playable = game.pending.cardChoices.filter((choice) => choice.card.location === CardLocation.HAND);
    expect(playable.map((choice) => choice.card.name)).not.toContain('Village');
    expect(playable.map((choice) => choice.card.name)).toContain('Silver');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
  });

  it("played in the Action phase, plays Fool's Gold twice: +$1, then +$4 as the second Fool's Gold played", async () => {
    const game = createGame({ kingdom: ["Fool's Gold"] });
    game.alice.setHand(['Coronet', "Fool's Gold", 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard("Fool's Gold");

    expect(game.alice.coins).toBe(5);
  });

  it('plays Horn of Plenty twice: once trashed, it no longer counts itself, and is not trashed again', async () => {
    const game = createGame({ kingdom: ['Horn of Plenty'] });
    game.alice.setHand(['Village', 'Coronet', 'Horn of Plenty', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Coronet');
    await game.chooseCard('Horn of Plenty');
    // Village, Coronet and Horn of Plenty: up to $3
    expect(offeredNames(game)).toContain('Silver');
    await game.chooseCard('Estate');
    expect(game.trash).toEqual(['Horn of Plenty']);

    // Second play: only Village and Coronet are in play, so up to $2
    expect(offeredNames(game)).toContain('Estate');
    expect(offeredNames(game)).not.toContain('Silver');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Horn of Plenty']);
    expect(game.alice.log).toContain('Alice has lost track of Horn of Plenty');
    expect(game.alice.discard).toEqual(['Estate', 'Estate']);
    expect(game.alice.inPlay).toEqual(['Village', 'Coronet']);
    expect(game.alice.hand).toEqual(['Silver', 'Copper']);
  });

  it('played in the Buy phase with Footpad in the game, gains made by the Action it plays draw nothing', async () => {
    const game = createGame({ kingdom: ['Footpad', 'Merchant Guild', 'Workshop'] });
    game.alice.setHand(['Merchant Guild', 'Coronet', 'Workshop', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant Guild');
    await game.playTreasure('Coronet');
    await game.chooseCard('Workshop');
    await game.chooseCard('Silver');
    await game.chooseCard('Silver');
    await game.chooseNone();

    // Footpad only draws for gains in an Action phase
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.endBuyPhase();

    // Merchant Guild counts every card gained in the Buy phase, including Workshop's
    expect(game.alice.coffers).toBe(3);
  });

  it('plays Spoils twice for +$6 even though the first play returns it to its pile', async () => {
    const game = createGame({ kingdom: ['Bandit Camp'] });
    game.alice.setHand(['Coronet', 'Spoils', 'Estate']);
    game.alice.setDeck(coppers(10));
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Spoils');

    expect(game.alice.coins).toBe(6);
    expect(game.pileSize('Spoils')).toBe(spoils + 1);
    expect(game.alice.inPlay).toEqual(['Coronet']);
  });

  it('can play a Treasure–Victory Farm or a Curse that is a Treasure twice, but not a Victory card', async () => {
    const game = createGame({ kingdom: ['Farm', 'Charlatan'] });
    game.alice.setHand(['Coronet', 'Farm', 'Charlatan Curse', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Coronet');
    // No non-Reward Action in hand, so straight to the Treasure
    game.expectDecision('chooseCard', 'Alice');
    expect(offeredNames(game).sort()).toEqual(['Charlatan Curse', 'Farm']);
    await game.chooseCard('Farm');

    expect(game.alice.inPlay).toEqual(['Coronet', 'Farm']);
    expect(game.alice.coins).toBe(4);
  });

  it('plays an Action–Victory Mill twice, then a Treasure twice', async () => {
    const game = createGame({ kingdom: ['Mill'] });
    game.alice.setHand(['Coronet', 'Mill', 'Silver', 'Estate', 'Estate', 'Duchy']);
    game.alice.setDeck(['Duchy', 'Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Mill');
    await game.chooseCards(['Estate', 'Estate']);
    await game.chooseCards(['Duchy', 'Duchy']);
    await game.chooseCard('Silver');

    expect(game.alice.inPlay).toEqual(['Coronet', 'Mill', 'Silver']);
    expect(game.alice.coins).toBe(2 + 2 + 4);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Copper']);
  });
});
