import React from 'react';

export const AffiliateSidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-gray-800 border-l border-gray-700 p-4 hidden lg:block">
            <h3 className="font-semibold mb-4 text-gray-300">Support Development</h3>

            <div className="space-y-4">
                <a
                    href="https://github.com/sponsors/sidunrealde"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-700 p-4 rounded hover:bg-gray-600 transition-colors border border-gray-600 hover:border-blue-500 group"
                >
                    <div className="flex items-center justify-center mb-3 text-pink-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 group-hover:scale-110 transition-transform">
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-center text-white mb-1">Become a Sponsor</h4>
                    <p className="text-xs text-gray-400 text-center">
                        Support my work on GitHub and help sustain this project!
                    </p>
                </a>
            </div>
        </aside>
    );
};
