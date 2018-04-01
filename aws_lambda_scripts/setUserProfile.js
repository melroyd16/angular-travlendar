var aws = require('aws-sdk');
const doc = require("dynamodb-doc");
const dynamo = new doc.DynamoDB();

var username = "";
var lambda = new aws.Lambda({
  region: 'us-west-2'
});

exports.handler = (event, context, callback) => {

  function saveProfile() {
    var payload = {
      TableName: "user_preferences",
      Item: {
        "username": username,
        "homeLocation": event.body.homeLocation,
        "workLocation": event.body.workLocation,
        "preferredMode": event.body.preferredModes,
        "bicyclingDistance": event.body.bicyclingDistance,
        "walkingDistance": event.body.walkingDistance,
      }
    }
    //context.succeed(payload);
    dynamo.putItem(payload, callback);
  }

  function saveLocation(){
    var payload = {
      TableName: "user_preferences",
      Item: {
        "username": username,
        "homeLocation": event.body.homeLocation,
        "workLocation": event.body.workLocation
      }
    }
    dynamo.putItem(payload, callback);
  }


  lambda.invoke({
    FunctionName: 'getUsername',
    Payload: JSON.stringify({
      idToken: event.idToken
    }, null, 2)
  }, function (error, data) {
    if (error) {
      context.done('error', error);
    }
    if (data.Payload) {
      username = data.Payload.replace(/['"]+/g, '');
      switch (event.body.operation) {
        case "saveLocation":
          saveLocation();
          break;
        case "saveProfile":
          saveProfile();
          break;
        default:
          context.fail("Invalid Operation");
      }
    }
  });
}
