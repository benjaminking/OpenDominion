import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './hinterlandsHelpers';

const KINGDOM = ['Wheelwright', 'Weaver', 'Border Village', 'Village', 'Smithy', 'Laboratory'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Wheelwright', () => {
  it('asks nothing when there is no card to discard', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Wheelwright']);

    await game.start();
    await game.playAction('Wheelwright');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.discard).toEqual([]);
  });

  it('gains an Action card costing as much as the discarded card or less, and must gain one', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Wheelwright', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Wheelwright');
    const discard = game.expectDecision('chooseCard', 'Alice');
    expect(discard.noneAllowed).toBe(true);
    await game.chooseCard('Gold');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Border Village', 'Laboratory', 'Wheelwright', 'Smithy']));
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Duchy');
    expect(offered).not.toContain('Silver');
    await game.chooseCard('Border Village');

    // Border Village's own on-gain ability then happens
    await game.chooseCard('Laboratory');
    expect(game.alice.discard).toEqual(['Gold', 'Border Village', 'Laboratory']);
  });

  it('still gains a card costing up to the discarded card when that card was played on being discarded', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Wheelwright', 'Weaver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Wheelwright');
    await game.chooseCard('Weaver');
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');
    expect(game.alice.inPlay).toEqual(['Wheelwright', 'Weaver']);

    // Weaver costs $4
    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Laboratory');
    await game.chooseCard('Smithy');

    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Smithy']);
  });

  it('can gain an Action card with a Potion in its cost after discarding a card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Wheelwright', 'Alchemist', 'Familiar', 'Golem', 'Village'] });
    game.alice.setHand(['Wheelwright', 'Alchemist', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Wheelwright');
    await game.chooseCard('Alchemist');

    // Up to $3P: Familiar, Alchemist and $3 or cheaper Actions, but not Golem ($4P)
    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Familiar', 'Alchemist', 'Village']));
    expect(offered).not.toContain('Golem');
    expect(offered).not.toContain('Wheelwright');
    await game.chooseCard('Familiar');

    expect(game.alice.discard).toEqual(['Alchemist', 'Familiar']);
  });

  it('cannot gain an Action card with a Potion in its cost after discarding a card without one', async () => {
    const game = createGame({ kingdom: ['Wheelwright', 'Alchemist', 'Familiar', 'Golem', 'Village'] });
    game.alice.setHand(['Wheelwright', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Wheelwright');
    await game.chooseCard('Gold');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Wheelwright', 'Village']));
    expect(offered).not.toContain('Alchemist');
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Golem');
  });

  it('compares reduced costs: with two Highways, discarding a Copper can gain an Action that now costs $0', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Highway', 'Cellar'] });
    game.alice.setHand(['Village', 'Highway', 'Highway', 'Wheelwright', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Wheelwright');
    await game.chooseCard('Copper');

    // Cellar ($2) costs $0; Village ($3) costs $1
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(['Cellar']);
    await game.chooseCard('Cellar');
    expect(game.alice.discard).toEqual(['Copper', 'Cellar']);
  });

  it('gains any card with the Action type, whatever its other types, and nothing else', async () => {
    const game = createGame({
      kingdom: ['Wheelwright', 'Mill', 'Nobles', 'Guard Dog', 'Farm', 'Cauldron', "Fool's Gold", 'Tunnel'],
    });
    game.alice.setHand(['Wheelwright', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Wheelwright');
    await game.chooseCard('Gold');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(expect.arrayContaining(['Mill', 'Nobles', 'Guard Dog', 'Wheelwright']));
    for (const nonAction of ['Farm', 'Cauldron', "Fool's Gold", 'Tunnel', 'Gold', 'Duchy']) {
      expect(offered(gain)).not.toContain(nonAction);
    }
    await game.chooseCard('Nobles');
  });

  it('can gain only the top Knight and the top Ruins, and no non-Supply Action', async () => {
    const game = createGame({ kingdom: ['Wheelwright', 'Knights', 'Marauder', 'Hermit', 'Urchin', 'Village'] });
    game.alice.setHand(['Village', 'Wheelwright', 'Wheelwright', 'Gold', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPile('Knights', ['Dame Anna', 'Sir Martin']);
    game.setPile('Ruins', ['Ruined Market', 'Survivors']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Wheelwright');
    await game.chooseCard('Gold');
    const knight = game.expectDecision('chooseCard', 'Alice');
    expect(offered(knight)).toContain('Dame Anna');
    expect(offered(knight)).not.toContain('Sir Martin');
    await game.chooseCard('Dame Anna');

    await game.playAction('Wheelwright');
    await game.chooseCard('Copper');
    const ruins = game.expectDecision('chooseCard', 'Alice');
    expect(offered(ruins)).toContain('Ruined Market');
    for (const name of ['Survivors', 'Madman', 'Mercenary', 'Coronet']) {
      expect(offered(ruins)).not.toContain(name);
    }
    await game.chooseCard('Ruined Market');

    expect(game.pileCards('Knights')).toEqual(['Sir Martin']);
    expect(game.pileCards('Ruins')).toEqual(['Survivors']);
  });

  it('lets a discarded Tunnel gain a Gold first, then gains an Action costing up to $3', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Tunnel'] });
    game.alice.setHand(['Wheelwright', 'Tunnel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Wheelwright');
    await game.chooseCard('Tunnel');
    await game.chooseEffect('Tunnel');
    expect(game.alice.discard).toEqual(['Tunnel', 'Gold']);

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toContain('Village');
    expect(offered(gain)).not.toContain('Smithy');
    await game.chooseCard('Village');
    expect(game.alice.discard).toEqual(['Tunnel', 'Gold', 'Village']);
  });
});
