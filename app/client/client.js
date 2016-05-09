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
//Meteor.subscribe("onosServices");
//Meteor.subscribe("userServices");

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
  'click': function() {
    self = this;
    //check if Rest Endpoint is available
    Meteor.call("checkRestEndpoint", function(error, result){
      if(error){
        sAlert.error("Error code: " + error.error + ". Server not reachable. <br> Please try again later.");
      } else {
        //Rest check successful!
        //TODO display 2FA input
        //TODO set button to pending state (only if serviceEnabled=true)
        //TODO wait for 2FA accepted -> then POST message
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
    $('button').blur();
  }
});

// check Status of service to display correct button-style
Template.services.helpers({
  serviceBtnStyle: function() {
    return (this.serviceEnabled) ? "btn-active" : "btn-inactive";
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
  }
});

Template.spinnerCube.onRendered( function(){
  //display loading spinnerCube after 100ms (prevents flashing appearance)
  setTimeout(function(){
    $('#loadingHider').removeClass('hidden').addClass('show');
  }, 100);
})
