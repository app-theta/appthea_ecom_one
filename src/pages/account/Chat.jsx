import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import ChatPanel from '../../components/chat/ChatPanel';

/** The account's chat page - the same conversation as the floating window, with more room. */
export default function Chat() {
  const { enabled, setOnPage } = useChat();

  useEffect(() => {
    setOnPage(true);
    return () => setOnPage(false);
  }, [setOnPage]);

  if (!enabled) return <Navigate to="/account" replace />;

  return <ChatPanel variant="page" />;
}
