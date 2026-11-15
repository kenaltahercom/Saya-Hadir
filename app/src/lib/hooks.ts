import { useEffect, useState } from 'react'
import { scheduleOf } from './attendance'
import { useStore } from './store'
import type { Attendance, DB, Employee, Schedule } from './types'
import { zoned, type Zoned } from './time'

export function useNow(everyMs = 15000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(t)
  }, [everyMs])
  return now
}

export function useMe() {
  const { db, account } = useStore()
  const emp = db?.employees.find((e) => e.id === account?.employeeId)
  const sch = db && emp ? scheduleOf(db, emp) : undefined
  return { db: db!, account, emp: emp as Employee, sch }
}

export type DayState = 'inactive' | 'no_office' | 'not_workday' | 'can_in' | 'can_out' | 'done' | 'recorded_other'

export interface Today {
  now: Zoned
  record?: Attendance
  state: DayState
}

export function todayOf(db: DB, emp: Employee, sch: Schedule | undefined, nowMs: number): Today {
  const now = zoned(nowMs, db.company.timezone)
  const record = db.attendance.find((a) => a.employeeId === emp.id && a.date === now.date)
  let state: DayState
  if (emp.status !== 'active') state = 'inactive'
  else if (!db.office) state = 'no_office'
  else if (!sch || !sch.days.includes(now.dow)) state = 'not_workday'
  else if (record && !record.inAt) state = 'recorded_other'
  else if (!record) state = 'can_in'
  else if (!record.outAt) state = 'can_out'
  else state = 'done'
  return { now, record, state }
}
