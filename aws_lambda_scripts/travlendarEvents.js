var moment = require('moment');
var aws = require('aws-sdk');
const doc = require("dynamodb-doc");
const dynamo = new doc.DynamoDB();

var lambda = new aws.Lambda({
  region: 'us-west-2'
});
var username = "";

exports.handler = (event, context, callback) => {

  function saveEvent(eventLeaveTime) {
    var id = new Date().getTime() + "_" + username
    if(event.body.eventDetails.isRepeat){
      var payload = {
        TableName: "user_events",
        Item: {
          "id": id,
          "username": username,
          "eventStart": event.body.eventDetails.eventStart,
          "eventEnd": event.body.eventDetails.eventEnd,
          "eventTitle": event.body.eventDetails.eventTitle,
          "origin": event.body.eventDetails.origin,
          "destination": event.body.eventDetails.destination,
          "travelMode": event.body.eventDetails.travelMode,
          "repeatMax" : event.body.eventDetails.repeatMax,
          "isRepeat" : event.body.eventDetails.isRepeat,
          "repeatPreference" : event.body.eventDetails.repeatPreference,
          "eventLeaveTime":eventLeaveTime

        }
      }
    }

    else {
      var payload = {
        TableName: "user_events",
        Item: {
          "id": id,
          "username": username,
          "eventStart": event.body.eventDetails.eventStart,
          "eventEnd": event.body.eventDetails.eventEnd,
          "eventTitle": event.body.eventDetails.eventTitle,
          "origin": event.body.eventDetails.origin,
          "destination": event.body.eventDetails.destination,
          "travelMode": event.body.eventDetails.travelMode,
          "isRepeat" : false,
          "eventLeaveTime":eventLeaveTime

        }
      }
    }
    
    var end = moment().endOf('day').unix()*1000;
    
    if(event.body.eventDetails.eventStart < end){
      createCronJob(payload.Item);
    }


    dynamo.putItem(payload, function (err, data) {
      if (err) {
        context.fail(err);
      } else {
        context.succeed(id);
      }
    });
  }
  
  function createCronJob(scheduleItem) {
        var scheduledDate = moment.unix(scheduleItem.eventLeaveTime/1000);
        var cloudwatchevents = new aws.CloudWatchEvents();

        var scheduleExpression = "cron("+
            scheduledDate.minute() + " " + 
            scheduledDate.hours() + " " +
            scheduledDate.date() + " " +
            (scheduledDate.month() + 1) + " " +
            "? " +
            scheduledDate.year() + ")";
            

        var endCronParams = {
            Name: 'notification_for_' + scheduleItem.eventTitle.replace(/\s/g,'') + scheduleItem.eventStart,
            Description: 'scheduling notification for an individual event',
            ScheduleExpression: scheduleExpression,
            State: "ENABLED"
        };

        cloudwatchevents.putRule(endCronParams, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                var lambda = new aws.Lambda();
                var params = {
                    Action: "lambda:InvokeFunction",
                    FunctionName: "sendPushNotification",
                    Principal: "events.amazonaws.com",
                    SourceArn: data.RuleArn,
                    StatementId: "NID" + scheduleItem.eventTitle.replace(/\s/g,'') + scheduleItem.eventStart
                };
                lambda.addPermission(params, function (err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else {
                        var input = {
                            "operation": "scheduleCron",
                            "eventDetails": scheduleItem,
                            "ruleToDelete":{
                                "ruleName": 'notification_for_' + scheduleItem.eventTitle.replace(/\s/g,'') + scheduleItem.eventStart,
                                "policyId": "NID" + scheduleItem.eventTitle.replace(/\s/g,'') + scheduleItem.eventStart
                            }
                        }
                        var params = {
                            Rule: 'notification_for_' + scheduleItem.eventTitle.replace(/\s/g,'') + scheduleItem.eventStart,
                            Targets: [{
                                Arn: 'arn:aws:lambda:us-west-2:016911789346:function:sendPushNotification',
                                Id: 'sendPushNotification',
                                Input: JSON.stringify(input)
                            }]
                        };
                        cloudwatchevents.putTargets(params, function (err, data) {
                            if (err) console.log(err, err.stack);
                        });
                    }
                });
            }
        });
    }

  function fetchEvents() {
    var payload = {
      TableName: "user_events",
      IndexName: "username-index",
      KeyConditionExpression: "username = :u",
      ExpressionAttributeValues: {
        ":u": username
      }
    };
    dynamo.query(payload, function (err, data) {
      if (err) {
        context.fail(err);
      } else {
        context.succeed(data);
      }
    })
  }

  function lunchConflicts(lunchData, lunchStart, lunchEnd) {
    if (lunchData == null || lunchData.Items.length == 0){
      return [false, null];
    }
    var itemList = lunchData.Items;
    var lunchOverlapMeetings = [];

    for (var i = 0; i < itemList.length; i++) {
      var item_start_time = itemList[i].eventStart;
      var item_end_time = itemList[i].eventEnd;

      var min = Math.min(lunchStart, item_start_time);
      var max = Math.max(lunchEnd, item_end_time);
   
      if ((max - min) < ((lunchEnd - lunchStart) + (item_end_time - item_start_time))) {
        lunchOverlapMeetings.push(itemList[i]);
      }
    }
    return lunchOverlapMeetings;

  }
  
  function getOrderedMeetings(meetingList) {
    var temp = null;
    for (var i=0; i<meetingList.length; i++) {
      for (var j=0; j<meetingList.length-i-1; j++) {
        if (meetingList[j].eventStart > meetingList[j+1].eventStart) {
          temp = meetingList[j];
          meetingList[j] = meetingList[j+1];
          meetingList[j+1] = temp;
        }
      }
    }
    return meetingList;
  }

  function isLunchPossible(lunchTimeMeetings, lunchStart, lunchEnd) {
    // Loop through lunchTimeMeetings 
    // if event is last event and lunchEnd > eventEnd --> check if lunchEnd-eventEnd >= 30 ==> return true
    // if not return false
    // check if eventStart-LunchStart >= 30 ==> return true
    // if not modify lunchStart to eventEnd
    if (lunchTimeMeetings == null || lunchTimeMeetings.length == 0) {
      return true;
    }
    var LUNCH_TIME = 30*60*1000 ;    //30 minute lunch time
    var itemList = getOrderedMeetings(lunchTimeMeetings);
    for (var i = 0; i < itemList.length; i++) {
      if (i == itemList.length - 1) {
        if (lunchEnd > itemList[i].eventEnd && lunchEnd - itemList[i].eventEnd > LUNCH_TIME) {
          return true;
        }
      }
      if (itemList[i].eventStart - lunchStart >= LUNCH_TIME) {
        return true;
      }
      else {
        lunchStart = itemList[i].eventEnd;
      }

    }
    return false;
  }

  function getDurationFromDistanceAPIInMins(startlocation, endLocation,mode){
    return 3000
    //     var AWS = require("aws-sdk");

    //         AWS.config.update({
    //         region: "us-west-2"
    //         });
    //     var aws = require('aws-sdk');
    //     var params = {"start_placeid": ["place_id:"+startlocation],
    //          "end_placeid" : ["place_id:"+endLocation],
    //          "mode": mode
    //          };

    //     var lambda = new aws.Lambda({
    //         region: 'us-west-2'
    //     });

    // lambda.invoke({
    //   FunctionName: 'getLocationInformation',
    //   Payload: JSON.stringify(params, null, null) // pass params
    // }, function(error, data) {

    //   if (error) {
    //     return 0;
    //   }

    //  // var response = data
    //   var response = data.Payload;
    //   if (data ==null || data.Payload == null){
    //       return 0;
    //   }
    //   var res = JSON.parse(response)
    //   var result = 0;

    //   if (res.status == 'Ok' && res.result[0].status == 'Ok' ){
    //              result = res.result[0].duration_value;
    //          }

    // return result;
    // });
  }

  // This method will consider only two location for overlapping
  function isConflictPresentForTwoLocations(eventStart1, eventEnd1, eventStart2, eventEnd2){

    var min = Math.min(eventStart1, eventStart2);
    var max = Math.max(eventEnd1, eventEnd2);
    if ((max - min) < ((eventEnd1 - eventStart1) + (eventEnd2 - eventStart2))) {
      return true;
    }
    return false;
  }

  // THis method looks through the list to calculate the overlapping conditions
  function isConflictPresent(data, eventID, eventStart, eventEnd) {
    if (data == null || data.Items.length == 0){
      return [false, null, null, null];
    }
    var itemList = data.Items
    var isMeetingOverlaps = false

    for (var i = 0; i < itemList.length; i++) {
      if(itemList[i].id == eventID)
        continue;
      var item_start_time = itemList[i].eventStart;
      var item_end_time = itemList[i].eventEnd;

      var min = Math.min(eventStart, item_start_time)
      var max = Math.max(eventEnd, item_end_time)
      if ((max - min) < ((eventEnd - eventStart) + (item_end_time - item_start_time))) {
        isMeetingOverlaps = true
        break;
      }
    }
    if(isMeetingOverlaps) {
      return [isMeetingOverlaps, itemList[i].eventTitle, itemList[i].eventStart, eventStart];
    }
    else {
      return [isMeetingOverlaps, null, null, null];
    }


  }


  function isUnderPreferredTransportation(currentEvent, travelMode, user_distance, allEvents, day_start) {
    var eventID = currentEvent.body.eventID;
    var eventStart = currentEvent.body.eventDetails.eventStart;
    var eventEnd = currentEvent.body.eventDetails.eventEnd;
    var origin = currentEvent.body.eventDetails.origin;
    var destination = currentEvent.body.eventDetails.destination;
     var currentTravelMode;
    if(currentEvent.body.eventDetails.travelMode != null){
      currentTravelMode = currentEvent.body.eventDetails.travelMode.mode;
    }

    var distance = 0;

    if(currentTravelMode == 'walking') {
      distance = user_distance.walkingDistance;
    }
    else if (currentTravelMode == 'bicycling') {
      distance = user_distance.bicyclingDistance;
    }
    // var date = new Date(eventStart);
    // var yy = date.getFullYear();
    // var mm = date.getMonth();
    // var dd = date.getDate();
    // var h = date.getHours();
    // var m = date.getMinutes();
    // var s = date.getSeconds();
    
    // var milliStart = new Date(Date.UTC(yy,mm,dd,0,0,0)).getTime();
    // var milliEnd = new Date(Date.UTC(yy,mm,dd+1,0,0,0)).getTime();

    var milliStart = day_start;
    var milliEnd = day_start + 24*60*60*1000;

    distance = distance * 1609; //converting to meters
    distance -= currentEvent.body.eventDetails.travelMode.distance.value;
    if (distance < 0) {
      return [false, currentEvent.body.eventDetails.eventTitle];
    }
    for(var i= 0; i < allEvents.length; i++){
      if (allEvents[i].id == currentEvent.id) {
        continue;
      }
      if (allEvents[i].eventStart > milliStart && allEvents[i].eventStart < milliEnd && travelMode != null) {
        if (allEvents[i].travelMode.mode == currentTravelMode) {
          distance -= allEvents[i].travelMode.distance.value;
          if (distance < 0) {
            return [false, allEvents[i].eventTitle];
          }
        }
      }
    }
    return [true, null];
  }


  //     lambda.invoke({
  //         FunctionName: 'getDistancePreference',
  //         Payload: JSON.stringify({
  //             user: username,
  //             mode: currentTravelMode
  //         }, null, 2)
  //         }, function (error, data) {
  //             if (error) {
  //                 context.fail('error', error);
  //             }
  //             if (data.Payload) {
  //                 distance = data.Payload;
  //                 var date = new Date(eventStart);
  //                 var yy = date.getFullYear();
  //                 var mm = date.getMonth();
  //                 var dd = date.getDate();
  //                 var h = date.getHours();
  //                 var m = date.getMinutes();
  //                 var s = date.getSeconds();

  //                 var milliStart = new Date(Date.UTC(yy,mm,dd,0,0,0)).getTime();
  //                 var milliEnd = new Date(Date.UTC(yy,mm,dd+1,0,0,0)).getTime();

  //                 distance = 2;
  //                 distance = distance * 1609; //converting to meters

  //                 distance -= currentEvent.body.eventDetails.travelMode.distance.value;
  //                 if (distance < 0) {
  //                     return false;
  //                 }
  //                 for(var i= 0; i < allEvents.length; i++){
  //                     if (allEvents[i].id == currentEvent.id) {
  //                         continue;
  //                     }
  //                     if (allEvents[i].eventStart > milliStart && allEvents[i].eventStart < milliEnd) {
  //                         if (allEvents[i].travelMode.mode == currentTravelMode) {
  //                             distance -= allEvents[i].travelMode.distance.value;
  //                             if (distance < 0) {
  //                                 return false;
  //                             }
  //                         }
  //                     }
  //                 }
  //             }
  //     });
  // }






  function checkConflictOnLocationBasis(data,eventID, eventStart, eventEnd, origin, destination, travelMode, status){
    var itemList = data.Items;

    var startmeetingDetails = null;
    var endMeetinfDetails = null;

    for(var i= 0; i < itemList.length; i++){
      if(itemList[i].id == eventID){
        continue;
      }

      if (itemList[i].eventStart > eventStart){
        //Next Meeting Information
        if (endMeetinfDetails == null){
          endMeetinfDetails = itemList[i];
          continue;
        }

        if(endMeetinfDetails.eventStart > itemList[i].eventStart){
          endMeetinfDetails = itemList[i];
        }

      }else{
        //First Meeting Information
        if (startmeetingDetails == null){
          startmeetingDetails = itemList[i];
          continue;
        }

        if (startmeetingDetails.eventEnd < itemList[i].eventEnd){
          startmeetingDetails = itemList[i];
        }
      }
    }

    // If there is no previous and next meeting then directly save the meeting
    if(startmeetingDetails == null && endMeetinfDetails == null){
      saveOrModifyEvents(status)
      return;
    }


    var currentLocationOrigin = origin;
    var currentLocationDestination = destination;
    var previousMeetingOriginPlaceId = "";
    var previousMeetingDestinationPlaceId = "";
    var nextMeetingOriginPlaceId = "";
    var nextMeetingDestinationPlaceId = "";
    var travelMode = travelMode;

    var previousMeetingEndTime = 0;
    var previousMeetingStartTime = 0;
    var currentMeetingStartTime = eventStart;
    var currentMeetingEndTime = eventEnd;
    var nextMeetingStartTime = 0;
    var nextMeetingEndTime = 0;

    // Adding meeting IDs for sending colflicting information

    var previousMeetingId = ""
    var nextMeetingId = ""
    var previousMeetingObject = null
    var nextMeetingObject = null

    if (startmeetingDetails != null){
      // params["previousMeeting"] = startmeetingDetails
      // var previous_response = getDurationFromDistanceAPIInMins(startmeetingDetails.destination.place_id, origin, travelMode);
      // //var previous_response = getDurationFromDistanceAPIInMins("ChIJ-c0dQ52tK4cR0o7GfBfBnC0","ChIJ44CqppgIK4cRH7QsOa1K3aI", "driving")

      // startmeetingDetails.eventStart = startmeetingDetails.eventStart + previous_response * 1000 //millesec

      // //startmeetingDetails.eventStart = startmeetingDetails.eventStart + 100 * 1000
      // var result = isConflictPresentForTwoLocations(startmeetingDetails.eventStart, startmeetingDetails.eventEnd,eventStart, eventEnd)

      // if (result == true){
      //     return true;
      // }

      previousMeetingOriginPlaceId = startmeetingDetails.origin.place_id;
      previousMeetingDestinationPlaceId = startmeetingDetails.destination.place_id;
      previousMeetingStartTime = startmeetingDetails.eventStart;
      previousMeetingEndTime = startmeetingDetails.eventEnd;
      previousMeetingId = startmeetingDetails.id;
      previousMeetingObject = startmeetingDetails

    }


    if(endMeetinfDetails != null){

      // var next_response = getDurationFromDistanceAPIInMins(destination, endMeetinfDetails.origin.place_id,travelMode);
      // //var next_response = getDurationFromDistanceAPIInMins("ChIJ-c0dQ52tK4cR0o7GfBfBnC0","ChIJ44CqppgIK4cRH7QsOa1K3aI", "driving")
      // var result = isConflictPresentForTwoLocations(endMeetinfDetails.eventStart,endMeetinfDetails.eventEnd,eventStart , eventEnd+ next_response  * 1000) // millesec
      //     if(result == true){
      //         return true;
      //     }
      // }
      nextMeetingOriginPlaceId = endMeetinfDetails.origin.place_id;
      nextMeetingDestinationPlaceId = endMeetinfDetails.destination.place_id;
      nextMeetingStartTime = endMeetinfDetails.eventStart;
      nextMeetingEndTime = endMeetinfDetails.eventEnd;
      nextMeetingId = endMeetinfDetails.id;
      nextMeetingObject = endMeetinfDetails
    }


    var params = {"currentLocationOrigin": currentLocationOrigin,
      "currentLocationDestination":currentLocationDestination,
      "previousMeetingOriginPlaceId": previousMeetingOriginPlaceId,
      "previousMeetingDestinationPlaceId":previousMeetingDestinationPlaceId,
      "nextMeetingOriginPlaceId":nextMeetingOriginPlaceId,
      "nextMeetingDestinationPlaceId":nextMeetingDestinationPlaceId,
      "travelMode":travelMode,
      "previousMeetingStartTime":previousMeetingStartTime,
      "previousMeetingEndTime":previousMeetingEndTime,
      "currentMeetingStartTime":currentMeetingStartTime,
      "currentMeetingEndTime":currentMeetingEndTime,
      "nextMeetingStartTime":nextMeetingStartTime,
      "nextMeetingEndTime":nextMeetingEndTime,
      "nextMeetingId":nextMeetingId,
      "previousMeetingId":previousMeetingId
    };

    // var AWS = require("aws-sdk");
    // AWS.config.update({
    //   region: "us-west-2"
    // });
    // var aws = require('aws-sdk');

    // var lambda = new aws.Lambda({
    //   region: 'us-west-2'
    // });

    // lambda.invoke({
    //   FunctionName: 'getLocationInformation',
    //   Payload: JSON.stringify(params, null, null) // pass params
    // }, function(error, data) {
    // if(status == "new") {
    //     saveEvent();
    //   } else {
    //     saveModifiedEvent();
    //   }
    //   context.succeed(error_message);
    //   return;

    // if (error) {

    //   // If the error occurs in fetching the service Still saving the data

    // }else{
    //   // save the meeting
    //   if (data['Payload'] == 'true'){
    //     var error_message = {
    //       "errorMessage": {
    //         "code": 4,
    //         "value": "MEHUL EVENT"
    //       }
    //     };
    //   }
    // }
    //   });
    promiseCallFunction(params, status, previousMeetingObject, nextMeetingObject)
  }

  function saveOrModifyEvents(status){
    // Adding eventLeaveTime Code
    
    // var aws = require('aws-sdk');
    // var lambda = new aws.Lambda({
    //   region: 'us-west-2'
    // });


    // var eventLeaveTime = event.body.eventDetails.eventStart;

    // params = {
    //   "currentLocationOrigin": event.body.eventDetails.origin.place_id ,
    //   "currentLocationDestination": event.body.eventDetails.destination.place_id,
    //   "travelMode": event.body.eventDetails.travelMode.mode,
    //   "currentMeetingStartTime": event.body.eventDetails.eventStart
    // }
    // lambda.invoke({
    //   FunctionName: 'getLocationInformation',
    //   Payload: JSON.stringify(params, null, null) // pass params
    // }, function(error, data) {

    //   if (error) {


    //   }else{

    //     var jsonResult = JSON.parse(data['Payload']);

    //     if(jsonResult != null && jsonResult['eventLeaveTime'] != null){
    //       eventLeaveTime = jsonResult['eventLeaveTime']
    //     }

    //     }

    //   if(status == 'new') {
    //     saveEvent(eventLeaveTime)
    //   }else{
    //     saveModifiedEvent(eventLeaveTime)
    //   }
    // });

    var eventLeaveTime = event.body.eventDetails.eventStart;
    if(event.body.eventDetails.travelMode.duration != null && event.body.eventDetails.travelMode.duration.value!= null ) {
        eventLeaveTime = event.body.eventDetails.eventStart - event.body.eventDetails.travelMode.duration.value * 1000
      }
      if(status == 'new') {
        saveEvent(eventLeaveTime)
      }else{
        saveModifiedEvent(eventLeaveTime)
      }
  }

  function promiseCallFunction(params, status, previousMeetingObject, nextMeetingObject){
    var callOtherLambdaFunction = new Promise(
      function (resolve, reject) {

        var aws = require('aws-sdk');
        var lambda = new aws.Lambda({
          region: 'us-west-2'
        });

        lambda.invoke({
          FunctionName: 'getLocationInformation',
          Payload: JSON.stringify(params, null, null) // pass params
        }, function(error, data) {

          if (error) {
            // If the error occurs in fetching the service Still saving the data
            saveOrModifyEvents(status)
            reject(error)
          }else{
            // save the meeting

            var jsonResult = JSON.parse(data['Payload'])

            var conflictTitle = ""
            var conflictInDuration = false
            var conflictMeetingId =  ""
            if(jsonResult != null && jsonResult['isConflictPresent'] != null && jsonResult['isConflictPresent'] == true){
              conflictInDuration = true
            }

            if(jsonResult != null && jsonResult['conflictMeetingId'] != null){
              conflictMeetingId = jsonResult['conflictMeetingId']
            }



            if (conflictInDuration == true){

              if (previousMeetingObject != null && previousMeetingObject.id != null && previousMeetingObject.id == conflictMeetingId && previousMeetingObject.eventTitle != null){
                conflictTitle = previousMeetingObject.eventTitle
              }

              if(nextMeetingObject != null && nextMeetingObject.id != null && nextMeetingObject.id == conflictMeetingId && nextMeetingObject.eventTitle != null){
                conflictTitle = nextMeetingObject.eventTitle
              }
              var error_message = {
                "errorMessage": {
                  "code": 4,
                  "value": conflictTitle,
                }
              };
              context.succeed(error_message);
              return;
            }else{
              // No Conflict
              saveOrModifyEvents(status)
            }
            resolve(data); // fulfilled
          }

        });

      });


    var promiseConsumeFunction = function () {
      callOtherLambdaFunction
        .then(function (data) {
          // yay, you got a new phone
        })
        .catch(function (error) {
          // oops, mom don't buy it
        });


    };
    promiseConsumeFunction();
  }

  function convertStringTimeToMillis(time, startDate) {
    var hr = time[0]+time[1]
    var min = time[3]+time[4]

    var date = new Date(1522022400000)
    var yy = date.getFullYear();
    var mm = date.getMonth() + 1;
    var dd = date.getDate();
    var hr = date.getHours();
    var min = date.getMinutes();

    var timeInMillis = new Date(Date.UTC(yy,mm,dd,17,0,0)).getTime();

    return timeInMillis;
  }


  function queryForFetchingNearMeetings(status) {
    var tableName = "user_events";
    var eventID = event.body.eventDetails.id;
    var eventTitle = event.body.eventDetails.eventTitle;
    var eventStart = event.body.eventDetails.eventStart;
    var eventEnd = event.body.eventDetails.eventEnd;
    var origin = event.body.eventDetails.origin.place_id;
    var destination = event.body.eventDetails.destination.place_id;
    var lunchStart = event.body.eventDetails.lunchStart;
    var lunchEnd = event.body.eventDetails.lunchEnd;
    var dinnerStart = event.body.eventDetails.dinnerStart;
    var dinnerEnd = event.body.eventDetails.dinnerEnd;
    var midnightTime = event.body.eventDetails.midnight;
    var travelMode;
     if(event.body.eventDetails.travelMode != null){
      travelMode = event.body.eventDetails.travelMode.mode;
    }
    
    var eventObj = {
      origin: event.body.eventDetails.origin,
      destination: event.body.eventDetails.destination,
      eventEnd: eventEnd,
      eventStart: eventStart,
      eventTitle: eventTitle
    };

    var cal_eventStart = Number(eventStart) - 86400000; //24*60*60*1000
    var cal_eventEnd = Number(eventEnd) + 86400000; //24*60*60*1000
    var params = {
      TableName: tableName,
      IndexName: "username-index",
      KeyConditionExpression: "#username = :u",
      ProjectionExpression: "id, eventTitle, eventStart, eventEnd, origin, destination, travelMode",
      FilterExpression: "eventStart >= :start and eventStart <= :end",
      ExpressionAttributeNames: {
        "#username": "username"
      },
      ExpressionAttributeValues: {
        ":u": username,
        ":start": cal_eventStart,
        ":end": cal_eventEnd
      }
    };

    dynamo.query(params, function (err, data) {

      if (err) {
        context.fail(err);
      } else {

        var payload = {
          TableName: "user_preferences",
          KeyConditionExpression: "username = :u",
          ProjectionExpression: "walkingDistance, bicyclingDistance, lunchTime, dinnerTime",
          ExpressionAttributeValues: {
            ":u": username
          }
        }

        dynamo.query(payload, function(err, dist) {
          if (err) {
            console.log("ERRRRRRRRR");
          } else {
            var user_distance = dist.Items[0];
            var error_message = "XYZ";
            var max_dist_status = false;
            if(user_distance.lunchTime && lunchStart != undefined) {
              if (eventObj.eventEnd - eventObj.eventStart <= 24*60*60*1000) { // if an event is 24 hr long no need to check for lunch/ dinner time availability
                var lunchTest = data;
                lunchTest.Items.push(eventObj);
                var meetingList = lunchConflicts(lunchTest, lunchStart, lunchEnd);
                var lunch = isLunchPossible(meetingList, lunchStart, lunchEnd);
                if (lunch == false) {
                  error_message = {
                    "errorMessage": {
                      "code": 5,
                      "value": "No time for Lunch"
                    }
                  };
                  context.succeed(error_message);
                  return;
                }
                else {
                  lunchTest.Items.pop(eventObj);
                }
              }
            }

            if(user_distance.dinnerTime && dinnerStart != undefined) {
              if (eventObj.eventEnd - eventObj.eventStart <= 24*60*60*1000) { // if an event is 24 hr long no need to check for lunch/ dinner time availability
                var dinnerTest = data;
                dinnerTest.Items.push(eventObj);
                var meetingList = lunchConflicts(dinnerTest, dinnerStart, dinnerEnd);
                var dinner = isLunchPossible(meetingList, dinnerStart, dinnerEnd);
                if (dinner == false) {
                  error_message = {
                    "errorMessage": {
                      "code": 6,
                      "value": "No time for Dinner"
                    }
                  };
                  context.succeed(error_message);
                  return;
                }
                else {
                  dinnerTest.Items.pop(eventObj);
                }
              }

            }

            if(travelMode == "walking") {
              if("walkingDistance" in user_distance) {
                max_dist_status = true;
              }
            }
            if(travelMode == "bicycling") {
              if("bicyclingDistance" in user_distance) {
                max_dist_status = true;
              }
            }
            if(max_dist_status) {
              if(travelMode == 'walking' || travelMode == 'bicycling') {
                var s = isUnderPreferredTransportation(event, travelMode, user_distance, data.Items, midnightTime);
                if (s[0] == false) {
                  var user_miles = null;
                  var error_code = -1;
                  if(travelMode == "walking") {
                    user_miles = user_distance.walkingDistance;
                    error_code = 1;
                  }
                  else if(travelMode == "bicycling") {
                    user_miles = user_distance.bicyclingDistance;
                    error_code = 2;
                  }
                  error_message = {
                    "errorMessage": {
                      "code": error_code,
                      "value": user_miles
                    }
                  };
                  context.succeed(error_message);
                  return;
                }
              }
            }
            var s2 = isConflictPresent(data, eventID, eventStart, eventEnd);
            if(s2[0] == true) {
              error_message = {
                "errorMessage": {
                  "code": 3,
                  "value": s2[1],
                  "startTime": s2[2],
                  "currentStartTime": s2[3]
                }
              }
              context.succeed(error_message);
              return;

            }else{
              checkConflictOnLocationBasis(data, eventID, eventStart, eventEnd, origin, destination, travelMode, status)
            }

            // else {
            //   if(status == "new") {
            //     saveEvent();
            //   } else {
            //     saveModifiedEvent();
            //   }
            // }
          }
        });
      }
    });

  }

  function deleteEvent() {
    var payload = {
      TableName: "user_events",
      Key: {
        "id": event.body.eventID
      }
    }
    dynamo.getItem(payload, function(err, data){
      if(!err){
        deleteRules(data.Item.eventTitle.replace(/\s/g,'') + data.Item.eventStart);
      }
    })
    dynamo.deleteItem(payload, function (err, data) {
      if (err) {
        context.fail(err);
      } else {
        context.succeed(data);
      }
    })
  }

  function deleteRules(uid) {
    var ruleName = 'notification_for_' + uid;
    var policyId = 'NID'+ uid;
    var cloudwatchevents = new aws.CloudWatchEvents();
    var lambda = new aws.Lambda();
    var params = {
      Ids: ['sendPushNotification'],
      Rule: ruleName
    };
    cloudwatchevents.removeTargets(params, function (err, data) {
      if (err) console.log(err, err.stack);
      else {
        var params = {
          Name: ruleName
        };
        cloudwatchevents.deleteRule(params, function (err, data) {
          if (err) console.log(err, err.stack);
        });
      }
    });
    var params = {
      FunctionName: 'sendPushNotification',
      StatementId: policyId,
    };
    lambda.removePermission(params, function (err, data) {
      if (err) console.log(err, err.stack);
    });
  }


  function saveModifiedEvent(eventLeaveTime) {
    
    // delete the cron job if user edits an event and specifically modifies time
    // do not dlete cron if user does not modify time
    var payload = {
      TableName: "user_events",
      Key: {
        "id": event.body.eventID
      }
    }
    dynamo.getItem(payload, function(err, data){
      if(!err){
        deleteRules(data.Item.eventTitle.replace(/\s/g,'') + data.Item.eventStart);
      }
      var new_event_payload = {
        TableName: "user_events",
        Item: {
          "id":  event.body.eventID,
          "username": username,
          "eventStart": event.body.eventDetails.eventStart,
          "eventEnd": event.body.eventDetails.eventEnd,
          "eventTitle": event.body.eventDetails.eventTitle,
          "origin": event.body.eventDetails.origin,
          "destination": event.body.eventDetails.destination,
          "travelMode": event.body.eventDetails.travelMode,
          "eventLeaveTime":eventLeaveTime
        }
      }
      
    if(event.body.eventDetails.isRepeat){
      new_event_payload.Item.repeatMax = event.body.eventDetails.repeatMax;
      new_event_payload.Item.isRepeat = event.body.eventDetails.isRepeat;
      new_event_payload.Item.repeatPreference = event.body.eventDetails.repeatPreference;
    }
    
    var end = moment().endOf('day').unix()*1000;
    
    if(event.body.eventDetails.eventStart < end){
      createCronJob(payload.Item);
    }


    dynamo.putItem(new_event_payload, function (err, data) {
      if (err) {
        context.fail(err);
      } else {
        context.succeed(event.body.eventID);
      }
    });
    })
  }


  // function queryForFetchingEventForModifiedEvent() {
  //     var tableName = "user_events";
  //     var eventID = event.body.eventID;
  //     var eventStart = event.body.eventDetails.eventStart;
  //     var eventEnd = event.body.eventDetails.eventEnd;
  //     var cal_eventStart = Number(eventStart) - 86400000; //24*60*60*1000
  //     var cal_eventEnd = Number(eventEnd) + 86400000; //24*60*60*1000
  //     var params = {
  //         TableName: tableName,
  //         IndexName: "username-index",
  //         KeyConditionExpression: "#username = :u",
  //         ProjectionExpression: "id, eventStart, eventEnd",
  //         FilterExpression: "eventStart >= :start and eventStart <= :end",
  //         ExpressionAttributeNames: {
  //             "#username": "username"
  //         },
  //         ExpressionAttributeValues: {
  //             ":u": username,
  //             ":start": cal_eventStart,
  //             ":end": cal_eventEnd
  //         }
  //     };

  //     dynamo.query(params, function (err, data) {
  //         if (err) {
  //             context.fail(err);
  //         } else {
  //             if (isConflictPresent(data, eventID, eventStart, eventEnd)) {
  //                 context.fail("Conflict");
  //             } else {
  //                 saveModifiedEvent();
  //             }
  //         }
  //     });
  // }

  lambda.invoke({
    FunctionName: 'getUsername',
    Payload: JSON.stringify({
      idToken: event.idToken
    }, null, 2)
  }, function (error, data) {
    if (error) {
      context.fail('error', error);
    }
    if (data.Payload) {
      username = data.Payload.replace(/['"]+/g, '');
      switch (event.body.operation) {
        case "saveEvent":
          if(event.body.forceSaveEvent){
            //saveEvent();
            saveOrModifyEvents("new")
          } else {
            queryForFetchingNearMeetings("new");
          }
          break;
        case "fetchEvents":
          fetchEvents();
          break;
        case "deleteEvent":
          deleteEvent();
          break;
        case "editEvent":
          if(event.body.forceSaveEvent){
            saveOrModifyEvents("modified");
          } else {
            queryForFetchingNearMeetings("modified");
          }
          break;
        default:
          context.fail("Invalid Operation");
      }
    }
  });
}


