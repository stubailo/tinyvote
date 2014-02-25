Meteor.methods({
  createElection: function (election) {
    check(election, {
      name: String,
      candidates: [String]
    });

    // generate unique URL
    var slug = Random.id().substr(0, 6).toLowerCase();

    // XXX handle duplicate slug? unlikely
    Elections.insert({
      slug: slug,
      name: election.name,
      candidates: election.candidates,
      voteCount: 0,
      createdAt: new Date(),
      owner: this.userId
    });

    return slug;
  },
  submitVote: function (vote) {
    check(vote, {
      voterName: String,
      candidates: [String],
      electionId: String
    });

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
  closeElection: function (electionId) {
    var election = Elections.findOne(electionId);
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