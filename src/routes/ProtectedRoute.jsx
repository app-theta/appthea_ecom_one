import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sk } from '../components/ui/Ui';

export default function ProtectedRoute({ children }) {
  const { isAuthed, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="shell section d-grid gap-3" style={{ maxWidth: 640 }}>
        <Sk h={24} w="40%" /><Sk h={120} /><Sk h={120} />
      </div>
    );
  }
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
