import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to profile settings by default
    navigate('/settings/profile', { replace: true });
  }, [navigate]);

  return null;
};

export default Settings;
