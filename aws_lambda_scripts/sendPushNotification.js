

var AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
    console.log("aaaaaaaaaaaaa")
  
  var snsApplicationARN = "arn:aws:sns:us-west-2:016911789346:app/GCM/Travlendar";
  if (event == null){
    return;
  }else if (event.eventDetails == null){
       deleteRules(event.ruleToDelete.ruleName, event.ruleToDelete.policyId);
  }else{
  sendNotification();
  }


  function sendNotification(){
    var username= "";
    if (event['eventDetails']['username'] != null){
      username = event.eventDetails.username;
    }



    if(username == null || username.trim() == ""){
      deleteRules(event.ruleToDelete.ruleName, event.ruleToDelete.policyId);

    }else{
      getListOfENdPointsForGivenUser(username);
    }

    }

  function getListOfENdPointsForGivenUser(username){
    console.log("Username" + username);
    var listOfEndPoints = [];

    var snsClient = new AWS.SNS();

    var params = {
      PlatformApplicationArn: snsApplicationARN
    };

    snsClient.listEndpointsByPlatformApplication(params, function(err, data) {
      if (err) {
        console.log("Error in fetching the list of EndPoints");
        console.log(err, err.stack); // an error occurred

      }else {
        console.log(data);           // successful response
        if (data !== null || data['Endpoints'] !== null && data['Endpoints'].length > 0){
          for(var i =0 ; i < data['Endpoints'].length; i++){
            var endPoint = data['Endpoints'][i];

            if(endPoint !== null && endPoint['Attributes'] !== null && endPoint['Attributes']['CustomUserData'] !== null &&
              endPoint['Attributes']['CustomUserData'] === username)
            { console.log(endPoint['EndpointArn']);
              console.log(endPoint['Attributes']['Token']);
              console.log(endPoint['Attributes']['CustomUserData']);
              listOfEndPoints.push(endPoint['EndpointArn']);
            }
          }
        }
      }
      sendPushNotificationToEndPoints(listOfEndPoints)
    });
  }



  function sendPushNotificationToEndPoints(listOfEndPoints){
    var destinationAddress = ""

    if(event['eventDetails']['destination'] != null && event['eventDetails']['destination']['formatted_address'] != null){
        destinationAddress = event['eventDetails']['destination']['formatted_address']
    }

    var eventStart  = 0

    if(event['eventDetails']['eventStart'] != null){
      eventStart += event['eventDetails']['eventStart']
    }

    // Adding time in seconds
    console.log("Print currentTime " + new Date().getTime())
    var timeInSeconds = new Date().getTime() - eventStart;
    if (timeInSeconds < 0){
      timeInSeconds = 0 - timeInSeconds
    }
    
    var message = "You have the meeting at location \"" + destinationAddress + "\" in " + parseInt(timeInSeconds/(60  * 1000)) + " mins";
    console.log("Message " + message);
    var snsClient = new AWS.SNS();
    
    var pushMessage = {
      "GCM": JSON.stringify({
        notification: {
          text: message,
        }
      })
    }

    if(listOfEndPoints !== null && listOfEndPoints.length > 0){
      for(var i = 0 ; i < listOfEndPoints.length ; i++){

          var params = {
              Message: JSON.stringify(pushMessage),
              MessageStructure: 'json',
              TargetArn: listOfEndPoints[i]
              // MessageAttributes: {
              // 'eventDetails': {
              // DataType: 'String', /* required */
              // StringValue: 'XXXXXXXXX'
              // }
          
    };

          snsClient.publish(params, function(err, data){
              if (err) console.log(err, err.stack); // an error occurred
              else     console.log(data);
          });
      }
    }
    deleteRules(event.ruleToDelete.ruleName, event.ruleToDelete.policyId);
  }



  function deleteRules(ruleName, policyId) {
    return;
    var cloudwatchevents = new AWS.CloudWatchEvents();
    var lambda = new AWS.Lambda();
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
};


