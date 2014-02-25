Package.describe({
  summary: "A package for voting algorithms."
});

Package.on_use(function (api) {
  if(api.export) {
    api.export('Voting');
  }

  where = ['client', 'server'];
  api.add_files('instantRunoff.js', where);
});

Package.on_test(function (api) {
  api.use('voting', 'client');
  api.use('tinytest', 'client');
  api.add_files('test/client/instantRunoff.js', 'client');
});