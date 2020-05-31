Meteor.methods({
  "addGroup":function(newGroup){
    return groups.insert(newGroup);
  },
  "addLog":function(newLog){
    return logs.update({dateId: newLog.dateId}, newLog, {upsert: true});
  },
});