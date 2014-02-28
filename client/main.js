Meteor.subscribe("ownedElections");

Handlebars.registerHelper("formError", function (key) {
  return Session.get("formErrors") && Session.get("formErrors")[key];
});

Template.navbar.helpers({
  ownedElections: function () {
    if (Meteor.userId()) {
      return Elections.find({owner: Meteor.userId()});
    }
  }
});