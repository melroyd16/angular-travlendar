import { Injectable } from '@angular/core';
import { CentralApiService } from '../../services/central-api.service';
import { Location } from '../../classes/location';
import { UserProfile } from '../../classes/user-profile';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

@Injectable()
export class ProfileService {

  userProfile: UserProfile = {};
  constructor(public centralAPIService: CentralApiService) { }

  fetchUserProfile(): Observable<any> {
    const simpleObservable = new Observable((observer) => {
      this.centralAPIService.callAPI('profile', {}, 'get').subscribe((data) => {
        if (data.Item) {
          this.setProfile(data.Item);
        }
        observer.next(data);
        observer.complete();
      });
    });
    return simpleObservable;
  }

  setProfile(item: any): void {
    this.userProfile.homeLocation = item.homeLocation;
    this.userProfile.workLocation = item.workLocation;
    this.userProfile.walkingDistance = item.walkingDistance;
    this.userProfile.bicyclingDistance = item.bicyclingDistance;
    this.userProfile.preferredMode = item.preferredMode;
    this.userProfile.lunchStartTime = item.lunchTime ? item.lunchTime.start_time : 'Not Set';
    this.userProfile.lunchEndTime = item.lunchTime ? item.lunchTime.end_time : 'Not Set';
    this.userProfile.dinnerStartTime = item.dinnerTime ? item.dinnerTime.start_time : 'Not Set';
    this.userProfile.dinnerEndTime = item.dinnerTime ? item.dinnerTime.end_time : 'Not Set';
  }

  setLocationDetails(homeLocation: Location, workLocation: Location): void {
    this.userProfile.homeLocation = homeLocation;
    this.userProfile.workLocation = workLocation;
    console.log(this.userProfile);
  }

  saveLocationDetails(homeLocation: Location, workLocation: Location): Observable<any> {
    const payload = {
      operation: 'saveLocation',
      homeLocation: homeLocation,
      workLocation: workLocation
    };
    return this.centralAPIService.callAPI('profile', payload, 'post');
  }

  saveUserProfile(homeLocation: Location, workLocation: Location, walkingDistance: number,
    bicyclingDistance: number, preferredModes: any[], lunchStartTime, lunchEndTime,
    dinnerStartTime, dinnerEndTime): Observable<any> {
    const payload = {
      operation: 'saveProfile',
      homeLocation: homeLocation,
      workLocation: workLocation,
      walkingDistance: walkingDistance,
      bicyclingDistance: bicyclingDistance,
      preferredModes: preferredModes,
      lunchTime: {
        'end_time': lunchEndTime,
        'start_time': lunchStartTime
      },
      dinnerTime: {
        'end_time': dinnerEndTime,
        'start_time': dinnerStartTime
      }
    };
    console.log(payload);
    return this.centralAPIService.callAPI('profile', payload, 'post');
  }

  setUserDetails(lunchStartTime: string, lunchEndTime: string, dinnerStartTime: string, dinnerEndTime: string, walkingDistance: number, bicyclingDistance: number,
    preferredModes: any[]): void {
    this.userProfile.walkingDistance = walkingDistance;
    this.userProfile.bicyclingDistance = bicyclingDistance;
    this.userProfile.preferredMode = preferredModes;
    this.userProfile.lunchStartTime = lunchStartTime;
    this.userProfile.lunchEndTime = lunchEndTime;
    this.userProfile.dinnerStartTime = dinnerStartTime;
    this.userProfile.dinnerEndTime= dinnerEndTime;
  }

  // getUserProfile(): UserProfile {
  //   console.log(this.userProfile);
  //   return this.userProfile;
  // }
}
