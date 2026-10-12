import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offered, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Pirate', () => {
  it('gains a Treasure costing up to $6 to hand at the start of the next turn, staying in play until then', async () => {
    const game = createGame({ kingdom: ['Pirate'], useColoniesPlatinum: true });
    game.alice.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Pirate');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Pirate']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect([...offered(gain)].sort()).toEqual(['Copper', 'Gold', 'Silver']);
    expect(gain.noneAllowed).toBe(false);
    await game.chooseCard('Gold');

    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.inPlay).toEqual(['Pirate']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Pirate');
  });

  it("can be played when another player gains a Treasure, and then gains a Treasure at the start of its owner's next turn", async () => {
    const game = createGame({ kingdom: ['Pirate'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.buy('Silver');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');
    expect(game.bob.inPlay).toEqual(['Pirate']);

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.inPlay).toEqual(['Pirate']);
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');
    expect(game.bob.hand).toContain('Gold');
    await game.endTurn();

    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Pirate');
  });

  it('can be played when its owner gains a Treasure', async () => {
    const game = createGame({ kingdom: ['Pirate'] });
    game.alice.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Pirate']);
  });

  it('lets its owner play two Pirates from hand when another player gains a Treasure', async () => {
    const game = createGame({ kingdom: ['Pirate'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Pirate', 'Pirate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Pirate');

    const second = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(second.optionalEffects.map((effect) => effect.effectName)).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');
    expect(game.bob.inPlay).toEqual(['Pirate', 'Pirate']);
  });

  it('is not offered when another player gains a card that is not a Treasure', async () => {
    const game = createGame({ kingdom: ['Pirate'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.buy('Estate');

    expect(game.currentPlayerName).toBe('Bob');
    game.expectDecision('actionPhase', 'Bob');
    expect(game.bob.hand).toContain('Pirate');
  });

  it('gains a Treasure for each play at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Pirate', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Pirate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Pirate');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseCard('Gold');
    expect(game.pending.kind).toBe('chooseCard');
    await game.chooseCard('Gold');
    expect(game.alice.hand.filter((name) => name === 'Gold')).toHaveLength(2);
  });

  it('may be played on any one of several Treasures gained in a row, but only once', async () => {
    const game = createGame({ kingdom: ['Pirate', 'Treasure Map'] });
    game.alice.setHand(['Treasure Map', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Treasure Map');
    await game.chooseCard('Treasure Map');

    // Offered for the first Gold; declined
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Bob'))).toEqual(['Pirate']);
    await game.declineEffects();
    // Offered again for the second Gold
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Bob'))).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');

    expect(game.bob.inPlay).toEqual(['Pirate']);
    expect(game.alice.deck.slice(0, 4)).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it("played on another player's turn, waits through that player's Outpost turn and gains on its owner's turn", async () => {
    const game = createGame({ kingdom: ['Pirate', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Pirate');
    expect(game.bob.inPlay).toEqual(['Pirate']);
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    // Alice's extra turn isn't Bob's next turn
    expect(game.currentPlayerName).toBe('Alice');
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toHaveLength(4);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    const gain = game.expectDecision('chooseCard', 'Bob');
    expect([...offered(gain)].sort()).toEqual(['Copper', 'Silver']);
    await game.chooseCard('Silver');
    expect(game.bob.hand).toContain('Silver');
  });

  it('lets a second Pirate in hand be played when the first one gains a Treasure at the start of the turn', async () => {
    const game = createGame({ kingdom: ['Pirate'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Pirate', 'Pirate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Pirate');
    await game.declineEffects();
    expect(game.bob.inPlay).toEqual(['Pirate']);

    expect(game.currentPlayerName).toBe('Bob');
    await game.chooseCard('Gold');
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Bob'))).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');
    expect(game.bob.inPlay).toEqual(['Pirate', 'Pirate']);
    await game.endTurn();

    // The first Pirate is done; the second gains at the start of Bob's next turn
    expect(game.bob.inPlay).toEqual(['Pirate']);
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.chooseCard('Gold');
    expect(game.bob.hand).toContain('Gold');
  });
  it('can gain any Supply Treasure costing up to $6, including multi-type ones, but not Potion-cost or non-Supply ones', async () => {
    const game = createGame({
      kingdom: ['Pirate', 'Farm', "Fool's Gold", "Philosopher's Stone", 'Bandit Camp', 'Astrolabe', 'Joust'],
    });
    game.alice.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Pirate');
    await game.endTurn();
    await game.endTurn();

    // Farm is a Treasure-Victory card; Philosopher's Stone costs $3P; Spoils and the Action-Treasure Coronet (a
    // Reward) aren't in the Supply
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect([...offered(gain)].sort()).toEqual([
      'Astrolabe',
      'Copper',
      'Farm',
      "Fool's Gold",
      'Gold',
      'Potion',
      'Silver',
    ]);
    await game.chooseCard('Farm');
    expect(game.alice.hand).toContain('Farm');
  });

  it('can be played when another player gains a Treasure-Victory card such as Farm', async () => {
    const game = createGame({ kingdom: ['Pirate', 'Farm'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.buy('Farm');

    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Bob'))).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');
    expect(game.bob.inPlay).toEqual(['Pirate']);
  });

  it('in a 3-player game, offers each other player their Pirate in turn order, and each chooses for themselves', async () => {
    const game = createGame({ kingdom: ['Pirate'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Pirate', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Pirate', ...coppers(10)]);
    cara.setHand(coppers(5));
    cara.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Cara');
    await game.playAllTreasures();
    await game.buy('Silver');

    // After Cara, Alice is next in turn order, then Bob
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.declineEffects();
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Pirate');

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.hand).toContain('Pirate');
    expect(game.bob.inPlay).toEqual(['Pirate']);

    // Alice's turn has no Pirate gain; Bob's does
    expect(game.currentPlayerName).toBe('Alice');
    game.expectDecision('actionPhase', 'Alice');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.chooseCard('Gold');
    expect(game.bob.hand).toContain('Gold');
  });
  it('can be played when another player gains the Action-Treasure Coronet from the Rewards', async () => {
    const game = createGame({ kingdom: ['Pirate', 'Joust'] });
    game.alice.setHand(['Joust', 'Province', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Pirate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Joust');
    await game.chooseCard('Province');
    await game.chooseCard('Coronet');
    expect(game.alice.hand).toContain('Coronet');

    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Bob'))).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');
    expect(game.bob.inPlay).toEqual(['Pirate']);
  });
});
