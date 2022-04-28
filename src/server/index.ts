import express from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { MetricExporter } from '@opentelemetry/sdk-metrics-base/build/src/export/types';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { Resource } from '@opentelemetry/resources';

// import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

function getExporter(): MetricExporter {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return new OTLPMetricExporter();
  } else {
    const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;
    return new PrometheusExporter({}, () => {
      console.log(`prometheus scrape endpoint: http://localhost:${port}${endpoint}`);
    });
  }
}

const provider = new MeterProvider({
  exporter: getExporter(),
  interval: 2000,
  resource: Resource.default().merge(
    new Resource({
      service: 'matschaffer',
      version: 1,
    })
  ),
});

const meter = provider.getMeter('example-meter');

meter.createObservableGauge(
  'cpu_core_usage',
  {
    description: 'Example of an async observable gauge with callback',
  },
  async (observableResult) => {
    const value1 = await getAsyncValue();
    observableResult.observe(value1, { core: '1' });
    const value2 = await getAsyncValue();
    observableResult.observe(value2, { core: '2' });
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

const port = process.env.PORT || 4000;

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
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
