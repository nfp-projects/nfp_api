'use strict';

var koa = require('koa');
var cors = require('koa-cors');
var koaLogger = require('koa-bunyan-logger');
var mask = require('koa-json-mask');
var router = require('koa-router');
var koaBody = require('koa-better-body')({fieldsKey: false});
var jwt = require('koa-jwt');

var config = require('./lib/config');
var log = require('./lib/log');
var error = require('./lib/helpers/error');
var middlewares = require('./lib/helpers/middlewares');

//Our koa app
var app = koa();

//Middlewares
app.use(error.errorHandler);
app.use(koaLogger(log));
app.use(koaLogger.requestIdContext({header: 'Request-Id'}));
app.use(koaLogger.requestLogger({
  updateLogFields: function(fields) {
    return {duration: fields.duration};
  }
}));

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(middlewares.lockContent);
app.use(jwt({
  secret: config.get('jwt:secret'),
  passthrough: true
}));
app.use(mask());
app.use(middlewares.parseBody);
app.use(middlewares.notFound);
app.use(router(app));

//Routes
var authentication = require('./lib/request-handlers/authentication');
var authenticated = authentication.authenticated;
app.post('/authenticate', koaBody, authentication.authenticate);

var category = require('./lib/request-handlers/category');
app.get('/categories', category.getCategories);
app.get('/categories/:category_id', category.getCategory);
app.post('/categories', authenticated, koaBody, category.createCategory);
app.put('/categories/:category_id', authenticated, koaBody, category.updateCategory);
app.del('/categories/:category_id', authenticated, category.deleteCategory);

var serie = require('./lib/request-handlers/serie');
app.get('/series', serie.getSeries);
app.get('/series/:serie_id', serie.getSerie);
app.post('/series', authenticated, koaBody, serie.createSerie);
app.put('/series/:serie_id', authenticated, koaBody, serie.updateSeries);
app.get('/categories/:category_id/series', serie.getSeries);
app.get('/categories/:category_id/series/:serie_id', serie.getSerie);
app.put('/categories/:category_id/series/:serie_id', authenticated, koaBody, serie.updateSeries);
app.post('/categories/:category_id/series', authenticated, koaBody, serie.createSerie);

var nav = require('./lib/request-handlers/nav');
app.get('/nav', nav.getNav);

var profile = require('./lib/request-handlers/profile');
app.get('/profile', authenticated, profile.getProfile);
app.post('/profile', authenticated, koaBody, profile.updateProfile);
app.post('/profile/forgot', koaBody, profile.forgotPassword);
app.post('/profile/verify', koaBody, profile.verify);
app.post('/profile/finish', koaBody, profile.finish);
app.post('/profile/signup', koaBody, profile.signup);


var releases = require('./lib/request-handlers/release');
app.get('/', releases.hello);


//Error logging
app.on('error', function(err) {
  log.error(err, 'Unknown error occured');
});


//Run the server
app.listen(config.get('server:port'));
log.info('Running api server on port', config.get('server:port'));
