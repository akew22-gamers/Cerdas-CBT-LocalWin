'use client'

import { useEffect, useState } from 'react'

interface Option {
  label: string
  text: string
}

interface QuestionDisplayProps {
  questionNumber: number
  teksSoal: string
  gambarUrl?: string | null
  options: Option[]
  selectedAnswer: string | null
  onAnswerChange: (answer: string) => void
}

declare global {
  interface Window {
    renderMathInElement: (element: Element, options?: any) => void
  }
}

export function QuestionDisplay({
  questionNumber,
  teksSoal,
  gambarUrl,
  options,
  selectedAnswer,
  onAnswerChange
}: QuestionDisplayProps) {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.renderMathInElement) {
      const element = document.getElementById(`question-content-${questionNumber}`)
      if (element) {
        window.renderMathInElement(element, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        })
        setRendered(true)
      }
    }
  }, [teksSoal, questionNumber])

  return (
    <div className="bg-white rounded-2xl shadow-md shadow-slate-200/50 ring-1 ring-slate-100 border border-slate-100 p-4 sm:p-6 md:p-8">
      <div className="flex items-start gap-4 mb-4 sm:mb-6">
        <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-sm shadow-blue-500/25 flex items-center justify-center font-bold text-sm sm:text-lg">
          {questionNumber}
        </span>
        <div id={`question-content-${questionNumber}`} className="flex-1 mt-0.5 sm:mt-1">
          <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {teksSoal}
          </p>
        </div>
      </div>

      {gambarUrl && (
        <div className="mb-4 sm:mb-6 ml-11 sm:ml-14">
          <img
            src={gambarUrl}
            alt="Gambar soal"
            className="max-w-full h-auto max-h-64 sm:max-h-96 rounded-lg border border-gray-200"
          />
        </div>
      )}

      <div className="space-y-3 pl-0 sm:ml-14">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onAnswerChange(option.text)}
            className={`
              w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-200
              flex items-center gap-3 sm:gap-4
              touch-manipulation outline-none active:scale-[0.99]
              ${selectedAnswer === option.text
                ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
              }
            `}
          >
            <span className={`
              w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 transition-colors
              ${selectedAnswer === option.text
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
              }
            `}>
              {option.label}
            </span>
            <span className={`flex-1 text-sm sm:text-base leading-snug ${selectedAnswer === option.text ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
              {option.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
