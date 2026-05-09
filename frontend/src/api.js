const BASE_URL = 'http://localhost:8000'
const USER_ID = 1

const now = new Date()
const YEAR = now.getFullYear()
const MONTH = now.getMonth() + 1
const PREV_YEAR = MONTH === 1 ? YEAR - 1 : YEAR
const PREV_MONTH = MONTH === 1 ? 12 : MONTH - 1

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  getSpendCurr:      () => apiFetch(`/users/${USER_ID}/spending/summary?year=${YEAR}&month=${MONTH}`),
  getSpendPrev:      () => apiFetch(`/users/${USER_ID}/spending/summary?year=${PREV_YEAR}&month=${PREV_MONTH}`),
  getSubscriptions:  () => apiFetch(`/users/${USER_ID}/subscriptions/`),
  getNotifications:  () => apiFetch(`/users/${USER_ID}/notifications/?year=${YEAR}&month=${MONTH}`),
}

export { YEAR, MONTH, PREV_YEAR, PREV_MONTH, USER_ID }