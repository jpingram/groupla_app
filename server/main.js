import { Meteor } from 'meteor/meteor';

logs = new Mongo.Collection('dayLogs');

Meteor.startup(() => {
  // code to run on server at startup
});
