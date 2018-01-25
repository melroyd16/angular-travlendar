import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'angular-calendar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { CalendarViewComponent } from './calendar-view/calendar-view.component';
import { HeaderComponent } from './header/header.component';
import { ProfileComponent } from './profile/profile.component';
import { GpCompleteDirective } from './directives/gp-complete.directive';

import { CognitoUtil } from './services/cognito.service';
import { routing } from './app.routes';
import { AwsUtil } from './services/aws.service';
import { UserRegistrationService } from './services/user-registration.service';
import { UserParametersService } from './services/user-parameters.service';
import { UserLoginService } from './services/user-login.service';
import { CentralApiService } from './services/central-api.service';
import { ProfileService } from './profile/shared/profile.service';

import * as $ from 'jquery';
import * as bootstrap from 'bootstrap';



import { AboutComponent, HomeComponent, HomeLandingComponent } from './public/home.component';
import { LoginComponent } from './public/auth/login/login.component';
import { RegisterComponent } from './public/auth/register/registration.component';
import { ForgotPassword2Component, ForgotPasswordStep1Component } from './public/auth/forgot/forgotPassword.component';
import { LogoutComponent, RegistrationConfirmationComponent } from './public/auth/confirm/confirmRegistration.component';
import { ResendCodeComponent } from './public/auth/resend/resendCode.component';
import { NewPasswordComponent } from './public/auth/newpassword/newpassword.component';
import { AuthInterceptor } from './apiinterceptor';

@NgModule({
  declarations: [
    AppComponent,
    CalendarViewComponent,
    HeaderComponent,
    ProfileComponent,
    GpCompleteDirective,
    NewPasswordComponent,
    LoginComponent,
    LogoutComponent,
    RegistrationConfirmationComponent,
    ResendCodeComponent,
    ForgotPasswordStep1Component,
    ForgotPassword2Component,
    RegisterComponent,
    AboutComponent,
    HomeLandingComponent,
    HomeComponent
  ],
  imports: [
    NgbModule.forRoot(),
    NgbModalModule.forRoot(),
    CalendarModule.forRoot(),
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    routing
  ],
  providers: [CognitoUtil,
    AwsUtil,
    UserRegistrationService,
    UserLoginService,
    UserParametersService,
    ProfileService,
    CentralApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
