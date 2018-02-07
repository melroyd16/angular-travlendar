import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UserLoginService } from '../services/user-login.service';
import { LoggedInCallback } from '../services/cognito.service';
import { ProfileService } from './shared/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit {

  homeLocationText: string;
  workLocationText: string;

  constructor(public router: Router, public userService: UserLoginService, public profileService: ProfileService) {
    this.userService.isAuthenticated(this);
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (!isLoggedIn) {
      this.router.navigate(['/home/login']);
    }
  }

  ngOnInit() {
    if (!this.profileService.userProfile.homeLocation) {
      this.profileService.fetchUserProfile().subscribe((data) => {
        if (data.Item) {
          this.profileService.setLocationDetails(data.Item.homeLocation, data.Item.workLocation);
          this.homeLocationText = this.profileService.userProfile.homeLocation.formatted_address;
          this.workLocationText = this.profileService.userProfile.workLocation.formatted_address;
        }
      });
    } else {
      this.homeLocationText = this.profileService.userProfile.homeLocation.formatted_address;
      this.workLocationText = this.profileService.userProfile.workLocation.formatted_address;
    }
  }
}
