Template.adminpanelUser.helpers({
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  },
  'allUser': function(){
    return Meteor.users.find({},{sort: {status : -1}});
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
  'activeUserService': function(){
    if(this.status.online === true){
      return UserServices.find({$and : [
        {user: this._id},
        {serviceEnabled: true}
      ]});
    }
  },
  'inactiveUserService': function(){
    if(this.status.online === true){
      return UserServices.find({$and : [
        {user: this._id},
        {serviceEnabled: false}
      ]});
    }
  },
  'iconColor': function(){
    return this.serviceEnabled ? "fontColorGreen" : "fontColorRed";
  },
  'userAgent': function(){
    if(this.status.online === true){
      return this.status.lastLogin.userAgent;
    } else {
      return "n/a";
    }
  }
});

Template.adminpanelUser.events({
  'click #showFlows': function(){
    //TODO collect flows for particular user (REST) and display them
    console.log("Display Flows");
  },
});
