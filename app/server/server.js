Meteor.startup(function () {
  BOUNTY_COUNT = Bounties.find().count();
});

function getRando() {
  return Math.floor(Math.random() * (BOUNTY_COUNT - 1)) + 1;
}

Meteor.publish("bounties", function() {
  var randos = [];
  _.times(50, function() { randos.push(getRando()); });
  return Bounties.find({rando: {$in: randos}});
});
