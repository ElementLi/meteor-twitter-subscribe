// for convenience
var loginButtonsSession = Accounts._loginButtonsSession;

// shared between dropdown and single mode
Template.subscribeForm.events({
  'click #subscribe-buttons-logout': function() {
    Meteor.logout(function () {
      loginButtonsSession.closeDropdown();
    });
  },
  'keyup #email': function(e) {
    var email = $("#email").val();
    if (validateEmail(email)) {
      $('.subscribe-button').removeClass('disabled');
    } else {
      $('.subscribe-button').addClass('disabled');
    }

  }
});

Template.registerHelper('subscribeForm', function () {
  throw new Error("Use {{> subscribeForm}} instead of {{subscribeForm}}");
});

//
// helpers
//

enableSubscribeButton = function () {
  var subscribeButton = $('#subscribe-buttons-twitter');
  subscribeButton.removeClass('disable');
};

displayName = function () {
  var user = Meteor.user();
  if (!user)
    return '';

  if (user.profile && user.profile.name)
    return user.profile.name;
  if (user.username)
    return user.username;
  if (user.emails && user.emails[0] && user.emails[0].address)
    return user.emails[0].address;

  return '';
};

usersEmail = function () {
  var user = Meteor.user();
  return user.emails[0].address;
};

// returns an array of the login services used by this app. each
// element of the array is an object (eg {name: 'facebook'}), since
// that makes it useful in combination with handlebars {{#each}}.
//
// don't cache the output of this function: if called during startup (before
// oauth packages load) it might not include them all.
//
// NOTE: It is very important to have this return password last
// because of the way we render the different providers in
// login_buttons_dropdown.html
getLoginServices = function () {
  var self = this;

  // First look for OAuth services.
  var services = Package['accounts-oauth'] ? Accounts.oauth.serviceNames() : [];

  // Be equally kind to all login services. This also preserves
  // backwards-compatibility. (But maybe order should be
  // configurable?)
  services.sort();

  // Add password, if it's there; it must come last.
  if (hasPasswordService())
    services.push('password');

  return _.map(services, function(name) {
    return {name: name};
  });
};

hasPasswordService = function () {
  return !!Package['accounts-password'];
};

dropdown = function () {
  return hasPasswordService() || getLoginServices().length > 1;
};

// XXX improve these. should this be in accounts-password instead?
//
// XXX these will become configurable, and will be validated on
// the server as well.
validateUsername = function (username) {
  if (username.length >= 3) {
    return true;
  } else {
    loginButtonsSession.errorMessage("Username must be at least 3 characters long");
    return false;
  }
};
validateEmail = function (email) {
  if (passwordSignupFields() === "USERNAME_AND_OPTIONAL_EMAIL" && email === '')
    return true;

  if (email.indexOf('@') !== -1) {
    return true;
  } else {
    loginButtonsSession.errorMessage("Invalid email");
    return false;
  }
};
validatePassword = function (password) {
  if (password.length >= 6) {
    return true;
  } else {
    loginButtonsSession.errorMessage("Password must be at least 6 characters long");
    return false;
  }
};

//
// loginButtonLoggedOut template
//

Template._subscribeButtonLoggedOut.helpers({
  dropdown: dropdown,
  services: getLoginServices,
  singleService: function () {
    var services = getLoginServices();
    if (services.length !== 1)
      throw new Error(
        "Shouldn't be rendering this template with more than one configured service");
    return services[0];
  },
  configurationLoaded: function () {
    return Accounts.loginServicesConfigured();
  }
});


//
// loginButtonsLoggedIn template
//

  // decide whether we should show a dropdown rather than a row of
  // buttons
Template._subscribeButtonLoggedIn.helpers({
  dropdown: dropdown
});



//
// loginButtonsLoggedInSingleLogoutButton template
//

Template._subscribeButtonLoggedInSingleLogoutButton.helpers({
  displayName: displayName,
  usersEmail: usersEmail
});



//
// loginButtonsMessage template
//

Template._subscribeButtonMessages.helpers({
  errorMessage: function () {
    return loginButtonsSession.get('errorMessage');
  }
});

