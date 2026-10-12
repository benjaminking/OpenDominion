import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

const putInTrash = (game: GameHarness, names: string[]): void => {
  for (const name of names) {
    game.state.trash.addCard(game.alice.createCard(name, CardLocation.TRASH));
  }
};

describe('Rogue', () => {
  it('must gain a card costing $3-$6 from the trash, and then does not attack', async () => {
    const game = createGame({ kingdom: ['Rogue'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    putInTrash(game, ['Copper', 'Province', 'Golem', 'Silver', 'Duchy']);

    await game.start();
    await game.playAction('Rogue');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Silver', 'Duchy']);
    await game.chooseCard('Duchy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Duchy']);
    expect(game.trash).toEqual(['Copper', 'Province', 'Golem', 'Silver']);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
    expect(game.alice.coins).toBe(2);
  });

  it('attacks each other player in turn order when nothing in the trash costs $3-$6', async () => {
    const game = createGame({ kingdom: ['Rogue'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    cara.setDeck(['Estate', 'Copper', ...COPPERS]);
    // A Potion in the cost means the card does not cost from $3 to $6
    putInTrash(game, ['Copper', 'Province', 'Golem']);

    await game.start();
    await game.playAction('Rogue');

    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Copper', 'Province', 'Golem', 'Gold']);
    expect(game.bob.discard).toEqual(['Silver']);
    expect(cara.discard).toEqual(['Estate', 'Copper']);
    expect(game.alice.discard).toEqual([]);
  });

  it('attacks instead of gaining when Bridge makes the only Silver in the trash cost $2', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Bridge', 'Rogue', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Gold', 'Copper', ...COPPERS]);
    putInTrash(game, ['Silver']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Rogue');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Silver', 'Gold']);
    expect(game.alice.discard).toEqual([]);
  });

  it('gains, on its second Throne Room play, the card its first play made another player trash', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Rogue', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Copper', 'Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Rogue');

    // First play: the trash is empty, so Bob trashes his Silver; second play: Alice gains it
    await game.chooseCard('Silver', CardLocation.TRASH);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Gold', 'Copper']);
    expect(game.alice.coins).toBe(4);
  });

  it('must gain a $7 card from the trash while Highway makes it cost $6, but not a $8 one', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Highway'] });
    game.alice.setHand(['Highway', 'Rogue', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    putInTrash(game, ["King's Court", 'Province']);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Rogue');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(["King's Court"]);
    await game.chooseCard("King's Court");

    expect(game.alice.discard).toEqual(["King's Court"]);
    expect(game.trash).toEqual(['Province']);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
  });

  it('gains from the trash on its first Throne Room play, then attacks on the second once the trash has no $3-$6 card', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Rogue', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Gold', 'Copper', ...COPPERS]);
    putInTrash(game, ['Silver', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Rogue');
    await game.chooseCard('Silver', CardLocation.TRASH);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.trash).toEqual(['Copper', 'Gold']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.alice.coins).toBe(4);
  });

  it('stays in play when its attack trashes a Knight, since Rogue is not a Knight', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Knights'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Dame Anna', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Rogue');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Dame Anna']);
    expect(game.alice.inPlay).toEqual(['Rogue']);
    expect(game.bob.discard).toEqual(['Copper']);
  });

  it('gains from the trash as a real gain, so Watchtower can put the gained card onto the deck', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Watchtower'] });
    game.alice.setHand(['Rogue', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);
    putInTrash(game, ['Silver']);

    await game.start();
    await game.playAction('Rogue');
    await game.chooseCard('Silver', CardLocation.TRASH);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.discard).toEqual([]);
    expect(game.trash).toEqual([]);
  });

  it("shuffles the target's discard pile, without the card already revealed, to reveal a second card", async () => {
    const game = createGame({ kingdom: ['Rogue'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver']);
    game.bob.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Rogue');

    const trash = game.expectDecision('chooseCard', 'Bob');
    expect(trash.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Gold']);
    expect(game.bob.deck).toEqual([]);
  });

  it('in a 4-player game, attacks Bob, Cara and Dan in turn order, each choosing their own card', async () => {
    const game = createGame({ kingdom: ['Rogue'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    cara.setDeck(['Duchy', 'Smithy', ...COPPERS]);
    dan.setDeck(['Copper', 'Laboratory', ...COPPERS]);

    await game.start();
    await game.playAction('Rogue');

    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');
    // The trash now has a Gold, but Rogue already chose to attack, so Cara is attacked too
    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Gold', 'Smithy', 'Laboratory']);
    expect(game.bob.discard).toEqual(['Silver']);
    expect(cara.discard).toEqual(['Duchy']);
    expect(dan.discard).toEqual(['Copper']);
    expect(game.alice.discard).toEqual([]);
  });

  it('uses stacked cost reductions: with Bridge and Highway in play it must gain a Province ($6 now), not a Silver ($1)', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Bridge', 'Highway', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Rogue', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    putInTrash(game, ['Silver', 'Province']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Rogue');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Province']);
    await game.chooseCard('Province');

    expect(game.alice.discard).toEqual(['Province']);
    expect(game.trash).toEqual(['Silver']);
  });

  it('attacks instead of gaining a Peddler from the trash, since it costs $8 outside the Buy phase', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Peddler'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Gold', 'Copper', ...COPPERS]);
    putInTrash(game, ['Peddler']);

    await game.start();
    await game.playAction('Rogue');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Peddler', 'Gold']);
    expect(game.alice.discard).toEqual([]);
  });

  it('can gain Dame Josephine (Action-Attack-Victory-Knight, $5) from the trash', async () => {
    const game = createGame({ kingdom: ['Rogue', 'Knights'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);
    putInTrash(game, ['Dame Josephine']);

    await game.start();
    await game.playAction('Rogue');
    await game.chooseCard('Dame Josephine', CardLocation.TRASH);

    expect(game.alice.discard).toEqual(['Dame Josephine']);
    expect(game.alice.score).toBe(2);
  });
});
