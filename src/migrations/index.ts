import * as migration_20260706_203108_initial from './20260706_203108_initial';
import * as migration_20260707_120000_add_pages_card_image from './20260707_120000_add_pages_card_image';
import * as migration_20260707_150000_quote_pricing_and_survey from './20260707_150000_quote_pricing_and_survey';
import * as migration_20260707_170000_add_site_settings_tiktok from './20260707_170000_add_site_settings_tiktok';
import * as migration_20260708_110000_add_site_settings_analytics_pin from './20260708_110000_add_site_settings_analytics_pin';
import * as migration_20260708_140000_add_site_settings_home_photos from './20260708_140000_add_site_settings_home_photos';

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
  {
    up: migration_20260707_170000_add_site_settings_tiktok.up,
    down: migration_20260707_170000_add_site_settings_tiktok.down,
    name: '20260707_170000_add_site_settings_tiktok'
  },
  {
    up: migration_20260708_110000_add_site_settings_analytics_pin.up,
    down: migration_20260708_110000_add_site_settings_analytics_pin.down,
    name: '20260708_110000_add_site_settings_analytics_pin'
  },
  {
    up: migration_20260708_140000_add_site_settings_home_photos.up,
    down: migration_20260708_140000_add_site_settings_home_photos.down,
    name: '20260708_140000_add_site_settings_home_photos'
  },
];
