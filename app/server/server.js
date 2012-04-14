Meteor.startup(function () {
  // code to run on server at startup
  WAITING = [];
  BOUNTY_COUNT = Bounties.find().count();
});

function getRando() {
  return Math.floor(Math.random() * (BOUNTY_COUNT - 1)) + 1;
}

Meteor.methods({
  startSingle: function() {
    return Meteor.uuid();
  },
  startBattle: function() {
    if (WAITING.length) {
      var uuid = WAITING.pop();
    } else {
      var uuid = Meteor.uuid();
      WAITING.push(uuid);
    }

    return uuid;
  },
  giveUp: function(uuid) {
    WAITING = _.without(WAITING, uuid);
    return true;
  },
  join: function(uuid) {
    var randos = [];
    _.times(5, function() { randos.push(getRando()); });
    Meteor.publish("bounties-" + uuid, function() {
      return Bounties.find({rando: {$in: randos}});
    });
  }
});
