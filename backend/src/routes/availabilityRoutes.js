const express = require('express')
const { orders } = require('../data/store')
const {
  PRIVATE_LESSON_SLOT_TIMES,
  collectPrivateLessonBookings,
  dateInMonth,
} = require('../utils/privateLessonSlots')

const router = express.Router()

/**
 * GET /availability/private-lessons?month=YYYY-MM
 * Public: lets shoppers see which slots are already taken.
 */
router.get('/private-lessons', (req, res) => {
  const month = req.query.month
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'Query "month" is required (YYYY-MM).' })
  }
  const allBooked = collectPrivateLessonBookings(orders)
  const booked = allBooked.filter((b) => dateInMonth(b.date, month))
  return res.json({
    month,
    slotTimes: PRIVATE_LESSON_SLOT_TIMES,
    booked,
  })
})

module.exports = router
