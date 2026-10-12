import { CardLocation, CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Squire', () => {
  it("gains an Attack card from the Supply (not a Mercenary) for its owner when trashed by another player's Swindler", async () => {
    const game = createGame({ kingdom: ['Squire', 'Swindler', 'Urchin', 'Militia'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Squire', ...COPPERS]);

    await game.start();
    await game.playAction('Swindler');

    // Bob chooses his Attack card right when Squire is trashed
    const attackGain = game.expectDecision('chooseCard', 'Bob');
    const offered = attackGain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Swindler', 'Urchin', 'Militia']));
    expect(offered).not.toContain('Mercenary');
    expect(attackGain.noneAllowed).toBe(false);
    await game.chooseCard('Militia');

    // Then Alice picks a $2 card for Bob
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Squire');

    expect(game.trash).toEqual(['Squire']);
    expect(game.bob.discard).toEqual(['Militia', 'Squire']);
  });

  it('can gain the top Knight when trashed', async () => {
    const game = createGame({ kingdom: ['Squire', 'Knights'] });
    game.alice.setHand(['Dame Anna', 'Squire', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);
    const topKnight = game.state.piles.getTopCardOfPile('Knights')!;

    await game.start();
    await game.playAction('Dame Anna');
    await game.chooseCards(['Squire']);

    const attackGain = game.expectDecision('chooseCard', 'Alice');
    const knightChoices = attackGain.cardChoices.filter((choice) => choice.card.types.includes(CardType.KNIGHT));
    expect(knightChoices.map((choice) => choice.card.name)).toEqual([topKnight.getName()]);
    await game.chooseCard(topKnight.getName(), CardLocation.PILE);

    expect(game.alice.discard).toEqual([topKnight.getName()]);
    expect(game.pileSize('Knights')).toBe(9);
  });

  it('can choose a different option for each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Squire', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Squire', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Squire');
    await game.chooseOption('+2 Buys');
    await game.chooseOption('Gain a Silver');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('gains an Attack card for each Squire when Chapel trashes two at once', async () => {
    const game = createGame({ kingdom: ['Squire', 'Chapel', 'Militia', 'Witch'] });
    game.alice.setHand(['Chapel', 'Squire', 'Squire', 'Estate', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Squire', 'Squire', 'Estate']);
    await game.chooseCard('Militia', CardLocation.PILE);
    await game.chooseCard('Witch', CardLocation.PILE);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Squire', 'Squire', 'Estate']);
    expect(game.alice.discard).toEqual(['Militia', 'Witch']);
  });

  it('gains an Attack when Procession trashes it, before Procession gains an Action costing $3', async () => {
    const game = createGame({
      kingdom: [
        'Procession',
        'Squire',
        'Militia',
        'Village',
        'Smithy',
        'Market',
        'Festival',
        'Laboratory',
        'Council Room',
        'Gardens',
      ],
    });
    game.alice.setHand(['Procession', 'Squire', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Squire');
    await game.chooseOption('+2 Actions');
    await game.chooseOption('+2 Buys');

    const attackGain = game.expectDecision('chooseCard', 'Alice');
    expect(attackGain.cardChoices.map((choice) => choice.card.name)).toEqual(['Militia']);
    await game.chooseCard('Militia');
    const actionGain = game.expectDecision('chooseCard', 'Alice');
    expect(actionGain.cardChoices.map((choice) => choice.card.name)).toEqual(['Village']);
    await game.chooseCard('Village');

    expect(game.trash).toEqual(['Squire']);
    expect(game.alice.discard).toEqual(['Militia', 'Village']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(3);
  });
  it('gains an Attack card for the player who trashes it from the Supply with Lurker', async () => {
    const game = createGame({ kingdom: ['Squire', 'Lurker', 'Militia'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption('Trash an Action card from the Supply');
    await game.chooseCard('Squire');

    const attackGain = game.expectDecision('chooseCard', 'Alice');
    expect(attackGain.cardChoices.map((choice) => choice.card.name)).toEqual(['Militia']);
    await game.chooseCard('Militia');

    expect(game.trash).toEqual(['Squire']);
    expect(game.alice.discard).toEqual(['Militia']);
  });

  it('can gain Dame Josephine (Action-Attack-Victory-Knight) from the top of the Knights pile, but not the Knight below', async () => {
    const game = createGame({ kingdom: ['Squire', 'Knights', 'Chapel'] });
    game.setPile('Knights', ['Dame Josephine', 'Sir Martin']);
    game.alice.setHand(['Chapel', 'Squire', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Squire']);

    const attackGain = game.expectDecision('chooseCard', 'Alice');
    expect(attackGain.cardChoices.map((choice) => choice.card.name)).toEqual(['Dame Josephine']);
    await game.chooseCard('Dame Josephine');

    expect(game.alice.discard).toEqual(['Dame Josephine']);
    expect(game.pileCards('Knights')).toEqual(['Sir Martin']);
  });

  it('offers only Attack piles that still have cards', async () => {
    const game = createGame({ kingdom: ['Squire', 'Chapel', 'Militia', 'Witch'] });
    game.setPileSize('Militia', 0);
    game.alice.setHand(['Chapel', 'Squire', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Squire']);

    const attackGain = game.expectDecision('chooseCard', 'Alice');
    expect(attackGain.cardChoices.map((choice) => choice.card.name)).toEqual(['Witch']);
    await game.chooseCard('Witch');

    expect(game.alice.discard).toEqual(['Witch']);
  });

  it('gives its +$1 before the choice, and gains nothing for "Gain a Silver" when the Silver pile is empty', async () => {
    const game = createGame({ kingdom: ['Squire'] });
    game.setPileSize('Silver', 0);
    game.alice.setHand(['Squire', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Squire');
    game.expectDecision('chooseOneOption', 'Alice');
    expect(game.alice.coins).toBe(1);
    await game.chooseOption('Gain a Silver');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.buys).toBe(1);
  });

  it("gains an Attack for each player whose Squire another player's Swindler trashes, in turn order (3 players)", async () => {
    const game = createGame({ kingdom: ['Squire', 'Swindler', 'Militia', 'Witch'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Squire', ...COPPERS]);
    cara.setDeck(['Squire', ...COPPERS]);

    await game.start();
    await game.playAction('Swindler');

    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Militia');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Squire');
    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Witch');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Squire');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Squire', 'Squire']);
    expect(game.bob.discard).toEqual(['Militia', 'Squire']);
    expect(cara.discard).toEqual(['Witch', 'Squire']);
  });
  it('can gain any Attack whatever its cost or other types: Familiar ($3P) and Clerk (Action-Reaction-Attack)', async () => {
    const game = createGame({ kingdom: ['Squire', 'Chapel', 'Familiar', 'Clerk'] });
    game.alice.setHand(['Chapel', 'Squire', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Squire']);

    const attackGain = game.expectDecision('chooseCard', 'Alice');
    expect(attackGain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Clerk', 'Familiar']);
    await game.chooseCard('Familiar');

    expect(game.alice.discard).toEqual(['Familiar']);
  });
});
