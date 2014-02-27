// define collections
Elections = new Meteor.Collection("elections");
Votes = new Meteor.Collection("votes");

if (Meteor.isServer) {
  Elections._ensureIndex("slug", {unique: 1});

  Votes._ensureIndex("electionId");
  Votes._ensureIndex({electionId: 1, voterName: 1}, {unique: 1});

  // get a certain election by the slug
  Meteor.publish("election", function (slug) {
    return Elections.find({slug: slug}, {fields: {adminToken: 0}});
  });

  // when you're logged in, get all of the elections you own
  Meteor.publish("ownedElections", function () {
    if (this.userId) {
      return Elections.find({owner: this.userId});
    }
  });
}