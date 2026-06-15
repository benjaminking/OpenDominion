import { CardGroup, ClientGameState, Pile } from '@dominion/client-common';
import {
  ChoiceSortingFunction,
  DefaultCardGroupSortingFunction,
  DefaultChoiceSortingFunction,
  SupplyChoiceSortingFunction,
} from '@dominion/client-common';
import {
  CardChoice,
  CardSelectionPurpose,
  Choice,
  ChoiceType,
  DecisionService,
  EffectChoice,
  EndActionPhaseChoice,
  EndBuyPhaseChoice,
  EndTreasurePhaseChoice,
  EndTurnChoice,
  ExtraTurnChoice,
  isNoneChoice,
  MultiCardChoice,
  MultiNamedChoice,
  NamedChoice,
  NoneChoice,
  SimpleTreasuresChoice,
} from '@dominion/common';
import process from 'process';
import * as readline from 'readline';

export class TextBasedDecisionService implements DecisionService {
  private rlObj = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  constructor(private readonly clientGameState: ClientGameState) {}

  /*chooseCardFromSupply(
    prompt: string,
    _selectionType: CardSelectionPurpose,
    _decisionName: string,
    cardChoices: CardChoice[],
    noneChoice?: NoneChoice,
  ): Promise<CardChoice | NoneChoice> {
    const options: (CardChoice | NoneChoice)[] = noneChoice === undefined ? cardChoices : [...cardChoices, noneChoice];
    const potentialChoices: Map<string, CardChoice | NoneChoice> = this.numberOptions<CardChoice | NoneChoice>(
      options,
      new SupplyChoiceSortingFunction(),
    );

    return this.singleChoiceHelper<CardChoice | NoneChoice>(prompt, potentialChoices);
  }*/

  private numberOptions<T extends Choice>(
    options: T[],
    sortingFunction = new DefaultChoiceSortingFunction(),
  ): Map<string, T> {
    options.sort(sortingFunction.getBoundOrderingFunction());
    const potentialChoices: Map<string, T> = new Map<string, T>();
    let index = 1;
    for (const option of options) {
      potentialChoices.set(index.toFixed(), option);
      index++;
    }
    return potentialChoices;
  }

  private numberTwoOptionGroups<T extends Choice, U extends Choice>(
    options1: T[],
    options2: U[],
    noneChoice: NoneChoice | undefined,
    sortingFunction1: ChoiceSortingFunction = new DefaultChoiceSortingFunction(),
    sortingFunction2: ChoiceSortingFunction = new DefaultChoiceSortingFunction(),
  ): Map<string, T | U | NoneChoice> {
    options1.sort(sortingFunction1.getBoundOrderingFunction());
    options2.sort(sortingFunction2.getBoundOrderingFunction());
    const potentialChoices: Map<string, T | U | NoneChoice> = new Map<string, T | U>();
    let index = 1;
    for (const option of options1) {
      potentialChoices.set(index.toFixed(), option);
      index++;
    }
    for (const option of options2) {
      potentialChoices.set(index.toFixed(), option);
      index++;
    }
    if (noneChoice !== undefined) {
      potentialChoices.set(index.toFixed(), noneChoice);
      index++;
    }
    return potentialChoices;
  }

  private singleChoiceHelper<T extends Choice>(prompt: string, potentialChoices: Map<string, T>): Promise<T> {
    const choiceStrs = this.getChoiceStrings(potentialChoices);

    return new Promise<T>((resolve) => {
      const answerFunction = (answer: string) => {
        if (this.isHiddenChoice(answer)) {
          this.processHiddenChoice(answer);
          promptFunction();
        } else if (!potentialChoices.has(answer)) {
          console.log('Invalid choice');
          promptFunction();
        } else {
          const choice: T | undefined = potentialChoices.get(answer);
          if (choice !== undefined) {
            resolve(choice);
          }
        }
      };
      const promptFunction = () => {
        this.rlObj.question(prompt + '\n' + choiceStrs.join(', ') + '\n', answerFunction);
      };

      promptFunction();
    });
  }

