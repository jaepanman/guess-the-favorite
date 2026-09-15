import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, ExternalLink, Maximize2, Minimize2, Sparkles, ShieldCheck } from 'lucide-react';
import { getStudentUrl } from '../utils/routeUtils';

interface StudentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const StudentShareModal: React.FC<StudentShareModalProps> = ({
  isOpen,
  onClose,
  roomCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const studentUrl = getStudentUrl();

  useEffect(() => {
    if (!isOpen || !studentUrl) return;

    const timer = setTimeout(() => {
      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          studentUrl,
          {
            width: isEnlarged ? 380 : 240,
            margin: 2,
            color: {
              dark: '#0F172A',
              light: '#FFFFFF',
            },
          },
          (err) => {
            if (err) console.error('Failed to generate QR code:', err);
          }
        );
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, studentUrl, isEnlarged]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = studentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full text-white overflow-hidden transition-all duration-300 ${
          isEnlarged ? 'max-w-xl p-6 sm:p-8' : 'max-w-md p-6 sm:p-7'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <QrCode className="w-5 h-5" />
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                生徒用URL &amp; QRコードの共有
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              生徒用URLには「先生」の選択肢がなく、生徒としてのみ安全に参加できます。
            </p>
          </div>
          <button
            onClick={onClose}
            id="close-share-modal-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 space-y-5">
          {/* Room Code Badge */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-xs font-bold text-indigo-200">
              へや番号（ルームコード）:
            </span>
            <span className="font-mono text-lg font-black text-indigo-300 tracking-wider">
              {roomCode}
            </span>
          </div>

          {/* QR Code Canvas */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white shadow-inner mx-auto w-fit">
            <canvas ref={canvasRef} className="rounded-lg" />
            <div className="text-[11px] font-bold text-slate-700 mt-2 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>iPad・Chromebookのカメラで読み取れます</span>
            </div>
          </div>

          {/* URL Display & Copy */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              生徒専用URL (配信用)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={studentUrl}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-white/10 rounded-xl text-xs font-mono text-slate-200 focus:outline-none select-all"
              />
              <button
                type="button"
                id="copy-student-url-modal-btn"
                onClick={handleCopy}
                className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>コピー完了!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>コピー</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Safe Notice */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">生徒の乗っ取り防止:</span>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                生徒がこのURLを開いても先生になるボタンは一切表示されません。先生が部屋を開くまで「待機画面」が表示されます。
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsEnlarged(!isEnlarged)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer transition"
          >
            {isEnlarged ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>標準サイズに戻す</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>プロジェクター拡大表示</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <a
              href={studentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>別タブでテスト</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
