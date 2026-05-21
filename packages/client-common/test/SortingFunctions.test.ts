import { CardType, ChoiceType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardGroup } from '../src/CardGroup';
import {
  DefaultCardGroupSortingFunction,
  DefaultChoiceSortingFunction,
  SupplyChoiceSortingFunction,
} from '../src/SortingFunctions';
import { createCardChoice, createCardMetadata, createMultiCardChoice } from './TestFixtures';

describe('DefaultCardGroupSortingFunction', () => {
  it('orders action before treasure before victory', () => {
    const sortingFunction = new DefaultCardGroupSortingFunction();
    const groups = [
      new CardGroup([createCardMetadata('Estate', { coins: 2, types: [CardType.VICTORY] })]),
      new CardGroup([createCardMetadata('Silver', { coins: 3, types: [CardType.TREASURE] })]),
      new CardGroup([createCardMetadata('Village', { coins: 3, types: [CardType.ACTION] })]),
    ];

    const orderedNames = groups.sort(sortingFunction.getBoundOrderingFunction()).map((group) => group.name);

    expect(orderedNames).toEqual(['Village', 'Silver', 'Estate']);
  });
});

describe('Choice sorting functions', () => {
  it('prioritizes actionable card choices before ending-phase choices', () => {
    const sortingFunction = new DefaultChoiceSortingFunction();
    const choices = [
      { type: ChoiceType.EndTurn },
      createCardChoice('Village', 3, [CardType.ACTION]),
      createMultiCardChoice('Silver', 3, [CardType.TREASURE]),
      { type: ChoiceType.EndActionPhase },
    ];

    const sortedChoiceTypes = choices.sort(sortingFunction.getBoundOrderingFunction()).map((choice) => choice.type);

    expect(sortedChoiceTypes).toEqual([
      ChoiceType.Card,
      ChoiceType.MultiCard,
      ChoiceType.EndActionPhase,
      ChoiceType.EndTurn,
    ]);
  });

  it('sorts supply card choices by ascending cost when card type tie-breakers are equal', () => {
    const sortingFunction = new SupplyChoiceSortingFunction();
    const choices = [
      createCardChoice('Silver', 3, [CardType.TREASURE]),
      createCardChoice('Copper', 0, [CardType.TREASURE]),
      createCardChoice('Gold', 6, [CardType.TREASURE]),
    ];

    const sortedCardNames = choices.sort(sortingFunction.getBoundOrderingFunction()).map((choice) => choice.card.name);

    expect(sortedCardNames).toEqual(['Copper', 'Silver', 'Gold']);
  });
});
