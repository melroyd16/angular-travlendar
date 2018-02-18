import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {UserLoginService} from '../services/user-login.service';
import {ProfileService} from './shared/profile.service';
import {IonRangeSliderComponent} from 'ng2-ion-range-slider';
import {Location} from '../classes/location';


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

  mapLunchTime = new Map<string, number>();
  mapDinnerTime = new Map<string, number>();
  lunchStart = 4;
  lunchEnd = 6;

  dinnerStart = 7;
  dinnerEnd = 8;

  index: number;
  walking = 0;
  cycling = 0;

  advancedSlider1 = {name: 'Lunch Slider', onUpdate: undefined, onFinish: undefined};
  advancedSlider = {name: 'Dinner Slider', onUpdate: undefined, onFinish: undefined};

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
        case 'cycling' :
          this.cycle = true;
          break;
        case 'transit' :
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
        case 'cycling' :
          this.cycle = false;
          break;
        case 'transit' :
          this.trans = false;
          break;
        default:
          break;
      }
    }
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (!isLoggedIn) {
      this.router.navigate(['/home/login']);
    }
  }

  ngOnInit() {
    this.mapLunchTime.set('11:00am', 0);
    this.mapLunchTime.set('11:15am', 1);
    this.mapLunchTime.set('11:30am', 2);
    this.mapLunchTime.set('11:45am', 3);
    this.mapLunchTime.set('12:00pm', 4);
    this.mapLunchTime.set('12:15am', 5);
    this.mapLunchTime.set('12:30pm', 6);
    this.mapLunchTime.set('12:45pm', 7);
    this.mapLunchTime.set('01:00pm', 8);
    this.mapLunchTime.set('01:15pm', 9);
    this.mapLunchTime.set('01:30pm', 10);
    this.mapLunchTime.set('01:45pm', 11);
    this.mapLunchTime.set('02:00pm', 12);
    this.mapLunchTime.set('02:15pm', 13);
    this.mapLunchTime.set('02:30pm', 14);
    this.mapLunchTime.set('02:45pm', 15);
    this.mapLunchTime.set('03:00pm', 16);
    this.mapDinnerTime.set('06:00pm', 0);
    this.mapDinnerTime.set('06:15pm', 1);
    this.mapDinnerTime.set('06:30pm', 2);
    this.mapDinnerTime.set('06:45pm', 3);
    this.mapDinnerTime.set('07:00pm', 4);
    this.mapDinnerTime.set('07:15am', 5);
    this.mapDinnerTime.set('07:30pm', 6);
    this.mapDinnerTime.set('07:45pm', 7);
    this.mapDinnerTime.set('08:00pm', 8);
    this.mapDinnerTime.set('08:15pm', 9);
    this.mapDinnerTime.set('08:30pm', 10);
    this.mapDinnerTime.set('08:45pm', 11);
    this.mapDinnerTime.set('09:00pm', 12);
    this.mapDinnerTime.set('09:15pm', 13);
    this.mapDinnerTime.set('09:30pm', 14);
    this.mapDinnerTime.set('09:45pm', 15);
    this.mapDinnerTime.set('10:00pm', 16);
    if (!this.profileService.userProfile.homeLocation || !this.profileService.userProfile.preferredMode) {
      this.profileService.fetchUserProfile().subscribe((data) => {
        if (data.Item) {
          this.profileService.setLocationDetails(data.Item.homeLocation, data.Item.workLocation);
          this.homeLocation = this.profileService.userProfile.homeLocation;
          this.workLocation = this.profileService.userProfile.workLocation;
          this.homeLocationText = this.profileService.userProfile.homeLocation.formatted_address;
          this.workLocationText = this.profileService.userProfile.workLocation.formatted_address;
          this.lunchStart = this.mapLunchTime.get(data.Item.lunchTime.start_time);
          this.lunchEnd = this.mapLunchTime.get(data.Item.lunchTime.end_time);
          this.dinnerStart = this.mapDinnerTime.get(data.Item.dinnerTime.start_time);
          this.dinnerEnd = this.mapDinnerTime.get(data.Item.dinnerTime.end_time);

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
      this.cycling, this.travelMode).subscribe((data) => {
      this.profileService.setUserDetails(this.walking, this.cycling, this.travelMode);
    });
  }

  update(slider, event) {
    slider.onUpdate = event;
  }

  finishStart(slider, event) {
    slider.onFinish = event;
    this.lunchStart = this.mapLunchTime.get(event.from);
    this.lunchEnd = this.mapLunchTime.get(event.to);
    console.log(this.mapLunchTime.get(event.from));
    console.log(event.to);
  }

  finishDinner(slider, event) {
    slider.onFinish = event;
    this.dinnerStart = this.mapDinnerTime.get(event.from);
    this.dinnerEnd = this.mapDinnerTime.get(event.to);
    console.log(this.dinnerStart);
    console.log(this.lunchEnd);
  }
}
