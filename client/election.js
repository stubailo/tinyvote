Template.election.helpers({
  candidates: function () {
    var candidatesList = _.map(Session.get("candidates"), function (rank, name) {
      return {
        name: name,
        rank: rank
      };
    });

    var sorted = _.sortBy(candidatesList, function (candidate) {
      return candidate.rank;
    });

    var withIndex = _.map(sorted, function (candidate, index) {
      return _.extend(candidate, {index: index + 1});
    });

    return withIndex;
  },
  formatTime: function (time) {
    return moment(time).calendar().toLowerCase();
  },
  submitting: function () {
    return Session.get("submitting");
  },
  submitted: function () {
    return Session.get("submitted");
  },
  isOwner: function () {
    return Meteor.userId() === this.owner || Session.get("adminToken");
  },
  adminToken: function () {
    return Session.get("adminToken");
  },
  pluralize: function (number, wordSingular, wordPlural) {
    if (number === 1) {
      return number + " " + wordSingular;
    } else {
      return number + " " + wordPlural;
    }
  },
  link: function () {
    var relativePath = Router.routes['election'].path({
      slug: this.slug
    });

    var withoutLeadingSlash = relativePath.substr(1);

    return Meteor.absoluteUrl(withoutLeadingSlash);
  }
});

Template.election.events({
  "keydown input": function () {
    Session.set("submitted", false);
  },
  "click .submit-vote": function (event, template) {
    Session.set("submitting", true);

    var voterName = template.find("input[name=voterName]").value.trim();

    var formErrors = {};

    if (! voterName) {
      formErrors.voterName = "Name can't be blank.";
    }

    if (! _.isEmpty(formErrors)) {
      Session.set("formErrors", formErrors);
      return;
    }

    var sortedPairs = _.sortBy(_.pairs(Session.get("candidates")), 
      function (pair) {
        return pair[1];
      });

    var candidates = _.map(sortedPairs, function (pair) {
      return pair[0];
    });

    var data = {
      voterName: voterName,
      candidates: candidates,
      electionId: this._id
    };

    Meteor.call("submitVote", data, function (error, result) {
      if (!error) {
        Session.set("submitting", false);
        Session.set("submitted", voterName);
        Session.set("formErrors", null);
      }
    });
  },
  "click .reset": function (event, template) {
    Session.set("candidates", null);
    Session.set("submitted", null);
    template.find("input[name=voterName]").value = "";
  },
  "click .close-vote": function () {
    Meteor.call("closeElection", this._id, Session.get("adminToken"),
      function (error, result) {
        if (error) {
          console.warn(error);
        }
      });
  }
});

SimpleRationalRanks = {
  beforeFirst: function (firstRank) {
    return firstRank - 1;
  },
  between: function (beforeRank, afterRank) {
    return (beforeRank + afterRank) / 2;
  },
  afterLast: function (lastRank) {
    return lastRank + 1;
  }
};

var setRank = function (name, newRank) {
  var ranks = Session.get("candidates");
  ranks[name] = newRank;
  Session.set("candidates", ranks);
};

Template.election.rendered = function () {
  $(this.find(".sortable")).sortable({
    stop: function (event, ui) {
      Session.set("submitted", false);

      // code below shamelessly hijacked from Avital's example for
      // reorderable lists
      var name = ui.item.get(0).dataset.name,
        before = ui.item.prev().get(0),
        after = ui.item.next().get(0);

      var newRank;
      if (!before) { // moving to the top of the list
        newRank = SimpleRationalRanks.beforeFirst(
          parseInt(after.dataset.rank, 10));

      } else if (!after) { // moving to the bottom of the list
        newRank = SimpleRationalRanks.afterLast(
          parseInt(before.dataset.rank, 10));

      } else {
        newRank = SimpleRationalRanks.between(
          parseInt(before.dataset.rank, 10),
          parseInt(after.dataset.rank, 10));
      }

      setRank(name, newRank);
    }
  });
};