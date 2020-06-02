import { Session } from 'meteor/session';

const moment = require('moment');

//IMPORT REQUIRED HTML FILES FOR TEMPLATE ACCESS
import './home.html';
import './appLayout.html';
import './groupHomePage.html';
import './calender.html';
import './dayDisplay.html';
import './dayEdit.html';
import './timeline.html';

import './testData.js';

//SET-UP COLLECTIONS
logs = new Mongo.Collection('dayLogs');
groups = new Mongo.Collection('groups');

//CONFIGURE THE ROUTER
Router.configure({
  layoutTemplate: 'appLayout'
});

//SET UP SESSION VARIABLES
//start by setting up week display which defaults to the most recent sunday
if(!Session.get('active-date')){
  Session.set('active-date', moment().day(0).toDate());
  setActiveWeek();
};
Session.set('selected-day', undefined);
Session.set('status', 'calender');
Session.set('active-group', -1);
Session.set('adding-group', false);

//SET UP CALENDER META INFO AND ROUTE
Router.onBeforeAction(
  function(){
    document.title('Calender Prototype');
    this.next();
  },
  {
    only:['/'],
  }
);

Router.route('/', function(){
  Meteor.subscribe('allGroups');
  Session.set('active-group', -1);
  this.render('home');
});

Router.route('/g/:_gid', function(){
  Meteor.subscribe('allGroups');
  Session.set('active-group', this.params._gid);
  this.render('groupHomePage',
    {
      data:{
        group:groups.findOne({_id:Session.get('active-group')}),
      }
    }
  );
});

Router.route('/g/:_gid/calender', function(){
  Session.set('active-group', this.params._gid);
  Meteor.subscribe('activeGroupLogs', Session.get('active-group'));
  Session.set('status', 'calender');
  this.render('calender');
});

Router.route('/g/:_gid/day/:_id', function(){
  Meteor.subscribe('allGroups');

  Session.set('active-group', this.params._gid);
  Meteor.subscribe('activeGroupLogs', Session.get('active-group'));

  var currentDateID = this.params._id;
  var info = currentDateID.split('-');
  var currentDate = new Date(info[2], info[0]-1, info[1]);

  this.render('dayDisplay', 
    {
      data:{
        group:groups.findOne({_id:Session.get('active-group')}),
        dateId:currentDateID,
        dateString:currentDate.toDateString(),
        log:getLogByID(currentDateID),
      }
    }
  );
});

Router.route('/g/:_gid/day/:_id/edit', function(){
  Meteor.subscribe('allGroups');

  Session.set('active-group', this.params._gid);
  Meteor.subscribe('activeGroupLogs', Session.get('active-group'));

  var currentDateID = this.params._id;
  var info = currentDateID.split('-');
  var currentDate = new Date(info[2], info[0]-1, info[1]);
  var log = getLogByID(currentDateID);

  this.render('dayEdit', 
    {
      data:{
        group:groups.findOne({_id:Session.get('active-group')}),
        dateId:currentDateID,
        dateString:currentDate.toDateString(),
        log:log,
        //attendence statistics:
        //added here to limit database queries
        //when loading selectors in template
        attValues:getDefaultAttValues(log),
      }
    }
  );
});

Router.route('/g/:_gid/timeline', function(){
  Session.set('active-group', this.params._gid);
  Meteor.subscribe('activeGroupLogs', Session.get('active-group'));
  Session.set('status', 'timeline');
  this.render('timeline');
});

Template.home.helpers({
  "isLoggedIn":function(){
    return Meteor.user();
  },
  "groupExists":function(){
    Meteor.subscribe('allGroups');
    return groups.findOne();
  },
  "getGroups":function(){
    Meteor.subscribe('allGroups');
    return groups.find();
  },
  "isNameEmpty":function(name){
    if(name){
      return (name.length == 0);
    }else{
      return true;
    }
  },
  "isAddingGroup":function(){
    return Session.get('adding-group');
  },
  "isEdittingGroup":function(id){
    return (Session.get('edittingGroup') == id);
  },
  "isWarningRemoval":function(id){
    return (Session.get('warningRemovalGroup') == id);
  },
  "removeGroup":function(id){
    Meteor.call('removeGroup', id, function(err, res){
      if(!res){
        console.log('\'removeGroup\': remove error');
      }
    });
  },
});

