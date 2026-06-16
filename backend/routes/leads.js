const express = require('express');
const Lead = require('../models/Lead');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

/**
 * Emit a lead event to:
 *  - the lead owner's personal room
 *  - the 'admin' room (so all admins see every lead change)
 * Never uses io.emit() which would broadcast to every socket.
 */
function emitLeadEvent(io, eventName, payload, ownerUserId) {
  io.to(ownerUserId.toString()).emit(eventName, payload);
  io.to('admin').emit(eventName, payload);
}

// ── Create lead ──────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { name, email, phone, source } = req.body;
  try {
    const lead = new Lead({ name, email, phone, source, userId: req.user.id });
    await lead.save();

    // Populate so the client gets userId.name and userId.email
    await lead.populate('userId', 'name email');

    const io = req.app.get('io');
    emitLeadEvent(io, 'leadCreated', lead, req.user.id);

    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Get leads ────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, source, page = 1, limit = 10 } = req.query;
    let query = {};

    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (source) query.source = source;

    const skip = (page - 1) * limit;
    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Lead.countDocuments(query),
    ]);

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get single lead ──────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('userId', 'name email');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (req.user.role !== 'admin' && lead.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update lead ──────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  const { status, notes, name, email, phone, source } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const ownerId = lead.userId.toString();

    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (name)              lead.name = name;
    if (email)             lead.email = email;
    if (phone !== undefined) lead.phone = phone;
    if (source)            lead.source = source;
    if (status)            lead.status = status;
    if (notes)             lead.notes.push({ text: notes });
    lead.updatedAt = Date.now();

    await lead.save();

    // Populate AFTER save so the emitted payload has userId.name/email
    await lead.populate('userId', 'name email');

    const io = req.app.get('io');
    emitLeadEvent(io, 'leadUpdated', lead, ownerId);

    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Add note to lead ─────────────────────────────────────────────────
router.post('/:id/notes', auth, async (req, res) => {
  const { text } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const ownerId = lead.userId.toString();

    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    lead.notes.push({ text });
    lead.updatedAt = Date.now();
    await lead.save();

    await lead.populate('userId', 'name email');

    const io = req.app.get('io');
    emitLeadEvent(io, 'leadUpdated', lead, ownerId);

    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Delete lead ──────────────────────────────────────────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const ownerId = lead.userId.toString();

    await Lead.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    emitLeadEvent(io, 'leadDeleted', req.params.id, ownerId);

    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;