import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { HomeComponent, LogoutComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { CalendarViewComponent } from './calendar-view/calendar-view.component';


const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'calendar', component: CalendarViewComponent },
  { path: 'logout', component: LogoutComponent },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },


];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
