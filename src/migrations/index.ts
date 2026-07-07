import * as migration_20260706_203108_initial from './20260706_203108_initial';
import * as migration_20260707_120000_add_pages_card_image from './20260707_120000_add_pages_card_image';

export const migrations = [
  {
    up: migration_20260706_203108_initial.up,
    down: migration_20260706_203108_initial.down,
    name: '20260706_203108_initial'
  },
  {
    up: migration_20260707_120000_add_pages_card_image.up,
    down: migration_20260707_120000_add_pages_card_image.down,
    name: '20260707_120000_add_pages_card_image'
  },
];
