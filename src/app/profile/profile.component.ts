import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UserLoginService } from '../services/user-login.service';
import { ProfileService } from './shared/profile.service';
import { IonRangeSliderComponent } from 'ng2-ion-range-slider';
import { Location } from '../classes/location';


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

  homeLocation: Location;
  workLocation: Location;

  mapLunchTime = new Map<string, number>(
    [
      ['11:00am', 0],
      ['11:15am', 1],
      ['11:30am', 2],
      ['11:45am', 3],
      ['12:00pm', 4],
      ['12:15pm', 5],
      ['12:30pm', 6],
      ['12:45pm', 7],
      ['01:00pm', 8],
      ['01:15pm', 9],
      ['01:30pm', 10],
      ['01:45pm', 11],
      ['02:00pm', 12],
      ['02:15pm', 13],
      ['02:30pm', 14],
      ['02:45pm', 15],
      ['03:00pm', 16]
    ]
  );
  lunchStart: number;
  lunchEnd: number;
  lunchStartTime: string;
  lunchEndTime: string;

  mapDinnerTime = new Map<string, number>(
    [
      ['06:00pm', 0],
      ['06:15pm', 1],
      ['06:30pm', 2],
      ['06:45pm', 3],
      ['07:00pm', 4],
      ['07:15pm', 5],
      ['07:30pm', 6],
      ['07:45pm', 7],
      ['08:00pm', 8],
      ['08:15pm', 9],
      ['08:30pm', 10],
      ['08:45pm', 11],
      ['09:00pm', 12],
      ['09:15pm', 13],
      ['09:30pm', 14],
      ['09:45pm', 15],
      ['10:00pm', 16]
    ]
  );
  dinnerStartTime: string;
  dinnerEndTime: string;
  dinnerStart: number;
  dinnerEnd: number;

  index: number;
  walking = 0;
  cycling = 0;

  advancedSlider1 = { name: 'Lunch Slider', onUpdate: undefined, onFinish: undefined };
  advancedSlider = { name: 'Dinner Slider', onUpdate: undefined, onFinish: undefined };

  // User preferred mode checkboxes
  walk = true;
  drive = true;
  cycle = true;
  trans = true;
  travelMode = ['walking', 'driving', 'cycling', 'transit'];

  constructor(public router: Router, public userService: UserLoginService, public profileService: ProfileService) {
    this.userService.isAuthenticated(this);
  }

  logCheckbox(element: HTMLInputElement): void {
    if (element.checked) {
      this.travelMode.push(element.value);
      console.log(this.travelMode);

      switch (element.value) {
        case 'walking':
          this.walk = true;
          break;
        case 'driving':
          this.drive = true;
          break;
        case 'cycling':
          this.cycle = true;
          break;
        case 'transit':
          this.trans = true;
          break;
        default:
          break;
      }
    } else {
      this.index = this.travelMode.indexOf(element.value);
      if (this.index > -1) {
        this.travelMode.splice(this.index, 1);
      }
      switch (element.value) {
        case 'walking':
          this.walk = false;
          break;
        case 'driving':
          this.drive = false;
          break;
        case 'cycling':
          this.cycle = false;
          break;
        case 'transit':
          this.trans = false;
          break;
        default:
          break;
      }
    }
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (!isLoggedIn) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit() {
    if (!this.profileService.userProfile.homeLocation || !this.profileService.userProfile.preferredMode) {
      this.profileService.fetchUserProfile().subscribe((data) => {
        if (data.Item) {
          console.log(data);
          // this.profileService.setLocationDetails(data.Item.homeLocation, data.Item.workLocation);
          this.homeLocation = this.profileService.userProfile.homeLocation;
          this.workLocation = this.profileService.userProfile.workLocation;
          this.homeLocationText = this.profileService.userProfile.homeLocation.formatted_address;
          this.workLocationText = this.profileService.userProfile.workLocation.formatted_address;
          this.lunchStart = this.mapLunchTime.get(data.Item.lunchTime.start_time);
          this.lunchEnd = this.mapLunchTime.get(data.Item.lunchTime.end_time);
          this.dinnerStart = this.mapDinnerTime.get(data.Item.dinnerTime.start_time);
          this.dinnerEnd = this.mapDinnerTime.get(data.Item.dinnerTime.end_time);
          this.lunchStartTime = data.Item.lunchTime.start_time;
          this.lunchEndTime = data.Item.lunchTime.end_time;
          this.dinnerStartTime = data.Item.dinnerTime.start_time;
          this.dinnerEndTime = data.Item.dinnerTime.end_time;
          console.log(this.lunchStart);
          console.log(this.lunchEnd);
          console.log(this.dinnerStart);
          console.log(this.dinnerEnd);
          if (data.Item.walkingDistance) {
            this.profileService.setUserDetails(data.Item.walkingDistance,
              data.Item.cyclingDistance, data.Item.preferredMode);
            this.walking = this.profileService.userProfile.walkingDistance;
            this.cycling = this.profileService.userProfile.cyclingDistance;
            this.travelMode = this.profileService.userProfile.preferredMode;
            this.walk = this.travelMode.indexOf('walking') > -1;
            this.drive = this.travelMode.indexOf('driving') > -1;
            this.cycle = this.travelMode.indexOf('cycling') > -1;
            this.trans = this.travelMode.indexOf('transit') > -1;
          }
        }
      });
    } else {
      this.homeLocation = this.profileService.userProfile.homeLocation;
      this.workLocation = this.profileService.userProfile.workLocation;
      this.homeLocationText = this.profileService.userProfile.homeLocation.formatted_address;
      this.workLocationText = this.profileService.userProfile.workLocation.formatted_address;
      this.walking = this.profileService.userProfile.walkingDistance;
      this.cycling = this.profileService.userProfile.cyclingDistance;
      this.travelMode = this.profileService.userProfile.preferredMode;
      console.log(this.profileService.userProfile);
      this.walk = this.travelMode.indexOf('walking') > -1;
      this.drive = this.travelMode.indexOf('driving') > -1;
      this.cycle = this.travelMode.indexOf('cycling') > -1;
      this.trans = this.travelMode.indexOf('transit') > -1;
    }
  }

  selectAddress(place: any, location: string) {
    if (location === 'home') {
      this.homeLocation = new Location(place.place_id, place.formatted_address, place.geometry.location.lat(),
        place.geometry.location.lng());
    } else {
      this.workLocation = new Location(place.place_id, place.formatted_address, place.geometry.location.lat(),
        place.geometry.location.lng());
    }
  }

  saveUserProfile(): void {
    this.profileService.saveUserProfile(this.homeLocation, this.workLocation, this.walking,
      this.cycling, this.travelMode, this.lunchStartTime, this.lunchEndTime, this.dinnerStartTime,
      this.dinnerEndTime).subscribe((data) => {
        this.profileService.setUserDetails(this.walking, this.cycling,
          this.travelMode);
      });
  }

  update(slider, event) {
    slider.onUpdate = event;
  }

  finishStart(slider, event) {
    slider.onFinish = event;
    this.mapLunchTime.forEach((value, key) => {
      if (value === event.from) {
        this.lunchStartTime = key;
      }
      if (value === event.to) {
        this.lunchEndTime = key;
      }
    });
    console.log(this.lunchStartTime);
    console.log(this.lunchEndTime);
  }

  finishDinner(slider, event) {
    slider.onFinish = event;
    this.mapDinnerTime.forEach((value, key) => {
      if (value === event.from) {
        this.dinnerStartTime = key;
      }
      if (value === event.to) {
        this.dinnerEndTime = key;
      }
    });
    console.log(this.dinnerStartTime);
    console.log(this.dinnerEndTime);
  }
}
