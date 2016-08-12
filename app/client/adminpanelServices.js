Template.adminpanelServices.helpers({
  servicesAvailable: function(){
    if(OnosServices.find().count() > 0){
      return true;
    } else {
      return false;
    }
  },
  onosServices: function(){
    return OnosServices.find();
  },
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  }
});
