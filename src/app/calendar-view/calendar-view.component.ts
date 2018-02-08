import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  OnInit,
  ChangeDetectorRef,
  ApplicationRef
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { Subject } from 'rxjs/Subject';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent
} from 'angular-calendar';

import { UserLoginService } from '../services/user-login.service';
import { LoggedInCallback } from '../services/cognito.service';
import { Router } from '@angular/router';

import { ProfileService } from '../profile/shared/profile.service';
import { EventsService } from './shared/events.service';
import { CalendarService } from './shared/calendar.service';
import { Location } from '../classes/location';
import { Event } from '../classes/event';

import * as moment from 'moment';

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit {
  @ViewChild('modalContent') modalContent: TemplateRef<any>;

  view = 'month';
  displayLocationModal: boolean;
  eventsLoaded = false;
  homeLocation: Location;
  workLocation: Location;
  eventPayload: any;
  event: Event;
  otherLocationDetails: Location;
  eventStartMinDate: Date = new Date();
  viewDate: Date = new Date();
  activeDayIsOpen = false;
  displayEventModal = false;
  displayTravelModes = false;
  locationTypes = ['home', 'work', 'prior event location', 'other'];
  selectedPriorLocation = 'home';
  travelModeArray = [];

  modalData: {
    action: string;
    event: CalendarEvent;
  };

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fa fa-fw fa-pencil"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.handleEvent('Deleted', event);
      }
    }
  ];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [];

  constructor(private modal: NgbModal, public router: Router,
    public userService: UserLoginService,
    public profileService: ProfileService,
    public eventsService: EventsService,
    public calendarService: CalendarService,
    private ref: ApplicationRef) {
    this.userService.isAuthenticated(this);
  }

  ngOnInit() {
    const userProfile = this.profileService.getUserProfile();
    if (!this.profileService.userProfile || !this.profileService.userProfile.homeLocation) {
      this.profileService.fetchUserProfile().subscribe((locationDetails) => {
        if (!locationDetails.Item || !locationDetails.Item.homeLocation) {
          $('#locationModal').modal('toggle');
        } else {
          this.homeLocation = locationDetails.Item.homeLocation;
          this.workLocation = locationDetails.Item.workLocation;
        }
      });
    } else {
      this.homeLocation = this.profileService.userProfile.homeLocation;
      this.workLocation = this.profileService.userProfile.workLocation;
    }
    console.log(userProfile);
    this.eventsService.fetchEvents().subscribe((eventList) => {
      this.eventsLoaded = true;
      for (let i = 0; i < eventList.Items.length; i++) {
        this.addEvent(eventList.Items[i].eventTitle, eventList.Items[i].eventStart, eventList.Items[i].eventEnd);
      }
    });
    this.initEvent();
  }

  initEvent(): void {
    this.event = new Event();
    this.event.eventStart = new Date();
    this.event.eventEnd = moment().add('hours', 1);
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (!isLoggedIn) {
      this.router.navigate(['/home/login']);
    }
  }

  selectAddress(place: any, location: string) {
    switch (location) {
      case 'home':
        this.homeLocation = new Location(place.place_id, place.formatted_address,
          place.geometry.location.lat(), place.geometry.location.lng());
        break;
      case 'work':
        this.workLocation = new Location(place.place_id, place.formatted_address,
          place.geometry.location.lat(), place.geometry.location.lng());
        break;
      case 'event':
        this.event.destination = new Location(place.place_id, place.formatted_address,
          place.geometry.location.lat(), place.geometry.location.lng());
        this.changeLocation();
        break;
      case 'other':
        this.otherLocationDetails = new Location(place.place_id, place.formatted_address,
          place.geometry.location.lat(), place.geometry.location.lng());
        break;
    }
  }

  saveLocation(): void {
    this.profileService.saveLocationDetails(this.homeLocation, this.workLocation).subscribe((data) => {
      this.profileService.setLocationDetails(this.homeLocation, this.workLocation);
      $('#locationModal').modal('toggle');
    });
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  saveEvent(): void {
    this.eventPayload = Object.assign({}, this.event);
    this.eventPayload.eventStart = new Date(this.eventPayload.eventStart).getTime();
    this.eventPayload.eventEnd = new Date(this.eventPayload.eventEnd).getTime();
    for (let i = 0; i < this.travelModeArray.length; i++) {
      if (this.eventPayload.travelMode === this.travelModeArray[i].mode) {
        this.eventPayload.travelMode = {
          mode: this.travelModeArray[i].mode,
          distance: this.travelModeArray[i].value.distance,
          duration: this.travelModeArray[i].value.duration
        };
      }
    }
    this.calendarService.saveEvent(this.eventPayload, false).subscribe((data) => {
      if (data.errorMessage && data.errorMessage === 'Conflict') {
        console.log('A conflict occured');
      } else {
        this.addEvent(this.eventPayload.eventTitle, this.eventPayload.eventStart, this.eventPayload.eventEnd);
        $('eventModal').modal('hide');
      }
    });
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.handleEvent('Dropped or resized', event);
    this.refresh.next();
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.modalData = { event, action };
    this.modal.open(this.modalContent, { size: 'lg' });
  }

  openEventModal(): void {
    this.displayEventModal = true;
  }

  changeLocation(): void {
    // this.displayTravelModes = false;
    this.event.travelMode = null;
    if (!(this.event.origin && this.event.origin.place_id)) {
      this.event.origin = this.homeLocation;
    }
    if (this.event.origin && this.event.origin.place_id && this.event.destination && this.event.destination.place_id) {
      this.calendarService.fetchTransitDetails(this.event.origin, this.event.destination).subscribe((data) => {
        this.travelModeArray = data;
        this.displayTravelModes = true;
        this.ref.tick();
      });
    }
  }

  addEvent(eventTitle, eventStart, eventEnd): void {
    this.events.push({
      title: 'New event',
      start: new Date(eventStart),
      end: new Date(eventEnd),
      color: colors.red,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true
      }
    });
    this.refresh.next();
  }
}
