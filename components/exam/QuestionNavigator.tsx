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
      <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-3 sm:mb-4 uppercase tracking-wider">
        Navigasi Soal
      </h3>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
          const isAnswered = answeredQuestions.includes(num)
          const isCurrent = num === currentQuestion

          return (
            <button
              key={num}
              onClick={() => onQuestionSelect(num)}
              className={cn(
                'aspect-square rounded-lg font-bold text-xs transition-all duration-200',
                'flex items-center justify-center',
                'touch-manipulation active:scale-95',
                isCurrent && 'ring-2 ring-blue-500 ring-offset-2',
                isAnswered
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              )}
            >
              {num}
            </button>
          )
        })}
      </div>
      <div className="mt-4 sm:mt-5 flex items-center justify-between text-[11px] sm:text-xs text-slate-600 font-medium bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500 shadow-sm" />
          <span>Sudah Diisi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
          <span>Belum Diisi</span>
        </div>
      </div>
    </div>
  )
}
