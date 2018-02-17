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
  eventsLoaded = false;
  homeLocation: Location;
  workLocation: Location;
  eventPayload: any;
  event: Event;
  otherLocationDetails: Location;
  eventStartMinDate: Date = new Date();
  viewDate: Date = new Date();
  activeDayIsOpen = false;
  displayDeleteModal: boolean;
  displayEventModal = false;
  displayTravelModes = false;
  displayModalError = false;
  forceSaveEvent = false;
  displaySuccess = false;
  scheduleModalError = '';
  successMessage = '';
  locationTypes = ['home', 'work', 'prior event location', 'other'];
  selectedPriorLocation = 'home';
  travelModeArray = [];
  deleteEventId = '';

  eventActions: CalendarEventAction[] = [
    {
      label: '<i class="fas fa-edit"></i>',
      onClick: ({ event }: { event: any }): void => {
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: any }): void => {
        $('#deleteModal').modal('toggle');
        this.deleteEventId = event.id;
      }
    }
  ];

  refresh: Subject<any> = new Subject();

  events: any[] = [];

  constructor(private modal: NgbModal, public router: Router,
    public userService: UserLoginService,
    public profileService: ProfileService,
    public eventsService: EventsService,
    public calendarService: CalendarService,
    private ref: ApplicationRef) {
    this.userService.isAuthenticated(this);
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (!isLoggedIn) {
      this.router.navigate(['/home/login']);
    }
  }

  ngOnInit() {

    this.displayDeleteModal = false;

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
    this.eventsService.fetchEvents().subscribe((eventList) => {

      this.eventsLoaded = true;
      for (let i = 0; i < eventList.Items.length; i++) {
        this.addEvent(eventList.Items[i].id, eventList.Items[i].eventTitle, eventList.Items[i].eventStart, eventList.Items[i].eventEnd);
      }
    });
    this.initEvent();
  }

  initEvent(): void {
    this.event = new Event();
    this.event.eventStart = new Date();
    this.event.eventEnd = moment().add(1, 'hours');
    this.displayEventModal = false;
    this.displayTravelModes = false;
    this.displayModalError = false;
    this.forceSaveEvent = false;
    this.scheduleModalError = '';
    this.selectedPriorLocation = 'home';
    this.travelModeArray = [];
    this.otherLocationDetails = new Location();
  }

  addEvent(eventId, eventTitle, eventStart, eventEnd): void {
    this.events.push({
      id: eventId,
      title: eventTitle,
      start: new Date(eventStart),
      end: new Date(eventEnd),
      color: colors.red,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      actions: this.eventActions
    });
    this.refresh.next();
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
        this.event.origin = Object.assign({}, this.otherLocationDetails);
        this.changeLocation();
        break;
    }
  }

  saveLocation(): void {
    this.profileService.saveLocationDetails(this.homeLocation, this.workLocation).subscribe((data) => {
      this.profileService.setLocationDetails(this.homeLocation, this.workLocation);
      $('#locationModal').modal('toggle');
    });
  }

  openEventModal(): void {
    this.displayEventModal = true;
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
    this.eventsService.saveEvent(this.eventPayload, this.forceSaveEvent).subscribe((data) => {
      if (data.errorMessage && data.errorMessage === 'Conflict') {
        this.displayModalError = true;
        this.forceSaveEvent = true;
        this.scheduleModalError = 'This event conflicts with another scheduled event. Click Continue to proceed anyways.';
      } else {
        this.addEvent(data, this.eventPayload.eventTitle, this.eventPayload.eventStart, this.eventPayload.eventEnd);
        $('#eventModal').modal('hide');
        this.initEvent();
        this.displaySuccessMessage('Event has been added successfully');
      }
    });
  }

  displaySuccessMessage(message): void {
    this.successMessage = message;
    this.displaySuccess = true;
    const timeoutId = setTimeout(() => {
      this.displaySuccess = false;
      clearTimeout(timeoutId);
    }, 3000);
  }

  changeLocation(): void {
    this.displayTravelModes = false;
    this.event.travelMode = null;
    this.travelModeArray = [];
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

  changePreviousLocation(): void {
    this.displayTravelModes = false;
    this.event.travelMode = null;
    // reinitialing
    this.travelModeArray = [];
    switch (this.selectedPriorLocation) {
      case 'home':
        this.event.origin = this.homeLocation;
        this.changeLocation();
        break;
      case 'work':
        this.event.origin = this.workLocation;
        this.changeLocation();
        break;
    }
  }

  changeStartDate(): void {
    if (this.event.eventStart > this.event.eventEnd) {
      this.event.eventEnd = moment(this.event.eventStart).add(1, 'hours');
    }
  }

  closeDeleteModal(): void {
    $('#deleteModal').modal('toggle');
  }

  deleteEvent(): void {
    this.closeDeleteModal();
    this.eventsService.deleteEvent(this.deleteEventId).subscribe(() => {
      for (let i = 0; i < this.events.length; i++) {
        if (this.events[i].id === this.deleteEventId) {
          this.events.splice(i, 1);
          this.refresh.next();
          this.activeDayIsOpen = false;
          this.displaySuccessMessage('Event has been deleted successfully');
        }
      }
    });
  }

  dayClicked({ date, events }: { date: Date; events: any[] }): void {
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

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();
  }
}
