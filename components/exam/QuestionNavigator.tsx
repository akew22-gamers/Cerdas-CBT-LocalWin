'use client'

import { cn } from '@/lib/utils'

interface QuestionNavigatorProps {
  totalQuestions: number
  answeredQuestions: number[]
  currentQuestion: number
  onQuestionSelect: (index: number) => void
}

export function QuestionNavigator({
  totalQuestions,
  answeredQuestions,
  currentQuestion,
  onQuestionSelect
}: QuestionNavigatorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4">
        Navigator Soal
      </h3>
      <div className="grid grid-cols-5 sm:grid-cols-5 gap-1 sm:gap-2 md:gap-3">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
          const isAnswered = answeredQuestions.includes(num)
          const isCurrent = num === currentQuestion

          return (
            <button
              key={num}
              onClick={() => onQuestionSelect(num)}
              className={cn(
                'aspect-square rounded-lg font-medium text-xs sm:text-sm transition-all duration-200',
                'flex items-center justify-center',
                'touch-manipulation',
                isCurrent && 'ring-2 ring-blue-600 ring-offset-2',
                isAnswered
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {num}
            </button>
          )
        })}
      </div>
      <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-600" />
          <span>Terjawab</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gray-100 border border-gray-300" />
          <span>Belum diisi</span>
        </div>
      </div>
    </div>
  )
}
