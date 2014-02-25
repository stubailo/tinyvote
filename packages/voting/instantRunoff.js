var tallyVotes = function (remainingCandidates, votes) {
  var points = {};

  _.each(remainingCandidates, function (candidate) {
    points[candidate] = 0;
  });

  // give points to remaining candidates
  // 1 point for first place
  // x/(10 * votes.length) for each subsequent place for tiebreaker

  _.each(votes, function (vote) {
    var weight = 1;

    _.each(vote.candidates, function (candidate) {
      if(_.contains(remainingCandidates, candidate)) {
        points[candidate] += weight;
        weight /= (10*votes.length);
      }
    });
  });

  return points;
};

Voting = {
  instantRunoff: function (candidates, votes) {
    var majority = votes.length / 2;

    while (candidates.length > 1) {
      var points = tallyVotes(candidates, votes);
      var pairs = _.pairs(points);

      var sorted = _.sortBy(pairs, function (pair) {
        return -pair[1];
      });

      // if highest score is majority, we have a winner!
      if (Math.floor(sorted[0][1]) > majority) {
        return sorted[0][0];
      }

      if (candidates.length === 2) {
        return null;
      }

      // XXX identify ties...
      sorted.pop();

      candidates = _.map(sorted, function (pair) {
        return pair[0];
      });
    }
  }
};