  private getChoiceStrings<T extends Choice>(potentialChoices: Map<string, T>): string[] {
    const choiceStrs: string[] = [];
    for (const [choiceMarker, option] of potentialChoices) {
      if (option.type === ChoiceType.Card) {
        choiceStrs.push(choiceMarker + ') ' + (option as unknown as CardChoice).card.name);
      } else if (option.type === ChoiceType.ChooseOne) {
        choiceStrs.push(choiceMarker + ') ' + (option as unknown as NamedChoice).name);
      } else if (option.type === ChoiceType.SimpleTreasures) {
        choiceStrs.push(choiceMarker + ') ' + '+$' + (option as unknown as SimpleTreasuresChoice).coins.toFixed());
      } else if (option.type === ChoiceType.EndActionPhase) {
        choiceStrs.push(choiceMarker + ') End action phase');
      } else if (option.type === ChoiceType.EndTreasurePhase) {
        choiceStrs.push(choiceMarker + ') End treasure phase');
      } else if (option.type === ChoiceType.EndBuyPhase) {
        choiceStrs.push(choiceMarker + ') End buy phase');
      } else if (option.type === ChoiceType.EndTurn) {
        choiceStrs.push(choiceMarker + ') End turn');
      } else if (option.type === ChoiceType.None) {
        choiceStrs.push(choiceMarker + ') None of the above');
      }
    }
    return choiceStrs;
  }

  private multiChoiceHelper(
    prompt: string,
    potentialChoices: Map<string, NamedChoice>,
    numToSelect: number,
  ): Promise<MultiNamedChoice> {
    const choiceStrs = this.getChoiceStrings(potentialChoices);

    return new Promise<MultiNamedChoice>((resolve) => {
      const answerFunction = (answer: string) => {
        if (this.isHiddenChoice(answer)) {
          this.processHiddenChoice(answer);
          promptFunction();
        } else {
          const choiceChars: string[] = answer.split(',');
          const multiNamedChoice: MultiNamedChoice = {
            type: ChoiceType.ChooseMultiple,
            names: [],
          };
          let isChoiceInvalid = false;
          for (const choiceChar of choiceChars) {
            const choice: NamedChoice | undefined = potentialChoices.get(choiceChar);
            if (choice !== undefined) {
              multiNamedChoice.names.push(choice.name);
            } else {
              console.log('Invalid choice: ' + choiceChar);
              isChoiceInvalid = true;
              break;
            }
          }
          if (!isChoiceInvalid && multiNamedChoice.names.length !== numToSelect) {
            console.log('Incorrect number of items chosen: ' + multiNamedChoice.names.length.toFixed());
          }
          if (isChoiceInvalid) {
            promptFunction();
          }
          resolve(multiNamedChoice);
        }
      };
      const promptFunction = () => {
        this.rlObj.question(prompt + '\n' + choiceStrs.join(', ') + '\n', answerFunction);
      };

      promptFunction();
    });
  }

  /*chooseCardFromSupplyOrSet(
    prompt: string,
    _selectionType: CardSelectionPurpose,
    _decisionName: string,
    supplyCardChoices: CardChoice[],
    setCardChoices: CardChoice[],
    noneChoice?: NoneChoice,
  ): Promise<CardChoice | NoneChoice> {
    const potentialChoices: Map<string, CardChoice | NoneChoice> = this.numberTwoOptionGroups(
      supplyCardChoices,
      setCardChoices,
      noneChoice,
      new SupplyChoiceSortingFunction(),
      new DefaultChoiceSortingFunction(),
    );

    return this.singleChoiceHelper<CardChoice | NoneChoice>(prompt, potentialChoices);
  }*/

  chooseCards(
    prompt: string,
    _selectionType: CardSelectionPurpose,
    _decisionName: string,
    numSelectedEligibility: number[],
    cardChoices: CardChoice[],
  ): Promise<MultiCardChoice> {
    this.printHand();
    const potentialChoices: Map<string, CardChoice[]> = this.numberMultiCardOptions(cardChoices);

    return this.chooseCardsHelper(prompt, potentialChoices, new Set<number>(numSelectedEligibility));
  }

