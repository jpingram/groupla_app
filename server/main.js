import { Meteor } from 'meteor/meteor';

logs = new Mongo.Collection('dayLogs');
groups = new Mongo.Collection('groups');

Meteor.startup(() => {
  // code to run on server at startup
});
