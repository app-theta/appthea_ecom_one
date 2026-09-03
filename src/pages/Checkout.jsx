import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkout as checkoutApi } from '../api/endpoints';
import { parseApiError, isPriceMismatch, needsOtp } from '../api/errors';
import { useCart, qtyOf } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Crumbs } from '../components/layout/Layout';
import OtpModal from '../components/checkout/OtpModal';
import { Img, Empty } from '../components/ui/Ui';
import { money } from '../utils/format';

const BLANK = {
  full_name: '', email: '', phone: '', address: '',
  city: '', country: 'Bangladesh', zip_code: '', order_note: '',
};

export default function Checkout() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const { items, subtotal, apiCart, syncPrices, clear } = useCart();
  const { shipping, enabledPayments, features, info } = useBusiness();
  const { customer, isAuthed } = useAuth();

  const [form, setForm] = useState(BLANK);
  const [area, setArea] = useState('inside_city');
  const [payment, setPayment] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpDone, setOtpDone] = useState(false);
  const renderedAt = useRef(Math.floor(Date.now() / 1000));
  const honeypot = useRef('');

  useEffect(() => {
    if (!payment && enabledPayments.length) setPayment(enabledPayments[0]);
  }, [enabledPayments, payment]);

  useEffect(() => {
    if (!isAuthed || !customer) return;
    setForm((f) => ({
      ...f,
      full_name: f.full_name || [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.name || '',
      email: f.email || customer.email || '',
      phone: f.phone || customer.phone || '',
      address: f.address || customer.address || '',
      city: f.city || customer.city || '',
    }));
  }, [isAuthed, customer]);

  const shippingCharge = useMemo(() => {
    if (shipping.freeAbove > 0 && subtotal >= shipping.freeAbove) return 0;
    return area === 'inside_city' ? shipping.inside : shipping.outside;
  }, [area, shipping, subtotal]);

  const discount = Number(applied?.discount_amount ?? 0);
  const grandTotal = useMemo(() => {
    if (applied?.grand_total != null) return Number(applied.grand_total);
    return Math.max(0, subtotal + shippingCharge - discount);
  }, [applied, subtotal, shippingCharge, discount]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!items.length) {
    return (
      <div className="shell section">
        <Empty
          icon="bi-bag"
          title={t('checkout.emptyCart')}
          action={<Link to="/products" className="btn btn-primary mt-2">{t('cart.keepShopping')}</Link>}
        />
      </div>
    );
  }

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponBusy(true); setCouponError(null);
    try {
      const data = await checkoutApi.applyCoupon({
        coupon_code: coupon.trim(),
        cart: apiCart(),
        shipping_area: area,
      });
      setApplied(data);
      toast.success(t('checkout.couponApplied'));
    } catch (e) {
      const parsed = parseApiError(e);
      setApplied(null);
      setCouponError(parsed.message);
    } finally { setCouponBusy(false); }
  };

  const removeCoupon = () => { setApplied(null); setCoupon(''); setCouponError(null); };

  const place = async (e) => {
    e?.preventDefault();
    setErrors({}); setBanner(null);

    if (!payment) { setBanner({ kind: 'error', text: t('checkout.payment') }); return; }
    setPlacing(true);

    try {
      /* Backend re-prices every line and rejects mismatches — refresh first. */
      const { changed } = await syncPrices();
      if (changed) {
        setBanner({ kind: 'info', text: t('cart.priceUpdated') });
        setPlacing(false);
        return;
      }

      const payload = {
        cart: apiCart(),
        coupon_code: applied ? coupon.trim() : '',
        coupon_discount_amount: discount,
        ...form,
        shipping_area: area,
        payment_type: payment,
        grand_total: grandTotal,
        website: honeypot.current,
        form_rendered_at: renderedAt.current,
      };

      const res = await checkoutApi.place(payload);
      if (res?.status === false) throw { response: { data: res, status: res.code } };

      const data = res?.data || {};
      const code = data.order?.unique_code || data.order?.order_code || '';

      if (data.payment_required && data.payment_url) {
        toast.info(t('checkout.redirecting'));
        window.location.href = data.payment_url;
        return;
      }

      clear();
      navigate(`/order/success?order=${encodeURIComponent(code)}&message=${encodeURIComponent(res?.message || '')}`);
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);

      if (needsOtp(parsed) && payment === 'Cash On Delivery' && !otpDone) {
        setOtpOpen(true);
      } else if (isPriceMismatch(parsed)) {
        await syncPrices();
        setBanner({ kind: 'error', text: t('checkout.priceChanged') });
      } else {
        setBanner({ kind: 'error', text: parsed.message });
        if (parsed.list.length > 1) setBanner({ kind: 'error', text: parsed.message, list: parsed.list });
      }
    } finally { setPlacing(false); }
  };

  return (
    <>
      <Crumbs trail={[{ label: t('cart.title'), to: '/cart' }, { label: t('checkout.title') }]} />
      <div className="shell" style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
        <h1 className="display mb-5">{t('checkout.title')}</h1>

        {banner && (
          <div
            className="mb-4 p-4"
            role="alert"
            style={{
              background: banner.kind === 'error' ? 'rgba(255,77,31,.07)' : 'var(--bgAlt)',
              borderLeft: `3px solid ${banner.kind === 'error' ? 'var(--flame)' : 'var(--navy)'}`,
              borderRadius: 'var(--radius)',
            }}
          >
            <div>{banner.text}</div>
            {banner.list && (
              <ul className="mb-0 mt-2" style={{ fontSize: 'var(--fs-13)' }}>
                {banner.list.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={place} noValidate>
          <div className="row g-5">
            <div className="col-lg-7">
              <section className="mb-5">
                <div className="step-head">
                  <span className="step-head__n">1</span>
                  <h3>{t('checkout.contact')}</h3>
                </div>

                <div className="row g-3">
                  <Field className="col-12" id="full_name" label={t('checkout.fullName')} value={form.full_name} onChange={set('full_name')} error={errors.full_name} required />
                  <Field className="col-md-6" id="phone" label={t('checkout.phone')} value={form.phone} onChange={set('phone')} error={errors.phone} type="tel" required />
                  <Field className="col-md-6" id="email" label={t('checkout.email')} value={form.email} onChange={set('email')} error={errors.email} type="email" />
                  <Field className="col-12" id="address" label={t('checkout.address')} value={form.address} onChange={set('address')} error={errors.address} required />
                  <Field className="col-md-5" id="city" label={t('checkout.city')} value={form.city} onChange={set('city')} error={errors.city} required />
                  <Field className="col-md-4" id="country" label={t('checkout.country')} value={form.country} onChange={set('country')} error={errors.country} />
                  <Field className="col-md-3" id="zip_code" label={t('checkout.zip')} value={form.zip_code} onChange={set('zip_code')} error={errors.zip_code} />
                  <div className="col-12">
                    <label className="opt-label" htmlFor="order_note">
                      {t('checkout.note')} <span className="mute text-lowercase">({t('common.optional')})</span>
                    </label>
                    <textarea
                      id="order_note"
                      className="form-control"
                      rows={3}
                      value={form.order_note}
                      onChange={set('order_note')}
                      placeholder={t('checkout.notePlaceholder')}
                    />
                  </div>
                </div>

                {/* honeypot — invisible to humans, filled only by bots */}
                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    onChange={(e) => { honeypot.current = e.target.value; }}
                  />
                </div>
              </section>

              <section className="mb-5">
                <div className="step-head">
                  <span className="step-head__n">2</span>
                  <h3>{t('checkout.shippingArea')}</h3>
                </div>
                <div className="row g-2">
                  {[
                    { key: 'inside_city', label: t('checkout.insideCity'), amount: shipping.inside },
                    { key: 'outside_city', label: t('checkout.outsideCity'), amount: shipping.outside },
                  ].map((opt) => (
                    <div className="col-md-6" key={opt.key}>
                      <button type="button" className="pick" aria-pressed={area === opt.key} onClick={() => setArea(opt.key)}>
                        <span className="pick__dot" aria-hidden="true" />
                        <span>
                          <span className="pick__title d-block">{opt.label}</span>
                          <span className="pick__note mono">
                            {shipping.freeAbove > 0 && subtotal >= shipping.freeAbove ? t('common.free') : money(opt.amount)}
                          </span>
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
                {shipping.freeAbove > 0 && subtotal < shipping.freeAbove && (
                  <p className="mute mt-3 mb-0" style={{ fontSize: 'var(--fs-12)' }}>
                    {money(shipping.freeAbove - subtotal)} {t('cart.freeShipRemaining')}
                  </p>
                )}
              </section>

              <section>
                <div className="step-head">
                  <span className="step-head__n">3</span>
                  <h3>{t('checkout.payment')}</h3>
                </div>
                {enabledPayments.length === 0 ? (
                  <p className="mute">{t('common.somethingWrong')}</p>
                ) : (
                  <div className="row g-2">
                    {enabledPayments.map((type) => (
                      <div className="col-md-6" key={type}>
                        <button type="button" className="pick" aria-pressed={payment === type} onClick={() => setPayment(type)}>
                          <span className="pick__dot" aria-hidden="true" />
                          <span>
                            <span className="pick__title d-block">{t(`pay.${type}`)}</span>
                            <span className="pick__note">
                              {type === 'Cash On Delivery' ? t('pay.codNote') : t('pay.onlineNote')}
                            </span>
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="col-lg-5">
              <div className="summary" style={{ position: 'sticky', top: 'calc(var(--headerHeight) + var(--sp-5))' }}>
                <h2 className="offcanvas-title mb-4">{t('checkout.summary')}</h2>

                <div className="d-grid gap-3 mb-4">
                  {items.map((line) => (
                    <div className="d-flex gap-3" key={line.key}>
                      <span style={{ width: 54, flex: '0 0 54px', aspectRatio: '3 / 4', overflow: 'hidden', borderRadius: 4 }}>
                        <Img src={line.meta?.image} alt="" label="" />
                      </span>
                      <div className="flex-grow-1" style={{ fontSize: 'var(--fs-13)' }}>
                        <div>{line.meta?.name}</div>
                        <div className="mute">
                          {line.meta?.variant ? `${line.meta.variant} · ` : ''}× {qtyOf(line)}
                        </div>
                      </div>
                      <span className="mono" style={{ fontSize: 'var(--fs-13)' }}>{money(line.total_price)}</span>
                    </div>
                  ))}
                </div>

                {features.is_coupon && (
                  <div className="mb-4">
                    <label className="opt-label" htmlFor="coupon">{t('checkout.coupon')}</label>
                    {applied ? (
                      <div className="d-flex align-items-center justify-content-between">
                        <span><i className="bi bi-ticket-perforated me-2" aria-hidden="true" />{coupon.toUpperCase()}</span>
                        <button type="button" className="link-quiet" onClick={removeCoupon}>{t('checkout.couponRemove')}</button>
                      </div>
                    ) : (
                      <div className="d-flex gap-2">
                        <input
                          id="coupon"
                          className="form-control"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          placeholder="ABC10"
                        />
                        <button type="button" className="btn btn-dark" onClick={applyCoupon} disabled={couponBusy}>
                          {couponBusy ? '…' : t('common.apply')}
                        </button>
                      </div>
                    )}
                    {couponError && <div className="field-error">{couponError}</div>}
                  </div>
                )}

                <div className="summary__row">
                  <span>{t('cart.subtotal')}</span>
                  <span className="mono">{money(applied?.sub_total ?? subtotal)}</span>
                </div>
                <div className="summary__row">
                  <span>{t('cart.shipping')}</span>
                  <span className="mono">
                    {(applied?.shipping_charge ?? shippingCharge) === 0
                      ? t('common.free')
                      : money(applied?.shipping_charge ?? shippingCharge)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="summary__row summary__row--save">
                    <span>{t('cart.discount')}</span>
                    <span className="mono">− {money(discount)}</span>
                  </div>
                )}
                <div className="summary__row summary__row--total">
                  <span>{t('cart.total')}</span>
                  <span className="mono">{money(grandTotal)}</span>
                </div>

                <button type="submit" className="btn btn-primary btn-cta w-100 mt-4" disabled={placing}>
                  {placing ? `${t('common.loading')}…` : t('checkout.placeOrder')}
                </button>

                <p className="mute mt-3 mb-0" style={{ fontSize: 'var(--fs-11)' }}>
                  {payment === 'Cash On Delivery' ? t('pay.codNote') : t('pay.onlineNote')}
                  {info?.name ? ` · ${info.name}` : ''}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <OtpModal
        open={otpOpen}
        phone={form.phone}
        onClose={() => setOtpOpen(false)}
        onVerified={() => { setOtpOpen(false); setOtpDone(true); place(); }}
      />
    </>
  );
}

function Field({ id, label, value, onChange, error, type = 'text', required, className = 'col-12' }) {
  return (
    <div className={className}>
      <label className="opt-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={AUTOCOMPLETE[id] || 'on'}
      />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

const AUTOCOMPLETE = {
  full_name: 'name', email: 'email', phone: 'tel', address: 'street-address',
  city: 'address-level2', country: 'country-name', zip_code: 'postal-code',
};