  private numberMultiCardOptions(options: CardChoice[]): Map<string, CardChoice[]> {
    options.sort(new DefaultChoiceSortingFunction().getBoundOrderingFunction());
    const choicesByCardName: Map<string, CardChoice[]> = new Map<string, CardChoice[]>();

    for (const card of options) {
      if (choicesByCardName.has(card.card.name)) {
        continue;
      }
      choicesByCardName.get(card.card.name)!.push({
        type: ChoiceType.Card,
        card: card.card,
      });
    }

    const potentialChoices: Map<string, CardChoice[]> = new Map<string, CardChoice[]>();
    let index = 1;
    for (const [_cardName, choices] of choicesByCardName) {
      potentialChoices.set(index.toFixed(), choices);
      index++;
    }
    return potentialChoices;
  }

  private chooseCardsHelper(
    prompt: string,
    potentialChoices: Map<string, CardChoice[]>,
    numSelectedEligibility: Set<number>,
  ): Promise<MultiCardChoice> {
    const choiceStrs: string[] = [];
    for (const choiceMarker of potentialChoices.keys()) {
      const exemplar: CardChoice | undefined = potentialChoices.get(choiceMarker)?.[0];
      if (exemplar !== undefined) {
        choiceStrs.push(choiceMarker + ') ' + exemplar.card.name);
      }
    }

    return new Promise<MultiCardChoice>((resolve) => {
      const answerFunction = (answer: string) => {
        let isInvalid = false;

        const choices: string[] = answer.split(',');
        if (!numSelectedEligibility.has(choices.length)) {
          console.log('The number of items you have selected is invalid.');
          isInvalid = true;
          promptFunction();
        }

        const multiCardChoice: MultiCardChoice = {
          type: ChoiceType.MultiCard,
          cards: [],
        };
        const choiceCount: Map<string, number> = new Map<string, number>();
        for (const choice of choices) {
          if (!choiceCount.has(choice)) {
            choiceCount.set(choice, 0);
          }
          choiceCount.set(choice, choiceCount.get(choice)! + 1);
        }

        for (const choice of choiceCount.keys()) {
          for (let index = 0; index < choiceCount.get(choice)!; ++index) {
            if (!potentialChoices.has(choice)) {
              console.log('Unknown item "choice"');
              isInvalid = true;
              promptFunction();
            }
            multiCardChoice.cards.push(potentialChoices.get(choice)![index].card);
          }
        }

        if (!isInvalid) {
          resolve(multiCardChoice);
        }
      };
      const promptFunction = () => {
        this.rlObj.question(prompt + '\n' + choiceStrs.join(', ') + '\n', answerFunction);
      };

      promptFunction();
    });
  }

  chooseCard(
    prompt: string,
    _selectionType: CardSelectionPurpose,
    _decisionName: string,
    cardChoices: CardChoice[],
    noneChoice?: NoneChoice,
  ): Promise<CardChoice | NoneChoice> {
    this.printHand();
    const options: (CardChoice | NoneChoice)[] = noneChoice === undefined ? cardChoices : [...cardChoices, noneChoice];
    const potentialChoices: Map<string, CardChoice | NoneChoice> = this.numberOptions<CardChoice | NoneChoice>(options);

    return this.singleChoiceHelper<CardChoice | NoneChoice>(prompt, potentialChoices);
  }

  chooseOneOption(prompt: string, _decisionName: string, namedChoices: NamedChoice[]): Promise<NamedChoice> {
    console.log(prompt);

    const potentialChoices: Map<string, NamedChoice> = this.numberNamedChoices(namedChoices);

    return this.singleChoiceHelper(prompt, potentialChoices);
  }

  chooseMultipleOptions(
    prompt: string,
    _decisionName: string,
    choices: NamedChoice[],
    numToSelect: number,
  ): Promise<MultiNamedChoice> {
    console.log(prompt);

    const potentialChoices: Map<string, NamedChoice> = this.numberNamedChoices(choices);

    return this.multiChoiceHelper(prompt, potentialChoices, numToSelect);
  }

