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
var testusers = Meteor.settings.private.users;
var ONOS_credentials = ONOS_username + ":" + ONOS_password;
var onosReachable = "-1";
var validGlyphs = ["asterisk", "plus" , "euro" , "envelope" , "glass" , "search" , "star" , "user" , "th-large" , "th-list" , "remove" , "zoom-out" , "signal" , "trash" , "file" , "road" , "download" , "inbox" , "repeat" , "list-alt" , "flag" , "volume-off" , "volume-up" , "barcode" , "tags" , "bookmark" , "camera" , "bold" , "text-height" , "align-left" , "align-right" , "list" , "indent-right" , "picture" , "adjust" , "edit" , "check" , "step-backward" , "backward" , "pause" , "forward" , "step-forward" , "chevron-left" , "plus-sign" , "remove-sign" , "question-sign" , "screenshot" , "ok-circle" , "arrow-left" , "arrow-up" , "share-alt" , "resize-small" , "gift" , "fire" , "eye-close" , "plane" , "random" , "magnet" , "chevron-down" , "shopping-cart" , "folder-open" , "resize-horizontal" , "bullhorn" , "certificate" , "thumbs-down" , "hand-left" , "hand-down" , "circle-arrow-left" , "circle-arrow-down" , "wrench" , "filter" , "fullscreen" , "paperclip" , "link" , "pushpin" , "gbp" , "sort-by-alphabet" , "sort-by-order" , "sort-by-attributes" , "unchecked" , "collapse-down" , "log-in" , "log-out" , "record" , "open" , "import" , "send" , "floppy-saved" , "floppy-save" , "credit-card" , "cutlery" , "compressed" , "phone-alt" , "stats" , "hd-video" , "sound-stereo" , "sound-5-1" , "sound-7-1" , "registration-mark" , "cloud-upload" , "tree-deciduous" , "save-file" , "level-up" , "paste" , "equalizer" , "queen" , "bishop" , "baby-formula" , "blackboard" , "apple" , "hourglass" , "duplicate" , "scissors" , "yen" , "scale" , "ice-lolly-tasted" , "option-horizontal" , "menu-hamburger" , "oil" , "sunglasses" , "text-color" , "object-align-top" , "object-align-horizontal" , "object-align-vertical" , "triangle-right" , "triangle-bottom" , "superscript" , "menu-left" , "menu-down" ];

 // Startup
 Meteor.startup(function(){
  //create admin account on initial server startup
  if (Meteor.users.find().count() === 0) {
     var admin = Meteor.settings.private.admin.username;
     var email = Meteor.settings.private.admin.email;
     var password = Meteor.settings.private.admin.password;
     Meteor.call("createUserAccount", admin, email, password);
     _.each(testusers, function(testuser){
       Meteor.call("createUserAccount", testuser.username, testuser.password, testuser.email);
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
          } else {
            //console.log("onos reachable");
            onosReachable = true;
            //get all available services
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
        //userIP = "10.0.0.1";
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
          //user service does not exist yet -> add to collection
          if(! UserServices.findOne({serviceId: serviceToAdd.serviceId})){
            UserServices.insert({
              user: userId,
              serviceName: serviceToAdd.serviceName,
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
              serviceTpPort: serviceToAdd.serviceTpPort
            });
          }
        }
      },
      //changeServiceStatus (triggered when service-button is pressed)
      changeServiceStatus: function(serviceId, serviceUserId, restMethod){
        var userIP = Meteor.call("getIpByUserId", serviceUserId);
        //TODO delete line below
        //userIP = "10.0.0.1";
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
      //this is where 2FA happens in future
      checkVerificationToken: function(token){
        return true;
      },
      isValidGlyph: function(glyph){
        index = validGlyphs.indexOf(glyph);
        return index === -1 ? false : true;
      }
  });
