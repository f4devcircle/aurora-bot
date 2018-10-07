require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const gstore = require('gstore-node')();
const Datastore = require('@google-cloud/datastore');
const moment = require('moment');
 
const datastore = new Datastore({
  projectId: 'f4-dev-circle',
  keyFilename: __dirname + '/googlekey.json'
});
 
moment.locale("id-ID");

gstore.connect(datastore);

const app = express();

app.use(cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const route = require('./routes/index');

app.use('/v1', route);

app.use((req, res, next) => {
  var err = new Error('404 Not Found');
  err.code = 404;
  err.message = 'Page is not found'
  next(err);
});

app.use((err, req, res, next) => {
  console.log(err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') !== 'development' ? err : {};

  if (err.isJoi) {
    res.status(422);
    res.send({
      errors: err.details
    })
  } else if (err.name == 'ValidationError') {
    res.status(422);
    res.send({
      errors: [{
        message: err.errors[Object.keys(err.errors)[0]].message
      }]
    })
  } else if (err.name === 'UnauthorizedError') {
    res.status(err.status || 500);
    res.send({
      errors: [{
        status: err.status,
        message: err.message,
      }]
    });
  } else if (err.name === 'CastError') {
    res.status(404);
    res.send({
      errors: [{
        status: 404,
        message: err.model.modelName + ' is not found',
      }]
    });
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(422);
    res.send({
      errors: [{
        status: 404,
        message:'Image\'s file is to large. Maximum size is 800kb',
      }]
    });
  } else {
    res.status(err.code || 500);
    res.send({
      errors: [{
        status: err.code,
        message: err.message,
      }]
    });
  }
})

module.exports = app;