  private numberNamedChoices(options: NamedChoice[]): Map<string, NamedChoice> {
    options.sort(new DefaultChoiceSortingFunction().getBoundOrderingFunction());
    const potentialChoices: Map<string, NamedChoice> = new Map<string, NamedChoice>();
    let index = 1;
    for (const option of options) {
      if (option.name === 'Yes') {
        potentialChoices.set('Y', option);
      } else if (option.name === 'No') {
        potentialChoices.set('N', option);
      } else {
        potentialChoices.set(index.toFixed(), option);
        index++;
      }
    }

    return potentialChoices;
  }

  chooseFromMultipleEvents(
    _extraMessage: string,
    optionalEffects: EffectChoice[],
    mandatoryEffects: EffectChoice[],
  ): Promise<EffectChoice | NoneChoice> {
    const optionalEffectOptions: EffectChoice[] = this.groupEffectOptions(optionalEffects);
    const mandatoryEffectOptions: EffectChoice[] = this.groupEffectOptions(mandatoryEffects);

    const potentialChoices: Map<string, EffectChoice | NoneChoice> = this.numberEffectChoices(
      optionalEffectOptions,
      mandatoryEffectOptions,
    );
    // TODO: tell the user which choices are mandatory/optional
    return this.effectHelper(potentialChoices);
  }

  private groupEffectOptions(effects: EffectChoice[]): EffectChoice[] {
    const sourceCounts = new Map<string, number>();
    const effectsBySourceName = new Map<string, EffectChoice>();
    for (const effect of effects) {
      if (sourceCounts.has(effect.effectName)) {
        sourceCounts.set(effect.effectName, sourceCounts.get(effect.effectName)! + 1);
      } else {
        sourceCounts.set(effect.effectName, 1);
        effectsBySourceName.set(effect.effectName, effect);
      }
    }

    const choices: EffectChoice[] = [];
    for (const sourceName of sourceCounts.keys()) {
      if (sourceCounts.get(sourceName)! > 1) {
        choices.push({
          type: ChoiceType.Effect,
          effectName:
            effectsBySourceName.get(sourceName)!.effectName + ' (' + sourceCounts.get(sourceName)!.toFixed() + ')',
          effectId: effectsBySourceName.get(sourceName)!.effectId,
        });
      } else {
        choices.push({
          type: ChoiceType.Effect,
          effectName: effectsBySourceName.get(sourceName)!.effectName,
          effectId: effectsBySourceName.get(sourceName)!.effectId,
        });
      }
    }

    return choices;
  }

  private numberEffectChoices(
    optionalEffects: EffectChoice[],
    mandatoryEffects: EffectChoice[],
  ): Map<string, EffectChoice | NoneChoice> {
    optionalEffects.sort(new DefaultChoiceSortingFunction().getBoundOrderingFunction());
    mandatoryEffects.sort(new DefaultChoiceSortingFunction().getBoundOrderingFunction());
    const potentialChoices: Map<string, EffectChoice | NoneChoice> = new Map<string, EffectChoice | NoneChoice>();
    let index = 1;
    for (const effect of optionalEffects) {
      potentialChoices.set(index.toFixed(), effect);
      index++;
    }
    for (const effect of mandatoryEffects) {
      potentialChoices.set(index.toFixed(), effect);
      index++;
    }
    if (mandatoryEffects.length === 0) {
      potentialChoices.set('N', { type: ChoiceType.None });
    }

    return potentialChoices;
  }

  private effectHelper(potentialChoices: Map<string, EffectChoice | NoneChoice>): Promise<EffectChoice | NoneChoice> {
    const choiceStrs: string[] = [];
    for (const [choiceMarker, option] of potentialChoices) {
      if (!isNoneChoice(option)) {
        choiceStrs.push(choiceMarker + ') ' + option.effectName);
      }
    }

    return new Promise<EffectChoice | NoneChoice>((resolve) => {
      const answerFunction = (answer: string) => {
        if (this.isHiddenChoice(answer)) {
          this.processHiddenChoice(answer);
          promptFunction();
        } else if (!potentialChoices.has(answer)) {
          console.log('Invalid choice');
          promptFunction();
        } else {
          const choice: EffectChoice | NoneChoice | undefined = potentialChoices.get(answer);
          if (choice !== undefined) {
            resolve(choice);
          }
        }
      };
      const promptFunction = () => {
        this.rlObj.question('Choose one: \n' + choiceStrs.join(', ') + '\n', answerFunction);
      };

      promptFunction();
    });
  }

