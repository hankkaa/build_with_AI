import { useState, useEffect } from 'react'
import './index.css'
import SpendChart from './SpendChart'
import { api, YEAR, MONTH } from './api'

const BRAND = '#E8572A'
const S = {
  card: { background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16 },
}

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
GET /users/{id}/spending/summary?year=&month= 응답:
{ "year": 2025, "month": 5, "by_category": {"통신": 130000, ...}, "total": 342000, "vs_last_month": 12.5 }

GET /users/{id}/subscriptions/ 응답:
[
  { "id": 1, "name": "SKT 5GX 슬림", "category": "통신", "monthly_cost": 55000, "next_billing_date": "2025-05-23", "is_active": true },
  ...
]
*/
function MainScreen({ onSwap }) {
  const [spendData, setSpendData] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.getSpendCurr(), api.getSubscriptions()])
      .then(([s, subs]) => { setSpendData(s); setSubscriptions(subs) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  // 만기가 가장 가까운 구독 찾기
  const nextExpiry = subscriptions
    .filter(s => s.next_billing_date)
    .sort((a, b) => new Date(a.next_billing_date) - new Date(b.next_billing_date))[0]

  const dDay = nextExpiry
    ? Math.ceil((new Date(nextExpiry.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const total = spendData?.total || 0
  const diffPct = spendData?.vs_last_month
  const isUp = diffPct > 0

  // 주 지출 카테고리
  const byCategory = spendData?.by_category || {}
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
  const topCategoryPct = topCategory && total > 0
    ? Math.round((topCategory[1] / total) * 100)
    : 0

  // 절약 가능 금액 (가장 비싼 구독의 10% 추정)
  const saveable = subscriptions.length > 0
    ? Math.round(Math.max(...subscriptions.map(s => s.monthly_cost || 0)) * 0.1)
    : 0

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '20px 20px 0', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500 }}>SWAP</h1>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 500 }}>김</div>
        </div>
        <div style={{ fontSize: 12, color: '#6b6b6b', paddingBottom: 16 }}>{YEAR}년 {MONTH}월 · 스마트 구독 관리</div>
      </div>

      {loading ? (
        <div style={{ margin: '16px 20px 0' }}><LoadingBox /></div>
      ) : error ? (
        <div style={{ margin: '16px 20px 0' }}><ErrorBox /></div>
      ) : (
        <>
          {nextExpiry && (
            <div style={{ margin: '16px 20px 0' }}>
              <div style={{ background: '#1A1A2E', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#F7F6F2' }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>다음 결제일</div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{nextExpiry.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{nextExpiry.next_billing_date}</div>
                </div>
                <div style={{ background: BRAND, color: '#fff', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 20 }}>
                  D-{dDay}
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '16px 20px 0' }}>
            <SpendChart />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, padding: '16px 20px 0' }}>
            {[
              {
                label: '이번 달 지출',
                val: `₩${total.toLocaleString()}원`,
                sub: diffPct != null ? `${isUp ? '↑' : '↓'} ${Math.abs(Math.round(diffPct))}% 전월 대비` : '전월 데이터 없음',
                subColor: diffPct != null ? (isUp ? '#E24B4A' : '#1D9E75') : '#6b6b6b',
              },
              {
                label: '절약 가능 금액',
                val: saveable > 0 ? `₩${saveable.toLocaleString()}원` : '-',
                sub: '↓ 월 절감 예상',
                subColor: '#1D9E75',
              },
              {
                label: '구독 수',
                val: `${subscriptions.length}건`,
                sub: `활성 구독`,
                subColor: '#BA7517',
              },
              {
                label: '주 지출 카테고리',
                val: topCategory ? topCategory[0] : '-',
                sub: topCategory ? `전체의 ${topCategoryPct}%` : '데이터 없음',
                subColor: '#6b6b6b',
              },
            ].map((c) => (
              <div key={c.label} style={{ ...S.card, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 17, fontWeight: 500 }}>{c.val}</div>
                <div style={{ fontSize: 11, marginTop: 2, color: c.subColor }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </>
      )}

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
GET /users/{id}/subscriptions/ 응답 배열 그대로 사용
*/
function HistoryScreen() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getSubscriptions()
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const CATEGORY_ICONS = { '통신': '📱', '카드': '💳', 'OTT': '🎬', '보험': '🛡', '기타': '📦' }
  const CATEGORY_BG    = { '통신': '#E8F5E9', '카드': '#FFF3E0', 'OTT': '#FCE4EC', '보험': '#E3F2FD', '기타': '#F5F5F5' }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '20px 20px 0', background: '#fff' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>구독 내역</h1>
        <div style={{ fontSize: 12, color: '#6b6b6b', paddingBottom: 16 }}>현재 활성 구독 목록</div>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <LoadingBox />}
        {error && <ErrorBox />}
        {!loading && !error && items.length === 0 && (
          <div style={{ ...S.card, fontSize: 13, color: '#6b6b6b', textAlign: 'center', padding: 24 }}>
            등록된 구독이 없어요
          </div>
        )}
        {!loading && !error && items.map((item) => (
          <div key={item.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: CATEGORY_BG[item.category] || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {CATEGORY_ICONS[item.category] || '📦'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>
                {item.next_billing_date ? `다음 결제: ${item.next_billing_date}` : '결제일 없음'}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: BRAND }}>
              ₩{(item.monthly_cost || 0).toLocaleString()}원/월
            </div>
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

/*
GET /users/{id}/subscriptions/ 에서 통신 카테고리 필터링
GET /users/{id}/spending/summary 에서 카테고리별 지출 사용
*/
function Step2({ swapType, selectedPlan, onSelectPlan }) {
  const [subscriptions, setSubscriptions] = useState([])
  const [spendData, setSpendData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!swapType) return
    setLoading(true)
    Promise.all([api.getSubscriptions(), api.getSpendCurr()])
      .then(([subs, spend]) => { setSubscriptions(subs); setSpendData(spend) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [swapType])

  if (loading) return <LoadingBox />
  if (error) return <ErrorBox />

  const total = spendData?.total || 0
  const byCategory = spendData?.by_category || {}

  if (swapType === 'mobile') {
    const telecomSubs = subscriptions.filter(s => s.category === '통신')
    return (
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>현재 통신 구독</div>
        <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 16 }}>변경할 요금제를 선택해요</div>
        {telecomSubs.length === 0 && (
          <div style={{ ...S.card, fontSize: 13, color: '#6b6b6b', textAlign: 'center', padding: 24 }}>등록된 통신 구독이 없어요</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {telecomSubs.map((s) => (
            <div key={s.id} onClick={() => onSelectPlan(s.id)}
              style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderColor: selectedPlan === s.id ? BRAND : 'rgba(0,0,0,0.08)', background: selectedPlan === s.id ? '#FDF0EB' : '#fff' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>다음 결제: {s.next_billing_date || '-'}</div>
                <div style={{ fontSize: 13, color: BRAND, fontWeight: 500, marginTop: 2 }}>₩{(s.monthly_cost || 0).toLocaleString()}원/월</div>
              </div>
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
      {Object.entries(byCategory).length === 0 && (
        <div style={{ ...S.card, fontSize: 13, color: '#6b6b6b', textAlign: 'center', padding: 24 }}>지출 데이터가 없어요</div>
      )}
      {Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => (
          <div key={cat} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💳</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{cat}</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>월 ₩{amount.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: BRAND, fontWeight: 500, marginTop: 2 }}>
                전체의 {total > 0 ? Math.round((amount / total) * 100) : 0}%
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}

function Step3({ swapType }) {
  const save   = swapType === 'card' ? '₩12,400' : '₩8,700'
  const annual = swapType === 'card' ? '₩148,800' : '₩104,400'
  const items  = swapType === 'mobile'
    ? [
        { title: '요금제 변경 절감', sub: '현재 요금제 → 알뜰폰 추천 요금제', save: '-₩8,700', ok: true },
        { title: 'OTT 번들 혜택',   sub: '넷플릭스 제휴 할인 포함',           save: '-₩3,900', ok: true },
        { title: '기기 할부금',     sub: '위약금 여부 확인 필요',              save: '확인 필요', ok: false },
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

function Step4({ swapType, onDone }) {
  const steps = swapType === 'mobile'
    ? [
        { title: '알뜰폰 사이트 접속', desc: '앱 또는 홈페이지에서 회원가입' },
        { title: '번호이동 신청',       desc: '기존 유심 그대로 사용 가능' },
        { title: '개통 완료',           desc: '영업일 1-2일 이내 개통' },
      ]
    : [
        { title: '카드 신청',    desc: '카드사 앱 또는 홈페이지에서 신청' },
        { title: '기존 카드 해지', desc: '새 카드 수령 후 해지 권장' },
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
        {swapType === 'mobile' ? '알뜰폰 바로가기 ↗' : '카드 신청 바로가기 ↗'}
      </button>
      <button onClick={onDone} style={{ width: '100%', background: 'none', color: '#1a1a1a', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: 13, fontSize: 14, cursor: 'pointer' }}>
        나중에 하기
      </button>
    </div>
  )
}

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