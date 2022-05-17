import { Configuration } from '@sec-tester/core';
import { HttpMethod, ScanFactory, Severity, Target, TestType } from '@sec-tester/scan';
import { Repeater, RepeaterFactory } from '@sec-tester/repeater';

describe('test', () => {
  const config = new Configuration({
    cluster: process.env.CLUSTER ?? '',
    credentials: {
      token: process.env.TOKEN ?? ''
    }
  });

  let repeater!: Repeater;


  const scanFactory = new ScanFactory(config);


  beforeAll(async () => {
      repeater = await new RepeaterFactory(config).createRepeater();
      await repeater.start();
  });

  afterAll(async () => {
    await repeater.stop();
  })

  it('create test scan directly', async () => {
    const target = new Target({
      url: 'http://localhost:3000/testResource',
      method: HttpMethod.GET
    });
    const scan = await scanFactory.createScan({
      target,
      repeaterId: repeater.repeaterId,
      tests: [...Object.values(TestType)]
    });

    await scan.expect(scan => scan.done);
    const issues = await scan.issues();
    console.log(issues);
    expect(issues).toHaveLength(4);
  });
});