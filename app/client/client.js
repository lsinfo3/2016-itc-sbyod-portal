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

//subscribe Client to collections
Meteor.subscribe("onosServices");
Meteor.subscribe("userServices");

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

Template.body.helpers({
  //return onos services to display in frontend
  userServices: function() {
    return UserServices.find();
  }
});

Template.service.events({
  "click": function() {
    self = this;
    Meteor.call("checkRestEndpoint", function(error, result){
      if(error){
        sAlert.error("Error code: " + error.error + ". Server not reachable. <br> Please try again later.");
      } else {
        if(self.serviceEnabled == false){
          //enable chosen service for user
          restMethod = "POST";
          Meteor.call("changeServiceStatus", self.serviceId, Meteor.userId(), restMethod);
        } else {
          //disable chosen service for user
          restMethod = "DELETE";
          Meteor.call("changeServiceStatus", self.serviceId, Meteor.userId(), restMethod);
        }
      }
    });
  }
});

// check Status of service to display correct button-style
Template.service.helpers({
  serviceBtnStyle: function() {
    return (this.serviceEnabled) ? "btn-danger" : "btn-info";
  }
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
