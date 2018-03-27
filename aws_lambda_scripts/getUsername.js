var AWS = require('aws-sdk');
var jwtDecode = require('jwt-decode');

exports.handler = (event, context, callback) => {
    var idToken = event.idToken;
    var decoded = jwtDecode(idToken);
    context.succeed(decoded['cognito:username'])
};
