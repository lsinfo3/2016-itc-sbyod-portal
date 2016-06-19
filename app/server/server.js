//publish collections to clients
Meteor.publish("onosServices", function() {
  return OnosServices.find();
});
Meteor.publish("userServices", function(userId) {
  if(Roles.userIsInRole(this.userId, ['admin'])) {
     return UserServices.find();
  } else {
    return UserServices.find({user: userId});
  }
});
// publish all existing roles to client
Meteor.publish("roles", function (){
  if(Roles.userIsInRole(this.userId, ['admin'])) {
     return Meteor.roles.find();
  }
  //return Meteor.roles.find();
});
// publish collection holding all users to clients
Meteor.publish('allUsers', function(){
  if(Roles.userIsInRole(this.userId, ['admin'])) {
     return Meteor.users.find();
  } else {
  // user is not an admin -> return only the own user object
     return Meteor.users.find({_id: this.userId});
  }
});
//publish FlowCollection to user admin
Meteor.publish("flows", function() {
  if(Roles.userIsInRole(this.userId, ['admin'])){
    return FlowCollection.find();
  }
});
//initialize rest endpoints, credentials and polling rate
var urlPrefix = Meteor.settings.private.ONOSRestEndpoint;
var urlBYOD = Meteor.settings.private.ONOSByodEndpoint;
var ONOS_username = Meteor.settings.private.onosCredentials.username;
var ONOS_password = Meteor.settings.private.onosCredentials.password;
var pollingRate = Meteor.settings.private.pollingRate;
var testusers = Meteor.settings.private.users;
var ONOS_credentials = ONOS_username + ":" + ONOS_password;
var onosReachable = "-1";
//every flowResetCounter * pollingRate the flow collection is deleted
//this deletes old unused flows
var flowResetCounter = 5;

 // Startup
 Meteor.startup(function(){
  //create admin account on initial server startup
  if (Meteor.users.find().count() === 0) {
     var admin = Meteor.settings.private.admin.username;
     var email = Meteor.settings.private.admin.email;
     var password = Meteor.settings.private.admin.password;
     adminRole = "admin";
     Meteor.call("createUserAccount", admin, email, password, adminRole);
     defaultRole = "default"
     Meteor.call("createNewRole", defaultRole);
     _.each(testusers, function(testuser){
       Meteor.call("createUserAccount", testuser.username, testuser.email, testuser.password, defaultRole);
     }, this);
   }
   // start polling routine
   Meteor.call("triggerServiceDetection");
 });

