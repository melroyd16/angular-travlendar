import { Location } from './location';

export class UserProfile {

  homeLocation?: Location;
  workLocation?: Location;
  walkingDistance: number;
  cyclingDistance: number;
  preferredMode: any[];

  constructor(home: Location, work: Location, walk: number, cycle: number, mode: any[]) {
    this.homeLocation = home;
    this.workLocation = work;
    this.walkingDistance = walk;
    this.cyclingDistance = cycle;
    this.preferredMode= mode;
  }
}