Template.home.events({
  "submit #editGroupForm":function(event){
    var thisId = $('#groupIDBox').prop('value');
    var name = $('#editGroupNameBox').prop('value');
    Meteor.call('editGroup', {id:thisId, newName:name}, function(err, res){
      if(!res){
        console.log('\'editGroup\': update error');
      }
    });
    event.preventDefault();
  },
  "submit #removeGroupForm":function(event){
    var id = $('#removeGroupIDBox').prop('value');
    Meteor.call('removeGroup', id, function(err, res){
      if(!res){
        console.log('\'removeGroup\': remove error');
      }
    });
    event.preventDefault();
  },
  "submit #addGroupForm":function(event){
    var newGroup = {
      name:$('#groupNameBox').prop('value'),
    };
    Meteor.call('addGroup', newGroup, function(err, res){
      if(!res){
        console.log('\'addGroup\': insert error');
      }
    });
    event.preventDefault();
  },
});

Template.groupHomePage.helpers({
  "isNameEmpty":function(name){
    if(name){
      return (name.length == 0);
    }else{
      return true;
    }
  },
});

Template.groupHomePage.events({
  "click #calender-link":function(event){
    var path = '/g/' + Session.get('active-group') + '/calender';
    Router.go(path);
  },
  "click #timeline-link":function(event){
    var path = '/g/' + Session.get('active-group') + '/timeline';
    Router.go(path);
  },
});

Template.breadcrumb.helpers({
  "getActiveGroup":function(){
    return Session.get('active-group');
  },
});

Template.dateForm.onRendered(function(){
  //set up datetimepicker object
  $('#datepicker').datetimepicker({
    daysOfWeekDisabled:[1,2,3,4,5,6],
    format:'MM/DD/YYYY',
  });
  //set the value of the input form the datetimepicker is attached to 
  //to a string representation the current active date
  $('#datepicker').prop('value', moment(Session.get('active-date')).format('MM/DD/YYYY'));
});

Template.dateForm.events({
  "click .js-change-date":function(event){
    var text = $('.js-date-select').val();
    var info = text.split('/');
    Session.set('active-date', new Date(info[2], info[0]-1, info[1]));
    setActiveWeek();
    Session.set('selected-day', undefined);
    //console.log('in Template.dateForm.events');
    //console.log($('.js-date-select'));
    //console.log(text);
    //console.log(info[0] + " " + info[1] + " " + info [2]);
  },
});

Template.weekDisplay.helpers({
  "getDate":function(){
    return Session.get('active-date').toDateString();
  },
  "getWeekOfDates":function(){
    return Session.get('active-week');
  },
  "getActiveGroup":function(){
    return Session.get('active-group');
  },
  "logExists":function(id){
    return logs.findOne({dateId:id});
  },
  "eventExists":function(id){
    return logs.findOne({dateId:id}).eventFlag;
  },
  "isNameEmpty":function(id){
    var log = logs.findOne({dateId:id});
    var name;

    if(log){
      name = log.name;
    }else{
      return true;
    }

    if(name){
      return (name.length == 0);
    }else{
      return true;
    }
  },
  "getEventTitle":function(id){
    return logs.findOne({dateId:id}).eventTitle;
  },
  "priorityExists":function(id){
    return logs.findOne({dateId:id}).priorityFlag;
  },
  "noticeExists":function(id){
    return logs.findOne({dateId:id}).noticeFlag;
  },
  "attReqExists":function(id){
    return logs.findOne({dateId:id}).attReqFlag;
  },
  "getAttReqValue":function(id){
    return logs.findOne({dateId:id}).attReqValue;
  },
  "getAttReqMet":function(id){
    var requirement = logs.findOne({dateId:id}).attReqValue;
    if(logs.findOne({dateId:id}).availValue >= requirement){
      return true;
    }else{
      return false;
    }
  },
  "availExists":function(id){
    return logs.findOne({dateId:id}).availFlag;
  },
  "getAvailValue":function(id){
    return logs.findOne({dateId:id}).availValue;
  },
  "unavailExists":function(id){
    return logs.findOne({dateId:id}).unavailFlag;
  },
  "getUnavailValue":function(id){
    return logs.findOne({dateId:id}).unavailValue;
  },
  "timelineLogExists":function(id){
    return logs.findOne({dateId:id}).timelineFlag;
  },
  "getTimelineLogDetails":function(id){
    return logs.findOne({dateId:id}).timelineDetails;
  },
  "isLogEmpty":function(id){
    var log = logs.findOne({dateId:id});

    if(log){
      if(log.eventFlag == true){
        return false;
      }
      if(log.noticeFlag == true){
        return false;
      }
      if(log.attReqFlag == true){
        return false;
      }
      if(log.availFlag == true){
        return false;
      }
      if(log.unavailFlag == true){
        return false;
      }
      if(log.timelineFlag == true){
        return false;
      }
      return true;
    }else{
      return true;
    }
  },
});

