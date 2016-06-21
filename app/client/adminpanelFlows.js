Template.adminpanelFlows.helpers({
  'flowCollection': function(){
    return FlowCollection.find({},{sort: {appId: -1, deviceId: 1, priority: -1}});
  },
  'isAdmin': function() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  },
  'action': function() {
    var firstActionType = this.actions[0].type;
    var firstActionPort = this.actions[0].port;
    firstActionPort = (firstActionPort === "CONTROLLER") ? "CON" : firstActionPort;
    return firstActionType + " : " + firstActionPort;
  },
  'appIdShortened': function(){
    return this.appId.split(".")[2];
  },
  'deviceIdShortened': function(){
    var strLength = this.deviceId.length;
    return this.deviceId.substr(strLength-4,4);
  },
  'selector': function(){
    return this.type + " : " + (this.ethType || this.protocol || this.mac || this.port || this.tcpPort || this.ip || this.udpPort || this.sctpPort || this.icmpCode || this.targetAddress);
  }
});
