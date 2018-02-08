import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import { UserLoginService } from '../services/user-login.service';
import { LoggedInCallback } from '../services/cognito.service';
import { ProfileService } from './shared/profile.service';
import {IonRangeSliderComponent} from 'ng2-ion-range-slider';
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

  lunchStart: number=0;
  lunchEnd: number=4;

  dinnerStart: number=0;
  dinnerEnd: number=4;

  index:number;
  walking:number=0;
  cycling:number=0;

  advancedSlider1 = {name: 'Lunch Slider', onUpdate: undefined, onFinish: undefined};
  advancedSlider = {name: 'Dinner Slider', onUpdate: undefined, onFinish: undefined};

  // User preferred mode checkboxes
  walk:boolean = true;
  drive:boolean = true;
  cycle:boolean = true;
  trans:boolean = true;

  travelMode = ['walking','driving','cycling','transit'];

  logCheckbox(element: HTMLInputElement): void {
    if(element.checked){
      this.travelMode.push(element.value);
      console.log(this.travelMode);

      switch(element.value){
        case "walking":
          this.walk=true;
          break;
        case "driving":
          this.drive=true;
          break;
        case "cycling" :
          this.cycle=true;
          break;
        case "transit" :
          this.trans=true;
          break;
        default:
          break;
      }
    }
    else{
      this.index=this.travelMode.indexOf(element.value);
      if (this.index > -1) {
        this.travelMode.splice(this.index, 1);
      }
      switch(element.value){
        case "walking":
          this.walk=false;
          break;
        case "driving":
          this.drive=false;
          break;
        case "cycling" :
          this.cycle=false;
          break;
        case "transit" :
          this.trans=false;
          break;
        default:
          break;
      }
    }


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
          this.profileService.setUserDetails(data.Item.homeLocation, data.Item.workLocation,data.Item.walkingDistance,
          data.Item.cyclingDistance, data.Item.preferredMode);
          this.homeLocation=this.profileService.userProfile.homeLocation;
          this.workLocation=this.profileService.userProfile.workLocation;
          this.homeLocationText = this.profileService.userProfile.homeLocation.formatted_address;
          this.workLocationText = this.profileService.userProfile.workLocation.formatted_address;
          this.walking = this.profileService.userProfile.walkingDistance;
          this.cycling = this.profileService.userProfile.cyclingDistance;
          this.travelMode=this.profileService.userProfile.preferredMode;

          if(this.travelMode.indexOf('walking')> -1){
            this.walk=true;
          }
          else{
            this.walk=false;
          }

          if(this.travelMode.indexOf('driving')> -1){
            this.drive=true;
          }
          else{
            this.drive=false;
          }

          if(this.travelMode.indexOf('cycling')> -1){
            this.cycle=true;
          }
          else{
            this.cycle=false;
          }

          if(this.travelMode.indexOf('transit')> -1){
            this.trans=true;
          }
          else{
            this.trans=false;
          }

        }
      });
    } else {
      this.homeLocation=this.profileService.userProfile.homeLocation;
      this.workLocation=this.profileService.userProfile.workLocation;
      this.homeLocationText = this.profileService.userProfile.homeLocation.formatted_address;
      this.workLocationText = this.profileService.userProfile.workLocation.formatted_address;
      this.walking = this.profileService.userProfile.walkingDistance;
      this.cycling = this.profileService.userProfile.cyclingDistance;
      this.travelMode=this.profileService.userProfile.preferredMode;
      if(this.travelMode.indexOf('walking')> -1){
        this.walk=true;
      }
      else{
        this.walk=false;
      }

      if(this.travelMode.indexOf('driving')> -1){
        this.drive=true;
      }
      else{
        this.drive=false;
      }

      if(this.travelMode.indexOf('cycling')> -1){
        this.cycle=true;
      }
      else{
        this.cycle=false;
      }

      if(this.travelMode.indexOf('transit')> -1){
        this.trans=true;
      }
      else{
        this.trans=false;
      }
    }
  }

  selectAddress(place: any, location: string) {

    if (location === 'home') {
      this.homeLocation = new Location(place.place_id, place.formatted_address);
    } else {
      this.workLocation = new Location(place.place_id, place.formatted_address);
    }
  }

  saveUserProfile(): void {
    console.log("Inside Save user"+ this.homeLocation);
    this.profileService.saveUserProfile(this.homeLocation, this.workLocation, this.walking, this.cycling, this.travelMode).subscribe((data) => {
    this.profileService.setUserDetails(this.homeLocation, this.workLocation, this.walking, this.cycling, this.travelMode);
    });
  }

  update(slider, event) {
    slider.onUpdate = event;
  }

  finish(slider, event) {
    slider.onFinish = event;
  }
}
