import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, LogMessageType, type CardMetadata, type LogMessage } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { LogComponent } from '../src/app/log/log.component';
import { MessageSegmentType } from '../src/app/message/MessageSegment';
import { MessageDecoderService } from '../src/app/message-decoder.service';
import { setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

class FakeMessageDecoderService {
  logMessageCallback?: (logMessage: LogMessage) => void;

  subscribeToLogMessage(callback: (logMessage: LogMessage) => void): void {
    this.logMessageCallback = callback;
  }
}

function createComponent() {
  const decoder = new FakeMessageDecoderService();
  const injector = Injector.create({
    providers: [{ provide: MessageDecoderService, useValue: decoder }],
  });
  const component = runInInjectionContext(injector, () => new LogComponent());

  return { component, decoder };
}

describe('LogComponent', () => {
  it('sorts player names when computing player-to-color indices', () => {
    const { component } = createComponent();

    setInputSignalValue(component.playerNames as () => string[], ['Carol', 'Alice', 'Bob']);

    expect(component.playerIndices().get('Alice')).toBe(0);
    expect(component.playerIndices().get('Bob')).toBe(1);
    expect(component.playerIndices().get('Carol')).toBe(2);
  });

  it('appends log messages, transforms them for display, and scrolls after updates', () => {
    vi.stubGlobal('window', {
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
    });

    const { component, decoder } = createComponent();
    const scroller = { scrollTop: 0, scrollHeight: 120 };
    const silver = createCard('Silver', 'silver-1');
    (component as unknown as { logContainer: { nativeElement: typeof scroller } }).logContainer = {
      nativeElement: scroller,
    };

    component.ngOnInit();
    expect(scroller.scrollTop).toBe(120);

    decoder.logMessageCallback?.({
      orderIndex: 1,
      playerName: 'Alice',
      text: 'Alice begins their turn',
      knownCards: [],
      numUnknownCards: 0,
      type: LogMessageType.TURN_START,
    });
    decoder.logMessageCallback?.({
      orderIndex: 2,
      playerName: 'Alice',
      text: 'Gain %c and $2',
      knownCards: [silver],
      numUnknownCards: 0,
      type: LogMessageType.NORMAL,
    });

    expect(component.rawLogMessages()).toHaveLength(2);
    expect(component.logMessages()).toEqual([
      {
        orderIndex: 1,
        name: 'Alice',
        message: [{ id: 1, text: 'Alice begins their turn', type: MessageSegmentType.ORDINARY }],
        type: LogMessageType.TURN_START,
      },
      {
        orderIndex: 2,
        name: 'Alice',
        message: [
          { id: 0, text: 'Gain ', type: MessageSegmentType.ORDINARY, card: undefined },
          { id: 1, text: 'a ', type: MessageSegmentType.ORDINARY, card: undefined },
          { id: 2, text: 'Silver', type: MessageSegmentType.CARD, card: silver },
          { id: 3, text: ' and ', type: MessageSegmentType.ORDINARY, card: undefined },
          { id: 4, text: '2', type: MessageSegmentType.COIN, card: undefined },
        ],
        type: LogMessageType.NORMAL,
      },
    ]);

    component.ngAfterViewChecked();
    expect(scroller.scrollTop).toBe(120);

    vi.unstubAllGlobals();
  });
});
