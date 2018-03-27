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
  forceSaveEvent = false;
  repeatEdit = false;
  displaySuccess = false;
  scheduleModalError = '';
  successMessage = '';
  locationTypes = ['home', 'work', 'prior event location', 'other'];
  selectedPriorLocation = 'home';
  travelModeArray = [];
  datesArray = [];
  deleteEventId = '';
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
            if(this.event.isRepeat){
              this.repeatEdit=true;
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
    this.maxRepeatDate.setMonth(this.maxRepeatDate.getMonth() + 2);
    // const userProfile = this.profileService.getUserProfile();
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
    this.repeatEdit = false;
    this.scheduleModalError = '';
    this.selectedPriorLocation = 'home';
    this.eventType = 'save';
    this.travelModeArray = [];
    this.datesArray = [];
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

  saveEvent(): void {

    this.eventPayload = Object.assign({}, this.event);
    if(this.profileService.userProfile.lunchStartTime != "Not Set"){
      console.log(this.profileService.userProfile.lunchStartTime);
      this.lunchStart=this.setDateObject(this.lunchStart, this.event.eventStart, this.profileService.userProfile.lunchStartTime);
      this.lunchEnd=this.setDateObject(this.lunchEnd,this.event.eventStart, this.profileService.userProfile.lunchEndTime);
      this.eventPayload.lunchStart = new Date(this.lunchStart).getTime();
      this.eventPayload.lunchEnd = new Date(this.lunchEnd).getTime();
    }
    if (this.profileService.userProfile.dinnerStartTime != "Not Set"){
      this.dinnerStart=this.setDateObject(this.dinnerStart, this.event.eventStart, this.profileService.userProfile.dinnerStartTime);
      this.dinnerEnd=this.setDateObject(this.dinnerEnd, this.event.eventStart, this.profileService.userProfile.dinnerEndTime);
      this.eventPayload.dinnerStart = new Date(this.dinnerStart).getTime();
      this.eventPayload.dinnerEnd = new Date(this.dinnerEnd).getTime();
    }

    this.eventPayload.eventStart = new Date(this.eventPayload.eventStart).getTime();
    this.eventPayload.eventEnd = new Date(this.eventPayload.eventEnd).getTime();

    if (this.event.isRepeat){
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
          default :
                  this.scheduleModalError = 'This Event is Conflicting. Click Save to proceed anyways.';
                  break;
        }
        this.displayModalError = true;
        this.forceSaveEvent = true;
      } else {
        if (this.eventType === 'edit') {
          switch (this.event.repeatEditChoice){
            case "Current Event":
              this.event.repeatPreference=false;
              this.editEvent(this.event);
              break;
            case "Future Repeated Events(Including this event)":
              break;
            case "All Repeated Events":
              break;
            default:
              this.editEvent(this.event);
              break;
          }
        } else {
          this.eventPayload.id = data;
            if (this.event.isRepeat){
              this.repeatCheck(this.event);
            }
            else{
              $('#eventModal').modal('toggle');
              this.displaySuccessMessage('Event has been added successfully');
              this.initEvent();
            }
        }
      }
    });
  }

  setDateObject(target: Date, source:Date, time: string): Date{
    target.setDate(source.getDate());
    target.setMonth(source.getMonth());
    target.setFullYear(source.getFullYear());
    let split = time.split(":");
    if(split[1].slice(2,4) == "pm"){
      split[0]= (parseInt(split[0]) + 12).toString();
    }
    target.setHours(parseInt(split[0]));
    target.setMinutes(parseInt(split[1].slice(0,2)));
    return target;
  }

  editEvent(event: any): void{
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


  repeatCheck(event: any): void{
    if(this.event.repeatPreference){
      switch(this.event.repeatPreference){
        case 'Daily':
          const i = this.event.eventStart;
          while (i < this.event.repeatMax) {
            this.datesArray.push(new Date(i.setDate(i.getDate() + 1)));
          }
          break;
        case 'Weekly':
          const j = this.event.eventStart;
          j.setDate(j.getDate() + 7);
          while (j < this.event.repeatMax) {
            this.datesArray.push(new Date(j));
            j.setDate(j.getDate() + 7);
          }
          break;
      }
    }
    else{
      $('#eventModal').modal('hide');
      this.initEvent();
    }

    if(this.datesArray.length > 0){
          let i = 0 ;
          let count = 0;
          while (i < this.datesArray.length){
            this.eventPayload.eventStart = new Date(this.datesArray[i]).getTime();
            this.eventPayload.eventEnd = this.eventPayload.eventStart + this.difference;
            if(this.profileService.userProfile.lunchStartTime != "Not Set"){
              this.eventPayload.lunchStart = this.setDateObject(this.lunchStart, this.datesArray[i], this.profileService.userProfile.lunchStartTime).getTime();
              this.eventPayload.lunchEnd = this.setDateObject(this.lunchEnd, this.datesArray[i], this.profileService.userProfile.lunchEndTime).getTime();
            }
            if(this.profileService.userProfile.dinnerStartTime != "Not Set"){
              this.eventPayload.dinnerStart = this.setDateObject(this.dinnerStart, this.datesArray[i], this.profileService.userProfile.dinnerStartTime).getTime();
              this.eventPayload.dinnerEnd = this.setDateObject(this.dinnerEnd, this.datesArray[i], this.profileService.userProfile.dinnerEndTime).getTime();
            }
            this.displayModalSave = true;
            this.eventsService.saveEvent(this.eventPayload, this.forceSaveEvent, 'save', this.event.id).subscribe((data) => {
              count ++;
              if (data.errorMessage) {
                switch (data.errorMessage.code) {
                  case 1:
                    this.scheduleModalError = 'Maximum daily walking distance of '
                      + data.errorMessage.value + ' miles will be exceeded on the event starting at '+ new Date(data.errorMessage.startTime) +
                      '. Click Save to proceed anyways.';
                    break;
                  case 2:
                    this.scheduleModalError = 'Maximum daily bicycling distance of '
                      + data.errorMessage.value + ' miles will be exceeded on the event starting at '+ new Date(data.errorMessage.startTime) +
                      ' . Click Save to proceed anyways.';
                    break;
                  case 3:
                    this.scheduleModalError = 'The event  starting at ' + new Date(data.errorMessage.startTime) +
                    ' conflicts with another meeting. Click Save to proceed anyways.';
                    break;
                  case 4:
                    this.scheduleModalError = 'The travel time for The event  starting at ' + new Date(data.errorMessage.startTime) + ' conflicts with event: '
                      + data.errorMessage.value + '. Click Save to proceed anyways.';
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
              if(count == this.datesArray.length ){
                $('#eventModal').modal('hide');
                this.initEvent();
                this.displaySuccessMessage('All the Events have been added successfully');
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

  updateFlag(): void{
    this.forceSaveEvent = false;
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
