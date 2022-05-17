import { SecRunner, SecScan } from '@sec-tester/runner';
import { Severity, TestType } from '@sec-tester/scan';
import { Configuration } from '@sec-tester/core';

describe('scan runner', () => {

  const config = new Configuration({
    cluster: process.env.CLUSTER ?? '',
    credentials: {
      token: process.env.TOKEN ?? ''
    }
  });

  let runner!: SecRunner;
  let runnerScan!: SecScan;

  beforeEach(async () => {
    runner = new SecRunner(config);

    await runner.init();

    runnerScan = runner
    .createScan({ tests: [TestType.XSS] })
    .threshold(Severity.MEDIUM) // i. e. ignore LOW severity issues
    .timeout(300000); // i. e. fail if last longer than 5 minutes
  });

  afterEach(async () => {
    await runner.clear();
  });

  it('should not have persistent xss', async () => {
    await runnerScan.run({
      method: 'POST',
      url: 'http://localhost:3000/testResource',
      body: { subject: 'Test', body: "<script>alert('xss')</script>" }
    });
  });

  it('should not have reflective xss', async () => {
    await runnerScan.run({
      url: 'http://localhost:3000/testResource',
      query: {
        q: `<script>alert('xss')</script>`
      }
    });
  });
})