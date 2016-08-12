Template.adminpanel.helpers({
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  }
});

Template.adminpanel.events({
  'click #services': function(){
    Router.go('/adminpanel/services');
  },
  'click #user': function(){
    Router.go('/adminpanel/user');
  },
  'click #flows': function(){
    Router.go('/adminpanel/flows');
  }
})
