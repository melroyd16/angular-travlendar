import { Location } from './location';

export class UserProfile {

  homeLocation?: Location;
  workLocation?: Location;
  walkingDistance?: number;
  cyclingDistance?: number;
  preferredMode?: any[];
  lunchStartTime?: string;
  lunchEndTime?: string;
  dinnerStartTime?: string;
  dinnerEndTime?: string;

  constructor(home: Location, work: Location, walk: number, cycle: number,
    mode: any[], lunchStart: string, lunchEnd: string, dinnerStart: string, dinnerEnd: string) {
    this.homeLocation = home;
    this.workLocation = work;
    this.walkingDistance = walk;
    this.cyclingDistance = cycle;
    this.preferredMode = mode;
    this.lunchStartTime = lunchStart;
    this.lunchEndTime = lunchEnd;
    this.dinnerStartTime = dinnerStart;
    this.dinnerEndTime = dinnerEnd;
  }
}
