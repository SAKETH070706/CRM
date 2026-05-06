const express = require('express');
const Lead = require('../models/Lead');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Create lead (authenticated users)
router.post('/', auth, async (req, res) => {
  const { name, email, phone, source } = req.body;
  try {
    const lead = new Lead({ name, email, phone, source, userId: req.user.id });
    await lead.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(req.user.id).emit('leadCreated', lead);
    if (req.user.role === 'admin') {
      io.emit('leadCreated', lead); // Notify all admins
    }

    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get leads (users see their own, admins see all)
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
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (source) query.source = source;

    const skip = (page - 1) * limit;
    const leads = await Lead.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Lead.countDocuments(query);

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single lead (users see their own, admins see all)
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

// Update lead (users update their own, admins update any)
router.put('/:id', auth, async (req, res) => {
  const { status, notes, name, email, phone, source } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (req.user.role !== 'admin' && lead.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (name) lead.name = name;
    if (email) lead.email = email;
    if (phone !== undefined) lead.phone = phone;
    if (source) lead.source = source;
    if (status) lead.status = status;
    if (notes) lead.notes.push({ text: notes });
    lead.updatedAt = Date.now();

    await lead.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(lead.userId.toString()).emit('leadUpdated', lead);
    if (req.user.role === 'admin') {
      io.emit('leadUpdated', lead); // Notify all admins
    }

    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add note to lead (users add to their own, admins to any)
router.post('/:id/notes', auth, async (req, res) => {
  const { text } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (req.user.role !== 'admin' && lead.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    lead.notes.push({ text });
    lead.updatedAt = Date.now();
    await lead.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(lead.userId.toString()).emit('leadUpdated', lead);
    if (req.user.role === 'admin') {
      io.emit('leadUpdated', lead); // Notify all admins
    }

    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete lead (users delete their own, admins delete any)
router.delete('/:id',adminAuth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (req.user.role !== 'admin' && lead.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Lead.findByIdAndDelete(req.params.id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(lead.userId.toString()).emit('leadDeleted', req.params.id);
    if (req.user.role === 'admin') {
      io.emit('leadDeleted', req.params.id); // Notify all admins
    }

    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;