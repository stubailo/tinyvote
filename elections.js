Elections = new Meteor.Collection("elections");
Votes = new Meteor.Collection("votes");

Router.configure({
  autoRender: false
});

Router.map(function () {
  this.route("home", {
    path: "/",
    unload: function () {
      Session.set("candidates", null);
    }
  });

  this.route("election", {
    path: "/:slug",
    waitOn: function () {
      return this.subscribe("election", this.params.slug);
    },
    data: function () {
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
    }
  });
});

if (Meteor.isClient) {
  Meteor.subscribe("ownedElections");

  Template.home.events({
    "submit form.new-election": function (event, template) {
      if (Meteor.userId()) {
        var name = template.find("input[name=name]").value;
        var text = template.find("textarea[name=candidates]").value;

        var candidates = _.map(text.split("\n"), function (line) {
          return line.trim();
        });

        var data = {
          name: name,
          candidates: candidates
        };

        Meteor.call("createElection", data, function (error, result) {
          Router.go("election", {slug: result});
        });
      }

      event.preventDefault();
    }
  });

  Template.home.rendered = function () {
    $(this.find("textarea")).autosize({
      append: "\n"
    }).trigger('autosize.resize');
  };

  Template.navbar.helpers({
    ownedElections: function () {
      if (Meteor.userId()) {
        return Elections.find({owner: Meteor.userId()});
      }
    }
  });

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
      return Meteor.userId() === this.owner;
    },
    pluralize: function (number, wordSingular, wordPlural) {
      if (number === 1) {
        return number + " " + wordSingular;
      } else {
        return number + " " + wordPlural;
      }
    }
  });

  Template.election.events({
    "keydown input": function () {
      Session.set("submitted", false);
    },
    "click .submit-vote": function (event, template) {
      Session.set("submitting", true);

      var voterName = template.find("input[name=voterName]").value.trim();

      // XXX add validation
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
        console.log(error, result);

        if (!error) {
          Session.set("submitting", false);
          Session.set("submitted", voterName);
        }
      });
    },
    "click .reset": function (event, template) {
      Session.set("candidates", null);
      Session.set("submitted", null);
      template.find("input[name=voterName]").value = "";
    },
    "click .close-vote": function () {
      Meteor.call("closeElection", this._id, function (error, result) {
        // nothing yet
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
}

if (Meteor.isServer) {
  Elections._ensureIndex("slug", {unique: 1});
  Votes._ensureIndex("electionId");
  Votes._ensureIndex({electionId: 1, voterName: 1}, {unique: 1});

  Meteor.publish("election", function (slug) {
    return Elections.find({slug: slug});
  });

  Meteor.publish("ownedElections", function () {
    if (this.userId) {
      return Elections.find({owner: this.userId});
    }
  });

  Meteor.methods({
    createElection: function (data) {
      check(data, {
        name: String,
        candidates: [String]
      });

      var slug = Random.id().substr(0, 6).toLowerCase();

      // XXX handle duplicate slug? lol
      Elections.insert({
        slug: slug,
        name: data.name,
        candidates: data.candidates,
        voteCount: 0,
        createdAt: new Date(),
        owner: this.userId
      });

      return slug;
    },
    submitVote: function (data) {
      check(data, {
        voterName: String,
        candidates: [String],
        electionId: String
      });

      var election = Elections.findOne(data.electionId);

      if (election) {
        var selector = {
          voterName: data.voterName,
          electionId: data.electionId
        };

        var result = Votes.upsert(selector, data);

        if (result.insertedId) {
          Elections.update({_id: data.electionId}, {$inc: {
            voteCount: 1
          }});
        }
      }
    },
    closeElection: function (electionId) {
      var election = Elections.findOne(electionId);
      var candidates = election.candidates;
      var votes = Votes.find({electionId: electionId}).fetch();

      var winner = Voting.instantRunoff(candidates, votes);

      if (winner) {
        Elections.update({_id: electionId}, {
          $set: {
            closed: true,
            closedAt: new Date(),
            winner: winner
          }
        });
      }
    }
  });
}
