import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNavigation from "./BottomNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

const MobileLayout = ({ children, currentPage, title, subtitle, headerActions }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - Hidden on mobile */}
        <Sidebar currentPage={currentPage} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          {/* Mobile/Desktop Header */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                </div>
                {headerActions && (
                  <div className="ml-4 flex-shrink-0">
                    {headerActions}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 lg:p-6 pb-24 lg:pb-6 min-h-screen">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Hidden on desktop */}
      <BottomNavigation />
    </div>
  );
};

export default MobileLayout;
