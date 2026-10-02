import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { parseApiError } from '../../api/errors';

const MAX_FILE = 5 * 1024 * 1024;

/** The conversation with the store - inside the floating window ("popup") or the account page ("page"). */
export default function ChatPanel({ variant = 'popup', onClose }) {
  const { t } = useI18n();
  const { isAuthed } = useAuth();
  const chat = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthed) {
    const goTo = (path) => {
      chat.rememberForLogin();
      onClose?.();
      navigate(path, { state: { from: location.pathname + location.search } });
    };

    return (
      <div className={`chat-panel chat-panel--${variant}`}>
        <ChatHeader onClose={onClose} variant={variant} />
        <div className="chat-guest">
          <i className="bi bi-chat-heart" aria-hidden="true" />
          <h3>{t('chat.guestTitle')}</h3>
          <p className="muted">{t('chat.guestBody')}</p>
          <div className="d-grid gap-2 w-100">
            <button type="button" className="btn btn-primary" onClick={() => goTo('/login')}>{t('auth.signIn')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => goTo('/register')}>{t('chat.createAccount')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-panel chat-panel--${variant}`}>
      <ChatHeader onClose={onClose} variant={variant} />
      <ChatBody />
      <ChatComposer />
    </div>
  );
}

function ChatHeader({ onClose, variant }) {
  const { t } = useI18n();
  const { chat, live } = useChat();
  const store = chat?.store;

  return (
    <div className="chat-head">
      <div className="chat-head__store">
        {store?.logo ? <img src={store.logo} alt="" /> : <span className="chat-head__logo"><i className="bi bi-shop" /></span>}
        <div>
          <strong>{store?.name || t('chat.title')}</strong>
          <small>{live ? <><span className="chat-dot" />{t('chat.live')}</> : t('chat.repliesSoon')}</small>
        </div>
      </div>
      <div className="d-flex align-items-center gap-1">
        {variant === 'popup' && (
          <Link to="/account/chat" className="chat-icon-btn" title={t('chat.expand')} onClick={onClose}><i className="bi bi-arrows-angle-expand" /></Link>
        )}
        {onClose && <button type="button" className="chat-icon-btn" onClick={onClose} aria-label={t('common.close')}><i className="bi bi-x-lg" /></button>}
      </div>
    </div>
  );
}

function ChatBody() {
  const { t, lang } = useI18n();
  const { chat, messages, hasMore, loading, typingName, loadOlder, reload } = useChat();
  const bodyRef = useRef(null);
  const stick = useRef(true);
  const [olderLoading, setOlderLoading] = useState(false);
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // follow new messages when the reader is at the bottom
  useEffect(() => {
    const el = bodyRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, typingName]);

  const onScroll = () => {
    const el = bodyRef.current;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const older = async () => {
    const el = bodyRef.current;
    const before = el.scrollHeight;
    setOlderLoading(true);
    stick.current = false;
    try { await loadOlder(); } finally { setOlderLoading(false); }
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - before; });
  };

  if (loading && !chat) {
    return <div className="chat-body chat-body--center"><span className="spinner-border spinner-border-sm" /> {t('common.loading')}</div>;
  }

  if (!chat) {
    return (
      <div className="chat-body chat-body--center">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={reload}>{t('common.retry')}</button>
      </div>
    );
  }

  let lastDate = null;

  return (
    <div className="chat-body" ref={bodyRef} onScroll={onScroll}>
      {hasMore && (
        <div className="text-center mb-3">
          <button type="button" className="btn btn-link btn-sm" onClick={older} disabled={olderLoading}>
            {olderLoading ? <span className="spinner-border spinner-border-sm" /> : t('chat.earlier')}
          </button>
        </div>
      )}

      {!messages.length && (
        <div className="chat-welcome">
          <i className="bi bi-emoji-smile" aria-hidden="true" />
          <p>{t('chat.welcome')}</p>
        </div>
      )}

      {messages.map((m) => {
        const day = m.date !== lastDate ? m.date : null;
        lastDate = m.date;
        return (
          <div key={m.id}>
            {day && <div className="chat-day"><span>{day === today ? t('chat.today') : day}</span></div>}
            <ChatBubble m={m} store={chat.store} lang={lang} />
          </div>
        );
      })}

      {typingName !== null && (
        <div className="chat-typing">
          <span className="chat-dots"><i /><i /><i /></span>
          {t('chat.typing').replace(':name', typingName || chat.store?.name || '')}
        </div>
      )}

      {chat.can_rate && <ChatRating />}
    </div>
  );
}

function ChatBubble({ m, store }) {
  const { t } = useI18n();

  if (m.is_system) {
    return <div className="chat-system"><span>{(m.store_name || store?.name) + ' ' + m.message} · {m.clock}</span></div>;
  }

  const mine = m.sender_type === 'Customer';

  return (
    <div className={`chat-msg ${mine ? 'is-mine' : ''}`}>
      {!mine && (store?.logo ? <img className="chat-avatar" src={store.logo} alt="" /> : <span className="chat-avatar chat-avatar--icon"><i className="bi bi-shop" /></span>)}
      <div className="chat-msg__wrap">
        {!mine && <div className="chat-msg__name">{m.store_name || store?.name}</div>}
        <div className="chat-bubble">
          {m.order && (
            <Link to={`/account/orders/${m.order.id}`} className="chat-card">
              <i className="bi bi-receipt" />
              <span><strong>{t('chat.order')} {m.order.invoice_no}</strong><small>{m.order.date} · {m.order.status}</small></span>
            </Link>
          )}
          {m.product && (
            <Link to={`/product/${m.product.slug}`} className="chat-card">
              {m.product.image ? <img src={m.product.image} alt="" /> : <i className="bi bi-bag" />}
              <span><strong>{m.product.title}</strong><small>{t('chat.product')}</small></span>
            </Link>
          )}
          {m.message && <p className="chat-text">{m.message}</p>}
          {m.file && (m.is_image
            ? <a href={m.file} target="_blank" rel="noreferrer"><img className="chat-img" src={m.file} alt={m.file_name} loading="lazy" /></a>
            : <a className="chat-file" href={m.file} target="_blank" rel="noreferrer"><i className="bi bi-file-earmark-pdf" />{m.file_name}</a>)}
        </div>
        <div className="chat-meta">
          {m.clock}
          {mine && <i className={`bi bi-check2-all ${m.read ? 'is-read' : ''}`} title={m.read ? t('chat.seen') : t('chat.sent')} />}
        </div>
      </div>
    </div>
  );
}

function ChatRating() {
  const { t } = useI18n();
  const { rate } = useChat();
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!stars) return;
    setBusy(true);
    try { await rate(stars, note); } finally { setBusy(false); }
  };

  return (
    <div className="chat-rate">
      <p className="m-0">{t('chat.rateTitle')}</p>
      <div className="chat-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= stars ? 'is-on' : ''} onClick={() => setStars(n)} aria-label={`${n}`}>★</button>
        ))}
      </div>
      {stars > 0 && (
        <>
          <input className="form-control form-control-sm" value={note} onChange={(e) => setNote(e.target.value)} maxLength={191} placeholder={t('chat.rateNote')} />
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>{t('chat.rateSend')}</button>
        </>
      )}
    </div>
  );
}

function ChatComposer() {
  const { t } = useI18n();
  const { chat, send, notifyTyping, pending, setPending } = useChat();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { if (pending) inputRef.current?.focus(); }, [pending]);

  if (!chat) return null;

  if (chat.blocked) {
    return <div className="chat-blocked"><i className="bi bi-slash-circle me-1" />{t('chat.blocked')}</div>;
  }

  const pick = (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen) return;
    if (chosen.size > MAX_FILE) { setError(t('chat.tooBig')); return; }
    setError('');
    setFile(chosen);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy || (!text.trim() && !file && !pending)) return;
    setBusy(true);
    setError('');
    try {
      await send(text, file);
      setText('');
      setFile(null);
      if (inputRef.current) inputRef.current.style.height = 'auto';
    } catch (err) {
      const parsed = parseApiError(err);
      setError(Object.values(parsed.fields || {})[0] || parsed.message || t('chat.failed'));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <form className="chat-composer" onSubmit={submit}>
      {(pending || file) && (
        <div className="chat-attachments">
          {pending?.product && (
            <span className="chat-chip">{pending.product.image ? <img src={pending.product.image} alt="" /> : <i className="bi bi-bag" />}
              {pending.product.title}<button type="button" onClick={() => setPending(null)} aria-label={t('common.remove')}><i className="bi bi-x" /></button></span>
          )}
          {pending?.order && (
            <span className="chat-chip"><i className="bi bi-receipt" />{t('chat.order')} {pending.order.invoice_no}
              <button type="button" onClick={() => setPending(null)} aria-label={t('common.remove')}><i className="bi bi-x" /></button></span>
          )}
          {file && (
            <span className="chat-chip">{file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} alt="" /> : <i className="bi bi-file-earmark-pdf" />}
              {file.name}<button type="button" onClick={() => setFile(null)} aria-label={t('common.remove')}><i className="bi bi-x" /></button></span>
          )}
        </div>
      )}
      <div className="chat-composer__row">
        <button type="button" className="chat-icon-btn" onClick={() => fileRef.current?.click()} title={t('chat.attach')}><i className="bi bi-paperclip" /></button>
        <input ref={fileRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={pick} />
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          maxLength={3000}
          placeholder={t('chat.placeholder')}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            if (e.target.value.trim()) notifyTyping();
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
        />
        <button type="submit" className="chat-send" disabled={busy} aria-label={t('chat.send')}>
          {busy ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}
        </button>
      </div>
      {error && <small className="chat-error">{error}</small>}
    </form>
  );
}
