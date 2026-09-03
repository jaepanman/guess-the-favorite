import { GameCategory, CategoryId } from './types';

export const GAME_CATEGORIES: Record<CategoryId, GameCategory> = {
  sport: {
    id: 'sport',
    label: 'Sport',
    questionPhrase: 'What sport do you like?',
    answerPhraseTemplate: 'I like {option}!',
    icon: '⚽',
    options: [
      { id: 'soccer', keyNumber: 1, name: 'Soccer', japanese: 'サッカー', icon: '⚽', colorClass: 'bg-emerald-500', phonetic: '/ˈsɒk.ər/' },
      { id: 'basketball', keyNumber: 2, name: 'Basketball', japanese: 'バスケットボール', icon: '🏀', colorClass: 'bg-orange-500', phonetic: '/ˈbæs.kɪt.bɔːl/' },
      { id: 'swimming', keyNumber: 3, name: 'Swimming', japanese: '水泳', icon: '🏊‍♂️', colorClass: 'bg-sky-500', phonetic: '/ˈswɪm.ɪŋ/' },
      { id: 'baseball', keyNumber: 4, name: 'Baseball', japanese: '野球', icon: '⚾', colorClass: 'bg-amber-600', phonetic: '/ˈbeɪs.bɔːl/' },
      { id: 'dodgeball', keyNumber: 5, name: 'Dodgeball', japanese: 'ドッジボール', icon: '🏐', colorClass: 'bg-red-500', phonetic: '/ˈdɒdʒ.bɔːl/' },
      { id: 'tennis', keyNumber: 6, name: 'Tennis', japanese: 'テニス', icon: '🎾', colorClass: 'bg-lime-500', phonetic: '/ˈten.ɪs/' },
      { id: 'badminton', keyNumber: 7, name: 'Badminton', japanese: 'バドミントン', icon: '🏸', colorClass: 'bg-purple-500', phonetic: '/ˈbæd.mɪn.tən/' },
      { id: 'table_tennis', keyNumber: 8, name: 'Table Tennis', japanese: '卓球', icon: '🏓', colorClass: 'bg-teal-500', phonetic: '/ˈteɪ.bəl ˌten.ɪs/' },
      { id: 'volleyball', keyNumber: 9, name: 'Volleyball', japanese: 'バレーボール', icon: '🏐', colorClass: 'bg-indigo-500', phonetic: '/ˈvɒl.i.bɔːl/' },
      { id: 'running', keyNumber: 10, name: 'Running', japanese: 'かけっこ・陸上', icon: '🏃', colorClass: 'bg-amber-500', phonetic: '/ˈrʌn.ɪŋ/' },
    ],
  },
  color: {
    id: 'color',
    label: 'Color',
    questionPhrase: 'What color do you like?',
    answerPhraseTemplate: 'I like {option}!',
    icon: '🎨',
    options: [
      { id: 'blue', keyNumber: 1, name: 'Blue', japanese: '青', icon: '🔵', colorClass: 'bg-blue-600', phonetic: '/bluː/' },
      { id: 'red', keyNumber: 2, name: 'Red', japanese: '赤', icon: '🔴', colorClass: 'bg-red-600', phonetic: '/red/' },
      { id: 'green', keyNumber: 3, name: 'Green', japanese: '緑', icon: '🟢', colorClass: 'bg-green-600', phonetic: '/ɡriːn/' },
      { id: 'yellow', keyNumber: 4, name: 'Yellow', japanese: '黄色', icon: '🟡', colorClass: 'bg-yellow-500', phonetic: '/ˈjel.oʊ/' },
      { id: 'pink', keyNumber: 5, name: 'Pink', japanese: 'ピンク', icon: '🌸', colorClass: 'bg-pink-500', phonetic: '/pɪŋk/' },
      { id: 'purple', keyNumber: 6, name: 'Purple', japanese: '紫', icon: '🟣', colorClass: 'bg-purple-600', phonetic: '/ˈpɜːr.pəl/' },
      { id: 'orange', keyNumber: 7, name: 'Orange', japanese: 'オレンジ', icon: '🟠', colorClass: 'bg-orange-500', phonetic: '/ˈɒr.ɪndʒ/' },
      { id: 'light_blue', keyNumber: 8, name: 'Light Blue', japanese: '水色', icon: '🩵', colorClass: 'bg-sky-400', phonetic: '/laɪt bluː/' },
      { id: 'black', keyNumber: 9, name: 'Black', japanese: '黒', icon: '⚫', colorClass: 'bg-zinc-800', phonetic: '/blæk/' },
      { id: 'white', keyNumber: 10, name: 'White', japanese: '白', icon: '⚪', colorClass: 'bg-slate-300 text-slate-900', phonetic: '/waɪt/' },
    ],
  },
  fruit: {
    id: 'fruit',
    label: 'Fruit',
    questionPhrase: 'What fruit do you like?',
    answerPhraseTemplate: 'I like {option}!',
    icon: '🍎',
    options: [
      { id: 'apples', keyNumber: 1, name: 'Apples', japanese: 'りんご', icon: '🍎', colorClass: 'bg-red-500', phonetic: '/ˈæp.əlz/' },
      { id: 'bananas', keyNumber: 2, name: 'Bananas', japanese: 'バナナ', icon: '🍌', colorClass: 'bg-yellow-400', phonetic: '/bəˈnæn.əz/' },
      { id: 'strawberries', keyNumber: 3, name: 'Strawberries', japanese: 'いちご', icon: '🍓', colorClass: 'bg-rose-500', phonetic: '/ˈstrɔː.ber.iz/' },
      { id: 'watermelon', keyNumber: 4, name: 'Watermelon', japanese: 'すいか', icon: '🍉', colorClass: 'bg-emerald-600', phonetic: '/ˈwɔː.təˌmel.ən/' },
      { id: 'grapes', keyNumber: 5, name: 'Grapes', japanese: 'ぶどう', icon: '🍇', colorClass: 'bg-indigo-500', phonetic: '/ɡreɪps/' },
      { id: 'oranges', keyNumber: 6, name: 'Oranges', japanese: 'みかん・オレンジ', icon: '🍊', colorClass: 'bg-amber-500', phonetic: '/ˈɒr.ɪn.dʒɪz/' },
      { id: 'peaches', keyNumber: 7, name: 'Peaches', japanese: 'もも', icon: '🍑', colorClass: 'bg-pink-400', phonetic: '/ˈpiː.tʃɪz/' },
      { id: 'melons', keyNumber: 8, name: 'Melons', japanese: 'メロン', icon: '🍈', colorClass: 'bg-green-500', phonetic: '/ˈmel.ənz/' },
      { id: 'pineapples', keyNumber: 9, name: 'Pineapples', japanese: 'パイナップル', icon: '🍍', colorClass: 'bg-yellow-500', phonetic: '/ˈpaɪnˌæp.əlz/' },
      { id: 'cherries', keyNumber: 10, name: 'Cherries', japanese: 'さくらんぼ', icon: '🍒', colorClass: 'bg-red-600', phonetic: '/ˈtʃer.iz/' },
    ],
  },
  food: {
    id: 'food',
    label: 'Food',
    questionPhrase: 'What food do you like?',
    answerPhraseTemplate: 'I like {option}!',
    icon: '🍕',
    options: [
      { id: 'pizza', keyNumber: 1, name: 'Pizza', japanese: 'ピザ', icon: '🍕', colorClass: 'bg-amber-600', phonetic: '/ˈpiːt.sə/' },
      { id: 'hamburgers', keyNumber: 2, name: 'Hamburgers', japanese: 'ハンバーガー', icon: '🍔', colorClass: 'bg-orange-600', phonetic: '/ˈhæmˌbɜːr.ɡərz/' },
      { id: 'sushi', keyNumber: 3, name: 'Sushi', japanese: '寿司', icon: '🍣', colorClass: 'bg-teal-600', phonetic: '/ˈsuː.ʃi/' },
      { id: 'ramen', keyNumber: 4, name: 'Ramen', japanese: 'ラーメン', icon: '🍜', colorClass: 'bg-red-600', phonetic: '/ˈrɑː.mən/' },
      { id: 'curry', keyNumber: 5, name: 'Curry Rice', japanese: 'カレーライス', icon: '🍛', colorClass: 'bg-amber-700', phonetic: '/ˈkɜːr.i raɪs/' },
      { id: 'fried_chicken', keyNumber: 6, name: 'Fried Chicken', japanese: 'から揚げ', icon: '🍗', colorClass: 'bg-amber-600', phonetic: '/fraɪd ˈtʃɪk.ɪn/' },
      { id: 'spaghetti', keyNumber: 7, name: 'Spaghetti', japanese: 'スパゲッティ', icon: '🍝', colorClass: 'bg-rose-600', phonetic: '/spəˈɡet.i/' },
      { id: 'omurice', keyNumber: 8, name: 'Omurice', japanese: 'オムライス', icon: '🍳', colorClass: 'bg-yellow-500', phonetic: '/ˈoʊ.mjuː.raɪs/' },
      { id: 'tacos', keyNumber: 9, name: 'Tacos', japanese: 'タコス', icon: '🌮', colorClass: 'bg-yellow-600', phonetic: '/ˈtɑː.koʊz/' },
      { id: 'yakiniku', keyNumber: 10, name: 'Yakiniku', japanese: '焼肉', icon: '🥩', colorClass: 'bg-red-700', phonetic: '/ˌjɑː.kiˈniː.kuː/' },
    ],
  },
  drink: {
    id: 'drink',
    label: 'Drink',
    questionPhrase: 'What drink do you like?',
    answerPhraseTemplate: 'I like {option}!',
    icon: '🧋',
    options: [
      { id: 'water', keyNumber: 1, name: 'Water', japanese: '水', icon: '💧', colorClass: 'bg-cyan-500', phonetic: '/ˈwɔː.tər/' },
      { id: 'green_tea', keyNumber: 2, name: 'Green Tea', japanese: 'お茶・緑茶', icon: '🍵', colorClass: 'bg-emerald-600', phonetic: '/ɡriːn tiː/' },
      { id: 'barley_tea', keyNumber: 3, name: 'Barley Tea', japanese: '麦茶', icon: '🌾', colorClass: 'bg-amber-600', phonetic: '/ˈbɑːr.li tiː/' },
      { id: 'milk', keyNumber: 4, name: 'Milk', japanese: '牛乳', icon: '🥛', colorClass: 'bg-sky-500', phonetic: '/mɪlk/' },
      { id: 'orange_juice', keyNumber: 5, name: 'Orange Juice', japanese: 'オレンジジュース', icon: '🧃', colorClass: 'bg-orange-500', phonetic: '/ˈɒr.ɪndʒ dʒuːs/' },
      { id: 'apple_juice', keyNumber: 6, name: 'Apple Juice', japanese: 'りんごジュース', icon: '🍎', colorClass: 'bg-red-500', phonetic: '/ˈæp.əl dʒuːs/' },
      { id: 'boba', keyNumber: 7, name: 'Boba Milk Tea', japanese: 'タピオカミルクティー', icon: '🧋', colorClass: 'bg-amber-700', phonetic: '/ˈboʊ.bə mɪlk tiː/' },
      { id: 'hot_chocolate', keyNumber: 8, name: 'Hot Chocolate', japanese: 'ココア', icon: '☕', colorClass: 'bg-stone-700', phonetic: '/hɒt ˈtʃɒk.lət/' },
      { id: 'soda', keyNumber: 9, name: 'Soda', japanese: 'ソーダ・サイダー', icon: '🥤', colorClass: 'bg-rose-600', phonetic: '/ˈsoʊ.də/' },
      { id: 'lemonade', keyNumber: 10, name: 'Lemonade', japanese: 'レモネード', icon: '🍋', colorClass: 'bg-yellow-500', phonetic: '/ˌlem.əˈneɪd/' },
    ],
  },
  dessert: {
    id: 'dessert',
    label: 'Dessert',
    questionPhrase: 'What dessert do you like?',
    answerPhraseTemplate: 'I like {option}!',
    icon: '🍨',
    options: [
      { id: 'ice_cream', keyNumber: 1, name: 'Ice Cream', japanese: 'アイスクリーム', icon: '🍨', colorClass: 'bg-cyan-600', phonetic: '/ˈaɪs ˌkriːm/' },
      { id: 'chocolate_cake', keyNumber: 2, name: 'Chocolate Cake', japanese: 'チョコレートケーキ', icon: '🍰', colorClass: 'bg-amber-800', phonetic: '/ˈtʃɒk.lət keɪk/' },
      { id: 'donuts', keyNumber: 3, name: 'Donuts', japanese: 'ドーナツ', icon: '🍩', colorClass: 'bg-pink-600', phonetic: '/ˈdoʊ.nʌts/' },
      { id: 'cookies', keyNumber: 4, name: 'Cookies', japanese: 'クッキー', icon: '🍪', colorClass: 'bg-amber-600', phonetic: '/ˈkʊk.iz/' },
      { id: 'pudding', keyNumber: 5, name: 'Pudding', japanese: 'プリン', icon: '🍮', colorClass: 'bg-yellow-600', phonetic: '/ˈpʊd.ɪŋ/' },
      { id: 'waffles', keyNumber: 6, name: 'Waffles', japanese: 'ワッフル', icon: '🧇', colorClass: 'bg-amber-500', phonetic: '/ˈwɒf.əlz/' },
      { id: 'parfait', keyNumber: 7, name: 'Parfait', japanese: 'パフェ', icon: '🍧', colorClass: 'bg-rose-500', phonetic: '/pɑːrˈfeɪ/' },
      { id: 'crepes', keyNumber: 8, name: 'Crepes', japanese: 'クレープ', icon: '🥞', colorClass: 'bg-amber-400', phonetic: '/kreɪps/' },
      { id: 'pancakes', keyNumber: 9, name: 'Pancakes', japanese: 'パンケーキ', icon: '🥞', colorClass: 'bg-yellow-500', phonetic: '/ˈpæn.keɪks/' },
      { id: 'shaved_ice', keyNumber: 10, name: 'Shaved Ice', japanese: 'かき氷', icon: '🍧', colorClass: 'bg-sky-500', phonetic: '/ʃeɪvd aɪs/' },
    ],
  },
  animal: {
    id: 'animal',
    label: 'Animal',
    questionPhrase: 'What animal do you like?',
    answerPhraseTemplate: 'I like {option}!',
    icon: '🐼',
    options: [
      { id: 'dogs', keyNumber: 1, name: 'Dogs', japanese: '犬', icon: '🐶', colorClass: 'bg-amber-600', phonetic: '/dɒɡz/' },
      { id: 'cats', keyNumber: 2, name: 'Cats', japanese: '猫', icon: '🐱', colorClass: 'bg-orange-500', phonetic: '/kæts/' },
      { id: 'pandas', keyNumber: 3, name: 'Pandas', japanese: 'パンダ', icon: '🐼', colorClass: 'bg-zinc-800', phonetic: '/ˈpæn.dəz/' },
      { id: 'lions', keyNumber: 4, name: 'Lions', japanese: 'ライオン', icon: '🦁', colorClass: 'bg-yellow-600', phonetic: '/ˈlaɪ.ənz/' },
      { id: 'dolphins', keyNumber: 5, name: 'Dolphins', japanese: 'イルカ', icon: '🐬', colorClass: 'bg-cyan-600', phonetic: '/ˈdɒl.fɪnz/' },
      { id: 'koalas', keyNumber: 6, name: 'Koalas', japanese: 'コアラ', icon: '🐨', colorClass: 'bg-stone-500', phonetic: '/koʊˈɑː.ləz/' },
      { id: 'rabbits', keyNumber: 7, name: 'Rabbits', japanese: 'うさぎ', icon: '🐰', colorClass: 'bg-pink-400', phonetic: '/ˈræb.ɪts/' },
      { id: 'hamsters', keyNumber: 8, name: 'Hamsters', japanese: 'ハムスター', icon: '🐹', colorClass: 'bg-amber-500', phonetic: '/ˈhæm.stərz/' },
      { id: 'penguins', keyNumber: 9, name: 'Penguins', japanese: 'ペンギン', icon: '🐧', colorClass: 'bg-sky-600', phonetic: '/ˈpeŋ.ɡwɪnz/' },
      { id: 'tigers', keyNumber: 10, name: 'Tigers', japanese: 'トラ', icon: '🐯', colorClass: 'bg-orange-600', phonetic: '/ˈtaɪ.ɡərz/' },
    ],
  },
};

