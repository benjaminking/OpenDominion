import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Salvager', () => {
  it('still gives +1 Buy with nothing in hand to trash', async () => {
    const game = createGame({ kingdom: ['Salvager'] });
    game.alice.setHand(['Salvager']);

    await game.start();
    await game.playAction('Salvager');

    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(0);
    expect(game.trash).toEqual([]);
  });

  it("gives +$ equal to the trashed card's current cost", async () => {
    const game = createGame({ kingdom: ['Salvager', 'Highway'] });
    game.alice.setHand(['Highway', 'Salvager', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Salvager');
    // Trashing is mandatory
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Gold');

    expect(game.trash).toEqual(['Gold']);
    // Gold costs $5 while Highway is in play
    expect(game.alice.coins).toBe(5);
    expect(game.alice.buys).toBe(2);
  });

  it('gives only the $ part of the cost when trashing a card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Salvager', 'Golem'] });
    game.alice.setHand(['Salvager', 'Golem', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Salvager');
    await game.chooseCard('Golem');

    expect(game.trash).toEqual(['Golem']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.potions).toBe(0);
  });

  it("gives Peddler's full $8 in the Action phase, however many Actions are in play", async () => {
    const game = createGame({ kingdom: ['Salvager', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Salvager', 'Peddler', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Salvager');
    await game.chooseCard('Peddler');

    expect(game.trash).toEqual(['Peddler']);
    expect(game.alice.coins).toBe(8);
  });

  it("gives Peddler's reduced cost when played by Coronet in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Salvager', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Salvager', 'Peddler', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Salvager');
    await game.chooseCard('Peddler');

    // Coronet and Salvager are Actions in play, so Peddler costs $4
    expect(game.trash).toEqual(['Peddler']);
    expect(game.alice.coins).toBe(4);
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Estate');
    }
    expect(game.trash).toEqual(['Peddler', 'Estate']);
    expect(game.alice.coins).toBe(6);
    expect(game.alice.buys).toBe(3);
  });
  it("with Quarry in play, gives an Action-Victory card's reduced cost but a Treasure-Victory card's full cost", async () => {
    const game = createGame({ kingdom: ['Salvager', 'Quarry', 'Nobles', 'Farm'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Salvager', 'Nobles', 'Farm']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Salvager');
    // Nobles is an Action, so it costs $4 with Quarry
    await game.chooseCard('Nobles');
    expect(game.alice.coins).toBe(5);
    // Farm isn't an Action, so it still costs $6
    await game.chooseCard('Farm');

    expect(game.trash).toEqual(['Nobles', 'Farm']);
    expect(game.alice.coins).toBe(11);
    expect(game.alice.buys).toBe(3);
  });

  it('gives nothing for a card whose cost stacked reductions take below $0', async () => {
    const game = createGame({ kingdom: ['Salvager', 'Highway', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Highway', 'Bridge', 'Salvager', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    expect(game.costOf('Silver').coins).toBe(0);
    await game.playAction('Salvager');
    await game.chooseCard('Silver');

    // Just Bridge's $1
    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.coins).toBe(1);
  });

  it('gives +$ for a trashed Fortress even though it returns to hand', async () => {
    const game = createGame({ kingdom: ['Salvager', 'Fortress'] });
    game.alice.setHand(['Salvager', 'Fortress', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Salvager');
    await game.chooseCard('Fortress');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Fortress']);
    expect(game.alice.coins).toBe(4);
  });
});
