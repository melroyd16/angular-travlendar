import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import { UserLoginService } from '../services/user-login.service';
import { LoggedInCallback } from '../services/cognito.service';
import { ProfileService } from './shared/profile.service';
import {IonRangeSliderComponent} from 'ng2-ion-range-slider';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit {

  @ViewChild('lunchSliderElement') lunchSliderElement: IonRangeSliderComponent;
  @ViewChild('dinnerSliderElement') dinnerSliderElement: IonRangeSliderComponent;

  homeLocationText: string;
  workLocationText: string;

  advancedSlider1 = {name: 'Lunch Slider', onUpdate: undefined, onFinish: undefined};
  advancedSlider = {name: 'Dinner Slider', onUpdate: undefined, onFinish: undefined};

  // User preferred mode checkboxes
  log = '';

  logCheckbox(element: HTMLInputElement): void {
    this.log += `Checkbox ${element.value} was ${element.checked ? '' : 'un'}checked\n`;
  }

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

  update(slider, event) {
    console.log('Slider updated: ' + slider.name);
    slider.onUpdate = event;
  }

  finish(slider, event) {
    console.log('Slider finished: ' + slider.name);
    slider.onFinish = event;
  }

  setAdvancedSliderTo(from, to) {
    this.lunchSliderElement.update({value: from, to: to});
  }
}
