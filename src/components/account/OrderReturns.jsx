import { useState } from 'react';
import { returns as returnsApi } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { Sk, Stepper } from '../ui/Ui';
import { money, dateShort, statusPill } from '../../utils/format';

/**
 * Returns for one delivered order: what can still be sent back (and until when), a request form,
 * and the requests made so far. The shop approves and refunds from its admin panel.
 */
export default function OrderReturns({ orderId, onChanged }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const state = useAsync(() => returnsApi.forOrder(orderId), [orderId]);
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [qty, setQty] = useState({});
  const [reasonId, setReasonId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (state.loading && !state.data) return <Sk h={120} className="mt-5" />;
  if (state.error) return null;

  const info = state.data || {};
  const items = (info.returnable_items || []).filter((line) => line.returnable_quantity > 0);
  const history = info.returns || [];
  const value = items.reduce((sum, line) => sum + (qty[line.sale_product_id] || 0) * line.unit_price, 0);

  const start = async () => {
    setOpen(true);
    if (!reasons.length) {
      try { setReasons(await returnsApi.reasons()); } catch (e) { toast.error(parseApiError(e).message); }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const chosen = items
      .filter((line) => (qty[line.sale_product_id] || 0) > 0)
      .map((line) => ({ sale_product_id: line.sale_product_id, quantity: qty[line.sale_product_id] }));
    if (!chosen.length) {
      toast.error(t('returns.nothingChosen'));
      return;
    }
    setBusy(true);
    try {
      const res = await returnsApi.request(orderId, { items: chosen, sale_return_reason_id: Number(reasonId), note });
      toast.success(`${t('returns.sent')} (${res?.return_no ?? ''})`);
      setOpen(false);
      setQty({});
      setReasonId('');
      setNote('');
      state.reload();
      onChanged?.();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-5" aria-labelledby="returns-title">
      <h3 id="returns-title" className="offcanvas-title mb-3">{t('returns.title')}</h3>

      {info.can_return ? (
        !open && (
          <div className="d-flex flex-wrap align-items-center gap-3">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={start}>
              <i className="bi bi-arrow-counterclockwise me-2" aria-hidden="true" />{t('returns.request')}
            </button>
            {info.return_deadline && (
              <span className="mute" style={{ fontSize: 'var(--fs-13)' }}>
                {t('returns.until')} {dateShort(info.return_deadline, lang)}
              </span>
            )}
          </div>
        )
      ) : (
        info.not_returnable_reason && <p className="mute mb-0" style={{ fontSize: 'var(--fs-13)' }}>{info.not_returnable_reason}</p>
      )}

      {open && (
        <form onSubmit={submit} className="card-plain p-4 d-grid gap-4">
          <div>
            <div className="opt-label">{t('returns.chooseItems')}</div>
            {items.map((line) => (
              <div key={line.sale_product_id} className="d-flex flex-wrap align-items-center justify-content-between gap-3 py-2" style={{ borderBottom: '1px solid var(--lineSoft)' }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-14)' }}>{line.product}</div>
                  <div className="mute" style={{ fontSize: 'var(--fs-12)' }}>
                    {line.combination && `${line.combination} · `}{money(line.unit_price)} · {t('returns.qty')}: {line.returnable_quantity} {t('returns.of')} {line.quantity}
                  </div>
                </div>
                <Stepper
                  value={qty[line.sale_product_id] || 0}
                  min={0}
                  max={line.returnable_quantity}
                  onChange={(n) => setQty({ ...qty, [line.sale_product_id]: n })}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="opt-label" htmlFor="return-reason">{t('returns.reason')}</label>
            <select id="return-reason" className="form-select" required value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
              <option value="">{t('returns.chooseReason')}</option>
              {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div>
            <label className="opt-label" htmlFor="return-note">{t('returns.note')}</label>
            <textarea id="return-note" className="form-control" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <span>{t('returns.value')}: <strong className="mono">{money(value)}</strong></span>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? `${t('common.loading')}…` : t('returns.send')}
              </button>
            </div>
          </div>
        </form>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <div className="opt-label">{t('returns.history')}</div>
          {history.map((r) => (
            <div key={r.id} className="card-plain p-3 mb-3">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="mono">{r.return_no}</span>
                <span className={`pill ${statusPill(r.status)}`}>{r.status}</span>
              </div>
              <div className="mute mt-1" style={{ fontSize: 'var(--fs-12)' }}>
                {dateShort(r.requested_at, lang)}{r.reason && ` · ${r.reason}`}
              </div>
              <ul className="cart-line__sub mt-2">
                {r.items.map((item) => (
                  <li key={item.sale_product_id}>{item.product}{item.combination && ` (${item.combination})`} × {item.quantity}</li>
                ))}
              </ul>
              <div className="d-flex flex-wrap gap-4 mt-2" style={{ fontSize: 'var(--fs-13)' }}>
                <span>{t('returns.value')}: <span className="mono">{money(r.total_amount)}</span></span>
                {r.refunded_amount > 0 && <span>{t('returns.refunded')}: <span className="mono">{money(r.refunded_amount)}</span></span>}
              </div>
              {r.shop_note && <p className="mute mb-0 mt-2" style={{ fontSize: 'var(--fs-13)' }}>{t('returns.shopNote')}: {r.shop_note}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
