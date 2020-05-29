Meteor.methods({
   "addLog":function(newLog){
      return logs.update({dateId: newLog.dateId}, newLog, {upsert: true});
   }
});