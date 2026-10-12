import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Spice Merchant', 'Throne Room', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('SpiceMerchant', () => {
  it('does nothing when played as the only card in hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Spice Merchant']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Spice Merchant');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.coins).toBe(0);
    expect(game.alice.buys).toBe(1);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.hand).toEqual([]);
  });

  it('does not ask anything when there is no Treasure in hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Spice Merchant', 'Estate', 'Village']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Spice Merchant');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.hand).toEqual(['Estate', 'Village']);
    expect(game.trash).toEqual([]);
  });

  it('can trash two Treasures and choose differently each time when played by Throne Room', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Spice Merchant', 'Copper', 'Silver', 'Village']);
    game.alice.setDeck(['Gold', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Spice Merchant');

    const firstTrash = game.expectDecision('chooseCard', 'Alice');
    expect(firstTrash.noneAllowed).toBe(true);
    expect(firstTrash.cardChoices.map((choice) => choice.card.name)).toEqual(['Copper', 'Silver']);
    await game.chooseCard('Copper');
    await game.chooseOption('+1 Buy and +$2');

    await game.chooseCard('Silver');
    await game.chooseOption('+2 Cards and +1 Action');

    expect(game.trash).toEqual(['Copper', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Village', 'Gold', 'Estate']);
    game.expectDecision('actionPhase', 'Alice');
  });

  it("can trash a Treasure that is also an Action (Coronet) or a Reaction (Fool's Gold)", async () => {
    const game = createGame({ kingdom: [...KINGDOM, "Fool's Gold"] });
    game.alice.setHand(['Spice Merchant', 'Coronet', "Fool's Gold", 'Estate', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Spice Merchant');

    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(trash.cardChoices.map((choice) => choice.card.name)).toEqual(['Coronet', "Fool's Gold", 'Copper']);
    await game.chooseCard('Coronet');
    await game.chooseOption('+1 Buy and +$2');

    expect(game.trash).toEqual(['Coronet']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(2);
  });

  it('draws only what is left for +2 Cards when the deck and discard pile hold 1 card', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Spice Merchant', 'Copper', 'Village']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Spice Merchant');
    await game.chooseCard('Copper');
    await game.chooseOption('+2 Cards and +1 Action');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.hand).toEqual(['Village', 'Gold']);
    expect(game.alice.actions).toBe(1);
    expect(game.trash).toEqual(['Copper']);
  });

  it('offers Treasures that are also Victory cards or Attacks (Farm, Cauldron), but not Action–Victory cards', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Farm', 'Cauldron', 'Mill'] });
    game.alice.setHand(['Spice Merchant', 'Farm', 'Cauldron', 'Mill', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Spice Merchant');

    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(trash.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Cauldron', 'Farm']);
    await game.chooseCard('Farm');
    await game.chooseOption('+1 Buy and +$2');

    expect(game.trash).toEqual(['Farm']);
    expect(game.alice.coins).toBe(2);
  });
});
