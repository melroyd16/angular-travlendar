import { Location } from './location';
import { TravelMode } from './travel-mode';

export class Event {
  eventTitle: String;
  eventStart: int;
  eventEnd: int;
  destination: Location;
  origin: Location;
  travelMode: TravelMode;

  constructor(
    eventTitle: String,
    eventStart: int,
    eventEnd: int,
    destination: Location,
    origin: Location,
    travelMode: TravelMode
  ) {
    this.eventTitle = eventTitle;
    this.eventStart = eventStart;
    this.eventEnd = eventEnd;
    this.destination = destination;
    this.origin = origin;
    this.travelMode = travelMode;
  }
}
