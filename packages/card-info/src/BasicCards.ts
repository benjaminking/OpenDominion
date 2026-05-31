import { CardCategory, CardInfo, CardType, Expansion } from '@dominion/common';

export const basic_cards: CardInfo[] = [
  {
    category: CardCategory.CARD,
    name: 'Copper',
    category: CardCategory.CARD,
    text: '$1',
    font_size: 'xlarge',
    cost: {
      coins: 0,
    },
    production: {
      coins: 1,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Silver',
    category: CardCategory.CARD,
    text: '$2',
    font_size: 'xxlarge',
    cost: {
      coins: 3,
    },
    production: {
      coins: 2,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Gold',
    category: CardCategory.CARD,
    text: '$3',
    font_size: 'xxlarge',
    cost: {
      coins: 6,
    },
    production: {
      coins: 3,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Platinum',
    category: CardCategory.CARD,
    text: '$5',
    font_size: 'xlarge',
    cost: {
      coins: 9,
    },
    production: {
      coins: 5,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.PROSPERITY,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Potion',
    category: CardCategory.CARD,
    text: '1P',
    font_size: 'xlarge',
    cost: {
      coins: 4,
    },
    production: {
      coins: 0,
      potions: 1,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.ALCHEMY,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Estate',
    category: CardCategory.CARD,
    text: '1VP',
    font_size: 'xlarge',
    cost: {
      coins: 2,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Duchy',
    category: CardCategory.CARD,
    text: '3VP',
    font_size: 'xlarge',
    cost: {
      coins: 5,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Province',
    category: CardCategory.CARD,
    text: '6VP',
    font_size: 'xlarge',
    cost: {
      coins: 8,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Colony',
    category: CardCategory.CARD,
    text: '10VP',
    font_size: 'xlarge',
    cost: {
      coins: 11,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.PROSPERITY,
    is_kingdom: false,
  },

  {
    category: CardCategory.CARD,
    name: 'Curse',
    category: CardCategory.CARD,
    text: '-1VP',
    font_size: 'xlarge',
    cost: {
      coins: 0,
    },
    types: [CardType.CURSE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },
];
