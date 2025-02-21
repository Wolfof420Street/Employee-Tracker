import * as React from "react";

import { useTheme } from "next-themes";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MoonIcon, SunIcon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <SunIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
        </MenuButton>
      </div>

      <MenuItems className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          <MenuItem>
            {({ active }) => (
              <button
                onClick={() => setTheme('light')}
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center px-4 py-2 text-sm`}
              >
                <SunIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                Light
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }) => (
              <button
                onClick={() => setTheme('dark')}
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center px-4 py-2 text-sm`}
              >
                <MoonIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                Dark
              </button>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}