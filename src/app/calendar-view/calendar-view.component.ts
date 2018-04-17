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
import { FormGroup, FormControl } from '@angular/forms';

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
  maxRepeatDate: Date = new Date();
  repeatMax: Date = new Date();
  viewDate: Date = new Date();
  lunchStart: Date = new Date();
  lunchEnd: Date = new Date();
  dinnerStart: Date = new Date();
  dinnerEnd: Date = new Date();
  activeDayIsOpen = false;
  displayDeleteModal: boolean;
  displayEventModal = false;
  displayRepeatEventModal = false;
  displayTravelModes = false;
  repeatEvents = false;
  displayModalError = false;
  displayModalSave = false;
  repeatDeleteChoice: any;
  forceSaveEvent = false;
  repeatEdit = false;
  deletePrompt = true;
  repeatDelete = false;
  displaySuccess = false;
  startDifference = 0;
  endDifference = 0;
  displayError = false;
  scheduleModalError = '';
  successMessage = '';
  errorMessage = '';
  locationTypes = ['home', 'work', 'prior event location', 'other'];
  selectedPriorLocation = 'home';
  travelModeArray = [];
  payloadArray = [];
  repeatPayload: any;
  datesArray = [];
  errorList = [];
  editArray = [];
  deleteArray = [];
  deleteEvent: any;
  ifSelected = false;
  difference: any;
  repeatCheckbox: any;
  modalData: {
    action: string;
    event: any;
  };
  currentEventId = '';
  eventType = 'save';
  events: any[] = [];
  midnight: any;
  refresh: Subject<any> = new Subject();


  eventActions: CalendarEventAction[] = [
    {
      label: '<i class="fas fa-edit"></i>',
      onClick: ({ event }: { event: any }): void => {
        for (let i = 0; i < this.events.length; i++) {
          $('#eventModal').modal('toggle');
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
            this.event.isRepeat = event.isRepeat;
            this.event.repeatMax = event.repeatMax;
            this.event.repeatPreference = event.repeatPreference;
            this.changeLocation();
            this.event.travelMode = event.travelMode.mode;
            this.selectedPriorLocation = 'other';
            if (this.event.isRepeat) {
              this.repeatEdit = true;
            }
            if (this.event.origin.place_id && this.event.origin.place_id === this.homeLocation.place_id) {
              this.selectedPriorLocation = 'home';
            }
            if (this.event.origin.place_id && this.event.origin.place_id === this.workLocation.place_id) {
              this.selectedPriorLocation = 'work';
            }
            break;
          }
        }
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: any }): void => {
        for (let i = 0; i < this.events.length; i++) {
          if (event.id === this.events[i].id && this.events[i].isRepeat == true) {
            this.repeatDelete = true;
            this.deletePrompt = false;
          }
        }
        $('#deleteModal').modal('toggle');
        this.deleteEvent = event;

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
    this.maxRepeatDate.setMonth(this.maxRepeatDate.getMonth() + 2);
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
    this.event = {};
    this.event.eventStart = new Date();
    this.event.eventEnd = moment().add(1, 'hours');
    this.displayEventModal = false;
    this.displayRepeatEventModal = false;
    this.displayTravelModes = false;
    this.repeatEvents = false;
    this.displayModalError = false;
    this.displayModalSave = false;
    this.ifSelected = false;
    this.forceSaveEvent = false;
    this.repeatDeleteChoice = '';
    this.repeatEdit = false;
    this.deletePrompt = true;
    this.repeatDelete = false;
    this.scheduleModalError = '';
    this.selectedPriorLocation = 'home';
    this.eventType = 'save';
    this.travelModeArray = [];
    this.midnight = null;
    this.datesArray = [];
    this.editArray = [];
    this.deleteArray = [];
    this.otherLocationDetails = new Location();
    this.eventsService.fetchEvents().subscribe((eventList) => {
      this.eventsLoaded = true;
      this.events = [];
      if(eventList.Items){
        for (let i = 0; i < eventList.Items.length; i++) {
          this.addEvent(eventList.Items[i]);
        }
      }
    });
  }

  opendeletePrompt(): void {
    this.deletePrompt = true;
    console.log(this.repeatDeleteChoice);
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
      repeatMax: new Date(event.repeatMax),
      isRepeat: event.isRepeat,
      repeatPreference: event.repeatPreference,
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

  saveEvent(form): void {
    this.eventPayload = Object.assign({}, this.event);
    if (this.profileService.userProfile.lunchStartTime && this.profileService.userProfile.lunchStartTime !== 'Not_Set') {
      this.lunchStart = this.setDateObject(this.lunchStart, this.event.eventStart, this.profileService.userProfile.lunchStartTime);
      this.lunchEnd = this.setDateObject(this.lunchEnd, this.event.eventStart, this.profileService.userProfile.lunchEndTime);
      this.eventPayload.lunchStart = new Date(this.lunchStart).getTime();
      this.eventPayload.lunchEnd = new Date(this.lunchEnd).getTime();

    }
    if (this.profileService.userProfile.dinnerStartTime && this.profileService.userProfile.dinnerStartTime !== 'Not_Set') {
      this.dinnerStart = this.setDateObject(this.dinnerStart, this.event.eventStart, this.profileService.userProfile.dinnerStartTime);
      this.dinnerEnd = this.setDateObject(this.dinnerEnd, this.event.eventStart, this.profileService.userProfile.dinnerEndTime);
      this.eventPayload.dinnerStart = new Date(this.dinnerStart).getTime();
      this.eventPayload.dinnerEnd = new Date(this.dinnerEnd).getTime();
    }
    this.midnight = this.setMidnight(this.event.eventStart);
    this.eventPayload.midnight = new Date(this.midnight).getTime();
    this.eventPayload.eventStart = new Date(this.event.eventStart).getTime();
    this.eventPayload.eventEnd = new Date(this.event.eventEnd).getTime();

    if (this.event.isRepeat) {
      this.eventPayload.repeatMax = new Date(this.eventPayload.repeatMax).getTime();
    }
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
    if (this.eventType == 'edit' && this.event.isRepeat) {
      if (this.event.repeatEditChoice == 'Current Event') {
        this.eventPayload.isRepeat = false;
      }
    }
    this.eventsService.saveEvent(this.eventPayload, this.forceSaveEvent, this.eventType, this.event.id).subscribe((data) => {
      if (data.errorMessage) {
        switch (data.errorMessage.code) {
          case 1:
            this.scheduleModalError = 'Maximum daily walking distance of '
              + data.errorMessage.value + ' miles will be exceeded. Click Save to proceed anyways.';
            break;
          case 2:
            this.scheduleModalError = 'Maximum daily bicycling distance of '
              + data.errorMessage.value + ' miles will be exceeded. Click Save to proceed anyways.';
            break;
          case 3:
            this.scheduleModalError = 'This event directly conflicts with event: '
              + data.errorMessage.value + '. Click Save to proceed anyways.';
            break;
          case 4:
            this.scheduleModalError = 'The travel time for this event conflicts with event: '
              + data.errorMessage.value + '. Click Save to proceed anyways.';
            break;
          case 5:
            this.scheduleModalError = 'This event conflicts with the preferred Lunch Time Slot . Click Save to proceed anyways.';
            break;
          case 6:
            this.scheduleModalError = 'This event conflicts with the preferred Dinner Time Slot . Click Save to proceed anyways.';
            break;
          default:
            this.scheduleModalError = 'This Event is Conflicting. Click Save to proceed anyways.';
            break;
        }
        this.displayModalError = true;
        this.forceSaveEvent = true;
      } else {
        if (form) {
          form.reset();
          form.resetForm();
        }

        if (this.eventType === 'edit') {
          switch (this.event.repeatEditChoice) {
            case 'Current Event':
              this.event.repeatPreference = false;
              this.editEvent(this.event);
              break;
            case 'Future Repeated Events(Including this event)':
              for (let i = 0; i < this.events.length; i++) {
                if (this.events[i].id === this.event.id) {
                  this.editArray = this.checkFutureRepeatedEvents(this.events[i]);
                  this.startDifference = new Date(this.event.eventStart).getTime() - new Date(this.events[i].start).getTime();
                  this.endDifference = new Date(this.event.eventEnd).getTime() - new Date(this.events[i].end).getTime();
                  for (let i = 0; i < this.travelModeArray.length; i++) {
                    if (this.event.travelMode === this.travelModeArray[i].mode) {
                      this.event.travelMode = {
                        mode: this.travelModeArray[i].mode,
                        distance: this.travelModeArray[i].value.distance,
                        duration: this.travelModeArray[i].value.duration
                      };
                    }
                  }
                  break;
                }
              }
              this.saveEditEvents(this.editArray, this.event, this.startDifference, this.endDifference);
              break;
            case 'All Repeated Events':
              for (let i = 0; i < this.events.length; i++) {
                if (this.events[i].id === this.event.id) {
                  this.editArray = this.checkRepeatedEvents(this.events[i]);
                  this.startDifference = new Date(this.event.eventStart).getTime() - new Date(this.events[i].start).getTime();
                  this.endDifference = new Date(this.event.eventEnd).getTime() - new Date(this.events[i].end).getTime();
                  for (let i = 0; i < this.travelModeArray.length; i++) {
                    if (this.event.travelMode === this.travelModeArray[i].mode) {
                      this.event.travelMode = {
                        mode: this.travelModeArray[i].mode,
                        distance: this.travelModeArray[i].value.distance,
                        duration: this.travelModeArray[i].value.duration
                      };
                    }
                  }
                  break;
                }
              }
              this.saveEditEvents(this.editArray, this.event, this.startDifference, this.endDifference);
              break;
            default:
              if (this.event.isRepeat && this.deleteArray.length == 0) {
                this.repeatCheck(this.event);
              }
              else{
                this.editEvent(this.event);
              }
              break;
          }
        } else {
          this.eventPayload.id = data;
          if (this.event.isRepeat && this.deleteArray.length == 0) {
            this.repeatCheck(this.event);
          } else {
            $('#eventModal').modal('toggle');
            this.displaySuccessMessage('Event has been added successfully');
            this.initEvent();
          }
        }
      }
    });
  }

  setDateObject(target: Date, source: Date, time: string): Date {
    target.setDate(source.getDate());
    target.setMonth(source.getMonth());
    target.setFullYear(source.getFullYear());
    const split = time.split(':');
    if (split[1].slice(2, 4) === 'pm'&& parseInt(split[0]) != 12) {
      split[0] = (parseInt(split[0]) + 12).toString();
    }
    target.setHours(parseInt(split[0]));
    target.setMinutes(parseInt(split[1].slice(0, 2)));
    console.log(target);
    return target;
  }

  setMidnight(source:Date) :Date{
    let target = new Date();
    target.setDate(source.getDate());
    target.setMonth(source.getMonth());
    target.setFullYear(source.getFullYear());
    target.setHours(0);
    target.setMinutes(0);
    return target;
  }

  editEvent(event: any): void {
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].id === event.id) {
        this.events[i].title = event.eventTitle;
        this.events[i].start = event.eventStart;
        this.events[i].end = event.eventEnd;
        this.events[i].origin = event.origin;
        this.events[i].destination = event.destination;
        this.events[i].travelMode = this.eventPayload.travelMode;
        this.events[i].isRepeat = this.eventPayload.isRepeat;
      }
    }
    this.refresh.next();
    this.displaySuccessMessage('Event has been edited successfully');
    this.initEvent();
    $('#eventModal').modal('hide');
    this.activeDayIsOpen = false;
    this.fetchEvents();
  }

  checkFutureRepeatedEvents(event: any): any[] {
    const editArray = [];
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].id !== event.id &&
        this.events[i].title == event.title &&
        this.events[i].origin.place_id === event.origin.place_id &&
        this.events[i].destination.place_id === event.destination.place_id &&
        this.events[i].isRepeat) {
        if ((event.repeatPreference == 'Daily') &&
          (new Date(this.events[i].start).getTime() - new Date(event.repeatMax).getTime()) < 86400000 &&
          (new Date(this.events[i].start).getTime() > new Date(event.start).getTime()) &&
          (new Date(this.events[i].start).getTime() - new Date(event.start).getTime()) % 86400000 == 0
        ) {
          editArray.push(this.events[i]);
        }
      }
      if ((event.repeatPreference == 'Weekly') &&
        (new Date(this.events[i].start).getTime() - new Date(event.repeatMax).getTime()) < 86400000 &&
        (new Date(this.events[i].start).getTime() > new Date(event.start).getTime()) &&
        (new Date(this.events[i].start).getTime() - new Date(event.start).getTime()) % 604800000 == 0
      ) {
        editArray.push(this.events[i]);
      }
    }
    return editArray;
  }

  checkRepeatedEvents(event: any): any[] {
    const editArray = [];
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].id !== event.id &&
        this.events[i].title == event.title &&
        this.events[i].origin.place_id === event.origin.place_id &&
        this.events[i].destination.place_id === event.destination.place_id &&
        this.events[i].isRepeat) {
        if ((event.repeatPreference == 'Daily') &&
          (new Date(this.events[i].start).getTime() - new Date(event.repeatMax).getTime()) < 86400000 &&
          (new Date(this.events[i].end).getTime() > new Date().getTime()) &&
          (new Date(this.events[i].start).getTime() - new Date(event.start).getTime()) % 86400000 == 0
        ) {
          editArray.push(this.events[i]);
        }
      }
      if ((event.repeatPreference == 'Weekly') &&
        (new Date(this.events[i].start).getTime() - new Date(event.repeatMax).getTime()) < 86400000 &&
        (new Date(this.events[i].end).getTime() > new Date().getTime()) &&
        (new Date(this.events[i].start).getTime() - new Date(event.start).getTime()) % 604800000 == 0
      ) {
        editArray.push(this.events[i]);
      }
    }
    return editArray;
  }

  saveEditEvents(events: any, event: any, startDifference: any, endDifference: any): void {
    if (events.length > 0) {
      let i = 0;
      let eventStart = 0;
      let eventEnd = 0;
      let count = 0;
      let id = 0;
      while (i < events.length) {
        this.events[i].eventStart = this.events[i].start;
        this.events[i].eventEnd = this.events[i].end;
        eventStart = new Date(this.events[i].eventStart).getTime() + startDifference;
        eventEnd = new Date(this.events[i].eventEnd).getTime() + endDifference;
        id = this.events[i].id;
        this.events[i] = Object.assign({}, event);
        this.events[i].eventStart = eventStart;
        this.events[i].eventEnd = eventEnd;
        this.events[i].repeatMax = new Date(this.events[i].repeatMax).getTime();
        this.events[i].id = id;
        if (this.profileService.userProfile.lunchStartTime && this.profileService.userProfile.lunchStartTime != 'Not Set') {
          this.events[i].lunchStart = this.setDateObject(this.lunchStart, new Date(this.events[i].eventStart), this.profileService.userProfile.lunchStartTime).getTime();
          this.events[i].lunchEnd = this.setDateObject(this.lunchEnd, new Date(this.events[i].eventStart), this.profileService.userProfile.lunchEndTime).getTime();
        }
        if (this.profileService.userProfile.dinnerStartTime && this.profileService.userProfile.dinnerStartTime != 'Not Set') {
          this.events[i].dinnerStart = this.setDateObject(this.dinnerStart, new Date(this.events[i].eventStart), this.profileService.userProfile.dinnerStartTime).getTime();
          this.events[i].dinnerEnd = this.setDateObject(this.dinnerEnd, new Date(this.events[i].eventStart), this.profileService.userProfile.dinnerEndTime).getTime();
        }
            this.displayModalSave = true;
            this.eventsService.saveEvent(this.events[i], this.forceSaveEvent, 'edit', this.events[i].id).subscribe((data) => {
              count++;
              if (data.errorMessage) {
                switch (data.errorMessage.code) {
                  case 1:
                    this.scheduleModalError = 'Maximum daily walking distance of '
                      + data.errorMessage.value + ' miles will be exceeded. Click Save to proceed anyways.';
                    break;
                  case 2:
                    this.scheduleModalError = 'Maximum daily bicycling distance of '
                      + data.errorMessage.value + ' miles will be exceeded. Click Save to proceed anyways.';
                    break;
                  case 3:
                    this.scheduleModalError = 'This event directly conflicts with event: '
                      + data.errorMessage.value + '. Click Save to proceed anyways.';
                    break;
                  case 4:
                    this.scheduleModalError = 'The travel time for this event conflicts with event: '
                      + data.errorMessage.value + '. Click Save to proceed anyways.';
                    break;
                  case 5:
                    this.scheduleModalError = 'This event conflicts with the preferred Lunch Time Slot . Click Save to proceed anyways.';
                    break;
                  case 6:
                    this.scheduleModalError = 'This event conflicts with the preferred Dinner Time Slot . Click Save to proceed anyways.';
                    break;
                  default:
                    this.scheduleModalError = 'This Event is Conflicting. Click Save to proceed anyways.';
                    break;
                }
                $('#eventModal').modal('show');
                this.displayModalError = true;
                this.displayModalSave = false;
                this.forceSaveEvent = true;
              }
              else {
                this.eventPayload.id = data;
                this.refresh.next();
              }
              if (count == events.length) {
                $('#eventModal').modal('hide');
                this.initEvent();
                this.displaySuccessMessage('All the Events have been edited successfully');
              }
            });
            i++;
          }
    }

  }

  repeatCheck(event: any): void {
    if (this.event.repeatPreference) {
      switch (this.event.repeatPreference) {
        case 'Daily':
          let i = this.event.eventStart;
          while (i < this.event.repeatMax) {
            this.datesArray.push(new Date(i.setDate(i.getDate() + 1)));
          }
          break;
        case 'Weekly':
          let j = this.event.eventStart;
          while (j < this.event.repeatMax) {
              this.datesArray.push(new Date(j.setDate(j.getDate() + 7)));
          }
          break;
      }
    }
    else {
      $('#eventModal').modal('hide');
      this.initEvent();
    }

    if (this.datesArray.length > 0) {
      let i = 0;
      let count = 0;
      while (i < this.datesArray.length) {
        this.payloadArray[i] = Object.assign({}, this.event);
        this.payloadArray[i].eventStart = new Date(this.datesArray[i]).getTime();
        this.payloadArray[i].eventEnd = this.payloadArray[i].eventStart + this.difference;
        this.payloadArray[i].travelMode = this.eventPayload.travelMode;
        this.payloadArray[i].repeatMax = this.eventPayload.repeatMax;
        if (this.profileService.userProfile.lunchStartTime && this.profileService.userProfile.lunchStartTime != 'Not Set') {
          this.payloadArray[i].lunchStart = this.setDateObject(this.lunchStart, this.datesArray[i], this.profileService.userProfile.lunchStartTime).getTime();
          this.payloadArray[i].lunchEnd = this.setDateObject(this.lunchEnd, this.datesArray[i], this.profileService.userProfile.lunchEndTime).getTime();
        }
        if (this.profileService.userProfile.dinnerStartTime && this.profileService.userProfile.dinnerStartTime != 'Not Set') {
          this.payloadArray[i].dinnerStart = this.setDateObject(this.dinnerStart, this.datesArray[i], this.profileService.userProfile.dinnerStartTime).getTime();
          this.payloadArray[i].dinnerEnd = this.setDateObject(this.dinnerEnd, this.datesArray[i], this.profileService.userProfile.dinnerEndTime).getTime();
        }
        this.displayModalSave = true;
        this.eventsService.saveEvent(this.payloadArray[i], this.forceSaveEvent, 'save', this.event.id).subscribe((data) => {
          count++;
          if (data.errorMessage) {
            this.deleteArray.push(this.payloadArray[count - 1]);
            switch (data.errorMessage.code) {
              case 1:
                this.scheduleModalError = 'Maximum daily walking distance of '
                  + data.errorMessage.value + ' miles will be exceeded. Click Save to proceed anyways.';
                break;
              case 2:
                this.scheduleModalError = 'Maximum daily bicycling distance of '
                  + data.errorMessage.value + ' miles will be exceeded. Click Save to proceed anyways.';
                break;
              case 3:
                this.scheduleModalError = 'This event directly conflicts with event: '
                  + data.errorMessage.value + '. Click Save to proceed anyways.';
                break;
              case 4:
                this.scheduleModalError = 'The travel time for this event conflicts with event: '
                  + data.errorMessage.value + '. Click Save to proceed anyways.';
                break;
              case 5:
                this.scheduleModalError = 'This event conflicts with the preferred Lunch Time Slot . Click Save to proceed anyways.';
                break;
              case 6:
                this.scheduleModalError = 'This event conflicts with the preferred Dinner Time Slot . Click Save to proceed anyways.';
                break;
              default:
                this.scheduleModalError = 'This Event is Conflicting. Click Save to proceed anyways.';
                break;
            }
            $('#eventModal').modal('show');
            this.displayModalError = true;
            this.displayModalSave = false;
            this.forceSaveEvent = true;
            this.event= Object.assign({},this.payloadArray[count - 1] );
            this.event.eventStart = new Date(this.event.eventStart);
            this.event.eventEnd = new Date(this.event.eventEnd);
            this.event.travelMode = this.payloadArray[count-1].travelMode.mode;
            this.event.repeatMax = new Date(this.payloadArray[count - 1].repeatMax);
          }
          else {
            this.eventPayload.id = data;
            this.refresh.next();
          }
          if (count == this.datesArray.length){
            if(this.deleteArray.length < 1){
              $('#eventModal').modal('hide');
              this.initEvent();
              this.displaySuccessMessage('All the Events have been added successfully');
            }
            else{
              console.log(this.deleteArray);
            }
          }
        });
        i++;
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

  displayErrorMessage(message): void {
    this.errorMessage = message;
    this.displayError = true;
    const timeoutId = setTimeout(() => {
      this.displayError = false;
      clearTimeout(timeoutId);
    }, 3000);
  }

  openRepeatBlock(element: HTMLInputElement): void {
    console.log(this.event.isRepeat);
    this.repeatCheckbox = element;
    if (element.checked) {
      this.repeatEvents = true;
    }
    else {
      this.repeatEvents = false;
      this.ifSelected = false;
      this.event.repeatPreference = undefined;
      this.event.repeatMax = undefined;
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
    this.forceSaveEvent = false;
  }

  updateFlag(): void {
    this.forceSaveEvent = false;
  }

  closeDeleteModal(): void {
    $('#deleteModal').modal('toggle');
  }


  deleteEvents(): void {
    this.closeDeleteModal();
    switch (this.repeatDeleteChoice) {
      case 'Current Event':
        this.eventDeletion(this.deleteEvent.id);
        break;
      case 'All Repeated Events':
        this.eventDeletion(this.deleteEvent.id);
        this.deleteArray = this.checkRepeatedEvents(this.deleteEvent);
        if (this.deleteArray.length > 0) {
          let i = 0;
          while (i < this.deleteArray.length) {
            this.eventDeletion(this.deleteArray[i].id);
            i++;
          }
        }
        break;
      default:
        this.eventDeletion(this.deleteEvent.id);
        break;
    }

  }

  eventDeletion(id: any): void {
    this.eventsService.deleteEvent(id).subscribe(() => {
      for (let i = 0; i < this.events.length; i++) {
        if (this.events[i].id === this.deleteEvent.id) {
          this.refresh.next();
          this.activeDayIsOpen = false;
          this.initEvent();
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

  enableMaxDateSelection(): void {
    this.ifSelected = true;
  }


  closeRepeatEditModal(): void {
    console.log(this.event.repeatEdit);
    $('#eventModal').modal('show').focus();
    $('#repeatEditModal').modal('hide');
  }


  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {

    if (isPast(newStart)) {
      // console.log("DRAGGED INTO PAST");
      this.displayErrorMessage('Cannot Drag Event Onto Past Date.');
    }
    else {
      const eventCopy: any = Object.assign({}, event);
      this.event.id = eventCopy.id;
      this.event.eventTitle = eventCopy.title;
      this.event.eventStart = new Date(newStart);
      this.event.eventEnd = new Date(newEnd);
      this.event.origin = eventCopy.origin;
      this.event.otherLocation = eventCopy.origin.formatted_address;
      this.event.destination = eventCopy.destination;
      this.event.eventLocation = eventCopy.destination.formatted_address;
      this.eventType = 'edit';
      this.event.travelMode = eventCopy.travelMode;
      this.saveEvent(null);
    }

  }
}
