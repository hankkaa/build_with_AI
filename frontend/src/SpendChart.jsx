import { useState, useEffect } from 'react'
import { api } from './api'

/*
GET /users/{user_id}/spending/summary?year=&month= 응답:
{
  "year": 2025, "month": 5,
  "by_category": { "통신": 130000, "식비": 85000, ... },
  "total": 342000,
  "vs_last_month": 12.5   // null이면 비교 불가
}
*/

const CATEGORY_COLORS = {
  '통신':   '#E8572A',
  '식비':   '#378ADD',
  '교통':   '#1D9E75',
  '쇼핑':   '#BA7517',
  '구독':   '#7F77DD',
  '기타':   '#888780',
  '공과금': '#D4537E',
  '의료':   '#5DCAA5',
}
const FALLBACK_COLORS = ['#E8572A','#378ADD','#1D9E75','#BA7517','#7F77DD','#888780','#D4537E','#5DCAA5']

function getColor(key, index) {
  return CATEGORY_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function toBreakdownPct(byCategory, total) {
  if (!byCategory || total === 0) return {}
  return Object.fromEntries(
    Object.entries(byCategory).map(([k, v]) => [k, Math.round((v / total) * 100)])
  )
}

function StackedBar({ breakdown, categories, hoveredKey, onHover }) {
  if (!categories.length) {
    return (
      <div style={{ height: 36, borderRadius: 8, background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: '#6b6b6b' }}>데이터 없음</span>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', height: 36, borderRadius: 8, overflow: 'hidden', width: '100%' }}>
      {categories.map((cat, i) => (
        <div key={cat.key}
          onMouseEnter={() => onHover(cat.key)}
          onMouseLeave={() => onHover(null)}
          style={{
            width: `${breakdown[cat.key] || 0}%`,
            background: cat.color,
            opacity: hoveredKey && hoveredKey !== cat.key ? 0.3 : 1,
            transition: 'opacity 0.18s',
            cursor: 'pointer',
            borderRight: i < categories.length - 1 ? '2px solid #fff' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function SpendChart() {
  const [curr, setCurr] = useState(null)
  const [prev, setPrev] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredKey, setHoveredKey] = useState(null)

  useEffect(() => {
    Promise.all([api.getSpendCurr(), api.getSpendPrev()])
      .then(([c, p]) => { setCurr(c); setPrev(p) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16, fontSize: 13, color: '#6b6b6b' }}>
      불러오는 중...
    </div>
  )
  if (error) return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16, fontSize: 13, color: '#E24B4A' }}>
      데이터를 불러오지 못했어요.
    </div>
  )

  const currTotal = curr?.total || 0
  const prevTotal = prev?.total || 0
  const currBreakdown = toBreakdownPct(curr?.by_category, currTotal)
  const prevBreakdown = toBreakdownPct(prev?.by_category, prevTotal)

  const allKeys = Array.from(new Set([
    ...Object.keys(curr?.by_category || {}),
    ...Object.keys(prev?.by_category || {}),
  ]))
  const categories = allKeys.map((key, i) => ({ key, color: getColor(key, i) }))

  const diffPct = curr?.vs_last_month
  const isUp = diffPct > 0
  const hoveredCat = categories.find((c) => c.key === hoveredKey)

  const months = [
    { label: `${prev?.month || ''}월 (지난달)`, total: prevTotal, breakdown: prevBreakdown },
    { label: `${curr?.month || ''}월 (이번달)`, total: currTotal, breakdown: currBreakdown },
  ]

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 2 }}>월별 지출 현황</div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>₩{currTotal.toLocaleString()}원</div>
        </div>
        {diffPct != null && (
          <div style={{ fontSize: 12, fontWeight: 500, color: isUp ? '#A32D2D' : '#1D9E75', background: isUp ? '#FCEBEB' : '#EAF3DE', padding: '4px 10px', borderRadius: 20, marginTop: 2 }}>
            {isUp ? '▲' : '▼'} {Math.abs(Math.round(diffPct))}% 전월 대비
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {months.map((m) => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b6b6b', fontWeight: 500 }}>{m.label}</span>
              <span style={{ fontSize: 12, color: '#6b6b6b' }}>₩{m.total.toLocaleString()}원</span>
            </div>
            <StackedBar breakdown={m.breakdown} categories={categories} hoveredKey={hoveredKey} onHover={setHoveredKey} />
          </div>
        ))}
      </div>

      {hoveredCat ? (
        <div style={{ marginTop: 14, padding: '10px 12px', background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: hoveredCat.color, display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{hoveredCat.key}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b6b6b' }}>
            <span>지난달 <strong style={{ color: '#1a1a1a' }}>{prevBreakdown[hoveredCat.key] || 0}%</strong></span>
            <span>이번달 <strong style={{ color: '#1a1a1a' }}>{currBreakdown[hoveredCat.key] || 0}%</strong></span>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: '8px 14px' }}>
          {categories.map((cat) => (
            <div key={cat.key}
              onMouseEnter={() => setHoveredKey(cat.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b6b6b', cursor: 'default' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, display: 'inline-block' }} />
              {cat.key} {currBreakdown[cat.key] || 0}%
            </div>
          ))}
          {categories.length === 0 && (
            <span style={{ fontSize: 12, color: '#6b6b6b' }}>지출 데이터를 입력하면 그래프가 표시돼요</span>
          )}
        </div>
      )}
    </div>
  )
}