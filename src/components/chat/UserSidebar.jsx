import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, LogOut, User, MessageCircle } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

const UserSidebar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-16 bg-blue-600 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"
        >
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            ></div>
            
            {/* Menu */}
            <div className="absolute bottom-full left-4 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              
              <button
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                onClick={() => { setShowDropdown(false); setShowEditProfile(true); }}
              >
                <User className="w-4 h-4 mr-3" />
                Profile
              </button>
              
              <button 
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                onClick={() => setShowDropdown(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>
              
              <hr className="my-1" />
              
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
};

export default UserSidebar;