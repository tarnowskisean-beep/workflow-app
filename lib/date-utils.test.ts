import { describe, it, expect } from 'vitest'
import { parseLocalDate, formatLocalDate, getToday } from './date-utils'
import { startOfDay } from 'date-fns'

describe('Date Utils', () => {
    describe('parseLocalDate', () => {
        it('should parse YYYY-MM-DD string as local date at midnight', () => {
            const input = '2023-10-25'
            const result = parseLocalDate(input)

            // Expected: 2023-10-25T00:00:00 local time
            expect(result.getFullYear()).toBe(2023)
            expect(result.getMonth()).toBe(9) // 0-indexed
            expect(result.getDate()).toBe(25)
            expect(result.getHours()).toBe(0)
        })

        it('should default to today if input is empty', () => {
            const result = parseLocalDate('')
            const today = new Date()
            expect(result.getDate()).toBe(today.getDate())
            expect(result.getMonth()).toBe(today.getMonth())
        })
    })

    describe('formatLocalDate', () => {
        it('should format date as YYYY-MM-DD', () => {
            const date = new Date(2023, 9, 25, 12, 0, 0) // Oct 25, 2023 12:00 PM
            const result = formatLocalDate(date)
            expect(result).toBe('2023-10-25')
        })
    })

    describe('getToday', () => {
        it('should return start of today', () => {
            const today = getToday()
            const now = new Date()
            expect(today.getDate()).toBe(now.getDate())
            expect(today.getHours()).toBe(0)
            expect(today.getMinutes()).toBe(0)
        })
    })
})
