# Elastic OpenTelemetry Metrics

This is a demo repo to test out sending OpenTelemetry metrics from a nodejs application to elastic stack receivers.

## Basics

Run `yarn start` to start the React builder (3000) and server (4000).

## Collection

- Create an elastic deployment on https://cloud.elastic.co/
- Set up the prometheus agent integration in kibana (`/app/integrations/detail/prometheus-0.7.0/overview`) with "Prometheus collector metrics" set to `host.docker.internal:9464` and metrics path `/metrics`
- Create a `.env` file with `FLEET_URL` and `FLEET_ENROLLMENT_TOKEN` set to the values provided in the add agent screen
-
