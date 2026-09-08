import React, { useEffect } from 'react';
import { Volume2, Lock, Crown, Shuffle, Sparkles, MessageCircle } from 'lucide-react';
import { GameRoomState, Player, CategoryOption } from '../types';
import { playSelectSound, playLockInSound, speakEnglishPhrase } from '../utils/soundEffects';

interface PresenterSelectingViewProps {
  roomState: GameRoomState;
  myPlayer: Player | undefined;
  onChooseOption: (optionId: string) => void;
  onPickRandomPresenter: () => void;
  onSetPresenter: (playerId: string) => void;
  onTakeBackPresenter?: () => void;
}

export const PresenterSelectingView: React.FC<PresenterSelectingViewProps> = ({
  roomState,
  myPlayer,
  onChooseOption,
  onPickRandomPresenter,
  onSetPresenter,
  onTakeBackPresenter,
}) => {
  const category = roomState.currentCategory;
  const presenter = roomState.presenterId ? roomState.players[roomState.presenterId] : null;
  const isPresenter = Boolean(myPlayer && myPlayer.id === roomState.presenterId);
  const isHost = Boolean(myPlayer?.isTeacher || (roomState.hostId && myPlayer?.id === roomState.hostId));
  const canMakeChoice = Boolean(isPresenter || isHost);

  // Keyboard shortcut listener for numbers 1 to 5 (for presenter or host)
  useEffect(() => {
    if (!canMakeChoice) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= category.options.length) {
        const selected = category.options.find(opt => opt.keyNumber === keyNum);
        if (selected) {
          playLockInSound();
          onChooseOption(selected.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canMakeChoice, category.options, onChooseOption]);

  const handleSpeakQuestion = () => {
    speakEnglishPhrase(category.questionPhrase);
  };

  const handleSpeakOption = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speakEnglishPhrase(`I like ${text}!`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Big EFL Speaking Header */}
      <div className="bg-slate-900/60 rounded-3xl border border-white/10 backdrop-blur-md p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Subtle decorative category icon in background */}
        <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 pointer-events-none select-none">
          {category.icon}
        </div>

        {/* Round Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-black uppercase tracking-[0.15em] mb-3">
          <span>{category.label}（{category.japaneseLabel || category.label}）</span>
          <span>•</span>
          <span>第 {roomState.roundIndex + 1} 問 / 全 {roomState.categories.length} 問</span>
        </div>

        {/* Question for Host Subtitle */}
        <p className="text-indigo-400 font-black text-xs sm:text-sm tracking-wider mb-2">
          みんなで質問しよう！ (Question for Host)
        </p>

        {/* The Exact EFL Question Prompt with Gradient Accent */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            What <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 border-b-4 sm:border-b-8 border-indigo-500/30">{category.label.toUpperCase()}</span> do you like?
          </h1>
          <button
            onClick={handleSpeakQuestion}
            id="speak-question-btn"
            title="英語の音声をきく"
            className="p-2.5 sm:p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 transition cursor-pointer shrink-0"
          >
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <p className="text-slate-300 text-xs sm:text-sm mb-4">
          「{presenter?.name || '発表する人'}ちゃんの すきな{category.japaneseLabel || category.label}は なあに？」
        </p>

        {/* EFL Classroom Practice Prompt */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              みんなで言おう: <strong className="text-white">&ldquo;What {category.label.toLowerCase()} do you like, {presenter?.name || 'Presenter'}?&rdquo;</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => speakEnglishPhrase(`What ${category.label.toLowerCase()} do you like, ${presenter?.name || 'Presenter'}?`)}
            title="質問の英語をきく"
            className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition cursor-pointer shrink-0"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Presenter Mode vs Student Waiting Mode */}
      {canMakeChoice ? (
        /* PRESENTER OR HOST CHOOSING VIEW */
        <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
          {/* If teacher is observing a student presenter, show prominent Teacher Master Bar */}
          {isHost && !isPresenter && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-600/10 border-2 border-amber-500/40 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xl font-black shadow-md shrink-0">
                    👑
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      先生コントロールバー（ホスト権限）
                    </div>
                    <div className="text-sm font-bold text-white">
                      生徒 <span className="text-amber-200 underline font-black">{presenter?.avatar} {presenter?.name || '生徒'}</span> ちゃんが発表の選択をしています
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onTakeBackPresenter ? onTakeBackPresenter() : myPlayer && onSetPresenter(myPlayer.id)}
                    id="take-back-presenter-btn"
                    title="発表者の権利を先生にもどします"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-slate-950" />
                    👑 発表者に復帰（先生が選ぶ）
                  </button>

                  <button
                    onClick={onPickRandomPresenter}
                    id="pick-another-random-btn"
                    title="別の生徒をランダムに発表者として指名します"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    🎲 別の生徒をランダム指名
                  </button>

                  {/* Dropdown to pick specific student */}
                  <select
                    id="select-specific-presenter-dropdown"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onSetPresenter(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 border border-white/10 cursor-pointer focus:outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>特定の生徒を指名...</option>
                    {(Object.values(roomState.players) as Player[])
                      .filter(p => p.id !== presenter?.id)
                      .map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                          {p.avatar} {p.name} {p.isTeacher ? '(先生)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-300">
                💡 生徒のタブレット画面にも選択肢が表示されています。生徒が悩んでいる場合、上のボタンで交代・復帰するか、先生が下のカードを直接クリックして決定することもできます。
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
                👑
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isPresenter ? 'あなたの番です！発表しよう！👑' : '先生・ホストの代理選択'}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm font-medium">
                  {isPresenter
                    ? `あなたが一番すきなものを 1つ えらんでね（数字キー 1〜${category.options.length} でも選べるよ）:`
                    : `代理で選択する場合は、下のカードをクリックしてください（生徒の選択としても扱われます）:`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                ひみつの選択
              </span>
            </div>
          </div>

          {/* Interactive Choice Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {category.options.map((opt) => (
              <div
                key={opt.id}
                id={`presenter-choice-${opt.id}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  playLockInSound();
                  onChooseOption(opt.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playLockInSound();
                    onChooseOption(opt.id);
                  }
                }}
                className="group relative flex flex-col p-4 sm:p-5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border-2 border-white/10 hover:border-indigo-500 shadow-lg hover:shadow-indigo-500/10 transition-all text-left cursor-pointer overflow-hidden backdrop-blur-xs transform hover:-translate-y-0.5 focus:outline-none focus:border-indigo-500"
              >
                {/* Number in corner */}
                <span className="absolute top-3 left-3 text-slate-600 font-black text-sm sm:text-base group-hover:text-indigo-400/80 transition">
                  {opt.keyNumber}
                </span>

                <div className="flex justify-center my-2 sm:my-3">
                  <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">
                    {opt.icon}
                  </span>
                </div>

                {/* English Name - Most Prominent */}
                <div className="font-black text-white text-base sm:text-lg tracking-wide uppercase text-center group-hover:text-indigo-200">
                  {opt.name}
                </div>

                {/* Japanese Name - Smaller, fainter font */}
                {opt.japanese && (
                  <div className="text-xs text-slate-300 font-medium text-center mt-0.5 tracking-normal">
                    {opt.japanese}
                  </div>
                )}

                {opt.phonetic && (
                  <div className="text-[10px] text-indigo-300/60 font-mono text-center mt-0.5">
                    {opt.phonetic}
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-indigo-300">
                  <span className="truncate">&ldquo;I like {opt.name}!&rdquo;</span>
                  <button
                    type="button"
                    onClick={(e) => handleSpeakOption(e, opt.name)}
                    title={`「I like ${opt.name}!」をきく`}
                    className="p-1 rounded-lg hover:bg-white/10 text-indigo-400 hover:text-white transition shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom geometric accent bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900">
                  <div className="h-full bg-indigo-500 w-0 group-hover:w-full transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* STUDENT WAITING FOR PRESENTER TO CHOOSE */
        <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-indigo-600/30 animate-pulse">
                ⏳
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  発表者がえらんでいます…
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {presenter?.name || '発表する人'}ちゃんが すきな{category.japaneseLabel || category.label}を えらんでいるよ！
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  えらんだら すぐに回答ボタンがおせるようになるよ。いそいで当てるじゅんびをしておこう！
                </p>
              </div>
            </div>

            {/* Quick Presenter Swap for Teacher/Host only if presenter is stuck */}
            {isHost && (
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={onPickRandomPresenter}
                  id="change-presenter-btn"
                  title="発表者を交代する"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                  別の生徒にかえる
                </button>
              </div>
            )}
          </div>

          {/* Locked Preview of Choices (Practice pronunciation!) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">
                えらべる選択肢（えいごの発音をれんしゅうしておこう！）
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                <Lock className="w-3 h-3" />
                回答じゅんび中
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {category.options.map((opt) => (
                <div
                  key={opt.id}
                  className="relative p-3 rounded-2xl border border-white/5 bg-slate-800/30 flex flex-col items-center text-center opacity-70"
                >
                  <span className="text-2xl sm:text-3xl mb-1">{opt.icon}</span>
                  <span className="text-xs font-bold text-slate-200">{opt.name}</span>
                  {opt.japanese && (
                    <span className="text-[10px] text-slate-300 font-medium mt-0.5">{opt.japanese}</span>
                  )}
                  <span className="text-[9px] text-indigo-300/60 font-mono mt-0.5">{opt.phonetic}</span>
                  <button
                    type="button"
                    onClick={() => speakEnglishPhrase(`I like ${opt.name}!`)}
                    title={`「I like ${opt.name}!」をきく`}
                    className="mt-1 p-1 rounded hover:bg-white/10 text-indigo-400 hover:text-indigo-200 transition cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