Template.dayDisplay.helpers({
  "isAppStatusCalender":function(){
    return (Session.get('status') == 'calender');
  },
  "isLogEmpty":function(log){
    if(log){
      if(log.eventFlag == true){
        return false;
      }
      if(log.noticeFlag == true){
        return false;
      }
      if(log.attReqFlag == true){
        return false;
      }
      if(log.availFlag == true){
        return false;
      }
      if(log.unavailFlag == true){
        return false;
      }
      if(log.timelineFlag == true){
        return false;
      }
      return true;
    }else{
      return true;
    }
  },
  "isNameEmpty":function(name){
    if(name){
      return (name.length == 0);
    }else{
      return true;
    }
  },
  "getAttReqMet":function(id){
    Meteor.subscribe('activeGroupLogs', Session.get('active-group'));
    var requirement = logs.findOne({dateId:id}).attReqValue;
    if(logs.findOne({dateId:id}).availValue >= requirement){
      return true;
    }else{
      return false;
    }
  },
  "availabilityDataExists":function(id){
    Meteor.subscribe('activeGroupLogs', Session.get('active-group'));
    var log = logs.findOne({dateId:id});
    if(log){
      return (log.availFlag || log.unavailFlag);
    }else{
      return false;
    }
  },
});

Template.dayEdit.helpers({
  "isAppStatusCalender":function(){
    return (Session.get('status') == 'calender');
  },
  "setUpSession":function(id){
    Meteor.subscribe('activeGroupLogs', Session.get('active-group'));
    var log = logs.findOne({dateId:id});
    Session.set('editEvent', false);
    Session.set('editNotice', false);
    Session.set('editAttendence', false);
    Session.set('editAvail', false);
    Session.set('editUnavail', false);
    Session.set('editTimelineLog', false);
    if(log){
      if(log.eventFlag){
        Session.set('editEvent', true);
      }
      if(log.noticeFlag){
        Session.set('editNotice', true);
      }
      if(log.attReqFlag){
        Session.set('editAttendence', true);
        Session.set('editAvail', true);
        Session.set('editUnavail', true);
      }else{
        if(log.availFlag){
          Session.set('editAvail', true);
        }
        if(log.unavailFlag){
          Session.set('editUnavail', true);
        }
      }
      if(log.timelineFlag){
        Session.set('editTimelineLog', true);
      }
    }
  },
  "isEdittingEvent":function(){
    return Session.get('editEvent');
  },
  "isEdittingNotice":function(){
    return Session.get('editNotice');
  },
  "isEdittingAttendence":function(){
    return Session.get('editAttendence');
  },
  "isEdittingAvail":function(){
    return Session.get('editAvail');
  },
  "isEdittingUnavail":function(){
    return Session.get('editUnavail');
  },
  "isEdittingTimelineLog":function(){
    return Session.get('editTimelineLog');
  },
  "getAttendenceRange":function(){
    var rangeObject = [];
    for(var i = 0; i < 101; i++){
      rangeObject[i] = {number: i};
    };
    return rangeObject;
  },
  "setAttSelectForm":function(val){
    $('#attendenceSelectForm').prop('value', val);
  },
});

