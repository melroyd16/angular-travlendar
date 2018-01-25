// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,

  region: 'us-west-2',

  identityPoolId: 'us-west-2:8763dc1c-39ea-4734-9021-b9037792d1b3',
  userPoolId: 'us-west-2_xB02p2TFa',
  clientId: '6cnu6kmgit37adc14p69ugssli',

  rekognitionBucket: 'rekognition-pics',
  albumName: 'usercontent',
  bucketRegion: 'us-west-2',

  ddbTableName: 'LoginTrailtravlendar',

  cognito_idp_endpoint: '',
  cognito_identity_endpoint: '',
  sts_endpoint: '',
  dynamodb_endpoint: '',
  s3_endpoint: '',
  calendar_api: 'https://j24dhhvp0a.execute-api.us-west-2.amazonaws.com/dev/calendar',
  profile_api: 'https://j24dhhvp0a.execute-api.us-west-2.amazonaws.com/dev/profile',
  events_api: 'https://j24dhhvp0a.execute-api.us-west-2.amazonaws.com/dev/events',
  google_api_key: 'AIzaSyBOD1obaKMooT5SVbWwukvqImOLPdQBMHE'
};
