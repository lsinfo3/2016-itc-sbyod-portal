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
      return FlowCollection.find({"selectors.ip" : this.status.lastLogin.ipAddr + "/32"},{sort: {newFlow: -1, deviceId: -1, priority: -1}});
    }
  },
  'deviceIdShortened': function(){
    var deviceName = Template.adminpanelUser.__helpers.get('deviceTranslator')(this.deviceId);
    return deviceName;
  },
  'action': function() {
    var firstActionType = this.actions[0].type;
    var firstActionPort = this.actions[0].port;
    firstActionPort = (firstActionPort === "CONTROLLER") ? "CON" : firstActionPort;
    return firstActionType + " : " + firstActionPort;
  },
  'selector': function(){
    ethType = null;
    if(this.ethType){
      var ethType = Template.adminpanelUser.__helpers.get('ethTypeTranslator')(this.ethType);
    }
    return this.type + " : " + (ethType || this.protocol || this.mac || this.port || this.tcpPort || this.ip || this.udpPort || this.sctpPort || this.icmpCode || this.targetAddress);
  },
  'newFlowColor': function(){
    if(this.newFlow === true){
      return "newFlowColor";
    }
  },
  'deviceTranslator': function(deviceId){
    console.log(deviceId);
    switch(deviceId) {
      case "of:0001d0bf9cd01380": return "Switch 1";
      case "of:0001d0bf9cd62080": return "Switch 2";
      case "of:0001d0bf9cd5dd40": return "Switch 3";
      default: var strLength = deviceId.length;
               return deviceId.substr(strLength-4,4);
    }
  },
  'ethTypeTranslator': function(ethType){
    switch(ethType) {
      case "0x800": return "IP";
      default: return ethType;
    }
  }
});


Template.adminpanelUser.events({
  'click #displayFlows': function(){
  }
});
