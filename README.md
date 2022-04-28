# Elastic OpenTelemetry Metrics

This is a demo repo to test out sending OpenTelemetry metrics from a nodejs application to elastic stack receivers.

## Basics

Run `yarn start` to start the React builder (3000) and server (4000).

## Collection

### Prometheus exporter + Elastic agent

- Create an elastic deployment on https://cloud.elastic.co/
- Set up the prometheus agent integration in kibana (`/app/integrations/detail/prometheus-0.7.0/overview`) with "Prometheus collector metrics" set to `host.docker.internal:9464` and metrics path `/metrics`
- **CAREFUL!** Make sure to empty out all the pre-filled fields regarding auth (token, user, password, etc)
- Create a `.env` file with `FLEET_URL` and `FLEET_ENROLLMENT_TOKEN` set to the values provided in the add agent screen
- Start the agent with `docker-compose run agent`

### Prometheus exporter + Metricbeat standalone

- Create an elastic deployment on https://cloud.elastic.co/
- Download a copy of apm-server https://www.elastic.co/downloads/apm
- Make a `metricbeat.cloud.yml` like this:
  ```yaml
  metricbeat.modules:
  - module: prometheus
    period: 10s
    metricsets: ["collector"]
    hosts: ["localhost:9464"]
    metrics_path: /metrics

  output.elasticsearch:
    hosts: ["https://(ENDPOINT).es.(REGIONAL-TLD):9243"]
    username: "elastic"
    password: "(PASSWORD)"
  ```
- Start with `./metricbeat -c metricbeat.cloud.yml -e`

### OLTP exporter + APM server

- Create an elastic deployment on https://cloud.elastic.co/
- Download a copy of apm-server https://www.elastic.co/downloads/apm
- Make an apm-server.cloud.yml like this:
  ```yaml
  output.elasticsearch:
    hosts: ["https://(ENDPOINT).es.(REGIONAL-TLD):9243"]
    username: "elastic"
    password: "(PASSWORD)"
  ```
- Start with `./apm-server -c apm-server.cloud.yml -e`
- Run start the app with `OTEL_EXPORTER_OTLP_ENDPOINT="localhost:8200" yarn start`, the presence of `OTEL_EXPORTER_OTLP_ENDPOINT` will switch to OLTP exporter collection instead of prometheus.

## GRPC debugging

The current setup uses a local apm-server to simplify collection over GRPC. If you want to use external GRPC (for example, to an ESS-hosted apm-server) you can set these env vars.

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://(CLOUD ID).apm.(REGIONAL URL):443"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer (APM SECRET TOKEN)"
```

Additionally, you can set these variables to debug GRPC on Node.js:

```bash
export GRPC_NODE_TRACE="xds_client,xds_resolver,cds_balancer,eds_balancer,priority,weighted_target,round_robin,resolving_load_balancer,subchannel,keepalive,dns_resolver,fault_injection,http_filter,csds"
export GRPC_NODE_VERBOSITY=DEBUG
```

Or these for golang (See https://github.com/elastic/apm-server/tree/main/systemtest/cmd/sendotlp for a helpful golang test app):

```bash
export GRPC_GO_LOG_VERBOSITY_LEVEL=99
export GRPC_GO_LOG_SEVERITY_LEVEL=info
```
