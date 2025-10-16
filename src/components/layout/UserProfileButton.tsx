import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export const UserProfileButton = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className="min-h-[44px] min-w-[44px] p-2 hover:bg-gray-50 rounded-lg transition-colors"
    >
      {isAuthenticated ? (
        <>
          <User className="h-5 w-5 text-gray-700" />
          <span className="sr-only">Profile</span>
        </>
      ) : (
        <span className="text-sm font-semibold text-cyan-600">Login</span>
      )}
    </Button>
  );
};
