const { promisify } = require('util');
const { gzipSync } = require('zlib');
const { expect } = require('chai');
const index = require('../index');

const handler = promisify(index.handler);

describe('data dog', function () {
  let metrics;
  let reportPoints;

  before(function () {
    metrics = [];
    reportPoints = [];

    index.dogapi.metric.send_all = function (_metrics, callback) {
      if (metrics.length > 0) {
        reportPoints = _metrics;
      } else {
        metrics = _metrics;
      }
      callback();
    }
  });

  afterEach(function() {
    metrics = [];
    reportPoints = [];
  });

  it('sends metrics to datadog', async function () {
    const event = {
      awslogs: {
        data: gzipSync(JSON.stringify({
          logEvents: [
            {
              message: '2018-06-29T12:30:00.000Z - info: helium: metric#valid=1'
            }
          ]
        })).toString('base64')
      }
    }

    await handler(event, {});

    expect(metrics).to.deep.equal([
      {
        metric: 'app_name.default.helium.valid',
        points: [[1530275400, 1]],
        tags: []
      }
    ]);
  });
});
