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

    function checkConflictOnLocationBasis(data,eventID, eventStart, eventEnd, origin, destination, travelMode){
        var itemList = data.Items

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


        if (startmeetingDetails != null){
            var previous_response = getDurationFromDistanceAPIInMins(startmeetingDetails.destination, origin, travelMode);
            var data = []
            startmeetingDetails.eventStart = startmeetingDetails.eventStart + previous_response
            data.push(startmeetingDetails)
            var result = isConflictPresent(data.Items,eventID,eventStart, eventEnd)
            if (result == true){
                return true;
            }
        }

        if(endMeetinfDetails != null){
        var next_response = getDurationFromDistanceAPIInMins(destination, endMeetinfDetails.eventStart,travelMode);
        var data = []
        data.push(endMeetinfDetails)

        var result = isConflictPresent(data.Items,eventID,eventStart + next_response , eventEnd)
        if(result == true){
            return true;
            }
        }
        return false;
    }


    function queryForFetchingNearMeetings(status) {
        console.log("Inside the queryForFetchingNearMeetings method ")
        var tableName = "user_events";
        var eventID = event.body.eventID;
        var eventStart = event.body.eventDetails.eventStart;
        var eventEnd = event.body.eventDetails.eventEnd;
        var origin = event.body.eventDetails.origin;
        var destination = event.body.eventDetails.destination;

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
                console.log(data);

                // if (isConflictPresent(data, eventID, eventStart, eventEnd)) {
                //     context.fail("Conflict");
                // }

                if(checkConflictOnLocationBasis(data,eventID, eventStart, eventEnd, origin, destination, travelMode)){
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