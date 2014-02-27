Router.configure({
  autoRender: false
});

Router.map(function () {
  this.route("home", {
    path: "/",
    unload: function () {
      Session.set("candidates", null);
      Session.set("formErrors", null);
    }
  });

  this.route("election", {
    path: "/:slug",
    waitOn: function () {
      return this.subscribe("election", this.params.slug);
    },
    data: function () {
      Session.set("adminToken", this.params.adminToken);

      var election = Elections.findOne({slug: this.params.slug});
      
      if (! Session.get("candidates")) {
        var nameToRank = {};
        _.each(election.candidates, function (candidate, index) {
          nameToRank[candidate] = index;
        });
        Session.set("candidates", nameToRank);
      }

      return election;
    },
    loadingTemplate: "loading",
    unload: function () {
      Session.set("candidates", null);
      Session.set("submitting", null);
      Session.set("submitted", null);
      Session.set("formErrors", null);
    }
  });
});