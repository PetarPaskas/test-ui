import React from 'react'

export default function DonutChart({ classifications }) {
  const size = 160
  const strokeWidth = 28
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  const visibleItems = classifications.filter(c => c.percentage > 0)
  let cumulativePercent = 0

  return (
    <div className="donut-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
        {visibleItems.map((item, i) => {
          const offset = circumference * (1 - cumulativePercent / 100)
          const dashLength = circumference * (item.percentage / 100)
          cumulativePercent += item.percentage
          return (
            <circle
              key={item.type} cx={cx} cy={cy} r={radius} fill="none"
              stroke={item.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={offset} strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease', transitionDelay: `${i * 0.08}s` }}
            />
          )
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="600" fontFamily="var(--font-mono)">{visibleItems.length}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="500" fontFamily="var(--font-body)" letterSpacing="0.05em">CLASSES</text>
      </svg>
    </div>
  )
}