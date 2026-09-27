/**
 * One place that reads an order from the API (`OrderResource`), so the account pages don't each
 * guess field names. List rows carry no products / address; the detail response does.
 */
export function orderView(raw) {
  const o = raw?.order ?? raw ?? {};
  const address = o.shipping_address || {};

  return {
    id: o.id,
    // the short, human number; unique_code is the long tracking code
    number: o.invoice_no || o.unique_code || (o.id != null ? `#${o.id}` : '—'),
    trackingCode: o.unique_code,
    date: o.date || o.created_at,
    status: o.sale_status || o.status || '',
    paidStatus: o.sale_paid_status || '',
    paymentType: o.payment_type || '',
    subTotal: num(o.sub_total),
    shipping: num(o.shipping_charge),
    discount: num(o.discount_amount),
    couponDiscount: num(o.discount_coupon_amount),
    total: num(o.total_amount),
    returned: num(o.returned_amount),
    paid: num(o.paid_amount),
    due: num(o.due_amount),
    canCancel: Boolean(o.can_cancel),
    canRequestReturn: Boolean(o.can_request_return),
    note: o.note || '',
    items: (Array.isArray(o.products) ? o.products : []).map((line) => ({
      id: line.id,
      name: line.product?.name || line.product_name || '',
      slug: line.product?.slug,
      image: line.product?.thumbnail || null,
      variant: line.barcode?.combination || '',
      quantity: num(line.quantity),
      unitPrice: num(line.selling_price),
      total: num(line.subtotal_price ?? num(line.selling_price) * num(line.quantity)),
    })),
    address: {
      name: address.name || '',
      phone: address.phone || '',
      email: address.email || '',
      line: [address.address, address.city, address.zip_code, address.country].filter(Boolean).join(', '),
    },
    activities: Array.isArray(o.status_activities) ? o.status_activities : [],
  };
}

function num(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}
