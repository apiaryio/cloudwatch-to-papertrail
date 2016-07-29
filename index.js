'use strict';
let zlib = require('zlib');
let winston = require('winston');

require('winston-papertrail');

var papertrail = new winston.transports.Papertrail({
  host: 'logs4.papertrailapp.com',
  port: 54490,
  flushOnClose: true
});

papertrail.on('error', console.log);

var logger = new winston.Logger({
  transports: [
    papertrail
  ]
});

exports.handler = (event, context, callback) => {
  let payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, (err, result) => {
    if (err) {
      return callback(err);
    }

    papertrail.on('connect', function () {
      var data = JSON.parse(result.toString('utf8'));

      data.logEvents.forEach(function (log) {
        logger.info(log.message);
      });

      logger.close();
      callback(null, `Successfully processed log events.`);
    });
  });
};
