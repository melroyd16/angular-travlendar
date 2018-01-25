import { AwsUtil } from './services/aws.service';
import { UserLoginService } from './services/user-login.service';
import { CognitoUtil, LoggedInCallback } from './services/cognito.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { ProfileService } from './profile/shared/profile.service';

import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { } from '@types/googlemaps';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    './app.component.scss',
    '../../node_modules/angular-calendar/dist/css/angular-calendar.css']
})
export class AppComponent implements OnInit, LoggedInCallback {
  currentRoute: string;
  constructor(public awsUtil: AwsUtil, public userService: UserLoginService, public cognito: CognitoUtil,
    private router: Router, route: ActivatedRoute, private profileService: ProfileService) {
  }

  ngOnInit() {
    this.router.events
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const pathArray = event.urlAfterRedirects.split('/');
          this.currentRoute = pathArray[1];
        }
      });
    this.userService.isAuthenticated(this);
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    const mythis = this;
    this.cognito.getIdToken({
      callback() {
        mythis.profileService.fetchUserProfile().subscribe((data) => {
          if (data.Item) {
            mythis.profileService.setLocationDetails(data.Item.homeLocation, data.Item.workLocation);
          }
        });
      },
      callbackWithParam(token: any) {
        // Include the passed-in callback here as well so that it's executed downstream
        mythis.awsUtil.initAwsService(null, isLoggedIn, token);
      }
    });
  }
}
