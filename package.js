Package.describe({
  summary: "Twitter signup with email required, based on Accounts UI unstyled",
  version: "1.0.0",
  name: "yong:twitter-signup-with-email",
  git: "https://github.com/feelsys/meteor-twitter-subscribe"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.3');
  api.use(['tracker', 'service-configuration', 'accounts-base',
           'underscore', 'templating', 'session', 'accounts-ui-unstyled'], 'client');

  api.use('mongo', ['client', 'server']);
  
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);

  // Allow us to call Accounts.oauth.serviceNames, if there are any OAuth
  // services.
  api.use('accounts-oauth', {weak: true});
  // Allow us to directly test if accounts-password (which doesn't use
  // Accounts.oauth.registerService) exists.
  api.use('accounts-password', {weak: true});

  api.use('less', 'client');

  api.addFiles('subscribers.js', ['server','client']);

  api.addFiles([
    'yong:twitter-signup-with-email.js',
    'subscribe_form.html',
    'subscribe_form.js',
    'styles.less'], 'client');

  if(api.export) api.export('Subscribers')

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('yong:twitter-signup-with-email', 'client');
  api.addFiles('yong:twitter-signup-with-email-tests.js', 'client');
});
