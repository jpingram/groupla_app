Meteor.publish('allGroups', function(){
  if(this.userId){
    return groups.find({userId:this.userId});
  }else{
    return;
  }
});

Meteor.publish('activeGroupLogs', function(activeGroup){
  return logs.find({groupId:activeGroup});
});