  chooseExtraTurns(extraTurns: ExtraTurnChoice[]): Promise<ExtraTurnChoice> {
    const groupedExtraTurns: ExtraTurnChoice[] = this.groupExtraTurns(extraTurns);

    const potentialChoices: Map<string, ExtraTurnChoice> = this.numberExtraTurns(groupedExtraTurns);
    return this.extraTurnHelper(potentialChoices);
  }

  private groupExtraTurns(extraTurns: ExtraTurnChoice[]): ExtraTurnChoice[] {
    const sourceCounts = new Map<string, number>();
    const extraTurnsBySourceName = new Map<string, ExtraTurnChoice>();
    for (const extraTurn of extraTurns) {
      if (sourceCounts.has(extraTurn.card.name)) {
        sourceCounts.set(extraTurn.card.name, sourceCounts.get(extraTurn.card.name)! + 1);
      } else {
        sourceCounts.set(extraTurn.card.name, 1);
        extraTurnsBySourceName.set(extraTurn.card.name, extraTurn);
      }
    }

    const choices: ExtraTurnChoice[] = [];
    for (const sourceName of sourceCounts.keys()) {
      if (sourceCounts.get(sourceName)! > 1) {
        choices.push({
          type: ChoiceType.ExtraTurn,
          card: extraTurnsBySourceName.get(sourceName)!.card,
          name:
            extraTurnsBySourceName.get(sourceName)!.card.name + ' (' + sourceCounts.get(sourceName)!.toFixed() + ')',
        });
      } else {
        choices.push({
          type: ChoiceType.ExtraTurn,
          card: extraTurnsBySourceName.get(sourceName)!.card,
          name: extraTurnsBySourceName.get(sourceName)!.card.name,
        });
      }
    }

    return choices;
  }

  private numberExtraTurns(extraTurns: ExtraTurnChoice[]): Map<string, ExtraTurnChoice> {
    extraTurns.sort(new DefaultChoiceSortingFunction().getBoundOrderingFunction());
    const potentialChoices: Map<string, ExtraTurnChoice> = new Map<string, ExtraTurnChoice>();
    let index = 1;
    for (const extraTurn of extraTurns) {
      potentialChoices.set(index.toFixed(), extraTurn);
      index++;
    }
    return potentialChoices;
  }

  private extraTurnHelper(potentialChoices: Map<string, ExtraTurnChoice>): Promise<ExtraTurnChoice> {
    const choiceStrs: string[] = [];
    for (const [choiceMarker, option] of potentialChoices) {
      choiceStrs.push(choiceMarker + ') ' + option.card.name);
    }

    return new Promise<ExtraTurnChoice>((resolve) => {
      const answerFunction = (answer: string) => {
        if (this.isHiddenChoice(answer)) {
          this.processHiddenChoice(answer);
          promptFunction();
        } else if (!potentialChoices.has(answer)) {
          console.log('Invalid choice');
          promptFunction();
        } else {
          const choice: ExtraTurnChoice | undefined = potentialChoices.get(answer);
          if (choice !== undefined) {
            resolve(choice);
          }
        }
      };
      const promptFunction = () => {
        this.rlObj.question('Choose one: \n' + choiceStrs.join(', ') + '\n', answerFunction);
      };

      promptFunction();
    });
  }

  makeActionPhaseChoice(options: CardChoice[]): Promise<CardChoice | EndActionPhaseChoice | EndTurnChoice> {
    this.printHand();
    const potentialChoices: Map<string, CardChoice | EndActionPhaseChoice | EndTurnChoice> =
      this.numberOptions(options);
    potentialChoices.set('A', { type: ChoiceType.EndActionPhase });
    potentialChoices.set('T', { type: ChoiceType.EndTurn });
    return this.singleChoiceHelper<CardChoice | EndActionPhaseChoice | EndTurnChoice>(
      'Choose a card to play:',
      potentialChoices,
    );
  }

