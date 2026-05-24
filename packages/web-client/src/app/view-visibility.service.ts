import { Injectable, Signal, WritableSignal, signal } from '@angular/core';
import { ViewName } from './view-names';

@Injectable({ providedIn: 'root' })
export class ViewVisibilityService {
  private visibilityByViewName: Record<ViewName, WritableSignal<boolean>> = {
    [ViewName.REVEALED_LIMBO]: signal<boolean>(false),
    [ViewName.SET_ASIDE]: signal<boolean>(false),
    [ViewName.TRASH]: signal<boolean>(false),
    [ViewName.DISCARD]: signal<boolean>(false),
  };

  getViewVisibilitySignal(viewName: ViewName): Signal<boolean> {
    if (!Object.values(ViewName).includes(viewName)) {
      return signal<boolean>(false);
    }
    return this.visibilityByViewName[viewName];
  }

  toggleViewByName(viewName: ViewName): void {
    if (!Object.values(ViewName).includes(viewName)) {
      return;
    }
    this.visibilityByViewName[viewName].set(!this.visibilityByViewName[viewName]());
  }
}
