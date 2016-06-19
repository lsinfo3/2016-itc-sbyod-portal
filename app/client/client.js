Meteor.startup(function() {
  //alert configuration
  sAlert.config({
    effect: 'stackslide',
    position: 'top-right',
    timeout: 4000,
    html: true,
    onRouteClose: false,
    stack: true,
    offset: 30, // in px - will be added to first alert (bottom or top - depends of the position in config)
    beep: false,
    onClose: _.noop //
  });
});

//variables
const pendingServices = new Array;

Meteor.Spinner.options = {
    lines: 10, // The number of lines to draw
    length: 5, // The length of each line
    width: 4, // The line thickness
    radius: 8, // The radius of the inner circle
    corners: 0.7, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#fff', // #rgb or #rrggbb
    speed: 0.5, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: true, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 'auto', // Top position relative to parent in px
    left: 'auto' // Left position relative to parent in px
};

var checkAvailable = function(){
  Meteor.call("checkRestEndpoint", function(error, result){
    if(error){
      console.log(error.error);
      sAlert.error("Error code: " + error.error + ". Server not reachable. <br> Please try again later.");
    }
  });
}

//enable password only login
Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
  });

Template.body.events({
  'click #logout'() {
    Meteor.logout();
  }
});

Template.services.helpers({
  //return onos services to display in frontend
  userServices: function() {
    return UserServices.find();
  }
});

Template.services.events({
  'click .serviceBtn': function() {
    self = this;
    //check if Rest Endpoint is available
    Meteor.call("checkRestEndpoint", function(error, result){
      if(error){
        sAlert.error("Error code: " + error.error + ". Server not reachable. <br> Please try again later.");
      } else {
        //Rest check successful!
        //if service is active -> disable service
        if(self.serviceEnabled === true){
          //disable chosen service for user
          restMethod = "DELETE";
          Meteor.call("changeServiceStatus", self.serviceId, self.serviceEnabled, Meteor.userId(), restMethod);
          //set Session variable for service, holding the current state of this service
          Session.set(self._id, "inactive");
          //sAlert.success(self.serviceName + " deactivated");
        } else if(self.serviceEnabled === false && self.servicePending === false){
          UserServices.update(self._id, { $set: {servicePending: true}});
          if(pendingServices.includes(self.serviceId) === false){
            pendingServices.push(self.serviceId);
          }
          //generate a token for verification
          tmpToken = Random.secret([16]);
          console.log("Your Token: " + tmpToken);
          //set Session variable for service, holding the current state of this service
          Session.set(self._id, "pending");
        } else {
          //change status from pending to not pending
          UserServices.update(self._id, { $set: {servicePending: false}});
          //delete service from array pendingServices
          if(pendingServices.includes(self.serviceId) === true){
            var index = pendingServices.indexOf(self.serviceId);
            if(index !== -1) {
            	pendingServices.splice(index, 1);
            }
          }
        }
      }
    });
    $('button').blur();
  },
  'click #verifyBtn': function(event, template){
    serviceCounter = 0;
    event.preventDefault();
    const token = template.$('#verifyToken').val();
    if(token){
      Meteor.call("checkVerificationToken", token, function (error, result){
        if(error){
          sAlert.error("Not a valid Token");
        } else {
          //sAlert.success("Token verified");
          //send pending Rest calls (services in pending state are being hold in array "pendingSerives")
          if(pendingServices.length > 0){
            restMethod = "POST";
            serviceEnabled = false;
            //for each service send rest call
            _.each(pendingServices, function(serviceId){
              Meteor.call("changeServiceStatus", serviceId, serviceEnabled, Meteor.userId(), restMethod, function(error, errorFlag){
                if(error){
                  sAlert.error(error.reason);
                } else {
                  if(errorFlag === true){
                    Meteor.call("getServiceNameById", serviceId, function(error, result){
                      if(error) sAlert.error(error.reason);
                      else {
                        sAlert.error("Service " + result + " couldn't be activated");
                        Session.set(serviceId, "inactive");
                      }
                    });
                  }
                }
              });
              collectionId = UserServices.findOne({serviceId: serviceId})._id;
              UserServices.update(collectionId, { $set: {servicePending: false}})
              Session.set(serviceId, "active");
            }, this);
            //sAlert.success(serviceCounter + " Services activated");
            pendingServices.length = 0;
          }
        }
      });
    } else {
      sAlert.error("Please insert Token");
    }
  }
});

// check Status of service to display correct button-style
Template.services.helpers({
  userServices: function(){
    //this needs to be done to prevent duplicate services for admin user
    return UserServices.find({user: Meteor.userId()})
  },
  //change button style depending on service state (active, inactive or pending)
  serviceBtnStyle: function() {
    if(Session.get(this._id) === "active" || this.serviceEnabled === true)
      return "btn-success";
    else if(this.servicePending === true && this.serviceEnabled === false && Session.get(this._id) === "pending")
      return "btn-warning";
    // else if(Session.get(this._id) === "pending" && this.serviceEnabled === false)
    //   return "btn-warning";
    else
      return "btn-danger";
  },
  serviceIcon: function(){
    if(this.icon){
      return "glyphicon glyphicon-" + this.icon;
    } else {
      return "glyphicon glyphicon-list";
    }
  },
  serviceStateGlyph: function(){
    if(Session.get(this._id) === "active" || this.serviceEnabled === true)
      return "check";
    else if(this.servicePending === true && this.serviceEnabled === false && Session.get(this._id) === "pending")
      return "log-in";
    else
      return "unchecked";
  },
  servicesAvailable: function(){
    if(UserServices.find().count() > 0){
      return true;
    } else {
      return false;
    }
  }
});


Template.spinner.helpers({
});


//login handling
Template.login.events({
  'click #loginBtn': function(event, template) {
    event.preventDefault();
    const user = template.$('#user').val();
    const password = template.$('#password').val();
    if(user === ""){
      sAlert.error("Please enter username.");
      return;
    }
    if(password === ""){
      sAlert.error("Please enter password");
      return;
    }
    Meteor.loginWithPassword({username: user}, password, function(error) {
        if (error) {
          if(error.reason === "User not found"  || error.reason === "Incorrect password"){
            sAlert.error("Login failed! Wrong username and/or password.");
          } else {
            sAlert.error(error.reason);
          }
        } else {
          checkAvailable();
        }
    });

  }
});

Template.userNavigation.events({
  'click #logout': function() {
    Meteor.logout();
    Router.go('/');
  },
  'click #adminpanel': function() {
    if(Roles.userIsInRole(Meteor.userId(), 'admin')){
      Router.go('/adminpanel');
    } else {
      Router.go('/');
    }
  }
});

Template.userNavigation.helpers({
  'isAdmin': function() {
   return Roles.userIsInRole(Meteor.userId(), 'admin');
  }
});


Template.spinnerCube.onRendered( function(){
  //display loading spinnerCube after 100ms (prevents flashing appearance)
  setTimeout(function(){
    $('#loadingHider').removeClass('hidden').addClass('show');
  }, 100);
})
