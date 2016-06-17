Template.adminpanelUser.helpers({
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  },
  'allUser': function(){
    return Meteor.users.find();
  },
  'ipAddr': function(){
    if(this.status.online === true){
      return this.status.lastLogin.ipAddr;
    } else {
      return "n/a";
    }
  },
  'onlineStatus': function(){
    return this.status.online ? "online" : "offline";
  },
  'fontColor': function(){
    return this.status.online ? "fontColorGreen" : "fontColorRed";
  },
  'userService': function(){
    if(this.status.online === true){
      return UserServices.find({user: this._id});
    }
  },
  'iconColor': function(){
    return this.serviceEnabled ? "fontColorGreen" : "fontColorRed";
  }
});

Template.adminpanelUser.events({
  'click #showFlows': function(){
    //TODO collect flows for particular user (REST) and display them
    console.log("Display Flows");
  },
});
