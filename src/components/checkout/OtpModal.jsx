import { useEffect, useRef, useState } from 'react';
import { checkout as checkoutApi } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';

/**
 * Shown when COD checkout comes back asking for phone verification
 * (business fraud_check_method = OTP / Both).
 */
export default function OtpModal({ open, phone, onVerified, onClose }) {
  const { t } = useI18n();
  const toast = useToast();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (open && !sent) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  if (!open) return null;

  async function send() {
    setSending(true); setError(null);
    try {
      await checkoutApi.sendOtp(phone);
      setSent(true);
      setSeconds(45);
      inputs.current[0]?.focus();
    } catch (e) {
      const parsed = parseApiError(e);
      setError(parsed.message);
    } finally { setSending(false); }
  }

  const onDigit = (i, v) => {
    const clean = v.replace(/\D/g, '').slice(-1);
    setDigits((d) => { const next = [...d]; next[i] = clean; return next; });
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  };

  const verify = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 4) { setError(t('checkout.otpVerify')); return; }
    setVerifying(true); setError(null);
    try {
      await checkoutApi.verifyOtp({ phone, otp_code: code });
      toast.success(t('checkout.otpVerified'));
      onVerified();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally { setVerifying(false); }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('checkout.otpTitle')}
      style={{
        position: 'fixed', inset: 0, zIndex: 1070, display: 'grid', placeItems: 'center',
        background: 'rgba(18,32,60,.5)', padding: 'var(--sp-5)',
      }}
    >
      <div
        style={{
          width: 'min(420px, 100%)', background: 'var(--bg)', borderRadius: 'var(--radiusLg)',
          boxShadow: 'var(--shadow-lg)', padding: 'var(--sp-8)',
        }}
      >
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h3 className="modal-title mb-2">{t('checkout.otpTitle')}</h3>
            <p className="mute mb-0" style={{ fontSize: 'var(--fs-13)' }}>
              {t('checkout.otpBody')} <strong style={{ color: 'var(--ink)' }}>{phone}</strong>
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label={t('common.close')} />
        </div>

        <form onSubmit={verify} className="d-grid gap-4 mt-4">
          <div className="otp-inputs">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={d}
                onChange={(e) => onDigit(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) inputs.current[i - 1]?.focus(); }}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error && <div className="field-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-cta" disabled={verifying}>
            {verifying ? `${t('common.loading')}…` : t('checkout.otpVerify')}
          </button>

          <button
            type="button"
            className="link-quiet mx-auto"
            onClick={send}
            disabled={sending || seconds > 0}
          >
            {seconds > 0 ? `${t('checkout.otpResend')} (${seconds}s)` : t('checkout.otpResend')}
          </button>
        </form>
      </div>
    </div>
  );
}
