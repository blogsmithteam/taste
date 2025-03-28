import React from 'react';
import { UserSettings } from '../../types/user';
import { Switch } from '@headlessui/react';

interface PrivacySettingsProps {
  settings: UserSettings;
  onChange: (settings: UserSettings) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  settings,
  onChange,
}) => {
  const handleToggle = (key: keyof UserSettings) => {
    if (typeof settings[key] === 'boolean') {
      onChange({
        ...settings,
        [key]: !settings[key],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Privacy Settings</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage how your profile and content are visible to others.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Private Profile</span>
            <span className="text-sm text-gray-500">
              Only approved followers can see your profile and notes
            </span>
          </div>
          <Switch
            checked={settings.isPrivate}
            onChange={() => handleToggle('isPrivate')}
            className={`${
              settings.isPrivate ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                settings.isPrivate ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            >
              <span
                className={`${
                  settings.isPrivate ? 'opacity-0 duration-100 ease-out'
                    : 'opacity-100 duration-200 ease-in'
                } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                aria-hidden="true"
              >
                <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                  <path
                    d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span
                className={`${
                  settings.isPrivate
                    ? 'opacity-100 duration-200 ease-in'
                    : 'opacity-0 duration-100 ease-out'
                } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                aria-hidden="true"
              >
                <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                </svg>
              </span>
            </span>
          </Switch>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Email Notifications</span>
            <span className="text-sm text-gray-500">
              Receive email updates about new followers and interactions
            </span>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
            className={`${
              settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Data & Privacy</h4>
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Privacy Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Your privacy settings affect how your profile and notes are visible to others.
                  Private profiles are only visible to approved followers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 