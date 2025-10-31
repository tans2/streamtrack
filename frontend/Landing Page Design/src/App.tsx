import { useState } from 'react';
import LandingPage from './components/LandingPage';
import SignUpPage from './components/SignUpPage';
import SettingsPage from './components/SettingsPage';
import SearchPage from './components/SearchPage';
import ProfilePage from './components/ProfilePage';

type Page = 'landing' | 'signup' | 'settings' | 'search' | 'profile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'signup':
        return <SignUpPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Color Palette Preview - showcasing the updated cozy autumn theme */}
      <div className="fixed top-4 right-4 z-50 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
        <div className="space-y-3">
          <h4 className="text-xs text-muted-foreground font-medium">Cozy Autumn Palette</h4>
          <div className="flex gap-3 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-primary rounded-full border-2 border-border shadow-sm" />
              <span className="text-xs text-muted-foreground">Primary</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-secondary rounded-full border-2 border-border shadow-sm" />
              <span className="text-xs text-muted-foreground">Secondary</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-accent rounded-full border-2 border-border shadow-sm" />
              <span className="text-xs text-muted-foreground">Accent</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <div>🔥 Primary: Burnt Orange</div>
            <div>🍯 Secondary: Soft Caramel</div>
            <div>🌲 Accent: Forest Green</div>
          </div>
        </div>
      </div>
      {renderPage()}
    </div>
  );
}