export const CATEGORY_ORDER: CategoryId[] = [
  'sport',
  'color',
  'fruit',
  'food',
  'drink',
  'dessert',
  'animal',
];

export const AVAILABLE_AVATARS = [
  { id: 'dog', emoji: '🐶', label: 'Puppy' },
  { id: 'cat', emoji: '🐱', label: 'Kitty' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'rabbit', emoji: '🐰', label: 'Bunny' },
  { id: 'frog', emoji: '🐸', label: 'Froggy' },
  { id: 'bear', emoji: '🐻', label: 'Bear' },
  { id: 'tiger', emoji: '🐯', label: 'Tiger' },
  { id: 'koala', emoji: '🐨', label: 'Koala' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
];

export const AVAILABLE_COLORS = [
  { id: 'emerald', name: 'Emerald Green', hex: '#10b981', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500', textClass: 'text-emerald-600' },
  { id: 'sky', name: 'Sky Blue', hex: '#0284c7', bgClass: 'bg-sky-500', borderClass: 'border-sky-500', textClass: 'text-sky-600' },
  { id: 'indigo', name: 'Deep Indigo', hex: '#4f46e5', bgClass: 'bg-indigo-600', borderClass: 'border-indigo-600', textClass: 'text-indigo-600' },
  { id: 'rose', name: 'Vibrant Rose', hex: '#e11d48', bgClass: 'bg-rose-500', borderClass: 'border-rose-500', textClass: 'text-rose-600' },
  { id: 'amber', name: 'Sunny Amber', hex: '#d97706', bgClass: 'bg-amber-500', borderClass: 'border-amber-500', textClass: 'text-amber-600' },
  { id: 'purple', name: 'Royal Purple', hex: '#9333ea', bgClass: 'bg-purple-600', borderClass: 'border-purple-600', textClass: 'text-purple-600' },
  { id: 'teal', name: 'Fresh Teal', hex: '#0d9488', bgClass: 'bg-teal-500', borderClass: 'border-teal-500', textClass: 'text-teal-600' },
  { id: 'orange', name: 'Bright Orange', hex: '#ea580c', bgClass: 'bg-orange-500', borderClass: 'border-orange-500', textClass: 'text-orange-600' },
];

/**
 * Returns a category with 5 randomly chosen options from the pool of 10,
 * re-numbered 1 to 5 for clean single-screen UI layout and hotkey mappings.
 */
export function getRandomOptionsForCategory(categoryId: CategoryId, count = 5): GameCategory {
  const master = GAME_CATEGORIES[categoryId] || GAME_CATEGORIES.sport;
  // Shuffle all available options
  const shuffled = [...master.options].sort(() => Math.random() - 0.5);
  // Pick requested count (default 5) and assign keyNumber 1..count
  const selected = shuffled.slice(0, count).map((opt, index) => ({
    ...opt,
    keyNumber: index + 1,
  }));

  return {
    ...master,
    options: selected,
  };
}

