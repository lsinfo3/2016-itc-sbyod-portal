Template.adminpanelUser.helpers({
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  },
  'allUser': function(){
    return Meteor.users.find({},{sort: {status : -1}});
  },
  'ipAddr': function(){
    var userIp = this.status.lastLogin.ipAddr
    if(userIp){
      return userIp;
    } else {
      return "n/a";
    }
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
    if(ISODate){
      return ISODate.toUTCString().slice(0, -7);
    } else {
      return "never";
    }
  },
  'userAgent': function(){
      return this.status.lastLogin.userAgent;
  }
});
