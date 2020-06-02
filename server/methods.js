Meteor.methods({
  "editGroup":function({id, newName}){
    return groups.update({_id:id}, {
      $set:{name:newName}
    });
  },
  "addGroup":function(newGroup){
    return groups.insert(newGroup);
  },
  "removeGroup":function(id){
    logs.remove({groupId:id});
    return groups.remove({_id:id});
  },
  "addLog":function(newLog){
    if(logs.findOne({dateId: newLog.dateId, groupId: newLog.groupId})){
      return logs.update({dateId: newLog.dateId, groupId: newLog.groupId}, newLog, {upsert: true});
    }else{
      return logs.insert(newLog);
    }
  },
});