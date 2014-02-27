Tinytest.add('Voting - instant runoff', function (test) {
  var candidates, votes;

  candidates = ["a"];
  votes = [
    {candidates: ["a"]}
  ];

  test.equal(Voting.instantRunoff(candidates, votes), "a", "One candidate");

  candidates = ["a", "b", "c"];
  votes = [
    {candidates: ["a", "b", "c"]},
    {candidates: ["a", "b", "c"]},
    {candidates: ["a", "b", "c"]}
  ];

  test.equal(Voting.instantRunoff(candidates, votes), "a", "Obvious outcome");


  candidates = ["a", "b", "c"];
  votes = [
    {candidates: ["a", "b", "c"]},
    {candidates: ["a", "b", "c"]},
    {candidates: ["b", "a", "c"]}
  ];

  test.equal(Voting.instantRunoff(candidates, votes), "a", "Obvious outcome 2");

  candidates = ["a", "b", "c"];
  votes = [
    {candidates: ["a", "b", "c"]},
    {candidates: ["a", "b", "c"]},
    {candidates: ["b", "c", "a"]},
    {candidates: ["b", "a", "c"]},
    {candidates: ["c", "a", "b"]}
  ];

  test.equal(Voting.instantRunoff(candidates, votes), "a", "One runoff");

  candidates = ["a", "b", "c"];
  votes = [
    {candidates: ["a", "b", "c"]},
    {candidates: ["a", "b", "c"]},
    {candidates: ["b", "c", "a"]},
    {candidates: ["b", "a", "c"]},
    {candidates: ["c", "b", "a"]}
  ];

  test.equal(Voting.instantRunoff(candidates, votes), "b", "One runoff 2");

  candidates = ["a", "b", "c"];
  votes = [
    {candidates: ["a", "b", "c"]},
    {candidates: ["a", "b", "c"]},
    {candidates: ["b", "a", "c"]},
    {candidates: ["b", "a", "c"]},
  ];

  test.isFalse(Voting.instantRunoff(candidates, votes), "Tie");
});