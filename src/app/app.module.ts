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
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';

import { CognitoUtil } from './services/cognito.service';
import { routing } from './app.routes';
import { AwsUtil } from './services/aws.service';
import { UserRegistrationService } from './services/user-registration.service';
import { UserParametersService } from './services/user-parameters.service';
import { UserLoginService } from './services/user-login.service';
import { CentralApiService } from './services/central-api.service';
import { ProfileService } from './profile/shared/profile.service';
import { EventsService } from './calendar-view/shared/events.service';
import { CalendarService } from './calendar-view/shared/calendar.service';

import * as $ from 'jquery';
import * as bootstrap from 'bootstrap';
import * as moment from 'moment';



import { HomeComponent, LogoutComponent } from './home/home.component';
import { AuthInterceptor } from './apiinterceptor';
import { IonRangeSliderModule } from 'ng2-ion-range-slider';

@NgModule({
  declarations: [
    AppComponent,
    CalendarViewComponent,
    HeaderComponent,
    ProfileComponent,
    GpCompleteDirective,
    LogoutComponent,
    HomeComponent
  ],
  imports: [
    NgbModule.forRoot(),
    NgbModalModule.forRoot(),
    CalendarModule.forRoot(),
    Ng4LoadingSpinnerModule.forRoot(),
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    IonRangeSliderModule,
    HttpModule,
    HttpClientModule,
    routing,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    BrowserAnimationsModule
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
    },
    EventsService,
    CalendarService

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