Template.dayEdit.events({
  "change #eventCheckBox":function(event){
    var checked = $('#eventCheckBox').prop('checked');
    if(checked){
      Session.set('editEvent', true);
    }else{
      Session.set('editEvent', false);
    }
  },
  "change #noticeCheckBox":function(event){
    var checked = $('#noticeCheckBox').prop('checked');
    if(checked){
      Session.set('editNotice', true);
    }else{
      Session.set('editNotice', false);
    }
  },
  "change #attReqCheckBox":function(event){
    var checked = $('#attReqCheckBox').prop('checked');
    if(checked){
      Session.set('editAttendence', true);
      Session.set('editAvail', true);
      $('#availCheckBox').prop('checked', true);
      $('#availCheckBox').prop('disabled', true);
      Session.set('editUnavail', true);
      $('#unavailCheckBox').prop('checked', true);
      $('#unavailCheckBox').prop('disabled', true);
    }else{
      Session.set('editAttendence', false);
      $('#availCheckBox').prop('disabled', false);
      $('#unavailCheckBox').prop('disabled', false);
    }
  },
  "change #availCheckBox":function(event){
    var checked = $('#availCheckBox').prop('checked');
    if(checked){
      Session.set('editAvail', true);
    }else{
      Session.set('editAvail', false);
    }
  },
  "change #unavailCheckBox":function(event){
    var checked = $('#unavailCheckBox').prop('checked');
    if(checked){
      Session.set('editUnavail', true);
    }else{
      Session.set('editUnavail', false);
    }
  },
  "change #timelineCheckBox":function(event){
    var checked = $('#timelineCheckBox').prop('checked');
    if(checked){
      Session.set('editTimelineLog', true);
    }else{
      Session.set('editTimelineLog', false);
    }
  },
  "submit #js-day-edit-form":function(event){
    var date_id = $('#dateIDBox').prop('value');
    var group_id = Session.get('active-group');
    var info = date_id.split('-');
    var sort_id = info[2] + '-' + info[0] + '-' + info[1];

    //set up a temporary log object with default values
    var newLog = {
      dateId:date_id,
      groupId:group_id,
      sortId:sort_id,
      year:info[2],
      month:info[0],
      day:info[1],
      eventFlag:false,
      eventTitle:"",
      eventDescription:"",
      priorityFlag:false,
      noticeFlag:false,
      noticeDetails:"",
      attReqFlag:false,
      attReqValue:0,
      availFlag:false,
      availValue:0,
      availDetails:"",
      unavailFlag:false,
      unavailValue:0,
      unavailDetails:"",
      timelineFlag:false,
      timelineDetails:"",
    };

    /*run through each checkbox, if checkbox is checked,
        fields in that section are relevant and thus,
        add appripriate values from section to newLog */
    if($('#eventCheckBox').prop('checked')){
      newLog.eventFlag = true;

      newLog.eventTitle = $('#eventTitleBox').prop('value');

      newLog.eventDescription = $('#eventDescBox').prop('value');

      newLog.priorityFlag = $('#priorityCheckBox').prop('checked');
    };
    
    if($('#noticeCheckBox').prop('checked')){
      newLog.noticeFlag = true;

      newLog.noticeDetails = $('#noticeTextBox').prop('value');
    };
    
    if($('#attReqCheckBox').prop('checked')){
      newLog.attReqFlag = true;

      newLog.attReqValue = $('#attendenceSelectForm').prop('value');
    };
    
    if($('#availCheckBox').prop('checked')){
      newLog.availFlag = true;

      newLog.availValue = $('#availSelectForm').prop('value');

      newLog.availDetails = $('#availInfoTextBox').prop('value');
    };
    
    if($('#unavailCheckBox').prop('checked')){
      newLog.unavailFlag = true;

      newLog.unavailValue = $('#unavailSelectForm').prop('value');

      newLog.unavailDetails = $('#unavailInfoTextBox').prop('value');
    };
    
    if($('#timelineCheckBox').prop('checked')){
      newLog.timelineFlag = true;

      newLog.timelineDetails = $('#timelineLogTextBox').prop('value');
    };

    Meteor.call('addLog', newLog, function(err, res){
      if(!res){
        console.log('\'addLog\': upsert error');
      }
    });

    event.preventDefault();
  },
  "click .js-update-day-log":function(event){
    $('#js-day-edit-form').submit();
  },
});

Template.timelineBreadcrumb.helpers({
  "getActiveGroup":function(){
    return Session.get('active-group');
  },
});

Template.timelineContent.helpers({
  "getLogs":function(){
    return logs.find({}, {sort:{sortId:1}});
  },
  "getActiveGroup":function(){
    return Session.get('active-group');
  },
  "getDateString":function(id){
    var info = id.split('-');
    //return (info[0] + '/' + info[1] + '/' + info[2]);
    return (new Date(info[2], info[0]-1, info[1])).toDateString();
  },
  "isDetailsEmpty":function(details){
    if(details){
      return (details.length == 0);
    }else{
      return true;
    }
  },
});

//AUXILLARY FUNCTIONS

/*returns a set of objects representing all seven dates of the current 'active week',
  starting with the 'active-date' Session object*/
