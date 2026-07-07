import * as migration_20260706_203108_initial from './20260706_203108_initial';
import * as migration_20260707_120000_add_pages_card_image from './20260707_120000_add_pages_card_image';
import * as migration_20260707_150000_quote_pricing_and_survey from './20260707_150000_quote_pricing_and_survey';

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
  {
    up: migration_20260707_150000_quote_pricing_and_survey.up,
    down: migration_20260707_150000_quote_pricing_and_survey.down,
    name: '20260707_150000_quote_pricing_and_survey'
  },
];
