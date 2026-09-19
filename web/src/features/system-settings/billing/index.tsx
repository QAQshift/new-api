/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { SettingsPage } from '../components/settings-page'
import type { BillingSettings } from '../types'
import {
  BILLING_DEFAULT_SECTION,
  getBillingSectionContent,
  getBillingSectionMeta,
} from './section-registry.tsx'

// Mirrors the backend lottery defaults so the prize editor stays usable even
// when the option row has not been persisted yet.
const DEFAULT_LOTTERY_PRIZES =
  '[{"quota":10000,"weight":70},{"quota":50000,"weight":25},{"quota":200000,"weight":5}]'

// Mirrors the backend affiliate defaults (bblabu-style ladder): first 3 top-ups
// pay 5%, everything after that pays 3%. rate_bp is a basis-point value.
const DEFAULT_AFFILIATE_TIERS =
  '[{"times":3,"rate_bp":500},{"times":0,"rate_bp":300}]'

const defaultBillingSettings: BillingSettings = {
  QuotaForNewUser: 0,
  PreConsumedQuota: 0,
  QuotaForInviter: 0,
  QuotaForInvitee: 0,
  TopUpLink: '',
  'general_setting.docs_link': '',
  'quota_setting.enable_free_model_pre_consume': true,
  QuotaPerUnit: 500000,
  USDExchangeRate: 7,
  'general_setting.quota_display_type': 'USD',
  'general_setting.custom_currency_symbol': '¤',
  'general_setting.custom_currency_exchange_rate': 1,
  DisplayInCurrencyEnabled: true,
  DisplayTokenStatEnabled: true,
  ModelPrice: '',
  ModelRatio: '',
  CacheRatio: '',
  CreateCacheRatio: '',
  CompletionRatio: '',
  ImageRatio: '',
  AudioRatio: '',
  AudioCompletionRatio: '',
  ExposeRatioEnabled: false,
  'billing_setting.billing_mode': '{}',
  'billing_setting.billing_expr': '{}',
  'tool_price_setting.prices': '{}',
  TopupGroupRatio: '',
  GroupRatio: '',
  UserUsableGroups: '',
  GroupGroupRatio: '',
  AutoGroups: '',
  MaxTokenAutoGroups: 5,
  DefaultUseAutoGroup: false,
  'group_ratio_setting.group_special_usable_group': '{}',
  PayAddress: '',
  EpayId: '',
  EpayKey: '',
  Price: 7.3,
  MinTopUp: 1,
  CustomCallbackAddress: '',
  PayMethods: '',
  'payment_setting.amount_options': '',
  'payment_setting.amount_discount': '',
  'payment_setting.enable_custom_topup': true,
  'payment_setting.compliance_confirmed': false,
  'payment_setting.compliance_terms_version': '',
  'payment_setting.compliance_confirmed_at': 0,
  'payment_setting.compliance_confirmed_by': 0,
  'payment_setting.compliance_confirmed_ip': '',
  StripeApiSecret: '',
  StripeWebhookSecret: '',
  StripePriceId: '',
  StripeUnitPrice: 8.0,
  StripeMinTopUp: 1,
  StripePromotionCodesEnabled: false,
  CreemApiKey: '',
  CreemWebhookSecret: '',
  CreemTestMode: false,
  CreemProducts: '[]',
  WaffoEnabled: false,
  WaffoApiKey: '',
  WaffoPrivateKey: '',
  WaffoPublicCert: '',
  WaffoSandboxPublicCert: '',
  WaffoSandboxApiKey: '',
  WaffoSandboxPrivateKey: '',
  WaffoSandbox: false,
  WaffoMerchantId: '',
  WaffoCurrency: 'USD',
  WaffoUnitPrice: 1,
  WaffoMinTopUp: 1,
  WaffoNotifyUrl: '',
  WaffoReturnUrl: '',
  WaffoPayMethods: '[]',
  WaffoPancakeMerchantID: '',
  WaffoPancakePrivateKey: '',
  WaffoPancakeReturnURL: '',
  WaffoPancakeStoreID: '',
  WaffoPancakeProductID: '',
  'checkin_setting.enabled': false,
  'checkin_setting.min_quota': 1000,
  'checkin_setting.max_quota': 10000,
  'checkin_setting.min_daily_calls': 3,
  'lottery_setting.enabled': false,
  'lottery_setting.mode': 'segment',
  'lottery_setting.segment_consume_quota': 500000,
  'lottery_setting.segment_prizes': DEFAULT_LOTTERY_PRIZES,
  'lottery_setting.first_threshold_quota': 500000,
  'lottery_setting.threshold_step_quota': 500000,
  'lottery_setting.tier_prizes': DEFAULT_LOTTERY_PRIZES,
  'lottery_setting.tier_prize_step': 10000,
  'lottery_setting.tier_prize_max': 5000000,
  'lottery_setting.show_prize_pool': true,
  'lottery_setting.show_prize_probability': true,
  'lottery_setting.show_lottery_history': true,
  'welfare_setting.show_activity_prize_pool': true,
  'welfare_setting.show_activity_probability': true,
  'welfare_setting.show_winner_list': false,
  'welfare_setting.rules_content': '',
  'welfare_setting.activities_enabled': false,
  'affiliate_setting.enabled': false,
  'affiliate_setting.tiers': DEFAULT_AFFILIATE_TIERS,
  'affiliate_setting.promo_templates': '',
  'affiliate_setting.poster_background_url': '',
  'affiliate_setting.cooldown_days': 7,
  'affiliate_setting.max_rebate_per_invitee': 0,
  'payment_setting.disabled_methods': '[]',
  'payment_setting.disabled_notice': '',
}

export function BillingSettings() {
  return (
    <SettingsPage
      routePath='/_authenticated/system-settings/billing/$section'
      defaultSettings={defaultBillingSettings}
      defaultSection={BILLING_DEFAULT_SECTION}
      getSectionContent={getBillingSectionContent}
      getSectionMeta={getBillingSectionMeta}
    />
  )
}
