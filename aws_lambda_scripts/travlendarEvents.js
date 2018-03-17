var aws = require('aws-sdk');
const doc = require("dynamodb-doc");
const dynamo = new doc.DynamoDB();

var lambda = new aws.Lambda({
  region: 'us-west-2'
});
var username = "";

exports.handler = (event, context, callback) => {
  console.log(event)

  function saveEvent() {
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
          "repeatPreference" : event.body.eventDetails.repeatPreference
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
          "isRepeat" : false
        }
      }
    }


    dynamo.putItem(payload, function (err, data) {
      if (err) {
        context.fail(err);
      } else {
        context.succeed(id);
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
    console.log("LUNCH CONFLICT CHECK");
    console.log(lunchData);
    if (lunchData == null || lunchData.Count == 0){
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

  function isLunchPossible(lunchTimeMeetings, lunchStart, lunchEnd) {

    // Loop through lunchTimeMeetings
    // if event is last event and lunchEnd > eventEnd --> check if lunchEnd-eventEnd >= 30 ==> return true
    // if not return false
    // check if eventStart-LunchStart >= 30 ==> return true
    // if not modify lunchStart to eventEnd
    console.log("ALFRED: "+lunchStart + " to " + lunchEnd);
    console.log(lunchTimeMeetings)
    if (lunchTimeMeetings == null || lunchTimeMeetings.length == 0) {
      console.log("HERE 1");
      return true;
    }
    var LUNCH_TIME = 30*60*1000 ;    //30 minute lunch time
    // var itemList = lunchTimeMeetings.Items;
    var itemList = lunchTimeMeetings;
    console.log(itemList[0])
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
    //     console.log("Inside the call Lambda function")
    //     console.log("DISTAAAAAAA", startlocation, endLocation, mode)
    //     console.log(startlocation,endLocation,mode)
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
    //     console.log("Error" + error)
    //     return 0;
    //   }
    //   console.log(data)

    //  // var response = data
    //   console.log("SSSS")
    //   var response = data.Payload;
    //   if (data ==null || data.Payload == null){
    //       return 0;
    //   }
    //   var res = JSON.parse(response)
    //   var result = 0;

    //   if (res.status == 'Ok' && res.result[0].status == 'Ok' ){
    //              result = res.result[0].duration_value;
    //          }

    //   console.log("Response" + result)
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

    console.log("CONFLICT CHECK")
    console.log(data)
    if (data == null || data.Count == 0){
      return [false, null];
    }
    console.log("Inside is conflict present");
    var itemList = data.Items
    var isMeetingOverlaps = false
    console.log(itemList);

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
      return [isMeetingOverlaps, itemList[i].eventTitle];
    }
    else {
      return [isMeetingOverlaps, null];
    }


  }


  function isUnderPreferredTransportation(currentEvent, travelMode, user_distance, allEvents) {
    console.log("Checking Walking/Biking Criteria");
    var eventID = currentEvent.body.eventID;
    var eventStart = currentEvent.body.eventDetails.eventStart;
    var eventEnd = currentEvent.body.eventDetails.eventEnd;
    var origin = currentEvent.body.eventDetails.origin;
    var destination = currentEvent.body.eventDetails.destination;
    var currentTravelMode = currentEvent.body.eventDetails.travelMode.mode;

    var distance = 0;
    console.log(username, currentTravelMode);

    if(currentTravelMode == 'walking') {
      distance = user_distance.walkingDistance;
    }
    else if (currentTravelMode == 'biking') {
      distance = user_distance.bikingDistance;
    }
    console.log(distance);
    console.log("Preferred distance", distance);
    console.log("Alfred", eventStart)
    var date = new Date(eventStart);
    var yy = date.getFullYear();
    var mm = date.getMonth();
    var dd = date.getDate();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    console.log(mm+'/'+dd+'/'+yy, h+':'+m+':'+s)

    var milliStart = new Date(Date.UTC(yy,mm,dd,0,0,0)).getTime();
    console.log(milliStart);
    var milliEnd = new Date(Date.UTC(yy,mm,dd+1,0,0,0)).getTime();
    console.log(milliEnd);

    console.log(allEvents);

    distance = distance * 1609; //converting to meters

    distance -= currentEvent.body.eventDetails.travelMode.distance.value;
    if (distance < 0) {
      return [false, currentEvent.body.eventDetails.eventTitle];
    }
    for(var i= 0; i < allEvents.length; i++){
      if (allEvents[i].id == currentEvent.id) {
        continue;
      }
      if (allEvents[i].eventStart > milliStart && allEvents[i].eventStart < milliEnd) {
        console.log("Daily Event: ", allEvents[i]);
        if (allEvents[i].travelMode.mode == currentTravelMode) {
          distance -= allEvents[i].travelMode.distance.value;
          if (distance < 0) {
            console.log("Distance Overboard");
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
  //             console.log("AAAAA: ", data);
  //             if (error) {
  //                 context.fail('error', error);
  //             }
  //             if (data.Payload) {
  //                 distance = data.Payload;
  //                 console.log(distance);
  //                 console.log("Preferred distance", distance);
  //                 console.log("Alfred", eventStart)
  //                 var date = new Date(eventStart);
  //                 var yy = date.getFullYear();
  //                 var mm = date.getMonth();
  //                 var dd = date.getDate();
  //                 var h = date.getHours();
  //                 var m = date.getMinutes();
  //                 var s = date.getSeconds();
  //                 console.log(mm+'/'+dd+'/'+yy, h+':'+m+':'+s)

  //                 var milliStart = new Date(Date.UTC(yy,mm,dd,0,0,0)).getTime();
  //                 console.log(milliStart);
  //                 var milliEnd = new Date(Date.UTC(yy,mm,dd+1,0,0,0)).getTime();
  //                 console.log(milliEnd);

  //                 console.log(allEvents);

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
  //                                 console.log("Distance Overboard");
  //                                 return false;
  //                             }
  //                         }
  //                     }
  //                 }
  //             }
  //     });
  // }






  function checkConflictOnLocationBasis(data,eventID, eventStart, eventEnd, origin, destination, travelMode, status){
    console.log("Input AAAAA");
    console.log(data);
    console.log(origin);
    console.log(eventStart);

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


    console.log("SSSSS");
    console.log(startmeetingDetails);

    console.log("EEEE");
    console.log(endMeetinfDetails);

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

    if (startmeetingDetails != null){
      // params["previousMeeting"] = startmeetingDetails
      // var previous_response = getDurationFromDistanceAPIInMins(startmeetingDetails.destination.place_id, origin, travelMode);
      // //var previous_response = getDurationFromDistanceAPIInMins("ChIJ-c0dQ52tK4cR0o7GfBfBnC0","ChIJ44CqppgIK4cRH7QsOa1K3aI", "driving")

      // console.log("Previous location duration ", previous_response)

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
    }


    if(endMeetinfDetails != null){

      // var next_response = getDurationFromDistanceAPIInMins(destination, endMeetinfDetails.origin.place_id,travelMode);
      // //var next_response = getDurationFromDistanceAPIInMins("ChIJ-c0dQ52tK4cR0o7GfBfBnC0","ChIJ44CqppgIK4cRH7QsOa1K3aI", "driving")

      // console.log("Next location duration ", next_response)
      // var result = isConflictPresentForTwoLocations(endMeetinfDetails.eventStart,endMeetinfDetails.eventEnd,eventStart , eventEnd+ next_response  * 1000) // millesec
      //     if(result == true){
      //         return true;
      //     }
      // }
      nextMeetingOriginPlaceId = endMeetinfDetails.origin.place_id;
      nextMeetingDestinationPlaceId = endMeetinfDetails.destination.place_id;
      nextMeetingStartTime = endMeetinfDetails.eventStart;
      nextMeetingEndTime = endMeetinfDetails.eventEnd;
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
      "nextMeetingEndTime":nextMeetingEndTime
    };
    console.log('AABB')
    console.log(params)

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
    //     console.log("Saved SSSS")
    //     saveEvent();
    //   } else {
    //     saveModifiedEvent();
    //   }
    //   context.succeed(error_message);
    //   return;

    // if (error) {
    //   console.log("Error SSSS" + error);

    //   // If the error occurs in fetching the service Still saving the data

    // }else{

    //   console.log("Location data SSSS");
    //   console.log(data)
    //   // save the meeting
    //   if (data['Payload'] == 'true'){
    //       console.log("Conflict Found while comparing the location distance ")
    //     var error_message = {
    //       "errorMessage": {
    //         "code": 4,
    //         "value": "MEHUL EVENT"
    //       }
    //     };
    //   }
    // }
    //   });
    promiseCallFunction(params, status)
  }

  function saveOrModifyEvents(status){
    if(status == 'new'){
      saveEvent();
    }else{
      saveModifiedEvent();
    }
  }

  function promiseCallFunction(params, status){
    console.log("Inside Promise call function ")
    console.log(params)

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
            console.log("Error SSSS" + error);
            // If the error occurs in fetching the service Still saving the data
            saveOrModifyEvents(status)
            reject(error)
          }else{
            console.log("Location data ");
            console.log(data)
            // save the meeting
            if (data['Payload'] == 'true'){
              console.log("Conflict Found while comparing the location distance ")
              var error_message = {
                "errorMessage": {
                  "code": 4,
                  "value": "MEHUL EVENT"
                }
              };
              context.succeed(error_message);
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
          //console.log(data);
          //console.log("DDDD")
          // output: { brand: 'Samsung', color: 'black' }
        })
        .catch(function (error) {
          // oops, mom don't buy it
          //console.log(error.message);
          // output: 'mom is not happy'
        });


    };
    promiseConsumeFunction();
  }


  function queryForFetchingNearMeetings(status) {
    console.log("Inside the queryForFetchingNearMeetings method ");
    var tableName = "user_events";
    var eventID = event.body.eventDetails.id;
    var eventTitle = event.body.eventDetails.eventTitle;
    var eventStart = event.body.eventDetails.eventStart;
    var eventEnd = event.body.eventDetails.eventEnd;
    var origin = event.body.eventDetails.origin.place_id;
    var destination = event.body.eventDetails.destination.place_id;
    var travelMode = event.body.eventDetails.travelMode.mode;
    var lunchStart = event.body.lunchStart;
    var lunchEnd = event.body.lunchEnd;

    var eventObj = {
      origin: event.body.eventDetails.origin,
      destination: event.body.eventDetails.destination,
      eventEnd: eventEnd,
      eventStart: eventStart,
      eventTitle: eventTitle
    };

    console.log("OBJECT+++++++++++++++");
    console.log(eventObj);

    var cal_eventStart = Number(eventStart) - 86400000; //24*60*60*1000
    var cal_eventEnd = Number(eventEnd) + 86400000; //24*60*60*1000
    var params = {
      TableName: tableName,
      IndexName: "username-index",
      KeyConditionExpression: "#username = :u",
      ProjectionExpression: "id, eventTitle, eventStart, eventEnd, origin, destination",
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
          ProjectionExpression: "walkingDistance, bikingDistance",
          ExpressionAttributeValues: {
            ":u": username
          }
        }

        dynamo.query(payload, function(err, dist) {


          // console.log(dist.Items[0]);
          if (err) {
            console.log("ERRRRRRRRR");
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          } else {
            console.log("Query succeeded.");
            var user_distance = dist.Items[0];
            var error_message = "XYZ";
            // console.log(user_distance);

            var max_dist_status = false;

            if (false) {
              var lunchTest = data;
              lunchTest.Items.push(eventObj);
              var meetingList = lunchConflicts(lunchTest, lunchStart, lunchEnd);
              console.log(meetingList);
              var lunch = isLunchPossible(meetingList, lunchStart, lunchEnd);
              if (lunch == false) {
                error_message = {
                  "errorMessage": {
                    "code": 5,
                    "value": "No time for Lunch"
                  }
                };
                context.succeed(error_message);
              }

            }
            if(travelMode == "walking") {
              if("walkingDistance" in user_distance) {
                max_dist_status = true;
              }
            }
            if(travelMode == "biking") {
              if("bikingDistance" in user_distance) {
                max_dist_status = true;
              }
            }
            if(max_dist_status) {
              if(travelMode == 'walking' || travelMode == 'biking') {
                var s = isUnderPreferredTransportation(event, travelMode, user_distance, data);
                if (s[0] == false) {
                  var user_miles = null;
                  var error_code = -1;
                  if(travelMode == "walking") {
                    user_miles = user_distance.walkingDistance;
                    error_code = 1;
                  }
                  else if(travelMode == "biking") {
                    user_miles = user_distance.bikingDistance;
                    error_code = 2;
                  }
                  error_message = {
                    "errorMessage": {
                      "code": error_code,
                      "value": user_miles
                    }
                  };
                  console.log("Your " + travelMode + " distance exceeds your daily preference: " + user_miles + " miles");
                  context.succeed(error_message);
                }
              }
            }

            var s2 = isConflictPresent(data, eventID, eventStart, eventEnd);
            console.log("Time Conflict Response: ", s2);
            if(s2[0] == true) {
              console.log("This time overlaps with meeting: " + s2[1]);
              error_message = {
                "errorMessage": {
                  "code": 3,
                  "value": s2[1]
                }
              }
              context.succeed(error_message);

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
    dynamo.deleteItem(payload, function (err, data) {
      if (err) {
        context.fail(err);
      } else {
        context.succeed(data);
      }
    })
  }


  function saveModifiedEvent() {

    if(event.body.eventDetails.isRepeat){
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
          "repeatMax" : event.body.eventDetails.repeatMax,
          "isRepeat" : event.body.eventDetails.isRepeat,
          "repeatPreference" : event.body.eventDetails.repeatPreference
        }
      }
    }

    else{
      var new_event_payload = {
        TableName: "user_events",
        Item: {
          "id": event.body.eventID,
          "username": username,
          "eventStart": event.body.eventDetails.eventStart,
          "eventEnd": event.body.eventDetails.eventEnd,
          "eventTitle": event.body.eventDetails.eventTitle,
          "origin": event.body.eventDetails.origin,
          "destination": event.body.eventDetails.destination,
          "travelMode": event.body.eventDetails.travelMode
        }
      };
    }

    dynamo.putItem(new_event_payload, function (err, data) {
      if (err) {
        context.fail(err);
      } else {
        context.succeed(event.body.eventID);
      }
    });
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
            saveEvent();
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
            saveModifiedEvent();
          } else {
            queryForFetchingNearMeetings("modified");
          }
          break;
        case "lunch":
          console.log("LUNCH>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
          break;
        default:
          context.fail("Invalid Operation");
      }
    }
  });
}
