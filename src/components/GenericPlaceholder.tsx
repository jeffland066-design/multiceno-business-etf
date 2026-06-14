import React from 'react';

export default function GenericPlaceholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title} Module Loading</h2>
      <p className="text-slate-500 max-w-sm text-sm">
        {description} This module is currently downloading the latest organizational data.
      </p>
    </div>
  );
}
