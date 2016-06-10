Router.configure({
  layoutTemplate: 'LayoutBase'
});

var OnBeforeActions;
var OnAfterActions;
var RouterHelpers;

OnBeforeActions = {
  /* requires logged in user to show requested route */
  userRequired: function() {
    if(!Meteor.userId()) {
      this.redirect('/login');
      this.next();
    }
    else  {
      this.render('userNavigation', { to: 'userNavigation' });
      this.next();
    }
  },
  /* redirect to home site if user not already logged in */
  alreadyLoggedIn: function() {
    if(Meteor.userId()) {
      this.redirect('/');
      this.next();
    }
    else
      this.next();
  }
};

OnAfterActions = {
}

/**
 * default route
 */
Router.route('/', {
  name: 'services',
  template: 'services',
  onBeforeAction: [OnBeforeActions.userRequired],
  subscriptions: function(){
    return [
      Meteor.subscribe('onosServices'),
      Meteor.subscribe('userServices', Meteor.userId())
    ];
  },
  action: function() {
    if(this.ready()){
        this.render();
        //this.render('services', { to: 'services' });
        this.render('partners', { to: 'partners' });
    } else {
      this.render('spinnerCube');
    }
  }
});

/**
 * routes for login handling
 */
Router.route('/login', {
  name: 'login',
  template: 'login',
  onBeforeAction: [OnBeforeActions.alreadyLoggedIn],
  action: function() {
    this.render();
  }
});

/**
 * general routes
 */
 Router.route('/impressum', function() {
   this.render('impressum');
 });
