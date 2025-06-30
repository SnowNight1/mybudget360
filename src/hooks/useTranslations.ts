import { useTranslations } from 'next-intl';

// 创建类型安全的翻译 hooks
export function useCommonTranslations() {
  return useTranslations('common');
}

export function useNavigationTranslations() {
  return useTranslations('navigation');
}

export function useAuthTranslations() {
  return useTranslations('auth');
}

export function useBudgetTranslations() {
  return useTranslations('budget');
}

export function useTransactionTranslations() {
  return useTranslations('transactions');
}

export function useSubscriptionTranslations() {
  return useTranslations('subscriptions');
}

export function useRecordsTranslations() {
  return useTranslations('records');
}

export function useSettingsTranslations() {
  return useTranslations('settings');
}

export function useChartsTranslations() {
  return useTranslations('charts');
}

export function useDashboardTranslations() {
  return useTranslations('dashboard');
}

export function useFormTranslations() {
  return useTranslations('forms');
}

export function useLanguageTranslations() {
  return useTranslations('language');
}
