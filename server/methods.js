Meteor.methods({
  createElection: function (election) {
    check(election, {
      name: String,
      candidates: [String]
    });

    if (! election.name) {
      throw new Meteor.Error("invalid", "Must have a name.");
    }

    if ((! election.candidates) || election.candidates.length < 2) {
      throw new Meteor.Error("invalid", "Must have at least two candidates.");
    }

    if (election.candidates.length !== _.uniq(election.candidates).length) {
      throw new Meteor.Error("invalid", "Candidates must have unique names.");
    }

    // generate unique URL
    // XXX handle duplicate slug? unlikely
    var slug = Random.id().substr(0, 6).toLowerCase();
    
    election = {
      slug: slug,
      name: election.name,
      candidates: election.candidates,
      voteCount: 0,
      createdAt: new Date()
    };

    if (this.userId) {
      election.owner = this.userId;
    } else {
      election.adminToken = Random.id();
    }

    Elections.insert(election);

    return election;
  },
  submitVote: function (vote) {
    check(vote, {
      voterName: String,
      candidates: [String],
      electionId: String
    });

    if (! vote.voterName) {
      throw new Meteor.Error("invalid", "Must have a name.");
    }

    // make sure the election exists
    if (Elections.findOne(vote.electionId)) {
      var selector = {
        voterName: vote.voterName,
        electionId: vote.electionId
      };

      // if the election and voter name are the same, replace the vote
      // instead of inserting a new one
      var result = Votes.upsert(selector, vote);

      // keep count of number of votes for the election
      if (result.insertedId) {
        Elections.update({_id: vote.electionId}, {$inc: {
          voteCount: 1
        }});
      }
    }
  },
  closeElection: function (electionId, adminToken) {
    var election = Elections.findOne(electionId);

    // if no authorization info, or the info doesn't match the election
    if ((! adminToken && ! this.userId) ||
      (adminToken && election.adminToken !== adminToken) ||
      (this.userId && election.owner !== this.userId)) {
      throw new Meteor.Error("auth",
        "You're not authorized to administer this election.");
    }

    var candidates = election.candidates;
    var votes = Votes.find({electionId: electionId}).fetch();

    // from the voting package
    var winner = Voting.instantRunoff(candidates, votes);

    // XXX handle situations where voting fails, like a tie
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