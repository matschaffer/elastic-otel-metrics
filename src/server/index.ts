import express from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { MetricExporter } from '@opentelemetry/sdk-metrics-base/build/src/export/types';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { credentials } from '@grpc/grpc-js';
import { OTLPExporterConfigNode } from '@opentelemetry/exporter-trace-otlp-grpc';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

function getExporter(): MetricExporter {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const endpoint = new URL(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const collectorOptions: OTLPExporterConfigNode = {
      url: `${endpoint.host}:${endpoint.port}`,
    };

    if (endpoint.protocol === 'https') {
      collectorOptions.credentials = credentials.createSsl();
    }

    return new OTLPMetricExporter(collectorOptions);
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
