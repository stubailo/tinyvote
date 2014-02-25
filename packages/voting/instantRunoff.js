var tallyVotes = function (remainingCandidates, votes) {
  var counts = {};

  _.each(remainingCandidates, function (candidate) {
    counts[candidate] = 0;
  });

  _.each(votes, function (vote) {
    var candidate = _.find(vote.candidates, function (candidate) {
      return _.contains(remainingCandidates, candidate);
    });

    if (candidate) {
      counts[candidate] += 1;
    }
  });

  return counts;
};

Voting = {
  instantRunoff: function (candidates, votes) {
    var majority = votes.length / 2;

    while (candidates.length > 1) {
      var counts = tallyVotes(candidates, votes);
      var pairs = _.pairs(counts);

      var sorted = _.sortBy(pairs, function (pair) {
        return -pair[1];
      });

      // if highest score is majority, we have a winner!
      if (sorted[0][1] > majority) {
        return sorted[0][0];
      }

      if (candidates.length == 2) {
        return null;
      }

      sorted.pop();
      candidates = _.map(sorted, function (pair) {
        return pair[0];
      });
    };
  }
};