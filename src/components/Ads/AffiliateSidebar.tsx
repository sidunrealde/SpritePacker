import React from 'react';

export const AffiliateSidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-gray-800 border-l border-gray-700 p-4 hidden lg:block">
            <h3 className="font-semibold mb-4 text-gray-300">Recommended Assets</h3>

            <div className="space-y-4">
                <div className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors cursor-pointer">
                    <div className="h-24 bg-gray-900 rounded mb-2 flex items-center justify-center text-gray-500 text-xs">
                        Asset Preview
                    </div>
                    <h4 className="font-medium text-sm text-blue-400">Space Placcolder for Unity Asset Store Links</h4>
                </div>

                {/* More placeholders */}
                <div className="text-xs text-gray-500 mt-4">
                    Support the tool by checking out these assets!
                </div>
            </div>
        </aside>
    );
};