function setActiveWeek(){
  var currentDate = Session.get('active-date');
  var dates = [
    {
      date: moment(currentDate).toDate(),
      dateString: moment(currentDate).format("MM/DD/YYYY"),
      dateId: moment(currentDate).format("MM-DD-YYYY"),
    },
    {
      date: moment(currentDate).add(1, 'd').toDate(),
      dateString: moment(currentDate).add(1, 'd').format("MM/DD/YYYY"),
      dateId: moment(currentDate).add(1,'d').format("MM-DD-YYYY"),
    },
    {
      date: moment(currentDate).add(2, 'd').toDate(),
      dateString: moment(currentDate).add(2, 'd').format("MM/DD/YYYY"),
      dateId: moment(currentDate).add(2,'d').format("MM-DD-YYYY"),
    },
    {
      date: moment(currentDate).add(3, 'd').toDate(),
      dateString: moment(currentDate).add(3, 'd').format("MM/DD/YYYY"),
      dateId: moment(currentDate).add(3,'d').format("MM-DD-YYYY"),
    },
    {
      date: moment(currentDate).add(4, 'd').toDate(),
      dateString: moment(currentDate).add(4, 'd').format("MM/DD/YYYY"),
      dateId: moment(currentDate).add(4,'d').format("MM-DD-YYYY"),
    },
    {
      date: moment(currentDate).add(5, 'd').toDate(),
      dateString: moment(currentDate).add(5, 'd').format("MM/DD/YYYY"),
      dateId: moment(currentDate).add(5,'d').format("MM-DD-YYYY"),
    },
    {
      date: moment(currentDate).add(6, 'd').toDate(),
      dateString: moment(currentDate).add(6, 'd').format("MM/DD/YYYY"),
      dateId: moment(currentDate).add(6,'d').format("MM-DD-YYYY"),
    },
  ];
  Session.set('active-week', dates);
};

//takes date id string and returns 'logs' object
function getLogByID(id){
  return logs.findOne({dateId:id});
};

/*takes date log as parameter and returns a consolidated
  object of the numerical attendence values for use by
  the dayEdit template. sets all values to 0 if there is
  no log object available*/
function getDefaultAttValues(log){
  if(log){
    return {
      attReqValue:log.attReqValue,
      availValue:log.availValue,
      unavailValue:log.unavailValue,
    };
  }else{
    return {
      attReqValue:0,
      availValue:0,
      unavailValue:0,
    };
  }
}

//OPTIONAL CODE TO ADD TEST DATA
/*if(logs.findOne() == undefined){
  logs.insert({
    dateId:"05-30-2020",
    sortId:"2020-05-30",
    year:2020,
    month:05,
    day:30,
    eventFlag:true,
    eventTitle:"Road Trip",
    eventDescription:"We've grabbed our friends and we're going on an adventure.",
    priorityFlag:false,
    noticeFlag:true,
    noticeDetails:"We meet at the gas station at 6am and leave at 6:30!",
    attReqFlag:false,
    attReqValue:undefined,
    availFlag:false,
    availValue:undefined,
    availDetails:"",
    unavailFlag:false,
    unavailValue:undefined,
    unavailDetails:"",
    timelineFlag:false,
    timelineDetails:"",
  });
  logs.insert({
    dateId:"05-26-2020",
    sortId:"2020-05-26",
    year:2020,
    month:05,
    day:26,
    eventFlag:false,
    eventTitle:"Road Trip",
    eventDescription:"We've grabbed our friends and we're going on an adventure.",
    priorityFlag:false,
    noticeFlag:true,
    noticeDetails:"Make sure to start packing for the road trip now!",
    attReqFlag:false,
    attReqValue:undefined,
    availFlag:false,
    availValue:undefined,
    availDetails:"",
    unavailFlag:false,
    unavailValue:undefined,
    unavailDetails:"",
    timelineFlag:false,
    timelineDetails:"",
  });
  logs.insert({
    dateId:"05-25-2020",
    sortId:"2020-05-25",
    year:2020,
    month:05,
    day:25,
    eventFlag:true,
    eventTitle:"Meeting",
    eventDescription:"We gotta plan our moves going forward.",
    priorityFlag:true,
    noticeFlag:false,
    noticeDetails:"",
    attReqFlag:true,
    attReqValue:10,
    availFlag:true,
    availValue:11,
    availDetails:"",
    unavailFlag:true,
    unavailValue:3,
    unavailDetails:"",
    timelineFlag:true,
    timelineDetails:"Meeting went well enough. A lot was discussed and progress was made.",
  });
  logs.insert({
    dateId:"05-15-2020",
    sortId:"2020-05-15",
    year:2020,
    month:05,
    day:15,
    eventFlag:true,
    eventTitle:"BBQ",
    eventDescription:"Just hangin' out and grilling.",
    priorityFlag:false,
    noticeFlag:false,
    noticeDetails:"",
    attReqFlag:false,
    attReqValue:undefined,
    availFlag:false,
    availValue:undefined,
    availDetails:"",
    unavailFlag:false,
    unavailValue:undefined,
    unavailDetails:"",
    timelineFlag:true,
    timelineDetails:"It was fun! A lot of people we able to make it and the hot dogs were delicious!",
  });
};*/