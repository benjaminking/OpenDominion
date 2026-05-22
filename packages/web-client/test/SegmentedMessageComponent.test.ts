import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { MessageSegmentType, type MessageSegment } from '../src/app/message/MessageSegment';
import { SegmentedMessageComponent } from '../src/app/message/segmented-message.component';
import { setInputSignalValue } from './angular-test-utils';

function createSegment(id: number, type: MessageSegmentType, text: string): MessageSegment {
  return { id, type, text };
}

describe('SegmentedMessageComponent', () => {
  it('promotes isolated coin and vp segments to large for medium text size', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new SegmentedMessageComponent());

    setInputSignalValue(component.size as () => string, 'medium');
    const sizedSegments = component.assignSizes([
      createSegment(1, MessageSegmentType.ORDINARY, 'Header'),
      createSegment(2, MessageSegmentType.LINE_BREAK, '\n'),
      createSegment(3, MessageSegmentType.COIN, '$2'),
      createSegment(4, MessageSegmentType.LINE_BREAK, '\n'),
      createSegment(5, MessageSegmentType.VP, '2 VP'),
      createSegment(6, MessageSegmentType.LINE_BREAK, '\n'),
      createSegment(7, MessageSegmentType.ORDINARY, 'Footer'),
    ]);

    expect(sizedSegments[2].size).toBe('large');
    expect(sizedSegments[4].size).toBe('large');
    expect(sizedSegments[0].size).toBe('medium');
    expect(sizedSegments[6].size).toBe('medium');
  });

  it('keeps inline segments at current size and clamps xsmall bold text to small', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new SegmentedMessageComponent());

    setInputSignalValue(component.size as () => string, 'xsmall');
    const sizedSegments = component.assignSizes([
      createSegment(1, MessageSegmentType.ORDINARY, 'Gain'),
      createSegment(2, MessageSegmentType.COIN, '$1'),
      createSegment(3, MessageSegmentType.LINE_BREAK, '\n'),
      createSegment(4, MessageSegmentType.BOLD, '+1 Card'),
    ]);

    expect(sizedSegments[1].size).toBe('xsmall');
    expect(sizedSegments[3].size).toBe('small');
  });
});
