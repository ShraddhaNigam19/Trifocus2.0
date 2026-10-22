import { ArrowLeft, Menu, Search, MoreVertical } from "lucide-react";
import { useState } from "react";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  showBack?: boolean;
  showSearch?: boolean;
  onSearchClick?: () => void;
  gradient?: string;
}

const MobileHeader = ({
  title,
  subtitle,
  icon,
  actions,
  onMenuClick,
  onBackClick,
  showBack = false,
  showSearch = false,
  onSearchClick,
  gradient = "from-blue-500 to-purple-600"
}: MobileHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-3">
              {showBack ? (
                <button
                  onClick={onBackClick}
                  className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
              ) : (
                <button
                  onClick={onMenuClick}
                  className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>
              )}
              
              {icon && (
                <div className={`w-10 h-10 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  {icon}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              {showSearch && (
                <button
                  onClick={onSearchClick}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              )}
              
              {actions || (
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              </div>
            </div>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
