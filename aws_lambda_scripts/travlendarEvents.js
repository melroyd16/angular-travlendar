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
                "travelMode": event.body.eventDetails.travelMode
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


    function isConflictPresent(data, eventID, eventStart, eventEnd) {
        if (data == null || data.Count == 0){
            return false;
        }
        console.log("Inside is conflict present", data);
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
        return isMeetingOverlaps
    }


    function checkConflictOnLocationBasis(data,eventID, eventStart, eventEnd, origin, destination){
        var itemList = data.Items
        var isMeetingOverlaps = false

        var startmeetingDetails = null
        var endMeetinfDetails = null

        for(var i= 0; i < itemList.length; i++){
            if(itemList[i].id == eventID){
                continue;
            }

            if (itemList[i].eventStart > eventStart){
                //Next Meeting Information
                if (endMeetinfDetails == null){
                    endMeetinfDetails = itemList[i];
                    continue
                }

            if(endMeetinfDetails.eventStart > itemList[i].eventStart){
                endMeetinfDetails = itemList[i]
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

        //if (startmeetingDetails != null)
            //var response = JSON.parse(getDurationFromDistanceAPI(startmeetingDetails.eventEnd, eventStart, travelMode))
            // result = 0;
            // if (response.status == 'Ok' && response.result[0].status == 'Ok' ){
            //     result = int(response.result[0].duration.value);

            // }
    }


    function getDurationFromDistanceAPIInMins(startlocation, endLocation,mode){
        console.log("Inside the call Lambda function")
        var aws = require('aws-sdk');
        var params = {"start_placeid": ["place_id:"+startlocation],
             "end_placeid" : ["place_id:"+endLocation],
             "mode": mode
             };

        var lambda = new aws.Lambda({
            region: 'us-west-2'
        });

    lambda.invoke({
      FunctionName: 'getLocationInformation',
      Payload: JSON.stringify(params, null, null) // pass params
    }, function(error, data) {

      if (error) {
        console.log("Error" + error)
        return 0;
      }
      console.log(data)

     // var response = data
      console.log("SSSS")
      var response = data.Payload;
      if (data ==null || data.Payload == null){
          return 0;
      }
      var res = JSON.parse(response)
      var result = 0;

      if (res.status == 'Ok' && res.result[0].status == 'Ok' ){
                 result = res.result[0].duration_value;
             }

    return result;
    });
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
            return false;
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
                        return false;
                    }
                }
            }
        }
        return true;
    }


    function queryForFetchingNearMeetings(status) {
        console.log("Inside the queryForFetchingNearMeetings method ")
        var tableName = "user_events";
        var eventID = event.body.eventID;
        var eventStart = event.body.eventDetails.eventStart;
        var eventEnd = event.body.eventDetails.eventEnd;
        var travelMode = event.body.eventDetails.travelMode;
        var cal_eventStart = Number(eventStart) - 86400000; //24*60*60*1000
        var cal_eventEnd = Number(eventEnd) + 86400000; //24*60*60*1000
        var params = {
            TableName: tableName,
            IndexName: "username-index",
            KeyConditionExpression: "#username = :u",
            ProjectionExpression: "id, eventStart, eventEnd",
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
                    ProjectionExpression: "walkingDistance",
                    ExpressionAttributeValues: {
                        ":u": username
                    }
                }
                dynamo.query(payload, function(err, dist) {
                    console.log(dist.Items[0]);
                    if (err) {
                        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Query succeeded.");
                        var user_distance = dist.Items[0];
                        if(travelMode == 'walking' || travelMode == 'biking') {
                            var s = isUnderPreferredTransportation(event, travelMode, user_distance, data);
                            console.log("Walking Response: : ", s);
                            if (s == false) {
                                context.fail("Conflict");
                            }
                        }
                        // #NOTE -  UnComment for PRODUCTION
                        var s2 = isConflictPresent(data, eventID, eventStart, eventEnd);
                        console.log("Time Conflict Response: ", s2);
                        if(s2 == true) {
                            context.fail("Conflict");
                        }



                        var locationConflict = checkConflictOnLocationBasis(data, eventID, eventStart, eventEnd, origin, destination, travelMode);
                        console.log("Location Conflict Response: ", locationConflict);
                        if(locationConflict == true){
                            context.fail("Conflict");
                        }

                        else {
                            if(status == "new") {
                                saveEvent();
                            } else {
                                saveModifiedEvent();
                            }
                        }
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
                default:
                    context.fail("Invalid Operation");
            }
        }
    });
};
