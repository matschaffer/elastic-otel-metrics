import express from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { MetricExporter } from '@opentelemetry/sdk-metrics-base/build/src/export/types';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Create a new express application instance
const app: express.Application = express();

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

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/_metrics', (req, res) => {
  res.send('metrics');
});

app.listen(4000, function () {
  console.log(`Example app listening on port ${4000}!`);
});
