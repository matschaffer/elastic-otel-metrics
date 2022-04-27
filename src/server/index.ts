import express from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const prometheus = new PrometheusExporter({
  host: '127.0.0.1'
})

const provider = new MeterProvider();
provider.addMetricReader(prometheus)

const meter = provider.getMeter('example-meter');

meter.createObservableGauge(
  'cpu_core_usage',
  async (observableResult) => {
    const value1 = await getAsyncValue();
    observableResult.observe(value1, { core: '1' });
    const value2 = await getAsyncValue();
    observableResult.observe(value2, { core: '2' });
  },
  {
    description: 'Example of an async observable gauge with callback',
  }
);

function getAsyncValue(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random());
    }, 100);
  });
}

// Create a new express application instance
const app: express.Application = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(4000, function () {
  console.log(`Example app listening on port ${4000}!`);
});

const rules = 5000;

const successes = meter.createCounter('rule_successes', {
  description: 'Successful rule executions',
});

const failures = meter.createCounter('rule_failures', {
  description: 'Failed rule executions',
});

setInterval(() => {
  for (let i = 0; i < rules; i++) {
    if (Math.random() > 0.5) {
      successes.add(1, { rule: `rule_${i}` });
    } else {
      failures.add(1, { rule: `rule_${i}` });
    }
  }
}, 1000);
