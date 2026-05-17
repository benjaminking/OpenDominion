import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalSettingsService {
  usingOfficialArt = signal<boolean>(false);

  useUnofficialArt() {
    this.usingOfficialArt.set(false);
  }

  useOfficialArt() {
    this.usingOfficialArt.set(true);
  }

  assetDirectory = computed<string>(() => (this.usingOfficialArt() ? 'official_card_assets' : 'card_assets'));
}
