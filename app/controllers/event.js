const Event = require('../models/Event')
const HANDLER = require('../utils/response-helper')
const HttpStatus = require('http-status-codes')
module.exports = {
  createEvent: async (req, res, next) => {
    const event = new Event(req.body)
    try {
      await event.save()
      res.status(HttpStatus.CREATED).json({ event: event })
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: error })
    }
  },
  updateEvent: async (req, res) => {
    const { id } = req.params
    const updates = Object.keys(req.body)
    try {
      const event = await Event.findById(id)
      if (!event) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No post exists' })
      }
      updates.forEach(update => {
        event[update] = req.body[update]
      })
      await event.save()
      res.status(HttpStatus.OK).json({ event: event })
    } catch (error) {
      HANDLER.handleError(res, error)
    }
  },
  rsvp: async (req, res) => {
    const { yes, no, maybe } = req.body
    const { id } = req.params
    try {
      const data = await Event.findById(id)
      if (!data) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: 'No Event is available' })
        return
      }
      if (data.rsvpMaybe.includes(req.user.id) ||
      data.rsvpNo.includes(req.user.id) ||
      data.rsvpYes.includes(req.user.id)) {
        return res.status(HttpStatus.OK).json({ msg: 'You have already done the rsvp' })
      }
      const event = await Event.findByIdAndUpdate(id)
      if (yes) {
        try {
          event.rsvpYes.push(req.user.id)
          await event.save()
          return res.status(HttpStatus.OK).json({ rsvpData: data })
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error })
        }
      }
      if (no) {
        try {
          event.rsvpNo.push(req.user.id)
          await event.save()
          return res.status(HttpStatus.OK).json({ rsvpData: data })
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error })
        }
      }
      if (maybe) {
        try {
          event.rsvpMaybe.push(req.user.id)
          await event.save()
          return res.status(HttpStatus.OK).json({ rsvpData: data })
        } catch (error) {
          return res.status(HttpStatus.BAD_REQUEST).json({ error: error })
        }
      }
    } catch (error) {
      HANDLER.handleError(res, error)
    }
  },
  GetEventById: async (req, res, next) => {
    const { id } = req.params
    try {
      const EventData = await Event.findById(id)
      if (!EventData) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'No such Event is available!' })
      }
      res.status(HttpStatus.OK).json({ Event: EventData })
    } catch (error) {
      next(error)
    }
  },
  GetAllEvent: async (req, res, next) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10
    const currentPage = req.query.page ? parseInt(req.query.page) : 1
    try {
      const EventData = await Event.find({})
        .lean()
        .skip((currentPage - 1) * pagination)
        .limit(pagination)
      if (!EventData) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'No such Event is available!' })
      }
      return res.status(HttpStatus.OK).json({ Event: EventData })
    } catch (error) {
      HANDLER.handleError(res, error)
    }
  },
  deleteEvent: async (req, res, next) => {
    const { id } = req.params
    try {
      const deleteEvent = await Event.findById(id)
      if (!deleteEvent) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'No Event exists' })
      }
      await Event.findByIdAndRemove(id)
      res.status(HttpStatus.OK).json({ deleteEvent: deleteEvent, message: 'Deleted the event' })
    } catch (error) {
      HANDLER.handleError(res, error)
    }
  },
  UpComingEvents: async (req, res, next) => {
    const pageSize = req.query.pagination ? parseInt(req.query.pagination) : 10
    const currentPage = req.query.page ? parseInt(req.query.page) : 1
    try {
      const events = await Event.find({ eventDate: { $gt: Date.now() } })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .exec()
      console.log('Upcoming events ', events)
      if (events.length === 0) {
        return res.status(HttpStatus.OK).json({ msg: 'No Upcoming events exists!' })
      }
      return res.status(HttpStatus.OK).json({ events })
    } catch (error) {
      HANDLER.handleError(res, next)
    }
  }
}
