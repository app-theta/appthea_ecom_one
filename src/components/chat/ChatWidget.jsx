import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useI18n } from '../../context/I18nContext';
import ChatPanel from './ChatPanel';

/**
 * The floating chat button on every page (when the store has live chat). Everyone sees it;
 * a guest who opens it is asked to log in. Hidden on the account's own chat page.
 */
export default function ChatWidget() {
  const { t } = useI18n();
  const { enabled, isOpen, setOpen, unread } = useChat();
  const { pathname } = useLocation();
  const onChatPage = pathname.startsWith('/account/chat');

  // Esc closes the window
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setOpen]);

  useEffect(() => { if (onChatPage) setOpen(false); }, [onChatPage, setOpen]);

  if (!enabled || onChatPage) return null;

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-popup" role="dialog" aria-label={t('chat.title')}>
          <ChatPanel variant="popup" onClose={() => setOpen(false)} />
        </div>
      )}
      <button type="button" className={`chat-fab ${isOpen ? 'is-open' : ''}`} onClick={() => setOpen(!isOpen)}
              aria-label={isOpen ? t('common.close') : t('chat.title')}>
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`} />
        {!isOpen && unread > 0 && <span className="chat-fab__count">{unread > 99 ? '99+' : unread}</span>}
      </button>
    </div>
  );
}
