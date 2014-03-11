Template.home.events({
  "submit form.new-election": function (event, template) {
    event.preventDefault();

    var name = template.find("input[name=name]").value;
    var text = template.find("textarea[name=candidates]").value.trim();

    var formErrors = {};

    if (! name) {
      formErrors.name = "Name can't be blank.";
    }

    var candidates = _.map(text.split("\n"), function (line) {
      return line.trim();
    });

    if (candidates.length !== _.uniq(candidates).length) {
      formErrors.candidates = "Candidates must have unique names.";
    }

    // make sure we can't have duplicate candidate names
    if (candidates.length < 2) {
      formErrors.candidates = "Must have at least two candidates.";
    }

    if (! _.isEmpty(formErrors)) {
      Session.set("formErrors", formErrors);
      return;
    }

    var data = {
      name: name,
      candidates: candidates
    };

    Meteor.call("createElection", data, function (error, result) {
      // result is: {slug: String, adminToken: String}
      
      if (result.adminToken) { // election created without login
        Router.go("/" + result.slug + "?adminToken=" + result.adminToken);
      } else {
        Router.go("election", {
          slug: result.slug
        });
      }
    });
  }
});

Template.home.rendered = function () {
  $(this.find("textarea")).autosize({
    append: "\n"
  }).trigger('autosize.resize');
};