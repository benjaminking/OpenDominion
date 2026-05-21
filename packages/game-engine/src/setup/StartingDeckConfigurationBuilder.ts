import { CardNameWithCount, StartingDeckConfiguration } from './StartingDeckConfiguration';

export class StartingDeckConfigurationBuilder {
  private usingShelters = false;
  private heirloomNames: string[] = [];

  public useShelters(): this {
    this.usingShelters = true;
    return this;
  }

  public useHeirloom(heirloomName: string): this {
    this.heirloomNames.push(heirloomName);
    return this;
  }

  public build(): StartingDeckConfiguration {
    const cardNamesWithCounts: CardNameWithCount[] = [];

    if (this.usingShelters) {
      cardNamesWithCounts.push(new CardNameWithCount('Hovel', 1));
      cardNamesWithCounts.push(new CardNameWithCount('Overgrown Estate', 1));
      cardNamesWithCounts.push(new CardNameWithCount('Necropolis', 1));
    } else {
      cardNamesWithCounts.push(new CardNameWithCount('Estate', 3));
    }

    for (const heirloomName of this.heirloomNames) {
      cardNamesWithCounts.push(new CardNameWithCount(heirloomName, 1));
    }

    if (this.heirloomNames.length > 7) {
      throw new Error('Cannot have more than 7 heirlooms in starting deck');
    }
    cardNamesWithCounts.push(new CardNameWithCount('Copper', 7 - this.heirloomNames.length));

    return new StartingDeckConfiguration(cardNamesWithCounts);
  }
}
