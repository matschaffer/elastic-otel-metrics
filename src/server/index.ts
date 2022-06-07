import express from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import {
  MeterProvider,
  MetricReader,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// ---- If you need Otel diagnostic logs on stdout
// import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// ---- Set up the exporter based on OTEL_EXPORTER_OTLP_ENDPOINT
function getReader(): MetricReader {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
      exportIntervalMillis: 1000,
    });
  } else {
    return new PrometheusExporter({
      host: '127.0.0.1',
    });
  }
}
const provider = new MeterProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'elastic-otel-metrics',
  }),
});
provider.addMetricReader(getReader());

const meter = provider.getMeter('example-meter');

// Create a new express application instance (basically unused)
const app: express.Application = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

const port = process.env.PORT || 4000;

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});

// ---- Two async "CPU" gauges
meter
  .createObservableGauge('cpu_core_usage', {
    description: 'Example of an async observable gauge with callback',
  })
  .addCallback(async (observableResult) => {
    const value1 = await getAsyncValue();
    observableResult.observe(value1, { core: '1' });
    const value2 = await getAsyncValue();
    observableResult.observe(value2, { core: '2' });
  });

function getAsyncValue(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random());
    }, 100);
  });
}

// --- 5k rules x2 success/fail counters randomly incrementing every second
const rules = 1;

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