Meteor.methods({
      serviceDetection: function(){
        Meteor.call("checkRestEndpoint", function(error, result){
          if(error){
            console.log("Error while connecting to ONOS Controller. Please check REST endpoint and/or credentials in the settings.json file. Also make sure ONOS is running and S-BYOD plugin is installed.");
            onosReachable = false;
            OnosServices.remove({});
            UserServices.remove({});
            FlowCollection.remove({});
          } else {
            //console.log("onos reachable");
            onosReachable = true;
            //get all available services
            Meteor.call("updateServices");
            //get all user Services
            Meteor.call("updateUserServices");
            //get all flows
            Meteor.call("updateFlows");
          }
        });
      },
      checkRestEndpoint: function(){
        this.unblock();
        var url = urlPrefix + urlBYOD + "/service";
        return HTTP.call("GET", url, {timeout:300, auth: ONOS_credentials}).statusCode;
      },
      /*

      general services part

      */
      //get all Services available from ONOS and store them
      updateServices: function(){
        //get all Services and store them in collection OnosServices
        if(flowResetCounter === 0){
          FlowCollection.remove({});
          flowResetCounter = 4;
        }
        Meteor.call("getServices", function(error, result) {
          if(error){
            console.error(error);
          } else {
            _.each(result.services, function(serviceToAdd){
              Meteor.call("insertService", "OnosServices", serviceToAdd);
            }, this);
          }
        });
        flowResetCounter -= 1;
      },
      //get all BYOD Services from ONOS
      getServices: function(){
         this.unblock();
         var url = urlPrefix + urlBYOD + "/service"
         return HTTP.call("GET", url, {auth: ONOS_credentials}).data;
      },
      /*

      flow part

      */
      updateFlows: function(){
        //get the flows from endpoint "v1/flows" and store them in FlowCollection
        Meteor.call("getFlows", function(error, result) {
          if(error) console.error(error)
          else{
            _.each(result.flows, function(flowToAdd){
              Meteor.call("insertFlow", flowToAdd);
            },this);
          }
        });
      },
      //get the flows over REST
      getFlows: function(){
        this.unblock();
        var url = urlPrefix + "/v1" + "/flows";
        return HTTP.call("GET", url, {auth: ONOS_credentials}).data;
      },
      //store a flow
      insertFlow: function(flowToAdd){
        if(! FlowCollection.findOne({_id: flowToAdd.id}) ){
          FlowCollection.insert({
            _id: flowToAdd.id,
            tableId: flowToAdd.tableId,
            appId: flowToAdd.appId,
            priority: flowToAdd.priority,
            deviceId: flowToAdd.deviceId,
            state: flowToAdd.state,
            actions: flowToAdd.treatment.instructions,
            selectors: flowToAdd.selector.criteria
          });
          //state of a flow has changed
        } else if(FlowCollection.findOne({_id: flowToAdd.id}).state !== flowToAdd.state){
          FlowCollection.remove({_id: flowToAdd.id});
          Meteor.call("insertFlow", flowToAdd);
        }
      },
      /*

      user-services part

      */
      //insert services, a user is allowed to use, into UserServices collection
      updateUserServices: function() {
        //get all logged in users
        var users = UserStatus.connections.find().fetch();
        _.each(users, function(user){
          //check if userId is defined
          if(user.userId){
            //do this for every single logged in user -> userStatus.connections
            Meteor.call("checkUserServices", user.ipAddr, function(error, result) {
              if(error){
                console.error(error);
                //check if result exists
              } else if (result){
                //check if service got revoked
                Meteor.call("checkServiceRevoke", result.services, user.userId);
                //store services in collection
                _.each(result.services, function(serviceToAdd){
                    Meteor.call("insertService", "UserServices", serviceToAdd, user.userId);
                },this);
              } else {
                console.error("Error while fetching users services, probably users IP unknown. IP: " + user.ipAddr);
              }
            });
          }
        });
      },
      //return all services, including status, the user with userIP is able to connect to
      checkUserServices: function(userIpAddr) {
        var userIP = userIpAddr;
        //TODO delete line below
        userIP = "10.0.0.1";
        var url = urlPrefix + urlBYOD + "/user/" + userIP;
        var restMethod = "GET";
        this.unblock();
        return HTTP.call(restMethod, url, {auth: ONOS_credentials}).data;
      },
      checkServiceRevoke: function(onosServices, userId){
        //check all services of a special user if a service got revoked
        _.each(UserServices.find({user: userId}).fetch(), function(userService){
          //if userService is not in ONOS services, remove this userService (service got revoked by ONOS)
          if(! Meteor.call("findServiceById", onosServices, userService.serviceId)){
            UserServices.remove({serviceId: userService.serviceId});
          }
        }, this);
      },
      findServiceById: function(onosServices, serviceIdToFind){
        var serviceFound = false;
        _.each(onosServices, function(onosService){
          if(onosService.serviceId === serviceIdToFind){
            serviceFound = true;
          }
        });
        return serviceFound;
      },
      //insert given service in collection
      insertService: function(collection, serviceToAdd, userId){
        if(collection === "UserServices"){
          var existingService = UserServices.findOne({ $and: [ {serviceId: serviceToAdd.serviceId}, {user: userId} ]});
          //user service for particular user does not exist yet -> add to collection
          if(! UserServices.findOne({
                  $and: [
                    {serviceId: serviceToAdd.serviceId},
                    {user: userId}
                    ]
                  })) {
            UserServices.insert({
              user: userId,
              serviceName: serviceToAdd.serviceName.replace(/_|-/g, ' '),
              serviceId: serviceToAdd.serviceId,
              serviceTpPort: serviceToAdd.serviceTpPort,
              serviceEnabled: serviceToAdd.serviceEnabled,
              servicePending: false,
              icon: serviceToAdd.icon
            });
            //user service exists but state is different (enabled/disabled) -> update state
          } else if (existingService.serviceEnabled !== serviceToAdd.serviceEnabled) {
            //service already exists, so check if there was a status change
            var service_Id = existingService._id;
            var serviceStateNew = serviceToAdd.serviceEnabled;
            //console.log("There is a state to update: " + serviceToAdd.serviceName);
            //console.log(existingService.serviceEnabled);
            //console.log(serviceToAdd.serviceEnabled)
            UserServices.update(service_Id, { $set: {serviceEnabled: serviceStateNew}});
            UserServices.update(service_Id, { $set: {servicePending: false}});
          }
          //Collection is "OnosServices"
        } else {
          //add service to collection if not already existing
          if(! OnosServices.findOne({serviceId: serviceToAdd.serviceId})){
            OnosServices.insert({
              serviceName: serviceToAdd.serviceName,
              serviceId: serviceToAdd.serviceId,
              serviceTpPort: serviceToAdd.serviceTpPort,
              serviceIcon: serviceToAdd.icon
            });
          }
        }
      },
      //changeServiceStatus (triggered when service-button is pressed)
      changeServiceStatus: function(serviceId, serviceEnabled, serviceUserId, restMethod){
        var errorFlag = false;
        var userIP = Meteor.call("getIpByUserId", serviceUserId);
        //TODO delete line below
        userIP = "10.0.0.1";
        Meteor.call("changeServiceStatus_Request", restMethod, userIP, serviceId, function(error, result){
          if(error){
            console.error(error);
          } else {
            if(result.enabled === serviceEnabled){
              errorFlag = true;
            } else {
              Meteor.call("updateServiceStatus", serviceUserId, serviceId, result);
            }
          }
        });
        return errorFlag;
      },
      //POST/DELETE Rest call to enabled/disable a service to a user
      changeServiceStatus_Request: function(restMethod, userIP, serviceId){
        var url = urlPrefix + urlBYOD + "/user/" + userIP + "/service/" + serviceId;
        this.unblock();
        return HTTP.call(restMethod, url, {auth: ONOS_credentials}).data;
      },
      //update status of a users service in collection
      updateServiceStatus: function(serviceUserId, serviceId, result){
        var newState = result.enabled;
        //get service by serviceId
        var service = UserServices.findOne({
          $and: [
            {user: serviceUserId},
            {serviceId: serviceId}
          ]
        });
        //update collection via service._id which is collectionSide _id
        UserServices.update(service._id, { $set: {serviceEnabled: newState}});
      },
      checkServiceExistance: function(serviceId){
        var url = urlPrefix + urlBYOD + "/service/" + serviceId;
        this.unblock();
        return HTTP.call("GET", url, {auth: ONOS_credentials}).data;
      },
      getIpByUserId: function(userId){
        var user = UserStatus.connections.findOne({userId: userId});
        return user.ipAddr;
      },
      createUserAccount: function(username, email, password, role){
        var newUserId = Accounts.createUser({
          username: username,
          email: email,
          password : password});
        Roles.addUsersToRoles(newUserId, role);
      },
      createNewRole: function(role){
        return Meteor.roles.insert({
          name: role
        });
      },
      //trigger service polling every "pollingRate" ms
      triggerServiceDetection: function() {
        Meteor.setInterval( function() {
          Meteor.call("serviceDetection")
        }, pollingRate);
      },
      //this is where 2FA happens in future
      checkVerificationToken: function(token){
        return true;
      },
      getServiceNameById: function(serviceId){
        return OnosServices.findOne({serviceId: serviceId}).serviceName;
      }
  });
