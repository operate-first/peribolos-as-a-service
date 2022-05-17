import { collectDefaultMetrics, Counter, register } from 'prom-client';

if (process.env.NODE_ENV === 'production') {
  register.clear();
  collectDefaultMetrics({ prefix: 'peribolos_' });
}

export const numberOfInstallTotal =
  (register.getSingleMetric(
    'peribolos_num_of_install_total'
  ) as Counter<string>) ||
  new Counter({
    name: 'peribolos_num_of_install_total',
    help: 'Total number of installs received',
    labelNames: [],
  });

export const numberOfUninstallTotal =
  (register.getSingleMetric(
    'peribolos_num_of_uninstall_total'
  ) as Counter<string>) ||
  new Counter({
    name: 'peribolos_num_of_uninstall_total',
    help: 'Total number of uninstalls received',
    labelNames: [],
  });

export const numberOfActionsTotal =
  (register.getSingleMetric(
    'peribolos_num_of_actions_total'
  ) as Counter<string>) ||
  new Counter({
    name: 'peribolos_num_of_actions_total',
    help: 'Total number of actions received',
    labelNames: ['install', 'action'],
  });

export const operationsTriggered =
  (register.getSingleMetric(
    'peribolos_operations_triggered'
  ) as Counter<string>) ||
  new Counter({
    name: 'peribolos_operations_triggered',
    help: 'Metrics for action triggered by the operator with respect to the kubernetes operations.',
    labelNames: ['install', 'operation', 'status', 'method'],
  });

export default {
  numberOfInstallTotal,
  numberOfUninstallTotal,
  numberOfActionsTotal,
  operationsTriggered,
};
