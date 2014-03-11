Meteor.subscribe("ownedElections");

Handlebars.registerHelper("formError", function (key) {
  return Session.get("formErrors") && Session.get("formErrors")[key];
});

Handlebars.registerHelper("pluralize",
  function (number, wordSingular, wordPlural) {
    if (number === 1) {
      return number + " " + wordSingular;
    } else {
      return number + " " + wordPlural;
    }
  });

Template.navbar.helpers({
  ownedElections: function () {
    if (Meteor.userId()) {
      return Elections.find({owner: Meteor.userId()});
    }
  }
});