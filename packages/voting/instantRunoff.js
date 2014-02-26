var tallyVotes = function (remainingCandidates, votes) {
  var points = {};

  // initialize all points to 0
  _.each(remainingCandidates, function (candidate) {
    points[candidate] = 0;
  });

  // give points to remaining candidates, ignoring votes for candidates that
  // are no longer in the running:
  //    1 point for first place
  //    x/(10 * votes.length) for each subsequent place for tiebreaker
  // these weights are designed so that a first place preference is always
  // worth more than all second places, etc
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
  // takes a list of strings that are the candidates,
  // and a list of objects that contain an array called candidates
  // that encode each voter's preferences. See the tests for examples.
  instantRunoff: function (candidates, votes) {
    // as soon as a candidate gains a majority of first preferences, they win
    var majority = votes.length / 2;

    while (candidates.length > 1) {
      // assign every candidate points based on the candidates that are still
      // in the running
      var points = tallyVotes(candidates, votes);

      // reformat to sorted array of pairs of [candidate, points]
      var pairs = _.pairs(points);
      var sorted = _.sortBy(pairs, function (pair) {
        return -pair[1];
      });

      // if highest score is majority, we have a winner!
      if (Math.floor(sorted[0][1]) > majority) {
        return sorted[0][0];
      }

      // if we have no winner and there are 2 candidates, it's a tie
      if (candidates.length === 2) {
        return null;
      }

      // if there is no winner and more than two candidates left, remove the
      // candidate with the least points and try again
      sorted.pop();

      // reformat back to a dictionary of candidates -> points
      candidates = _.map(sorted, function (pair) {
        return pair[0];
      });
    }
  }
};