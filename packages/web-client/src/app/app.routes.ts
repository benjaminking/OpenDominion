import { Routes, CanDeactivateFn } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';
import { LoginPageComponent } from './pages/login-page.component';
import { LobbyPageComponent } from './pages/lobby-page.component';
import { TableRoomPageComponent } from './pages/table-room-page.component';
import { GameComponent } from './game.component';
import { ProfilePageComponent } from './pages/profile-page.component';

const tableRoomDeactivateGuard: CanDeactivateFn<TableRoomPageComponent> = (component) => component.canDeactivate();

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'lobby',
  },
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'lobby',
    component: LobbyPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tables/:tableId',
    component: TableRoomPageComponent,
    canActivate: [authGuard],
    canDeactivate: [tableRoomDeactivateGuard],
  },
  {
    path: 'game',
    canActivate: [authGuard],
    component: GameComponent,
  },
  {
    path: 'profile/:userId',
    component: ProfilePageComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'lobby',
  },
];
