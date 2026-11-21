'use client';

import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function PhotoViewerModal({ isOpen, onClose, title, photoUrl }) {
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/50">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-teal-400" />
            <h4 className="font-bold text-sm truncate">{title || 'ఫోటో ప్రివ్యూ (Photo Preview)'}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="కొత్త ట్యాబ్‌లో ఓపెన్ చేయండి"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-3 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-inner"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="hidden text-center text-slate-400 py-12 px-4">
            <p className="text-sm font-semibold mb-2">చిత్రం నేరుగా లోడ్ కాలేదు (Image cannot load directly)</p>
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold"
            >
              <span>లింక్ తెరవండి (Open Photo Link)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
