import { useState, useEffect } from 'react'
import './index.css'
import SpendChart from './SpendChart'
import { api } from './api'

const BRAND = '#E8572A'
const S = {
  card: { background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16 },
  muted: { color: '#6b6b6b' },
}

// ── 공통 ──────────────────────────────────────────────────
function LoadingBox() {
  return <div style={{ ...S.card, fontSize: 13, color: '#6b6b6b' }}>불러오는 중...</div>
}
function ErrorBox() {
  return <div style={{ ...S.card, fontSize: 13, color: '#E24B4A' }}>데이터를 불러오지 못했어요.</div>
}

// ── BOTTOM NAV ────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const items = [
    { id: 'main',    label: '홈',    icon: '⌂' },
    { id: 'history', label: '내역',  icon: '↺' },
    { id: 'main',    label: '알림',  icon: '🔔' },
    { id: 'main',    label: '프로필', icon: '◯' },
  ]
  return (
    <div style={{ display: 'flex', background: '#fff', borderTop: '0.5px solid rgba(0,0,0,0.08)', padding: '8px 0 12px', position: 'sticky', bottom: 0 }}>
      {items.map((item, i) => (
        <button key={i} onClick={() => onChange(item.id)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: active === item.id && i === 0 ? BRAND : '#6b6b6b', fontSize: 11, padding: '4px 0' }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ── MAIN SCREEN ───────────────────────────────────────────
/*
GET /api/insights 응답:
{
  "curr_total": 342000,
  "diff_pct": 12,
  "saveable": 8700,
  "expiry_count": 2,
  "top_category": "통신",
  "top_category_pct": 38
}

GET /api/subscriptions/expiry 응답:
{
  "service_name": "SKT 5GX 슬림 요금제",
  "d_day": 14,
  "alert_message": "월 ₩8,700 절약 가능한 플랜이 있어요"
}
*/
function MainScreen({ onSwap }) {
  const [insights, setInsights] = useState(null)
  const [expiry, setExpiry] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [loadingExpiry, setLoadingExpiry] = useState(true)

  useEffect(() => {
    api.getInsights()
      .then(setInsights)
      .catch(() => setInsights(null))
      .finally(() => setLoadingInsights(false))
    api.getExpiryInfo()
      .then(setExpiry)
      .catch(() => setExpiry(null))
      .finally(() => setLoadingExpiry(false))
  }, [])

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '20px 20px 0', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500 }}>SWAP</h1>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 500 }}>김</div>
        </div>
        <div style={{ fontSize: 12, color: '#6b6b6b', paddingBottom: 16 }}>2025년 5월 · 스마트 구독 관리</div>
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        {loadingExpiry ? <LoadingBox /> : expiry ? (
          <>
            <div style={{ background: '#1A1A2E', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#F7F6F2' }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>다음 만기</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{expiry.service_name}</div>
              </div>
              <div style={{ background: BRAND, color: '#fff', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 20 }}>D-{expiry.d_day}</div>
            </div>
            {expiry.alert_message && (
              <div style={{ marginTop: 12, background: '#FDF0EB', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 18, color: BRAND, flexShrink: 0 }}>🔔</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: BRAND }}>요금제 만기 후 재분석 완료</div>
                  <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{expiry.alert_message}</div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <SpendChart />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, padding: '16px 20px 0' }}>
        {loadingInsights
          ? [1,2,3,4].map(i => <div key={i} style={{ ...S.card, padding: 12, height: 72, background: '#f5f5f5' }} />)
          : insights
            ? [
                { label: '이번 달 지출',       val: `₩${insights.curr_total.toLocaleString()}원`,  sub: `${insights.diff_pct > 0 ? '↑' : '↓'} ${Math.abs(insights.diff_pct)}% 전월 대비`, subColor: insights.diff_pct > 0 ? '#E24B4A' : '#1D9E75' },
                { label: '절약 가능 금액',      val: `₩${insights.saveable.toLocaleString()}원`,    sub: '↓ 월 절감 예상',    subColor: '#1D9E75' },
                { label: '구독 만기 수',        val: `${insights.expiry_count}건`,                  sub: '이번 달 이내',      subColor: '#BA7517' },
                { label: '주 지출 카테고리',    val: insights.top_category,                         sub: `전체의 ${insights.top_category_pct}%`, subColor: '#6b6b6b' },
              ].map((c) => (
                <div key={c.label} style={{ ...S.card, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 500 }}>{c.val}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: c.subColor }}>{c.sub}</div>
                </div>
              ))
            : null
        }
      </div>

      <div style={{ padding: '16px 20px' }}>
        <button onClick={onSwap} style={{ width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          ⇄ SWAP으로 최적화하기
        </button>
      </div>
    </div>
  )
}

// ── HISTORY SCREEN ────────────────────────────────────────
/*
GET /api/swap/history 응답:
[
  { "icon": "📱", "bg": "#E8F5E9", "name": "SKT → LG U+ 알뜰폰", "date": "2025.04.01 변경", "save": "-₩12,000/월" },
  { "icon": "💳", "bg": "#FFF3E0", "name": "신한 → 카카오뱅크 카드", "date": "2025.03.15 변경", "save": "-₩8,400/월" }
]
*/
function HistoryScreen() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getSwapHistory()
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '20px 20px 0', background: '#fff' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>SWAP 내역</h1>
        <div style={{ fontSize: 12, color: '#6b6b6b', paddingBottom: 16 }}>나의 절약 기록</div>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <LoadingBox />}
        {error && <ErrorBox />}
        {!loading && !error && items.map((item) => (
          <div key={item.name} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{item.date}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1D9E75' }}>{item.save}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SWAP FLOW ─────────────────────────────────────────────
const STEP_TITLES = ['항목 선택', '조건 설정', '혜택 비교', '변경 안내']

function StepDots({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 20px', margin: '12px 0 0' }}>
      {[1,2,3,4].map((i) => (
        <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? BRAND : 'rgba(0,0,0,0.1)', transition: 'background 0.3s' }} />
      ))}
    </div>
  )
}

// STEP 1
function Step1({ swapType, onSelect }) {
  const options = [
    { key: 'mobile',    icon: '📡', label: '요금제',   sub: '통신사 · 알뜰폰' },
    { key: 'card',      icon: '💳', label: '신용카드', sub: '혜택 · 포인트 분석' },
    { key: 'ott',       icon: '📺', label: 'OTT 구독', sub: '넷플릭스 · 왓챠' },
    { key: 'insurance', icon: '🛡', label: '보험',     sub: '준비 중' },
  ]
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>무엇을 바꿀까요?</div>
      <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 16 }}>현재 구독 중인 항목을 선택해요</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {options.map((o) => (
          <div key={o.key} onClick={() => o.key !== 'insurance' && onSelect(o.key)}
            style={{ ...S.card, textAlign: 'center', cursor: o.key !== 'insurance' ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', borderColor: swapType === o.key ? BRAND : 'rgba(0,0,0,0.08)', background: swapType === o.key ? '#FDF0EB' : '#fff', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 24 }}>{o.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</span>
            <span style={{ fontSize: 11, color: '#6b6b6b' }}>{o.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// STEP 2
/*
GET /api/usage 응답:
{
  "data_used_gb": 19, "data_total_gb": 30,
  "call_used_min": 245, "call_total": "무제한",
  "sms_used": 48, "sms_total": "무제한"
}

GET /api/plans/mobile 응답:
[
  { "id": "a", "icon": "📡", "bg": "#E8F4FD", "name": "LG U+ 알뜰폰 20G", "detail": "데이터 20GB · 음성 무제한", "price_monthly": 19800, "recommend": true },
  { "id": "b", "icon": "📶", "bg": "#F3E5F5", "name": "KT 알뜰 슬림 20G",  "detail": "데이터 20GB · 음성 200분",  "price_monthly": 17600, "recommend": false }
]

GET /api/spending/categories 응답:
[
  { "icon": "🍔", "bg": "#E8F5E9", "name": "음식·배달", "amount": 87000, "pct": 25, "has_card_benefit": false },
  { "icon": "⛽", "bg": "#FFF3E0", "name": "교통·주유",  "amount": 62000, "pct": 18, "has_card_benefit": false },
  { "icon": "🛒", "bg": "#FCE4EC", "name": "마트·쇼핑",  "amount": 54000, "pct": 16, "has_card_benefit": true }
]
*/
function Step2({ swapType, selectedPlan, onSelectPlan }) {
  const [usage, setUsage] = useState(null)
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
  let cancelled = false

  if (swapType === 'mobile') {
    setLoading(true)
    Promise.all([api.getUsage(), api.getMobilePlans()])
      .then(([u, p]) => {
        if (!cancelled) { setUsage(u); setPlans(p) }
      })
      .catch((e) => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
  } else if (swapType === 'card') {
    setLoading(true)
    api.getCardCategories()
      .then((data) => { if (!cancelled) setCategories(data) })
      .catch((e) => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
  }

  return () => { cancelled = true }
}, [swapType])

  if (loading) return <LoadingBox />
  if (error) return <ErrorBox />

  if (swapType === 'mobile') {
    const bars = usage ? [
      { label: '데이터 사용량', cur: `${usage.data_used_gb}GB`,  max: `${usage.data_total_gb}GB`, pct: Math.round((usage.data_used_gb / usage.data_total_gb) * 100), color: BRAND },
      { label: '통화',         cur: `${usage.call_used_min}분`, max: usage.call_total,            pct: 30, color: '#1D9E75' },
      { label: '문자',         cur: `${usage.sms_used}건`,      max: usage.sms_total,             pct: 15, color: '#BA7517' },
    ] : []
    return (
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>현재 사용 패턴 분석</div>
        <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 16 }}>지난달 데이터를 기반으로 맞춤 요금제를 찾아요</div>
        {bars.map((b) => (
          <div key={b.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6b6b', marginBottom: 6 }}>
              <span>{b.label}</span><span>{b.cur} / {b.max}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: 4 }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 12 }}>✦ 분석 결과: 20GB 이하 요금제로도 충분해요</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.map((p) => (
            <div key={p.id} onClick={() => onSelectPlan(p.id)}
              style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderColor: selectedPlan === p.id ? BRAND : 'rgba(0,0,0,0.08)', background: selectedPlan === p.id ? '#FDF0EB' : '#fff' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{p.detail}</div>
                <div style={{ fontSize: 13, color: BRAND, fontWeight: 500, marginTop: 2 }}>₩{p.price_monthly.toLocaleString()}원/월</div>
              </div>
              {p.recommend && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#E8572A22', color: BRAND, fontWeight: 500 }}>추천</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>지출 패턴 분석</div>
      <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 16 }}>이번 달 주요 지출 카테고리예요</div>
      {categories.map((c) => (
        <div key={c.name} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>월 평균 ₩{c.amount.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: BRAND, fontWeight: 500, marginTop: 2 }}>전체의 {c.pct}%</div>
          </div>
          {c.has_card_benefit && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#E8572A22', color: BRAND, fontWeight: 500 }}>할인 카드 있음</span>}
        </div>
      ))}
    </div>
  )
}

// STEP 3
/*
GET /api/swap/benefits?type=mobile 응답:
{
  "monthly_save": 8700,
  "annual_save": 104400,
  "items": [
    { "title": "요금제 변경 절감", "sub": "SKT 5GX → LG U+ 알뜰 20G", "save": "-₩8,700", "type": "ok" },
    { "title": "OTT 번들 혜택",   "sub": "넷플릭스 제휴 할인 포함",    "save": "-₩3,900", "type": "ok" },
    { "title": "기기 할부금",     "sub": "위약금 없음 (약정 만료)",     "save": "₩0",      "type": "info" }
  ]
}
*/
function Step3({ swapType }) {
  const save    = swapType === 'card' ? '₩12,400' : '₩8,700'
  const annual  = swapType === 'card' ? '₩148,800' : '₩104,400'
  const items   = swapType === 'mobile'
    ? [
        { title: '요금제 변경 절감', sub: 'SKT 5GX → LG U+ 알뜰 20G', save: '-₩8,700', ok: true },
        { title: 'OTT 번들 혜택',   sub: '넷플릭스 제휴 할인 포함',    save: '-₩3,900', ok: true },
        { title: '기기 할부금',     sub: '위약금 없음 (약정 만료)',     save: '₩0',      ok: false },
      ]
    : [
        { title: '카카오페이 카드', sub: '배달·편의점 10% 할인',  save: '-₩8,700', ok: true },
        { title: '주유 캐시백',    sub: 'GS칼텍스 L당 100원',    save: '-₩3,700', ok: true },
      ]
  return (
    <div>
      <div style={{ background: '#FDF0EB', border: '0.5px solid rgba(232,87,42,0.2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: BRAND, marginBottom: 4 }}>월 예상 절약액</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: BRAND }}>{save}/월</div>
        <div style={{ fontSize: 12, color: '#6b6b6b' }}>연간 {annual} 절약 예상</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div key={item.title} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, color: item.ok ? '#1D9E75' : '#BA7517', flexShrink: 0 }}>{item.ok ? '✓' : 'ℹ'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{item.sub}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: item.ok ? '#1D9E75' : '#BA7517' }}>{item.save}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// STEP 4
function Step4({ swapType, onDone }) {
  const steps = swapType === 'mobile'
    ? [
        { title: 'LG U+ 알뜰몰 접속', desc: '앱 또는 홈페이지에서 회원가입' },
        { title: '번호이동 신청',       desc: '기존 유심 그대로 사용 가능' },
        { title: '개통 완료',           desc: '영업일 1-2일 이내 개통' },
      ]
    : [
        { title: '카카오페이 카드 신청', desc: '카카오페이 앱 → 금융 → 카드' },
        { title: '기존 카드 해지',       desc: '새 카드 수령 후 해지 권장' },
      ]
  return (
    <div style={{ textAlign: 'center', paddingTop: 16 }}>
      <div style={{ fontSize: 48, color: '#1D9E75', marginBottom: 16 }}>✓</div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>SWAP 준비 완료!</div>
      <div style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 24 }}>
        아래 절차를 따라 변경을 완료해요.<br />완료 후 SWAP이 기록됩니다.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={s.title} style={{ ...S.card, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onDone} style={{ width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 8 }}>
        {swapType === 'mobile' ? 'LG U+ 바로가기 ↗' : '카카오페이 카드 신청 ↗'}
      </button>
      <button onClick={onDone} style={{ width: '100%', background: 'none', color: '#1a1a1a', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: 13, fontSize: 14, cursor: 'pointer' }}>
        나중에 하기
      </button>
    </div>
  )
}

// ── SWAP SCREEN ───────────────────────────────────────────
function SwapScreen({ onBack }) {
  const [step, setStep] = useState(1)
  const [swapType, setSwapType] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const goNext = () => setStep((s) => Math.min(s + 1, 4))
  const goBack = () => {
    if (step === 1) { onBack(); return }
    setStep((s) => s - 1)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', padding: '20px 20px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{STEP_TITLES[step - 1]}</h2>
      </div>
      <StepDots step={step} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {step === 1 && <Step1 swapType={swapType} onSelect={setSwapType} />}
        {step === 2 && <Step2 swapType={swapType} selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />}
        {step === 3 && <Step3 swapType={swapType} />}
        {step === 4 && <Step4 swapType={swapType} onDone={onBack} />}
      </div>
      {step < 4 && (
        <div style={{ padding: '12px 20px 16px', background: '#fff', borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
          <button onClick={goNext} disabled={step === 1 && !swapType}
            style={{ width: '100%', background: step === 1 && !swapType ? '#ccc' : BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 500, cursor: step === 1 && !swapType ? 'not-allowed' : 'pointer' }}>
            {step === 2 ? '혜택 비교하기' : step === 3 ? '이 조건으로 SWAP하기' : '다음으로'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('main')
  return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#F7F6F2', minHeight: '100vh', fontFamily: 'sans-serif', fontSize: 14, color: '#1a1a1a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {screen === 'swap' ? (
          <SwapScreen onBack={() => setScreen('main')} />
        ) : (
          <>
            {screen === 'main' && <MainScreen onSwap={() => setScreen('swap')} />}
            {screen === 'history' && <HistoryScreen />}
            <BottomNav active={screen} onChange={setScreen} />
          </>
        )}
      </div>
    </div>
  )
}