  makeTreasurePhaseChoice(
    options: CardChoice[],
    simpleTreasuresOption: SimpleTreasuresChoice | undefined,
  ): Promise<CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice | EndBuyPhaseChoice | EndTurnChoice> {
    this.printHand();
    const potentialChoices: Map<string, CardChoice | SimpleTreasuresChoice | EndBuyPhaseChoice | EndTurnChoice> =
      this.numberOptions(options);
    if (simpleTreasuresOption !== undefined) {
      potentialChoices.set('P', simpleTreasuresOption);
    }
    potentialChoices.set('B', { type: ChoiceType.EndBuyPhase });
    potentialChoices.set('T', { type: ChoiceType.EndTurn });
    return this.singleChoiceHelper<CardChoice | SimpleTreasuresChoice | EndBuyPhaseChoice | EndTurnChoice>(
      'Choose a card to play:',
      potentialChoices,
    );
  }

  makeBuyPhaseChoice(
    options: CardChoice[],
    numBuys: number,
    numCoins: number,
    numPotions: number,
  ): Promise<CardChoice | EndBuyPhaseChoice | EndTurnChoice> {
    const message =
      'You have ' +
      numBuys.toFixed() +
      ' buy' +
      (numBuys > 1 ? 's' : '') +
      ' and $' +
      numCoins.toFixed() +
      '. You may buy a card.';
    const potentialChoices: Map<string, CardChoice | EndBuyPhaseChoice | EndTurnChoice> = this.numberOptions(
      options,
      new SupplyChoiceSortingFunction(),
    );
    potentialChoices.set('B', { type: ChoiceType.EndBuyPhase });
    potentialChoices.set('T', { type: ChoiceType.EndTurn });
    return this.singleChoiceHelper<CardChoice | EndBuyPhaseChoice | EndTurnChoice>(message, potentialChoices);
  }

  private isHiddenChoice(choiceMarker: string): boolean {
    return choiceMarker === 'K' || choiceMarker === 'H' || choiceMarker === 'S';
  }

  private processHiddenChoice(choiceMarker: string): void {
    if (choiceMarker === 'K') {
      this.printKingdom();
    } else if (choiceMarker === 'H') {
      this.printHelp();
    } else if (choiceMarker === 'S') {
      this.printPoints();
    }
  }

  private printHand(): void {
    if (this.clientGameState.players.mainPlayer === undefined) {
      return;
    }
    const cardGroups: CardGroup[] = this.clientGameState.players.mainPlayer.hand.getCardGroups();
    cardGroups.sort(new DefaultCardGroupSortingFunction().getBoundOrderingFunction());

    const cardGroupStrs: string[] = [];
    for (const cardGroup of cardGroups) {
      cardGroupStrs.push(cardGroup.numCards.toFixed() + ' × ' + cardGroup.name);
    }
    console.log('Your hand is: ' + cardGroupStrs.join(', '));
  }

  private printKingdom(): void {
    this.printPileSizes(this.clientGameState.piles.basicVictoryPiles);
    this.printPileSizes(this.clientGameState.piles.basicTreasurePiles);
    this.printPileSizes(this.clientGameState.piles.kingdomPiles);
  }

  private printPileSizes(piles: Pile[]): void {
    const cardGroupStrs: string[] = [];
    piles.sort((a: Pile, b: Pile) => a.cost.coins - b.cost.coins);
    for (const pile of piles) {
      cardGroupStrs.push(pile.size.toFixed() + ' × ' + pile.name);
    }
    console.log(cardGroupStrs.join(', '));
  }

  private printPoints(): void {
    if (this.clientGameState.players.mainPlayer === undefined) {
      return;
    }
    let scoresMessage: string =
      this.clientGameState.players.mainPlayer.getPlayerName() +
      ': ' +
      this.clientGameState.players.mainPlayer.statistics.numPoints.toFixed();
    for (const opponent of this.clientGameState.players.otherPlayers) {
      scoresMessage += ', ' + opponent.name + ': ' + opponent.statistics.numPoints.toFixed();
    }
    console.log(scoresMessage);
  }

  private printHelp(): void {
    console.log('K) View Kingdom, S) Scores, H) Help');
  }
}
