Meteor.publish('ownedGroups', function(){
  if(this.userId){
    return groups.find({userId:this.userId});
  }else{
    return;
  }
});

Meteor.publish('allGroups', function(){
  return groups.find();
});

Meteor.publish('activeGroupLogs', function(activeGroup){
  return logs.find({groupId:activeGroup});
});