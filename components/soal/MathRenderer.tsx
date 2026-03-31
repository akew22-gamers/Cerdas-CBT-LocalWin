'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'

interface MathRendererProps {
  text: string
  className?: string
  block?: boolean
}

export function MathRenderer({ text, className = '', block = false }: MathRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!containerRef.current || !text) return

    try {
      const html = renderMath(text, block)
      containerRef.current.innerHTML = html
    } catch (error) {
      console.error('KaTeX rendering error:', error)
      if (containerRef.current) {
        containerRef.current.textContent = text
      }
    }
  }, [text, block])

  if (!text) return null

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ display: block ? 'block' : 'inline' }}
    />
  )
}

function renderMath(text: string, block: boolean): string {
  if (!text) return ''

  let result = text
  let match

  const inlinePattern = /\$(.+?)\$/g
  const blockPattern = /\$\$([\s\S]+?)\$\$/g

  const inlineMatches: Array<{ full: string; expr: string; index: number }> = []
  const blockMatches: Array<{ full: string; expr: string; index: number }> = []

  while ((match = inlinePattern.exec(text)) !== null) {
    inlineMatches.push({ full: match[0], expr: match[1], index: match.index })
  }

  while ((match = blockPattern.exec(text)) !== null) {
    blockMatches.push({ full: match[0], expr: match[1], index: match.index })
  }

  const allMatches = [...inlineMatches, ...blockMatches].sort((a, b) => a.index - b.index)

  if (allMatches.length === 0) {
    return text
  }

  allMatches.forEach(({ full, expr }) => {
    try {
      const rendered = katex.renderToString(expr, {
        displayMode: full.startsWith('$$'),
        throwOnError: false,
        errorColor: '#cc0000'
      })
      result = result.replace(full, rendered)
    } catch (error) {
      console.error('KaTeX error:', error)
    }
  })

  return result
}
