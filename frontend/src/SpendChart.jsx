import { useState, useEffect } from 'react'
import { api } from './api'

const CATEGORIES = [
  { key: 'telecom',   label: '통신',  color: '#E8572A' },
  { key: 'food',      label: '식비',  color: '#378ADD' },
  { key: 'transport', label: '교통',  color: '#1D9E75' },
  { key: 'shopping',  label: '쇼핑',  color: '#BA7517' },
  { key: 'ott',       label: '구독',  color: '#7F77DD' },
  { key: 'etc',       label: '기타',  color: '#888780' },
]

/*
GET /api/spend/monthly 응답 형식:
{
  "prev": {
    "label": "지난달",
    "total": 304000,
    "breakdown": { "telecom": 32, "food": 28, "transport": 15, "shopping": 12, "ott": 8, "etc": 5 }
  },
  "curr": {
    "label": "이번달",
    "total": 342000,
    "breakdown": { "telecom": 38, "food": 25, "transport": 14, "shopping": 11, "ott": 7, "etc": 5 }
  }
}
*/

function StackedBar({ monthData, onHover, hoveredKey }) {
  return (
    <div style={{ display: 'flex', height: 36, borderRadius: 8, overflow: 'hidden', width: '100%' }}>
      {CATEGORIES.map((cat, i) => (
        <div key={cat.key}
          onMouseEnter={() => onHover(cat.key)}
          onMouseLeave={() => onHover(null)}
          style={{
            width: `${monthData.breakdown[cat.key]}%`,
            background: cat.color,
            opacity: hoveredKey && hoveredKey !== cat.key ? 0.3 : 1,
            transition: 'opacity 0.18s',
            cursor: 'pointer',
            borderRight: i < CATEGORIES.length - 1 ? '2px solid #fff' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function SpendChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredKey, setHoveredKey] = useState(null)

  useEffect(() => {
    api.getSpendMonthly()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16, color: '#6b6b6b', fontSize: 13 }}>
      데이터 불러오는 중...
    </div>
  )
  if (error) return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16, color: '#E24B4A', fontSize: 13 }}>
      데이터를 불러오지 못했어요. 백엔드 연결을 확인해주세요.
    </div>
  )

  const { prev, curr } = data
  const diff = curr.total - prev.total
  const diffPct = Math.round((diff / prev.total) * 100)
  const isUp = diff > 0
  const hoveredCat = CATEGORIES.find((c) => c.key === hoveredKey)

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 2 }}>월별 지출 현황</div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>₩{curr.total.toLocaleString()}원</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: isUp ? '#A32D2D' : '#1D9E75', background: isUp ? '#FCEBEB' : '#EAF3DE', padding: '4px 10px', borderRadius: 20, marginTop: 2 }}>
          {isUp ? '▲' : '▼'} {Math.abs(diffPct)}% 전월 대비
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[prev, curr].map((month) => (
          <div key={month.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b6b6b', fontWeight: 500 }}>{month.label}</span>
              <span style={{ fontSize: 12, color: '#6b6b6b' }}>₩{month.total.toLocaleString()}</span>
            </div>
            <StackedBar monthData={month} onHover={setHoveredKey} hoveredKey={hoveredKey} />
          </div>
        ))}
      </div>
      {hoveredCat ? (
        <div style={{ marginTop: 14, padding: '10px 12px', background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: hoveredCat.color, display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{hoveredCat.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b6b6b' }}>
            <span>지난달 <strong style={{ color: '#1a1a1a' }}>{prev.breakdown[hoveredCat.key]}%</strong></span>
            <span>이번달 <strong style={{ color: '#1a1a1a' }}>{curr.breakdown[hoveredCat.key]}%</strong></span>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: '8px 14px' }}>
          {CATEGORIES.map((cat) => (
            <div key={cat.key}
              onMouseEnter={() => setHoveredKey(cat.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b6b6b', cursor: 'default' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, display: 'inline-block' }} />
              {cat.label} {curr.breakdown[cat.key]}%
            </div>
          ))}
        </div>
      )}
    </div>
  )
}