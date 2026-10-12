import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Apprentice', () => {
  it('draws 6 cards for trashing a Golem ($4P), shuffling the discard pile partway through', async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Golem'] });
    game.alice.setHand(['Apprentice', 'Golem', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver']);
    game.alice.setDiscard(copies('Estate', 5));

    await game.start();
    await game.playAction('Apprentice');
    await game.chooseCard('Golem');

    expect(game.trash).toEqual(['Golem']);
    expect(game.alice.hand).toEqual([
      'Copper',
      'Copper',
      'Copper',
      'Silver',
      'Silver',
      'Silver',
      ...copies('Estate', 3),
    ]);
    expect(game.alice.deck).toEqual(['Estate', 'Estate']);
    expect(game.alice.actions).toBe(1);
  });

  it("draws 4 cards for trashing a Potion, which costs $4 and doesn't have a Potion in its cost", async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Golem'] });
    game.alice.setHand(['Apprentice', 'Potion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 5));

    await game.start();
    await game.playAction('Apprentice');
    await game.chooseCard('Potion');

    expect(game.trash).toEqual(['Potion']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', ...copies('Estate', 4)]);
    expect(game.alice.deck).toHaveLength(1);
  });

  it("uses the trashed card's reduced cost, keeping the +2 Cards for its Potion", async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Familiar', 'Highway'] });
    game.alice.setHand(['Highway', 'Apprentice', 'Familiar', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...copies('Estate', 8)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Apprentice');
    await game.chooseCard('Familiar');

    // Familiar costs $2P this turn: 2 + 2 cards
    expect(game.trash).toEqual(['Familiar']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', ...copies('Estate', 4)]);
    expect(game.alice.deck).toHaveLength(4);
  });

  it('draws nothing for a Copper even when costs are reduced below $0', async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Highway'] });
    game.alice.setHand(['Highway', 'Apprentice', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', ...copies('Estate', 8)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Apprentice');
    await game.chooseCard('Copper');

    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Silver']);
    expect(game.alice.deck).toHaveLength(8);
  });

  it('trashes two cards and draws for each when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Apprentice', 'Silver', 'Estate', 'Copper']);
    game.alice.setDeck(copies('Gold', 10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Apprentice');
    await game.chooseCard('Silver');
    // The cards drawn for the Silver can be trashed by the second play
    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Gold', 'Gold', 'Gold']);
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Silver', 'Estate']);
    expect(game.alice.hand).toEqual(['Copper', ...copies('Gold', 5)]);
    expect(game.alice.actions).toBe(2);
  });

  it('uses the cost after Bridge and Highway both reduce it: a Golem is $2P, so 4 cards', async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Golem', 'Bridge', 'Highway', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Apprentice', 'Golem']);
    game.alice.setDeck(['Copper', 'Copper', ...copies('Silver', 4), ...copies('Estate', 6)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    expect(game.costOf('Golem').coins).toBe(2);
    expect(game.costOf('Golem').potions).toBe(1);
    await game.playAction('Apprentice');
    await game.chooseCard('Golem');

    expect(game.trash).toEqual(['Golem']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Silver', 'Silver', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });

  it("draws 8 for a Peddler in the Action phase, since Peddler's reduction only applies in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Apprentice', 'Peddler', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...copies('Silver', 10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Apprentice');
    await game.chooseCard('Peddler');

    expect(game.trash).toEqual(['Peddler']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', ...copies('Silver', 8)]);
  });

  it('lets a Market Square in hand react to the trashing before Apprentice draws', async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Market Square'] });
    game.alice.setHand(['Apprentice', 'Market Square', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Market Square', 'Estate', ...copies('Copper', 5)]);

    await game.start();
    await game.playAction('Apprentice');
    await game.chooseCard('Silver');

    // Only the Market Square already in hand is offered; the one Apprentice is about to draw isn't
    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Market Square']);
    await game.chooseEffect('Market Square');

    // Silver costs $3: 3 cards, drawn after the Market Square was discarded for a Gold
    expect(game.alice.discard.sort()).toEqual(['Gold', 'Market Square']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Market Square', 'Estate']);
    expect(game.pending.kind).toBe('actionPhase');
  });

  it('draws for the cost of a Fortress, even though the Fortress goes back to hand when trashed', async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Fortress'] });
    game.alice.setHand(['Apprentice', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Silver', 10));

    await game.start();
    await game.playAction('Apprentice');
    await game.chooseCard('Fortress');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Fortress', ...copies('Silver', 4)]);
  });

  it("draws Cultist's 3 cards when it is trashed, then 5 more for its $5 cost", async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Cultist'] });
    game.alice.setHand(['Apprentice', 'Cultist', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...copies('Estate', 3), ...copies('Silver', 5), 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Apprentice');
    await game.chooseCard('Cultist');

    expect(game.trash).toEqual(['Cultist']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', ...copies('Estate', 3), ...copies('Silver', 5)]);
    expect(game.alice.deck).toEqual(['Gold', 'Gold']);
  });

  it("uses Peddler's Buy-phase cost when Coronet plays it in the Buy phase: $2 less per Action in play", async () => {
    const game = createGame({ kingdom: ['Apprentice', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Apprentice', 'Peddler', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Silver', 12));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Apprentice');
    // Coronet and Apprentice are Actions in play: Peddler costs $4
    expect(game.costOf('Peddler').coins).toBe(4);
    await game.chooseCard('Peddler');
    expect(game.alice.hand).toEqual(['Estate', 'Estate', ...copies('Silver', 4)]);
    // Second play: trash an Estate ($2)
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Peddler', 'Estate']);
    expect(game.alice.hand).toEqual(['Estate', ...copies('Silver', 6)]);
  });

  it('draws only the cards there are when the deck and discard pile hold fewer than the cost', async () => {
    const game = createGame({ kingdom: ['Apprentice'] });
    game.alice.setHand(['Apprentice', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Estate']);

    await game.start();
    await game.playAction('Apprentice');
    await game.chooseCard('Gold');

    // Gold costs $6: the Silver, then the Estate from the shuffled discard pile, and nothing more
    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('trashes and draws nothing, without asking, when it was the only card in hand, but still gives +1 Action', async () => {
    const game = createGame({ kingdom: ['Apprentice'] });
    game.alice.setHand(['Apprentice']);
    game.alice.setDeck(copies('Silver', 5));

    await game.start();
    await game.playAction('Apprentice');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.deck).toHaveLength(5);
    expect(game.alice.actions).toBe(1);
    game.expectDecision('buyPhase', 'Alice');
  });

  it("must trash a card when it has one: declining isn't offered, even when the only card is a Curse", async () => {
    const game = createGame({ kingdom: ['Apprentice'] });
    game.alice.setHand(['Apprentice', 'Curse']);
    game.alice.setDeck(copies('Silver', 5));

    await game.start();
    await game.playAction('Apprentice');

    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(false);
    expect(decision.cardChoices.map((choice) => choice.card.name)).toEqual(['Curse']);
    await game.chooseCard('Curse');

    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.hand).toEqual([]);
  });
});