Template._subscribeButtonMessages.helpers({
  infoMessage: function () {
    return loginButtonsSession.get('infoMessage');
  }
});


//
// loginButtonsLoggingInPadding template
//

Template._subscribeButtonLoggingInPadding.helpers({
  dropdown: dropdown
});

// for convenience 
var loginButtonsSession = Accounts._loginButtonsSession;


var loginResultCallback = function (serviceName, err) {
  if (!err) {
    loginButtonsSession.closeDropdown();
  } else if (err instanceof Accounts.LoginCancelledError) {
    // do nothing
  } else if (err instanceof ServiceConfiguration.ConfigError) {
    loginButtonsSession.configureService(serviceName);
  } else {
    loginButtonsSession.errorMessage(err.reason || "Unknown error");
  }
};


// In the login redirect flow, we'll have the result of the login
// attempt at page load time when we're redirected back to the
// application.  Register a callback to update the UI (i.e. to close
// the dialog on a successful login or display the error on a failed
// login).
//
Accounts.onPageLoadLogin(function (attemptInfo) {
  // Ignore if we have a left over login attempt for a service that is no longer registered.
  if (_.contains(_.pluck(getLoginServices(), "name"), attemptInfo.type))
    loginResultCallback(attemptInfo.type, attemptInfo.error);
});

Template._subscribeButton.events({
  'click .subscribe-button': function (e) {
    e.preventDefault();
    var email = $('#email').val();
    // Save email address first
    Meteor.call('insertSubscriber', email, function(err, id){
      if(err){ 
        Session.set('subscribeStatus', {
          message: err.reason,
          class: 'alert-danger'
        })
        console.log(err)      
      }else{
        // console.log('successfully inserted subscriber: '+id);
        $('#email').val("");
        Session.set('subscribeStatus', {
          message: 'Good call <b>champ</b>! We\'ll keep you updated.',
          class: 'alert-success'
        });
        Session.set('subscriberEmail', {
          email: email
        });
      }
    })


    var serviceName = this.name;
    loginButtonsSession.resetMessages();

    // XXX Service providers should be able to specify their
    // `Meteor.loginWithX` method name.
    var loginWithService = Meteor["loginWith" +
                                  (serviceName === 'meteor-developer' ?
                                   'MeteorDeveloperAccount' :
                                   capitalize(serviceName))];

    var options = {}; // use default scope unless specified
    if (Accounts.ui._options.requestPermissions[serviceName])
      options.requestPermissions = Accounts.ui._options.requestPermissions[serviceName];
    if (Accounts.ui._options.requestOfflineToken[serviceName])
      options.requestOfflineToken = Accounts.ui._options.requestOfflineToken[serviceName];
    if (Accounts.ui._options.forceApprovalPrompt[serviceName])
      options.forceApprovalPrompt = Accounts.ui._options.forceApprovalPrompt[serviceName];

    if (validateEmail(email)) {
      loginWithService(options, function (err) {
        loginResultCallback(serviceName, err);
        var userId = Meteor.userId();
        var emailObj = Session.get('subscriberEmail');
        Meteor.call('updateEmail', userId, emailObj.email);
        Router.go('questionnaire');
      });
    } 
  }
});

Template._subscribeButton.helpers({
  configured: function () {
    return !!ServiceConfiguration.configurations.findOne({service: this.name});
  },
  capitalizedName: function () {
    if (this.name === 'github')
      // XXX we should allow service packages to set their capitalized name
      return 'GitHub';
    else if (this.name === 'meteor-developer')
      return 'Meteor';
    else
      return capitalize(this.name);
  },
  isTwitter: function () {
    return this.name == "twitter";
  },
  status: function () {
    return Session.get('subscribeStatus');
  },
  message: function(){
    return Session.get('subscribeStatus').message;
  },
  class: function(){
    return Session.get('subscribeStatus').class;
  }
});

// Validate email address
var validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

// XXX from http://epeli.github.com/underscore.string/lib/underscore.string.js
var capitalize = function(str){
  str = str == null ? '' : String(str);
  return str.charAt(0).toUpperCase() + str.slice(1);
}


