import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { AboutComponent, HomeComponent, HomeLandingComponent, LogoutComponent } from './public/home.component';
import { LoginComponent } from './public/auth/login/login.component';
import { RegisterComponent } from './public/auth/register/registration.component';
import { ForgotPassword2Component, ForgotPasswordStep1Component } from './public/auth/forgot/forgotPassword.component';
import { RegistrationConfirmationComponent } from './public/auth/confirm/confirmRegistration.component';
import { ResendCodeComponent } from './public/auth/resend/resendCode.component';
import { NewPasswordComponent } from './public/auth/newpassword/newpassword.component';

import { ProfileComponent } from './profile/profile.component';
import { CalendarViewComponent } from './calendar-view/calendar-view.component';

const homeRoutes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'about', component: AboutComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'confirmRegistration/:username', component: RegistrationConfirmationComponent },
      { path: 'resendCode', component: ResendCodeComponent },
      { path: 'forgotPassword', component: ForgotPasswordStep1Component },
      { path: 'newPassword', component: NewPasswordComponent },
      { path: '', component: HomeLandingComponent }
    ]
  },
];

const routes: Routes = [
  {
    path: '',
    children: [
      ...homeRoutes,
      {
        path: '',
        component: HomeComponent
      }
    ]
  },
  { path: 'profile', component: ProfileComponent },
  { path: 'calendar', component: CalendarViewComponent },
  { path: 'logout', component: LogoutComponent }


];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
