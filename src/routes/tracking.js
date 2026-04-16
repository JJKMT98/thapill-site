const express = require('express');
const router = express.Router();

const Order = require('../models/order');
const Shipment = require('../models/shipment');
const { requireAuth } = require('../middleware/auth');

const STATUSES = ['order-placed', 'processing', 'shipped', 'in-transit', 'out-for-delivery', 'delivered'];

router.get('/:orderNumber', (req, res) => {
  const order = Order.findByNumber(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = Order.getItems(order.id);
  const shipment = Shipment.findByOrder(order.id);

  const statusIndex = shipment
    ? STATUSES.indexOf(shipment.status)
    : (order.status === 'paid' || order.status === 'processing' ? 1 : 0);

  const history = shipment && shipment.status_history
    ? JSON.parse(shipment.status_history)
    : [];

  const steps = STATUSES.map((s, i) => ({
    key: s,
    label: s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    completed: i <= statusIndex,
    current: i === statusIndex,
    timestamp: history.find(h => h.status === s)?.timestamp || (i <= statusIndex ? order.created_at : null),
    detail: history.find(h => h.status === s)?.detail || null,
  }));

  res.json({
    order_number: order.order_number,
    status: order.status,
    estimated_delivery: shipment?.estimated_delivery || null,
    carrier: shipment?.carrier || null,
    tracking_number: shipment?.tracking_number || null,
    tracking_url: shipment?.tracking_url || null,
    steps,
    items: items.map(i => ({ name: i.name, quantity: i.quantity, image_url: i.image_url })),
    total_pence: order.total_pence,
    created_at: order.created_at,
  });
});

router.post('/admin/:orderNumber/status', requireAuth, (req, res) => {
  if (req.user.email !== (process.env.ADMIN_EMAIL || 'hello@thapill.com')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { status, tracking_number, tracking_url, carrier, estimated_delivery, detail } = req.body;
  const order = Order.findByNumber(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  let shipment = Shipment.findByOrder(order.id);
  if (!shipment) {
    shipment = Shipment.create({
      order_id: order.id,
      carrier: carrier || 'royal-mail',
      tracking_number: tracking_number || null,
      tracking_url: tracking_url || null,
      estimated_delivery: estimated_delivery || null,
    });
  }

  if (tracking_number) Shipment.setTracking(shipment.id, tracking_number, tracking_url || null);

  const history = JSON.parse(shipment.status_history || '[]');
  history.push({ status, timestamp: new Date().toISOString(), detail: detail || null });

  Shipment.updateStatus(shipment.id, status, JSON.stringify(history));

  const orderStatus = status === 'delivered' ? 'delivered' : (status === 'shipped' || status === 'in-transit' || status === 'out-for-delivery') ? 'shipped' : order.status;
  Order.updateStatus(order.id, orderStatus);

  res.json({ ok: true, status });
});

module.exports = router;
