import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { chat as chatApi } from '../api/endpoints';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { loadScript } from '../utils/loadScript';

/**
 * Live chat with the store - one conversation per logged-in customer.
 *
 * Opening the chat (floating window or the account page) loads it and, when the store has
 * its own Pusher app, connects live (pusher-js is loaded from its CDN only then). Without it
 * the open chat asks for new messages every few seconds, and the closed chat only checks the
 * unread count once a minute. A guest who taps the chat is asked to log in; after logging
 * in the chat opens again by itself, with the product / order they were asking about.
 */
const ChatContext = createContext(null);

const AFTER_LOGIN_KEY = 'apptheta.chatAfterLogin';
const PUSHER_SRC = 'https://js.pusher.com/8.4.0/pusher.min.js';
const PAGE_SIZE = 50;
const POLL_OPEN_MS = 8000;
const POLL_CLOSED_MS = 60000;

export function ChatProvider({ children }) {
  const { isAuthed } = useAuth();
  const { features } = useBusiness();
  const enabled = Boolean(features.customer_live_chat);

  const [isOpen, setOpen] = useState(false);
  const [onPage, setOnPage] = useState(false);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typingName, setTypingName] = useState(null);
  const [live, setLive] = useState(false);
  const [pending, setPending] = useState(null); // { product } or { order } to send with the next message

  const pusherRef = useRef(null);
  const lastIdRef = useRef(0);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const visible = isOpen || onPage;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const addMessages = useCallback((list) => {
    if (!list?.length) return 0;
    let added = 0;
    setMessages((current) => {
      const ids = new Set(current.map((m) => m.id));
      const fresh = list.filter((m) => !ids.has(m.id));
      added = fresh.length;
      return fresh.length ? [...current, ...fresh] : current;
    });
    lastIdRef.current = Math.max(lastIdRef.current, ...list.map((m) => m.id));
    return added;
  }, []);

  const markRead = useCallback(() => {
    if (document.visibilityState !== 'visible') return;
    setUnread(0);
    chatApi.read().catch(() => {});
  }, []);

  const disconnect = useCallback(() => {
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
    setLive(false);
  }, []);

  const fetchNew = useCallback(async () => {
    try {
      const data = await chatApi.messages({ after: lastIdRef.current, seen: visibleRef.current && document.visibilityState === 'visible' ? 1 : 0 });
      if (data?.chat) setChat(data.chat);
      const fresh = (data?.messages || []).filter((m) => m.sender_type === 'Business' && !m.is_system);
      addMessages(data?.messages || []);
      if (fresh.length && !visibleRef.current) setUnread((n) => n + fresh.length);
      if (data?.read_up_to) {
        setMessages((current) => current.map((m) => (m.sender_type === 'Customer' && m.id <= data.read_up_to ? { ...m, read: true } : m)));
      }
    } catch { /* next round */ }
  }, [addMessages]);

  const connect = useCallback(async (realtime) => {
    if (!realtime?.enabled || pusherRef.current) return;
    try {
      await loadScript(PUSHER_SRC);
      const pusher = new window.Pusher(realtime.key, {
        cluster: realtime.cluster,
        forceTLS: true,
        channelAuthorization: {
          customHandler: ({ socketId, channelName }, callback) => {
            chatApi.broadcastAuth(socketId, channelName).then((data) => callback(null, data)).catch((error) => callback(error, null));
          },
        },
      });
      pusherRef.current = pusher;

      const channel = pusher.subscribe(realtime.channel);
      channel.bind('pusher:subscription_succeeded', () => setLive(true));
      channel.bind('pusher:subscription_error', () => setLive(false));

      channel.bind('message', (m) => {
        addMessages([m]);
        setTypingName(null);
        if (m.sender_type !== 'Business' || m.is_system) return;
        if (visibleRef.current && document.visibilityState === 'visible') markRead();
        else setUnread((n) => n + 1);
      });
      channel.bind('typing', (d) => {
        if (d.side !== 'Business') return;
        setTypingName(d.name || '');
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingName(null), 4000);
      });
      channel.bind('read', (d) => {
        if (d.reader === 'Business') setMessages((current) => current.map((m) => (m.sender_type === 'Customer' ? { ...m, read: true } : m)));
      });
      channel.bind('status', (d) => setChat((c) => (c ? { ...c, status: d.status, blocked: d.blocked, can_rate: d.status === 'Resolved' && !c.rating } : c)));

      // back after a drop: fetch what was said in between
      let wasDown = false;
      pusher.connection.bind('state_change', ({ current }) => {
        if (current === 'connected') {
          if (wasDown) fetchNew();
          wasDown = false;
          setLive(channel.subscribed);
        } else if (['unavailable', 'failed', 'disconnected'].includes(current)) {
          wasDown = true;
          setLive(false);
        }
      });
    } catch {
      setLive(false); // the CDN is blocked - polling still works
    }
  }, [addMessages, fetchNew, markRead]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chatApi.open();
      setChat(data.chat);
      setMessages(data.messages || []);
      lastIdRef.current = Math.max(0, ...(data.messages || []).map((m) => m.id));
      setHasMore((data.messages || []).length >= PAGE_SIZE);
      setUnread(0);
      connect(data.realtime);
    } catch { /* the panel shows its own retry */ } finally {
      setLoading(false);
    }
  }, [connect]);

  // first time the chat is seen in this session: load it
  useEffect(() => {
    if (visible && isAuthed && enabled && !chat && !loading) load();
  }, [visible, isAuthed, enabled, chat, loading, load]);

  // opened again later: mark read and catch up
  useEffect(() => {
    if (visible && chat) {
      markRead();
      if (!live) fetchNew();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // no live connection: poll new messages while open, the unread count while closed
  useEffect(() => {
    if (!isAuthed || !enabled || live) return undefined;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (visibleRef.current && chat) fetchNew();
      else if (!visibleRef.current) chatApi.unread().then((d) => setUnread(d?.unread || 0)).catch(() => {});
    };
    if (!visible) tick();
    const id = setInterval(tick, visible ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => clearInterval(id);
  }, [isAuthed, enabled, live, visible, chat, fetchNew]);

  // logged out: forget everything; logged in after tapping the chat as a guest: open it again
  useEffect(() => {
    if (!isAuthed) {
      disconnect();
      setChat(null);
      setMessages([]);
      setUnread(0);
      setPending(null);
      return;
    }
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(AFTER_LOGIN_KEY) || 'null'); sessionStorage.removeItem(AFTER_LOGIN_KEY); } catch { /* ignore */ }
    if (saved) {
      if (saved.product || saved.order) setPending(saved);
      setOpen(true);
    }
  }, [isAuthed, disconnect]);

  useEffect(() => () => disconnect(), [disconnect]);

  const openChat = useCallback((about = null) => {
    if (!isAuthed) {
      try { sessionStorage.setItem(AFTER_LOGIN_KEY, JSON.stringify(about || {})); } catch { /* ignore */ }
    } else if (about) {
      setPending(about);
    }
    setOpen(true);
  }, [isAuthed]);

  const send = useCallback(async (text, file) => {
    const form = new FormData();
    if (text?.trim()) form.append('message', text.trim());
    if (file) form.append('file', file);
    if (pending?.product) form.append('product_id', pending.product.id);
    if (pending?.order) form.append('sale_id', pending.order.id);
    const data = await chatApi.send(form, pusherRef.current?.connection?.socket_id);
    addMessages([data.message]);
    setPending(null);
    setChat((c) => (c ? { ...c, status: 'Open', can_rate: false } : c));
    return data.message;
  }, [pending, addMessages]);

  const notifyTyping = useCallback(() => {
    if (!pusherRef.current || Date.now() - lastTypingSent.current < 3000) return;
    lastTypingSent.current = Date.now();
    chatApi.typing(pusherRef.current.connection.socket_id).catch(() => {});
  }, []);

  const loadOlder = useCallback(async () => {
    if (!messages.length) return;
    const data = await chatApi.messages({ before: messages[0].id });
    const older = data?.messages || [];
    setMessages((current) => [...older.filter((m) => !current.some((c) => c.id === m.id)), ...current]);
    setHasMore(older.length >= PAGE_SIZE);
  }, [messages]);

  const rate = useCallback(async (rating, note) => {
    const data = await chatApi.rate(rating, note);
    if (data?.chat) setChat(data.chat);
  }, []);

  const value = useMemo(() => ({
    enabled, isOpen, setOpen, onPage, setOnPage, chat, messages, hasMore, unread, loading, live, typingName,
    pending, setPending, openChat, send, notifyTyping, loadOlder, rate, reload: load,
    // "open the chat after login" - keeps a product / order chosen earlier as a guest
    rememberForLogin: () => {
      try {
        if (!sessionStorage.getItem(AFTER_LOGIN_KEY)) sessionStorage.setItem(AFTER_LOGIN_KEY, JSON.stringify(pending || {}));
      } catch { /* ignore */ }
    },
  }), [enabled, isOpen, onPage, chat, messages, hasMore, unread, loading, live, typingName, pending, openChat, send, notifyTyping, loadOlder, rate, load]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
