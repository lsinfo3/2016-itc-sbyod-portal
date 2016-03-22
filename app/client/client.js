Meteor.startup(() => {
});

//subscribe Client to collections
Meteor.subscribe("onosServices");
Meteor.subscribe("userServices");

//enable password only login
Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
  });

Template.body.helpers({
  //return onos services to display in frontend
  userServices: function() {
    return UserServices.find();
  },
  //display message Div
  displaywarningDiv: function(){
    $("#warningDiv").removeClass("hide").addClass("show");
  },
  //hide message Div
  hidewarningDiv: function() {
    $("#warningDiv").removeClass("show").addClass("hide");
  },
  displaySuccessDiv: function() {
    $("#successDiv").removeClass("hide").addClass("show");
  },
  hideSuccessDiv: function() {
    $("#successDiv").removeClass("show").addClass("hide");
  }
});

Template.service.events({
  "click": function() {
    if(this.serviceEnabled == false){
      //enable chosen service for user
      restMethod = "POST";
      Meteor.call("changeServiceStatus", this.serviceId, Meteor.userId(), restMethod);
    } else {
      //disable chosen service for user
      restMethod = "DELETE";
      Meteor.call("changeServiceStatus", this.serviceId, Meteor.userId(), restMethod);
    }
  }
});

Template.body.events({
  'click #logout'() {
    Meteor.logout();
  }
});

// check Status of service to display correct button-style
Template.service.helpers({
  serviceBtnStyle: function() {
    return (this.serviceEnabled) ? "btn-danger" : "btn-info";
  }
});

Template.login.helpers({
  loginError() {
    return Session.get('loginError');
  }
});

//login handling
Template.login.events({
  'click #loginBtn': function(event, template) {
    event.preventDefault();
    const user = template.$('#user').val();
    const password = template.$('#password').val();
    Meteor.loginWithPassword({username: user}, password, function(error) {
        if (error) {
          $("#warningDiv").removeClass("hide").addClass("show");
          var errorText = error.reason == 'error.accounts.Login forbidden' ? 'Login failed. Invalid email and/or password.': error.reason;
          $("#warningDiv").text(errorText);
          //return Session.set('loginError', error.reason);
        } else {
          Session.set('loginError', '');
          $("#warningDiv").removeClass("show").addClass("hide");
          Template.body.__helpers.get('hideSuccessDiv').call();
        }
    });
  }
});
