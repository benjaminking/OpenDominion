import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Poor House', () => {
  it('cannot take coins below $0, so Treasures played afterwards still count in full', async () => {
    const game = createGame({ kingdom: ['Poor House'] });
    game.alice.setHand(['Poor House', 'Copper', 'Copper', 'Silver', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Poor House');
    expect(game.alice.coins).toBe(0);

    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
  });

  it('gives +$4 and -$1 per Treasure each time when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Poor House', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Poor House', 'Copper', 'Silver', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Poor House');

    expect(game.alice.coins).toBe(4);
  });

  it("counts Action-Treasures and Fool's Gold in hand as Treasures", async () => {
    const game = createGame({ kingdom: ['Poor House', "Fool's Gold"] });
    game.alice.setHand(['Poor House', 'Coronet', "Fool's Gold", 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Poor House');

    expect(game.alice.coins).toBe(2);
  });

  it('can be played twice by Coronet in the Buy phase, counting the Treasures still in hand each time', async () => {
    const game = createGame({ kingdom: ['Poor House'] });
    game.alice.setHand(['Coronet', 'Poor House', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Silver');
    await game.playTreasure('Coronet');
    await game.chooseCard('Poor House');
    // Coronet may then play a Treasure twice; play none
    await game.chooseNone();

    // $2 + ($4 - $1) + ($4 - $1)
    expect(game.alice.coins).toBe(8);
    expect(game.alice.inPlay).toEqual(['Silver', 'Coronet', 'Poor House']);
  });

  it('counts Farm (Treasure-Victory), Potion and Spoils as Treasures, but not Hovel or Estate', async () => {
    const game = createGame({ kingdom: ['Poor House', 'Farm', 'Bandit Camp', 'Golem'] });
    game.alice.setHand(['Poor House', 'Farm', 'Potion', 'Spoils', 'Hovel', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Poor House');

    expect(game.alice.coins).toBe(1);
    expect(game.alice.log).toContain('Alice reveals Farm, Potion, Spoils, Hovel, Estate');
  });
});
