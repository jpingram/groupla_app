Meteor.methods({
  "editGroup":function({id, newName}){
    if(Meteor.user()){
      return groups.update({_id:id}, {
        $set:{name:newName}
      });
    }else{
      return;
    }
  },
  "addGroup":function(newGroup){
    if(Meteor.user()){
      return groups.insert(newGroup);
    }else{
      return;
    }
  },
  "removeGroup":function(id){
    if(Meteor.user()){
      logs.remove({groupId:id});
      return groups.remove({_id:id});
    }else{
      return;
    }
  },
  "addLog":function(newLog){
    if(Meteor.user()){
      if(logs.findOne({dateId: newLog.dateId, groupId: newLog.groupId})){
        return logs.update({dateId: newLog.dateId, groupId: newLog.groupId}, newLog, {upsert: true});
      }else{
        return logs.insert(newLog);
      }
    }else{
      return;
    }
  },
});