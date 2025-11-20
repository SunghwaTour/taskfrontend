export function getWeekNumber(date: Date): { weekNumber: number; year: number } {
  // Week starts on Thursday (목요일) and ends on next Wednesday (수요일)
  const target = new Date(date)
  
  // Adjust to Thursday-based week
  const dayOfWeek = target.getDay()
  const thursdayOffset = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3
  target.setDate(target.getDate() - thursdayOffset)
  
  // Get the first Thursday of the year
  const yearStart = new Date(target.getFullYear(), 0, 1)
  const firstThursday = new Date(yearStart)
  const firstDayOfWeek = yearStart.getDay()
  const daysToFirstThursday = firstDayOfWeek <= 4 ? 4 - firstDayOfWeek : 11 - firstDayOfWeek
  firstThursday.setDate(yearStart.getDate() + daysToFirstThursday)
  
  // Calculate week number
  const weekNumber = Math.ceil((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  
  return {
    weekNumber,
    year: target.getFullYear()
  }
}

export function getWeekDateRange(year: number, weekNumber: number): { start: Date; end: Date } {
  // Get first Thursday of the year
  const yearStart = new Date(year, 0, 1)
  const firstDayOfWeek = yearStart.getDay()
  const daysToFirstThursday = firstDayOfWeek <= 4 ? 4 - firstDayOfWeek : 11 - firstDayOfWeek
  const firstThursday = new Date(year, 0, 1 + daysToFirstThursday)
  
  // Calculate the Thursday of the target week
  const targetThursday = new Date(firstThursday)
  targetThursday.setDate(firstThursday.getDate() + (weekNumber - 1) * 7)
  
  // Week starts on Thursday
  const start = new Date(targetThursday)
  
  // Week ends on next Wednesday
  const end = new Date(targetThursday)
  end.setDate(targetThursday.getDate() + 6)
  
  return { start, end }
}

export function formatWeekLabel(year: number, weekNumber: number): string {
  const { start, end } = getWeekDateRange(year, weekNumber)
  
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
  
  return `${year}년 ${weekNumber}주차 (${formatDate(start)} ~ ${formatDate(end)})`
}

export function getCurrentWeek(): { year: number; weekNumber: number } {
  return getWeekNumber(new Date())
}

export function getAvailableWeeks(): Array<{ year: number; weekNumber: number; label: string }> {
  const weeks = []
  const currentDate = new Date()
  
  // Get last 12 weeks
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - i * 7)
    const { year, weekNumber } = getWeekNumber(date)
    const label = formatWeekLabel(year, weekNumber)
    weeks.push({ year, weekNumber, label })
  }
  
  return weeks
}

export function getAvailableMonths(): Array<{ year: number; month: number; label: string }> {
  const months = []
  const currentDate = new Date()
  
  // Get last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() - i)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    months.push({
      year,
      month,
      label: `${year}년 ${month}월`
    })
  }
  
  return months
}
