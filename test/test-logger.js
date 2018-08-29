const { promisify } = require('util');
const { expect } = require('chai');
const Transport = require('winston-transport');
const index = require('../index');

const handler = promisify(index.handler);

class TestTransport extends Transport {
  constructor() {
    super();
    this.name = 'test';
    this.events = [];
  }

  log(level, message) {
    this.events.push({ level, message })
  }
}

describe('#handler', function () {
  let transport;

  beforeEach(function () {
    index.logger.add(TestTransport);
    transport = index.logger.transports.test;
  });

  afterEach(function() {
    index.logger.clear();
    transport = null;
  });

  it('logs given awslogs to winston', async function () {
    const event = {
      awslogs: {
        data: 'H4sIAAAAAAAAAHWPwQqCQBCGX0Xm7EFtK+smZBEUgXoLCdMhFtKV3akI8d0bLYmibvPPN3wz00CJxmQnTO41whwWQRIctmEcB6sQbFC3CjW3XW8kxpOpP+OC22d1Wml1qZkQGtoMsScxaczKN3plG8zlaHIta5KqWsozoTYw3/djzwhpLwivWFGHGpAFe7DL68JlBUk+l7KSN7tCOEJ4M3/qOI49vMHj+zCKdlFqLaU2ZHV2a4Ct/an0/ivdX8oYc1UVX860fQDQiMdxRQEAAA=='
      }
    }

    await handler(event, {});

    expect(transport.events).to.deep.equal([
      {
        level: 'info',
        message: '[ERROR] First test message',
      },
      {
        level: 'info',
        message: '[ERROR] Second test message',
      }
    ]);
  });
});
