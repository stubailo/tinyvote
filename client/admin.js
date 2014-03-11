Template.admin.helpers({
  link: function () {
    var relativePath = Router.routes['election'].path({
      slug: this.slug
    });

    var withoutLeadingSlash = relativePath.substr(1);

    return Meteor.absoluteUrl(withoutLeadingSlash);
  },
  adminToken: function () {
    return Session.get("adminToken");
  }
});