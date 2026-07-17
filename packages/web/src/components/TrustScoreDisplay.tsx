interface TrustScoreDisplayProps {
  score: number
}

export function TrustScoreDisplay({ score }: TrustScoreDisplayProps) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2.5 w-32">
        <div
          className={`h-2.5 rounded-full ${getColor().replace('text', 'bg')}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        ></div>
      </div>
      <span className={`text-sm font-semibold ${getColor()}`}>{score}/100</span>
    </div>
  )
}
