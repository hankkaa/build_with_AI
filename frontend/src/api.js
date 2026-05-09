const BASE_URL = 'http://localhost:8000'
 
async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
 
export const api = {
  getSpendMonthly:    () => apiFetch('/api/spend/monthly'),
  getInsights:        () => apiFetch('/api/insights'),
  getExpiryInfo:      () => apiFetch('/api/subscriptions/expiry'),
  getSwapHistory:     () => apiFetch('/api/swap/history'),
  getMobilePlans:     () => apiFetch('/api/plans/mobile'),
  getUsage:           () => apiFetch('/api/usage'),
  getCardCategories:  () => apiFetch('/api/spending/categories'),
}