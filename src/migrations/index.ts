import * as migration_20260706_203108_initial from './20260706_203108_initial';

export const migrations = [
  {
    up: migration_20260706_203108_initial.up,
    down: migration_20260706_203108_initial.down,
    name: '20260706_203108_initial'
  },
];
