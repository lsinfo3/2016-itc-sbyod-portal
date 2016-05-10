//publish collections to clients
Meteor.publish("onosServices", function() {
  return OnosServices.find();
});
Meteor.publish("userServices", function() {
  return UserServices.find();
});
//initialize rest endpoints, credentials and polling rate
var urlPrefix = Meteor.settings.private.ONOSRestEndpoint;
var urlBYOD = Meteor.settings.private.ONOSByodEndpoint;
var ONOS_username = Meteor.settings.private.onosCredentials.username;
var ONOS_password = Meteor.settings.private.onosCredentials.password;
var pollingRate = Meteor.settings.private.pollingRate;
var ONOS_credentials = ONOS_username + ":" + ONOS_password;
var onosReachable = "-1";

 // Startup
 Meteor.startup(function(){
  //create admin account
  if (Meteor.users.find().count() === 0) {
     var admin = Meteor.settings.private.admin.username;
     var email = Meteor.settings.private.admin.email;
     var password = Meteor.settings.private.admin.password;
     Meteor.call("createUserAccount", admin, email, password);
   }
   Meteor.call("triggerServiceDetection");
   //initialize meteor server (check endpoint rachability, load collections, etc.)
 });

Meteor.methods({
      serviceDetection: function(){
        Meteor.call("checkRestEndpoint", function(error, result){
          if(error){
            console.log("Error while connecting to ONOS Controller. Please check Rest endpoint and/or credentials in the settings.json file.");
            onosReachable = false;
          } else {
            console.log("onos reachable");
            onosReachable = true;
            Meteor.call("updateServices");
            //get all user Services
            Meteor.call("updateUserServices");
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
        //console.log("updateServices");
        //get all Services and store them in collection OnosServices
        Meteor.call("getServices", function(error, result) {
          if(error){
            console.error(error);
          } else {
            _.each(result.services, function(serviceToAdd){
              Meteor.call("insertService", "OnosServices", serviceToAdd);
            }, this);
          }
        });
      },
      //get all BYOD Services from ONOS
      getServices: function(){
         this.unblock();
         var url = urlPrefix + urlBYOD + "/service"
         return HTTP.call("GET", url, {auth: ONOS_credentials}).data;
      },


      /*

      user-services part

      */
      //insert services a user is allowed to use into UserServices collection
      updateUserServices: function() {
        //console.log("updateUserServices");
        //get all logged in users
        var users = UserStatus.connections.find().fetch();
        _.each(users, function(user){
          //check if userId is defined
          if(user.userId){
            //do this for every single logged in user -> userStatus.connections
            Meteor.call("checkUserServices", user.ipAddr, function(error, result) {
              if(error){
                console.error(error);
              } else {
                //check if service was revoked
                Meteor.call("checkServiceRevoke", result.services, user.userId);
                //store services in collection
                _.each(result.services, function(serviceToAdd){
                    Meteor.call("insertService", "UserServices", serviceToAdd, user.userId);
                },this);
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
          var existingService = UserServices.findOne({serviceId: serviceToAdd.serviceId});
          if(! UserServices.findOne({serviceId: serviceToAdd.serviceId})){
            UserServices.insert({
              user: userId,
              serviceName: serviceToAdd.serviceName,
              serviceId: serviceToAdd.serviceId,
              serviceTpPort: serviceToAdd.serviceTpPort,
              serviceEnabled: serviceToAdd.serviceEnabled,
              servicePending: false
            });
          } else if (existingService.serviceEnabled !== serviceToAdd.serviceEnabled) {
            //service already exists, so check if there was a status change
            var service_Id = existingService._id;
            var serviceStateNew = serviceToAdd.serviceEnabled;
            console.log("There is a state to update: " + serviceToAdd.serviceName);
            console.log(existingService.serviceEnabled);
            console.log(serviceToAdd.serviceEnabled)
            UserServices.update(service_Id, { $set: {serviceEnabled: serviceStateNew}});
            UserServices.update(service_Id, { $set: {servicePending: false}});
          }
          //Collection is "OnosServices"
        } else {
          if(! OnosServices.findOne({serviceId: serviceToAdd.serviceId})){
            OnosServices.insert({
              serviceName: serviceToAdd.serviceName,
              serviceId: serviceToAdd.serviceId,
              serviceTpPort: serviceToAdd.serviceTpPort
            });
          }
        }
      },
      //changeServiceStatus (triggered when service-button is pressed)
      changeServiceStatus: function(serviceId, serviceUserId, restMethod){
        var userIP = Meteor.call("getIpByUserId", serviceUserId);
        //TODO delete line below
        userIP = "10.0.0.1";
        Meteor.call("changeServiceStatus_Request", restMethod, userIP, serviceId, function(error, result){
          if(error){
            console.error(error);
          } else{
            //update status of a users service in collection
            Meteor.call("updateServiceStatus", serviceUserId, serviceId, result);
          }
        });
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
      getIpByUserId: function(userID){
        var user = UserStatus.connections.findOne({userId: userID});
        return user.ipAddr;
      },
      createUserAccount: function(username, email, password){
        var newUserId = Accounts.createUser({
          username: username,
          email: email,
          password : password});
      },
      //trigger service polling every "pollingRate" ms
      triggerServiceDetection: function() {
        Meteor.setInterval( function() {
          Meteor.call("serviceDetection")
        }, pollingRate);
      },
      checkVerificationToken: function(token){
        return true;
      }
  });
