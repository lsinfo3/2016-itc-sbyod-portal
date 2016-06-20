Template.adminpanelUser.helpers({
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  },
  'allUser': function(){
    return Meteor.users.find({},{sort: {status : -1}});
  },
  'ipAddr': function(){
      return this.status.lastLogin.ipAddr;
  },
  'onlineStatus': function(){
    return this.status.online ? "active" : "inactive";
  },
  'fontColor': function(){
    return this.status.online ? "fontColorGreen" : "fontColorRed";
  },
  'activeUserService': function(){
    return UserServices.find({$and : [
      {user: this._id},
      {serviceEnabled: true}
    ]});
  },
  'inactiveUserService': function(){
    return UserServices.find({$and : [
      {user: this._id},
      {serviceEnabled: false}
    ]});
  },
  'iconColor': function(){
    return this.serviceEnabled ? "fontColorGreen" : "fontColorRed";
  },
  'lastActive': function(){
    var ISODate = this.status.lastLogin.date;
    return ISODate.toUTCString().slice(0, -7);
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
