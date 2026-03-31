import * as React from "react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ icon, label, value, trend, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-lg border border-gray-200 shadow-sm",
        "flex flex-col justify-center gap-2",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-blue-500">
          {icon}
        </span>
        <span className="text-sm font-medium text-gray-500">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">
          {value}
        </span>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}
