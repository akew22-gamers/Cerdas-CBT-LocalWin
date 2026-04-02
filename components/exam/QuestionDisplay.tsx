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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
      <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
        <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
          {questionNumber}
        </span>
        <div id={`question-content-${questionNumber}`} className="flex-1">
          <p className="text-gray-900 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
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

      <div className="space-y-2 sm:space-y-3 ml-11 sm:ml-14">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onAnswerChange(option.text)}
            className={`
              w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200
              flex items-center gap-3 sm:gap-4
              touch-manipulation
              ${selectedAnswer === option.text
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className={`
              w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0
              ${selectedAnswer === option.text
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
              }
            `}>
              {option.label}
            </span>
            <span className="text-gray-900 flex-1 text-sm sm:text-base">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
