Meteor.publish('allGroups', function(){
  return groups.find();
});

Meteor.publish('activeGroupLogs', function(activeGroup){
  return logs.find({groupId:activeGroup});
});