import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Sailor', () => {
  it('lets its owner play a Duration card gained this turn, and gives +$2 and a trash on the next turn', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Caravan'] });
    game.alice.setHand(['Sailor', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Estate', ...coppers(4), 'Gold', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    expect(game.alice.actions).toBe(1);
    await game.playAllTreasures();
    await game.buy('Caravan');

    // Playing the gained Duration is optional
    const sailor = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(sailor.optionalEffects.map((effect) => effect.effectName)).toEqual(['Sailor']);
    await game.chooseEffect('Sailor');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sailor', 'Caravan']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseEffect('Sailor');
    expect(game.alice.coins).toBe(2);
    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(trash.noneAllowed).toBe(true);
    await game.chooseCard('Estate');
    expect(game.trash).toEqual(['Estate']);
    // Caravan's +1 Card
    expect(game.alice.hand).toContain('Gold');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Sailor', 'Caravan']));
  });

  it('lets its owner decline to play the gained Duration card', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Caravan'] });
    game.alice.setHand(['Sailor', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.playAllTreasures();
    await game.buy('Caravan');
    await game.declineEffects();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sailor']);
    expect(game.alice.discard).toContain('Caravan');
  });

  it('plays only one gained Duration card per Sailor', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Caravan', 'Village', 'Workshop'] });
    game.alice.setHand(['Village', 'Sailor', 'Workshop', 'Silver', 'Silver']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Sailor');
    await game.playAction('Workshop');
    await game.chooseCard('Caravan');
    await game.chooseEffect('Sailor');
    expect(game.alice.inPlay).toEqual(['Village', 'Sailor', 'Workshop', 'Caravan']);
    await game.playTreasure('Silver');
    await game.playTreasure('Silver');
    await game.buy('Caravan');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Caravan');
  });

  it('can play a Duration card gained by Blockade, which then fails to keep it set aside', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Blockade', 'Caravan'] });
    game.alice.setHand(['Sailor', 'Blockade', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.playAction('Blockade');
    await game.chooseCard('Caravan');
    await game.chooseEffect('Sailor');

    expect(game.alice.log).toContain('Alice has lost track of Caravan');
    expect(game.alice.inPlay).toEqual(['Sailor', 'Blockade', 'Caravan']);
    expect(game.alice.setAside).toEqual([]);
    await game.endTurn();

    // Blockade has nothing left to do, so it is discarded
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sailor', 'Caravan']);
  });

  it('offers the second Sailor for the same gained Duration card, which then loses track of it', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Caravan', 'Village'] });
    game.alice.setHand(['Village', 'Sailor', 'Sailor', 'Silver', 'Silver']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Sailor');
    await game.playAction('Sailor');
    await game.playAllTreasures();
    await game.buy('Caravan');
    await game.chooseEffect('Sailor');
    expect(game.alice.inPlay.filter((name) => name === 'Caravan')).toEqual(['Caravan']);

    // The other Sailor is still offered, but the Caravan has already left the discard pile
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Sailor']);
    await game.chooseEffect('Sailor');

    expect(game.alice.log).toContain('Alice has lost track of Caravan');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sailor', 'Sailor', 'Caravan']);
  });

  it('gives +$2 and a trash twice at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Sailor', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sailor');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseNone();
    expect(game.pending.kind).toBe('chooseCard');
    await game.chooseNone();
    expect(game.alice.coins).toBe(4);
  });

  it('can play a Duration bought in the Buy phase, whose drawn Treasures then cannot be played', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Wharf'] });
    game.alice.setHand(['Sailor', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.playAllTreasures();
    await game.buy('Wharf');
    await game.chooseEffect('Sailor');

    expect(game.alice.inPlay).toContain('Wharf');
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    // Wharf's +1 Buy can still be used, but the drawn Coppers can't be played after buying
    const buy = game.expectDecision('buyPhase', 'Alice');
    expect(buy.numBuys).toBe(1);
    expect(buy.numCoins).toBe(2);
    await game.buy('Estate');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sailor', 'Wharf']);
  });

  it('can play a bought Outpost, giving an extra turn on which its own +$2 and trash happen', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Outpost'] });
    game.alice.setHand(['Sailor', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Estate', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.playAllTreasures();
    await game.buy('Outpost');
    await game.chooseEffect('Sailor');
    expect(game.alice.inPlay).toContain('Outpost');
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    const durations = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...offeredEffects(durations)].sort()).toEqual(['Outpost', 'Sailor']);
    await game.chooseEffect('Sailor');
    expect(game.alice.coins).toBe(2);
    await game.chooseCard('Estate');
    await resolveEffects(game);

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
  });

  it('loses track of a gained Duration card that Watchtower has already put onto the deck', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Caravan', 'Watchtower'] });
    game.alice.setHand(['Sailor', 'Watchtower', 'Silver', 'Silver', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Caravan');
    expect([...offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))].sort()).toEqual([
      'Sailor',
      'Watchtower',
    ]);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    // Sailor is still offered, but loses track of the Caravan, so the turn ends and Caravan is drawn from the deck
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Sailor']);
    await game.chooseEffect('Sailor');
    expect(game.alice.log).toContain('Alice has lost track of Caravan');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sailor']);
    expect(game.alice.hand).toEqual(['Caravan', 'Copper', 'Copper', 'Copper', 'Copper']);
  });

  it('can play a Duration card gained onto the deck', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Caravan', 'Armory'] });
    game.alice.setHand(['Sailor', 'Armory', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.playAction('Armory');
    await game.chooseCard('Caravan');
    expect(game.alice.deck[0]).toBe('Caravan');
    await game.chooseEffect('Sailor');

    expect(game.alice.inPlay).toEqual(['Sailor', 'Armory', 'Caravan']);
    // Caravan's +1 Card drew the Silver
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver']);
  });
  it('can play a gained Duration-Attack such as Sea Witch, which attacks and then works on the next turn', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Sea Witch'] });
    game.alice.setHand(['Sailor', 'Gold', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.playAllTreasures();
    await game.buy('Sea Witch');
    await game.chooseEffect('Sailor');

    // The Buy was used up, so the turn ended; Sailor and Sea Witch stay in play
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sailor', 'Sea Witch']);
    await game.endTurn();

    // Sailor's +$2 and trash, and Sea Witch's +2 Cards and discard 2
    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseEffect('Sea Witch');
    await game.chooseCards(['Copper', 'Copper']);
    await game.chooseNone();
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toHaveLength(5);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });

  it('can play a gained Treasure-Duration Astrolabe in the Buy phase, in either order with a Pirate reacting to it', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Astrolabe', 'Pirate'] });
    game.alice.setHand(['Sailor', 'Pirate', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Astrolabe');

    const onGain = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...offeredEffects(onGain)].sort()).toEqual(['Pirate', 'Sailor']);
    await game.chooseEffect('Sailor');
    expect(game.alice.inPlay).toContain('Astrolabe');
    // Astrolabe is a Treasure, so the Pirate can still react to its gain
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Pirate']);
    await game.chooseEffect('Pirate');

    expect(game.alice.inPlay).toEqual(['Sailor', 'Silver', 'Copper', 'Copper', 'Astrolabe', 'Pirate']);
    const buy = game.expectDecision('buyPhase', 'Alice');
    expect(buy.numBuys).toBe(1);
    expect(buy.numCoins).toBe(2);
  });

  it('can play two gained Duration cards when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Throne Room', 'Caravan', 'Workshop'] });
    game.alice.setHand(['Throne Room', 'Sailor', 'Workshop', 'Silver', 'Silver']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sailor');
    await game.playAction('Workshop');
    await game.chooseCard('Caravan');
    // Both Sailor plays can play it; only one does
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Sailor', 'Sailor']);
    await game.chooseEffect('Sailor');
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Sailor', 'Workshop', 'Caravan']);
    // The other play is still offered for the Caravan already played; declining keeps it for the next gain
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Sailor']);
    await game.declineEffects();

    await game.playTreasure('Silver');
    await game.playTreasure('Silver');
    await game.buy('Caravan');
    await game.chooseEffect('Sailor');

    // The turn is over: only Workshop and the Silvers were discarded
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Sailor', 'Caravan', 'Caravan']);
  });

  it("does not let its owner play a Duration card gained during another player's turn", async () => {
    const game = createGame({ kingdom: ['Sailor', 'Jester', 'Caravan'] });
    game.alice.setHand(['Sailor', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...coppers(5), 'Caravan', ...coppers(10)]);
    game.bob.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sailor');
    await game.endTurn();

    await game.playAction('Jester');
    await game.chooseOption('Alice gains a copy');

    // Jester discarded a Caravan and Alice gained another; neither was played
    expect(game.alice.discard.filter((name) => name === 'Caravan')).toHaveLength(2);
    expect(game.alice.inPlay).toEqual(['Sailor']);
    expect(game.pending.playerName).toBe('Bob');
  });
  it('does not let its owner play a Duration card gained on the Outpost turn after the turn it was played', async () => {
    const game = createGame({ kingdom: ['Sailor', 'Outpost', 'Caravan', 'Village'] });
    game.alice.setHand(['Village', 'Sailor', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Sailor');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game, ['Sailor']);
    // Sailor's +$2 and optional trash on the extra turn
    await game.chooseNone();
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(2);
    await game.playAllTreasures();
    await game.buy('Caravan');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Caravan');
    expect(game.alice.inPlay).toEqual([]);
  });
});
