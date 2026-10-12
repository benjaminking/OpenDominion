import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Monkey', () => {
  it('draws a card for each card the player to its right gains, then a card at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Monkey', 'Workshop'] });
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Workshop', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Monkey']);
    await game.playAction('Workshop');
    await game.chooseCard('Silver');
    expect(game.alice.hand).toHaveLength(6);
    await game.playAllTreasures();
    await game.buy('Silver');

    // +1 Card for the bought Silver, then +1 Card at the start of Alice's turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(8);
    expect(game.alice.inPlay).toEqual(['Monkey']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Monkey');
  });

  it('is discarded at the end of the next turn even if the player to its right gained nothing', async () => {
    const game = createGame({ kingdom: ['Monkey'] });
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.inPlay).toEqual(['Monkey']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Monkey');
  });

  it("draws when the player to its right gains a card on its owner's turn, and still stays in play", async () => {
    const game = createGame({ kingdom: ['Monkey', 'Sea Witch', 'Village'] });
    game.alice.setHand(['Village', 'Monkey', 'Sea Witch', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Monkey');
    await game.playAction('Sea Witch');
    expect(game.bob.discard).toEqual(['Curse']);
    // 2 Coppers, +1 from Village, +2 from Sea Witch, +1 from Monkey
    expect(game.alice.hand).toHaveLength(6);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Monkey', 'Sea Witch']);
  });

  it('only draws for cards gained by the player to its right', async () => {
    const game = createGame({ kingdom: ['Monkey'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    cara.setHand(coppers(5));
    cara.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    // Bob is to Alice's left
    expect(game.currentPlayerName).toBe('Bob');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.alice.hand).toHaveLength(5);

    // Cara is to Alice's right
    expect(game.currentPlayerName).toBe('Cara');
    await game.playAllTreasures();
    await game.buy('Silver');

    // +1 Card for Cara's Silver, then +1 Card at the start of Alice's turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
  });

  it("stops drawing for gains once its owner's next turn has started", async () => {
    const game = createGame({ kingdom: ['Monkey', 'Sea Witch'] });
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Sea Witch', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    await game.playAction('Sea Witch');
    expect(game.bob.discard).toContain('Curse');
    expect(game.alice.hand).toHaveLength(8);
  });

  it('draws 2 cards per gain and 2 at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Monkey', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Monkey', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Monkey');
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy('Silver');

    // +2 Cards for the bought Silver, then +2 Cards at the start of Alice's turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(9);
  });

  it("draws when the player to its right gains a card on a third player's turn, as well as on their own turn", async () => {
    const game = createGame({ kingdom: ['Monkey', 'Sea Witch'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Sea Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    cara.setHand(coppers(5));
    cara.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    // Alice and Cara gain a Curse on Bob's turn; only Cara's (to Alice's right) counts
    await game.playAction('Sea Witch');
    expect(game.alice.discard).toContain('Curse');
    expect(cara.discard).toEqual(['Curse']);
    expect(game.alice.hand).toHaveLength(6);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Cara');
    await game.playAllTreasures();
    await game.buy('Silver');

    // +1 Card for Cara's Silver, then +1 Card at the start of Alice's turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(8);
  });

  it('lets its owner order it with Caravan at the start of the next turn, shuffling without the cards in play', async () => {
    const game = createGame({ kingdom: ['Monkey', 'Caravan', 'Village'] });
    game.alice.setHand(['Village', 'Monkey', 'Caravan', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', 'Copper', 'Silver', 'Silver', 'Silver', 'Silver', 'Silver']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Monkey');
    await game.playAction('Caravan');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.deck).toEqual([]);
    const durations = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...offeredEffects(durations)].sort()).toEqual(['Caravan', 'Monkey']);
    await resolveEffects(game, ['Caravan', 'Monkey']);

    // The discard pile (Village, 2 Estates, 2 Coppers) was shuffled to draw; Monkey and Caravan stayed in play
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.deck).toHaveLength(3);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Monkey', 'Caravan']);
    expect([...game.alice.hand, ...game.alice.deck]).not.toContain('Monkey');
  });

  it('draws at the start of an Outpost turn and then stops drawing for gains', async () => {
    const game = createGame({ kingdom: ['Monkey', 'Outpost', 'Village'] });
    game.alice.setHand(['Village', 'Monkey', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Monkey');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(4);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5);
  });
  it('in a 4-player game, draws only for gains by the player to its right', async () => {
    const game = createGame({ kingdom: ['Monkey'], players: ['Alice', 'Bob', 'Cara', 'Dave'] });
    const cara = game.player('Cara');
    const dave = game.player('Dave');
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    for (const player of [game.bob, cara, dave]) {
      player.setHand(coppers(5));
      player.setDeck(coppers(10));
    }

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.currentPlayerName).toBe('Cara');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.alice.hand).toHaveLength(5);

    // Dave is to Alice's right
    expect(game.currentPlayerName).toBe('Dave');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
  });

  it("draws for the player to its right's gains on both their normal turn and their Outpost turn", async () => {
    const game = createGame({ kingdom: ['Monkey', 'Outpost'] });
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.alice.hand).toHaveLength(6);
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Bob');
    await game.playAllTreasures();
    await game.buy('Silver');

    // +1 Card for each Silver, then +1 Card at the start of Alice's turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(8);
  });

  it('draws a card for each of several cards gained at once, e.g. the 4 Golds from Treasure Map', async () => {
    const game = createGame({ kingdom: ['Monkey', 'Treasure Map'] });
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Treasure Map', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    await game.playAction('Treasure Map');
    await game.chooseCard('Treasure Map');

    expect(game.bob.deck.slice(0, 4)).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    expect(game.alice.hand).toHaveLength(9);
  });

  it("lets its owner gain a Gold onto the deck with Fool's Gold first, and then draw that Gold", async () => {
    const game = createGame({ kingdom: ['Monkey', "Fool's Gold"] });
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(["Fool's Gold", 'Copper', 'Copper', 'Copper', 'Copper', 'Estate', ...coppers(10)]);
    game.bob.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    await game.playAllTreasures();
    await game.buy('Province');
    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...offeredEffects(reactions)].sort()).toEqual(["Fool's Gold", 'Monkey']);
    await game.chooseEffect("Fool's Gold");

    // Monkey then draws the Gold Fool's Gold put on the deck; the Estate is drawn at the start of Alice's turn
    expect(game.trash).toEqual(["Fool's Gold"]);
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold', 'Estate']);
  });

  it('lets its owner play a Pirate it draws in response to the same Treasure gain', async () => {
    const game = createGame({ kingdom: ['Monkey', 'Pirate'] });
    game.alice.setHand(['Monkey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...coppers(5), 'Pirate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Monkey');
    await game.endTurn();

    await game.playAllTreasures();
    await game.buy('Silver');

    // Monkey drew the Pirate, which can react to the Silver Bob just gained
    expect(game.alice.hand).toContain('Pirate');
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');
    expect(game.alice.inPlay).toEqual(['Monkey', 'Pirate']);

    expect(game.currentPlayerName).toBe('Alice');
    await resolveEffects(game, ['Monkey']);
    await game.chooseCard('Gold');
    expect(game.alice.hand).toEqual(expect.arrayContaining(['Gold']));
    expect(game.alice.hand).toHaveLength(7);
  });

  it('does not draw when another player gains a card that the player to its right gained earlier and then trashed', async () => {
    const game = createGame({
      kingdom: ['Monkey', 'Mine', 'Village', 'Graverobber'],
      players: ['Alice', 'Bob', 'Cara'],
    });
    const cara = game.player('Cara');
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Monkey', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Graverobber', ...coppers(10)]);
    cara.setHand(['Village', 'Mine', 'Mine', 'Silver', 'Copper']);
    cara.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.endTurn();

    // Cara gains a Gold with Mine, then trashes it with another Mine
    expect(game.currentPlayerName).toBe('Cara');
    await game.playAction('Village');
    await game.playAction('Mine');
    await game.chooseCard('Silver');
    await game.chooseCard('Gold');
    await game.playAction('Mine');
    await game.chooseCard('Gold');
    await game.chooseCard('Gold');
    expect(game.trash).toEqual(['Silver', 'Gold']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Monkey');
    await game.endTurn();

    // Bob (to Alice's left) gains that Gold from the trash
    await game.playAction('Graverobber');
    await game.chooseOption('Gain a card from the trash costing $3-$6 onto your deck');
    await game.chooseCard('Gold');
    expect(game.bob.deck[0]).toBe('Gold');

    // Alice's 5-card hand from her Clean-up, with nothing drawn for Bob's gain
    expect(game.alice.hand).toHaveLength(5);
  });
  it("played on an Outpost turn, draws for gains during the next player's turn and at the start of its owner's next normal turn", async () => {
    const game = createGame({ kingdom: ['Monkey', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Monkey', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    await game.playAction('Monkey');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Monkey']);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
});
