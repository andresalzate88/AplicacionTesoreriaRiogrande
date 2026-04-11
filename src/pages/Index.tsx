import { useAppStore } from '@/store/appStore';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/AppLayout';

const Index = () => {
  const { isLoggedIn } = useAppStore();
  return isLoggedIn ? <AppLayout /> : <LoginPage />;
};

export default Index;
