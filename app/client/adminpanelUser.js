Template.adminpanelUser.helpers({
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  },
  'allUser': function(){
    return Meteor.users.find({},{sort: {status : -1}});
  },
  'ipAddr': function(){
    if(this.status){
      var userIp = this.status.lastLogin.ipAddr
      if(userIp){
        return userIp;
      } else {
        return "n/a";
      }
    } else {
      return "n/a";
    }
  },
  'onlineStatus': function(){
    if(this.status){
      return this.status.online ? "active" : "inactive";
    } else {
      return "inactive";
    }
  },
  'fontColor': function(){
    if(this.status){
      return this.status.online ? "fontColorGreen" : "fontColorRed";
    } else {
      return "fontColorRed";
    }
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
    if(this.status){
      var ISODate = this.status.lastLogin.date;
      if(ISODate){
        return ISODate.toUTCString().slice(0, -7);
      } else {
        return "never";
      }
    } else {
      return "never";
    }
  },
  'userAgent': function(){
      return this.status.lastLogin.userAgent;
  },
  'userFlow': function(){
    if(this.status){
      return FlowCollection.find({"selectors.ip" : this.status.lastLogin.ipAddr + "/32"},{sort: {deviceId: -1, priority: -1}});
    }
  },
  'appIdShortened': function(){
    var strLength = this.deviceId.length;
    return this.deviceId.substr(strLength-4,4);
  },
  'action': function() {
    var firstActionType = this.actions[0].type;
    var firstActionPort = this.actions[0].port;
    firstActionPort = (firstActionPort === "CONTROLLER") ? "CON" : firstActionPort;
    return firstActionType + " : " + firstActionPort;
  },
  'selector': function(){
    return this.type + " : " + (this.ethType || this.protocol || this.mac || this.port || this.tcpPort || this.ip || this.udpPort || this.sctpPort || this.icmpCode || this.targetAddress);
  }
});


Template.adminpanelUser.events({
  'click #displayFlows': function(){
  }
});
