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
  addHours,
  isPast
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
  event: any;
  otherLocationDetails: Location;
  eventStartMinDate: Date = new Date();
  viewDate: Date = new Date();
  activeDayIsOpen = false;
  displayDeleteModal: boolean;
  displayEventModal = false;
  displayRepeatEventModal = false;
  displayTravelModes = false;
  repeatEvents = false;
  displayModalError = false;
  forceSaveEvent = false;
  displaySuccess = false;
  scheduleModalError = '';
  successMessage = '';
  locationTypes = ['home', 'work', 'prior event location', 'other'];
  selectedPriorLocation = 'home';
  travelModeArray = [];
  deleteEventId = '';
  date = [];
  difference: any;
  repeatCheckbox: any;
  dates = [{ value: null }];

  modalData: {
    action: string;
    event: any;
  };

  currentEventId = '';
  eventType = 'save';
  events: any[] = [];
  refresh: Subject<any> = new Subject();


  eventActions: CalendarEventAction[] = [
    {
      label: '<i class="fas fa-edit"></i>',
      onClick: ({ event }: { event: any }): void => {
        for (let i = 0; i < this.events.length; i++) {
          if (event.id === this.events[i].id) {
            this.event.id = event.id;
            this.event.eventTitle = event.title;
            this.event.eventStart = event.start;
            this.event.eventEnd = event.end;
            this.event.origin = event.origin;
            this.event.otherLocation = event.origin.formatted_address;
            this.event.destination = event.destination;
            this.event.eventLocation = event.destination.formatted_address;
            this.eventType = 'edit';
            this.changeLocation();
            this.event.travelMode = event.travelMode.mode;
            this.selectedPriorLocation = 'other';
            if (this.event.origin.place_id && this.event.origin.place_id === this.homeLocation.place_id) {
              this.selectedPriorLocation = 'home';
            }
            if (this.event.origin.place_id && this.event.origin.place_id === this.workLocation.place_id) {
              this.selectedPriorLocation = 'work';
            }
            $('#eventModal').modal('toggle');
            break;
          }
        }
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
      this.router.navigate(['/home']);
    }
  }

  ngOnInit() {

    this.displayDeleteModal = false;
    if (!this.profileService.userProfile || !this.profileService.userProfile.homeLocation) {
      this.profileService.fetchUserProfile().subscribe((locationDetails) => {
        console.log(locationDetails);
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
    this.fetchEvents();
    this.initEvent();
  }

  fetchEvents(): void {
    this.eventsService.fetchEvents().subscribe((eventList) => {
      this.events = [];
      this.eventsLoaded = true;
      for (let i = 0; i < eventList.Items.length; i++) {
        this.addEvent(eventList.Items[i]);
      }
    });
  }

  initEvent(): void {
    console.log(this.profileService);
    this.dates = [{ value: null }];
    this.event = {};
    this.event.eventStart = new Date();
    this.event.eventEnd = moment().add(1, 'hours');
    this.displayEventModal = false;
    this.displayRepeatEventModal = false;
    this.displayTravelModes = false;
    this.repeatEvents = false;
    this.displayModalError = false;
    this.forceSaveEvent = false;
    this.scheduleModalError = '';
    this.selectedPriorLocation = 'home';
    this.eventType = 'save';
    this.travelModeArray = [];
    this.otherLocationDetails = new Location();
    this.eventsService.fetchEvents().subscribe((eventList) => {
      this.eventsLoaded = true;
      this.events = [];
      for (let i = 0; i < eventList.Items.length; i++) {
        this.addEvent(eventList.Items[i]);
      }
    });
  }

  addEvent(event): void {
    this.events.push({
      id: event.id,
      title: event.eventTitle,
      start: new Date(event.eventStart),
      end: new Date(event.eventEnd),
      color: colors.red,
      origin: event.origin,
      destination: event.destination,
      travelMode: event.travelMode,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      actions: this.getEventActions(event.eventEnd)
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

  saveEvent(): void {
    this.eventPayload = Object.assign({}, this.event);
    this.eventPayload.eventStart = new Date(this.eventPayload.eventStart).getTime();
    this.eventPayload.eventEnd = new Date(this.eventPayload.eventEnd).getTime();
    this.difference = this.eventPayload.eventEnd - this.eventPayload.eventStart;
    for (let i = 0; i < this.travelModeArray.length; i++) {
      if (this.eventPayload.travelMode === this.travelModeArray[i].mode) {
        this.eventPayload.travelMode = {
          mode: this.travelModeArray[i].mode,
          distance: this.travelModeArray[i].value.distance,
          duration: this.travelModeArray[i].value.duration
        };
      }
    }
    this.eventsService.saveEvent(this.eventPayload, this.forceSaveEvent, this.eventType, this.event.id).subscribe((data) => {
      if (data.errorMessage && data.errorMessage === 'Conflict') {
        this.displayModalError = true;
        this.forceSaveEvent = true;
        this.scheduleModalError = 'This event conflicts with another scheduled event. Click Save to proceed anyways.';
      } else {
        if (this.eventType === 'edit') {
          for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].id === this.event.id) {
              this.events[i].title = this.event.eventTitle;
              this.events[i].start = this.event.eventStart;
              this.events[i].end = this.event.eventEnd;
              this.events[i].origin = this.event.origin;
              this.events[i].destination = this.event.destination;
              this.events[i].travelMode = this.eventPayload.travelMode;
            }
          }
          this.refresh.next();
          this.displaySuccessMessage('Event has been edited successfully');
        } else {
          this.eventPayload.id = data;
          this.displaySuccessMessage('Event has been added successfully');
        }
        $('#eventModal').modal('hide');
        this.initEvent();
        this.activeDayIsOpen = false;
        this.fetchEvents();
      }
    });

    if (this.dates.length > 1) {
      for (let i = 0; i < this.dates.length; i++) {
        this.eventPayload.eventStart = new Date(this.dates[i].value).getTime();
        this.eventPayload.eventEnd = this.eventPayload.eventStart + this.difference;
        this.eventsService.saveEvent(this.eventPayload, this.forceSaveEvent, this.eventType, this.event.id).subscribe((data) => {
          if (data.errorMessage && data.errorMessage === 'Conflict') {
            this.displayModalError = true;
            this.forceSaveEvent = true;
            this.scheduleModalError = 'This event conflicts with another scheduled event. Click Continue to proceed anyways.';
          } else {
            this.eventPayload.id = data;
            this.refresh.next();
            this.displaySuccessMessage('Event has been added successfully');
            this.initEvent();
          }
        });
      }
    }
  }

  handleEvent(action: string, event: any): void {

    this.modalData = { event, action };
    this.modal.open(this.modalContent, { size: 'lg' });
  }

  openEventModal(): void {
    this.displayEventModal = true;
  }
  displaySuccessMessage(message): void {
    this.successMessage = message;
    this.displaySuccess = true;
    const timeoutId = setTimeout(() => {
      this.displaySuccess = false;
      clearTimeout(timeoutId);
    }, 3000);
  }

  openRepeatEventModal(element: HTMLInputElement): void {
    this.repeatCheckbox = element;
    if (element.checked) {
      $('#repeatEventsModal').modal('toggle');
    }
    else {
      this.dates = [{ value: null }];
    }
  }

  closeRepeatModal(): void {
    this.repeatCheckbox.checked = false;
    $('#repeatEventsModal').modal('hide');
  }

  repeatEvent(): void {
    console.log(this.dates);
    $('#repeatEventsModal').modal('hide');
  }

  triggerRepeat(): void {
    this.repeatEvents = true;
  }

  addNewChoice(temp: Date): void {
    this.dates.push({ value: null });
  }

  removeChoice(temp: Date): void {
    if (this.dates.length > 1) {
      for (let i = 0; i < this.dates.length; i++) {
        if (this.dates[i].value === temp) {
          this.dates.splice(i, 1);
          break;
        }
      }
    } else {
      this.dates = [{ value: null }];
    }
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
        this.repeatEvents = true;
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
          break;
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

  getEventActions(eventEndTime): CalendarEventAction[] {
    if (isPast(eventEndTime)) {
      return [];
    } else { return this.eventActions; }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    const eventCopy: any = Object.assign({}, event);
    this.event.id = eventCopy.id;
    this.event.eventTitle = eventCopy.title;
    this.event.eventStart = new Date(newStart).getTime();
    this.event.eventEnd = new Date(newEnd).getTime();
    this.event.origin = eventCopy.origin;
    this.event.otherLocation = eventCopy.origin.formatted_address;
    this.event.destination = eventCopy.destination;
    this.event.eventLocation = eventCopy.destination.formatted_address;
    this.eventType = 'edit';
    this.event.travelMode = eventCopy.travelMode;
    this.saveEvent();
  }
}
