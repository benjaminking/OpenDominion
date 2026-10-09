import '@angular/compiler';
import { describe, expect, it } from 'vitest';

import { ViewVisibilityService } from '../src/app/view-visibility.service';
import { ViewName } from '../src/app/view-names';

describe('ViewVisibilityService', () => {
  it('toggles, enables, and disables known view names', () => {
    const service = new ViewVisibilityService();
    const revealedSignal = service.getViewVisibilitySignal(ViewName.REVEALED_LIMBO);

    expect(revealedSignal()).toBe(false);

    service.toggleViewByName(ViewName.REVEALED_LIMBO);
    expect(revealedSignal()).toBe(true);

    service.disableViewByName(ViewName.REVEALED_LIMBO);
    expect(revealedSignal()).toBe(false);

    service.enableViewByName(ViewName.REVEALED_LIMBO);
    expect(revealedSignal()).toBe(true);
  });

  it('ignores unknown view names and returns a false signal for unknown lookup', () => {
    const service = new ViewVisibilityService();
    const unknownView = 'not-a-real-view' as unknown as ViewName;

    const unknownSignal = service.getViewVisibilitySignal(unknownView);

    expect(unknownSignal()).toBe(false);

    service.toggleViewByName(unknownView);
    service.enableViewByName(unknownView);
    service.disableViewByName(unknownView);

    expect(unknownSignal()).toBe(false);
  });

  it('tracks every declared view name, including the miscellaneous view, with a persistent signal', () => {
    const service = new ViewVisibilityService();

    for (const viewName of Object.values(ViewName)) {
      const visibilitySignal = service.getViewVisibilitySignal(viewName);
      expect(visibilitySignal()).toBe(false);

      service.enableViewByName(viewName);
      expect(visibilitySignal()).toBe(true);
      expect(service.getViewVisibilitySignal(viewName)).toBe(visibilitySignal);
    }
  });

  it('toggles the miscellaneous view independently of the other views', () => {
    const service = new ViewVisibilityService();
    const miscellaneousSignal = service.getViewVisibilitySignal(ViewName.MISCELLANEOUS);
    const trashSignal = service.getViewVisibilitySignal(ViewName.TRASH);

    service.toggleViewByName(ViewName.MISCELLANEOUS);
    expect(miscellaneousSignal()).toBe(true);
    expect(trashSignal()).toBe(false);

    service.enableViewByName(ViewName.TRASH);
    service.disableViewByName(ViewName.MISCELLANEOUS);
    expect(miscellaneousSignal()).toBe(false);
    expect(trashSignal()).toBe(true);
  });
});
