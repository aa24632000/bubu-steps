import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Check, Plus, ChevronRight, ChevronLeft, BookOpen, Calendar, CheckSquare, 
  Trash2, Sun, Moon, Sunrise, Sunset, CalendarDays, Target, TrendingUp, 
  X, Star, Link as LinkIcon, Clock, Edit3, List as ListIcon, Camera, 
  Image as ImageIcon, AlertTriangle, Cloud, Settings, CalendarPlus, 
  Heart, Smile, Sparkles, Send, Share2, Download, Loader2, Gift, Leaf, 
  Wallet, Coins, Receipt 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, 
  signInWithPopup, signOut, signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from 'firebase/storage';

// --- 初始化雲端資料庫與 Storage ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyB_W0MdmX--LseDgO3T6sbWRPWRnpS4Eb0",
  authDomain: "my-36-days.firebaseapp.com",
  projectId: "my-36-days",
  storageBucket: "my-36-days.firebasestorage.app",
  messagingSenderId: "839382304055",
  appId: "1:839382304055:web:dd7e006a767b5d639346b2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : "my-36-days-app"; 

// --- 注入 html2canvas (畫報生成器) ---
const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error("畫報引擎載入失敗"));
    document.body.appendChild(script);
  });
};

// ==========================================
// 💡 準備串聯 LINE LIFF 引擎
// ==========================================
// 🚧 教學：請在這裡填入你申請到的「家長端 LIFF ID」
const LIFF_ID = ""; // 例如: "1234567890-Abcdefgh"

const loadLIFF = () => {
  return new Promise((resolve, reject) => {
    if (window.liff) return resolve(window.liff);
    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    script.onload = () => resolve(window.liff);
    script.onerror = () => reject(new Error("LINE SDK 載入失敗"));
    document.body.appendChild(script);
  });
};

// ==========================================
// 💡 AI 記帳學習記憶模組 LocalDB
// ==========================================
const LEARNING_DB_KEY = 'hey_bubu_accounting_learning_db';
const LocalDB = {
  getRules: () => {
    const data = localStorage.getItem(LEARNING_DB_KEY);
    return data ? JSON.parse(data) : {};
  },
  learnRule: (rawInput, correctMerchant, correctCategory) => {
    if (!rawInput) return false;
    const db = LocalDB.getRules();
    const isNew = !db[rawInput];
    const isMerchantChanged = rawInput !== correctMerchant;
    const isCategoryChanged = db[rawInput] && db[rawInput].category !== correctCategory;
    if (isNew || isMerchantChanged || isCategoryChanged) {
      db[rawInput] = { merchant: correctMerchant, category: correctCategory };
      localStorage.setItem(LEARNING_DB_KEY, JSON.stringify(db));
      return true;
    }
    return false;
  },
  intercept: (rawMerchant) => {
    const db = LocalDB.getRules();
    return db[rawMerchant] || null;
  }
};

// ==========================================
// 時間感知模組
// ==========================================
const useTimeTheme = () => {
  const [theme, setTheme] = useState({ name: 'afternoon', bgClass: 'from-[#8CAEBD] to-[#E3E8E4]' });
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTheme({ name: 'morning', bgClass: 'from-[#A4BCCD] via-[#E4E0D6] to-[#F1F3E6]', textColor: 'text-[#3E5C76]' }); 
      else if (hour >= 12 && hour < 17) setTheme({ name: 'afternoon', bgClass: 'from-[#C4D7D1] via-[#E9EBE0] to-[#F6F5ED]', textColor: 'text-[#4A5D54]' }); 
      else if (hour >= 17 && hour < 19) setTheme({ name: 'evening', bgClass: 'from-[#DFA896] via-[#E5C9C0] to-[#F1E4E0]', textColor: 'text-[#6D4C41]' }); 
      else setTheme({ name: 'night', bgClass: 'from-[#1A2535] via-[#2C3E50] to-[#4A5C6A]', textColor: 'text-[#E0E6ED]' }); 
    };
    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);
  return theme;
};

// ==========================================
// 星空特效
// ==========================================
const StarryNight = () => {
  const stars = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, size: `${Math.random() * 2 + 1}px`,
    animationDuration: `${Math.random() * 3 + 2}s`, animationDelay: `${Math.random() * 5}s`, opacity: Math.random() * 0.5 + 0.3
  })), []);
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen rounded-[inherit]">
      {stars.map(star => (
        <div key={star.id} className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-[twinkle_var(--duration)_ease-in-out_infinite_alternate]"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size, opacity: star.opacity, '--duration': star.animationDuration, animationDelay: star.animationDelay }} />
      ))}
    </div>
  );
};

// ==========================================
// 💡 Bubu 角色 (微型化精緻版)
// ==========================================
const BubuEngine = ({ state, message }) => {
  return (
    <div className={`fixed bottom-[145px] right-4 sm:right-[calc(50vw-270px)] flex items-end gap-1.5 transition-all duration-700 pointer-events-none z-[110] ${message ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'}`}>
      <div className="relative bg-white/95 backdrop-blur-md border border-[#EAE4D9] rounded-xl rounded-br-none px-3 py-1.5 shadow-md max-w-[180px]">
        <p className="text-[11px] font-black text-[#5C4D3C] leading-snug tracking-wide" style={{ fontFamily: "'SetoFont', 'YuanTi', 'Comic Sans MS', cursive", whiteSpace: "pre-wrap" }}>
          {String(message || '')}
        </p>
        <div className="absolute -bottom-1.5 right-0.5 w-2.5 h-2.5 bg-white border-b border-r border-[#EAE4D9] rotate-45"></div>
      </div>
      <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 transform transition-transform flex items-end justify-center ${state === 'celebrate' ? 'animate-bounce' : 'hover:scale-105'}`}>
        <div className="w-full h-full relative">
            <img src="圖片1.png" alt="Bubu" className="w-full h-full object-contain drop-shadow-lg relative z-10" onError={(e) => { e.target.style.display='none'; }} />
            <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-50 -z-10">🐻</div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 質感版：拾光軌跡
// ==========================================
const CompactForestOfLight = ({ dayOfBlock }) => {
  const steps = 10;
  return (
    <div className="relative w-full py-4 px-2 sm:px-4 mt-2">
      <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-1/2 h-1.5 bg-[#EAE4D9]/60 -translate-y-1/2 rounded-full"></div>
      <div className="absolute left-4 sm:left-6 top-1/2 h-1.5 bg-[#8A9A5B] -translate-y-1/2 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(138,154,91,0.5)]" style={{ width: `calc(${(Math.min(dayOfBlock, steps) - 1) / (steps - 1) * 100}% - 12px)` }}></div>
      <div className="relative z-10 flex justify-between">
        {Array.from({length: steps}).map((_, i) => {
           const isPassed = i < dayOfBlock;
           const isCurrent = i === dayOfBlock - 1;
           return (
             <div key={i} className="relative flex flex-col items-center">
               {isCurrent && (
                 <div className="absolute -top-7 text-[#FFF275] animate-bounce drop-shadow-md">
                   <Star size={18} fill="currentColor" strokeWidth={1} stroke="#E5C9C0"/>
                 </div>
               )}
               <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-500 ${isPassed ? 'bg-[#8A9A5B] border-[#F9F6F0] shadow-[0_0_8px_rgba(138,154,91,0.6)] scale-110' : 'bg-white border-[#EAE4D9]'}`} />
             </div>
           )
        })}
      </div>
    </div>
  );
};

const ACCOUNTING_CATEGORIES = [
  { key: '餐飲', icon: '🍔', bgColor: 'bg-[#F9EDE8]', color: 'text-[#D49A89]' },
  { key: '飲料', icon: '🥤', bgColor: 'bg-[#F9F3EA]', color: 'text-[#D4A373]' },
  { key: '交通', icon: '🚌', bgColor: 'bg-[#EAF0EB]', color: 'text-[#7A907C]' },
  { key: '購物', icon: '🛍️', bgColor: 'bg-[#F0EBE1]', color: 'text-[#8A7967]' },
  { key: '娛樂', icon: '🎬', bgColor: 'bg-[#F9F3EA]', color: 'text-[#D4A373]' },
  { key: '生活', icon: '🏠', bgColor: 'bg-[#EBF1F5]', color: 'text-[#6B8A9C]' },
  { key: '醫療', icon: '💊', bgColor: 'bg-[#F7EBEB]', color: 'text-[#C27A7E]' },
  { key: '教育', icon: '📚', bgColor: 'bg-[#EBF1F5]', color: 'text-[#6B8A9C]' },
  { key: '旅遊', icon: '✈️', bgColor: 'bg-[#EAF0EB]', color: 'text-[#7A907C]' },
  { key: '其他', icon: '✨', bgColor: 'bg-[#E8E2D9]', color: 'text-[#5C4D3C]' },
];

const LOVE_YOURSELF_LIBRARY = [
  { category: '身心放鬆', items: ['泡個熱水澡', '睡滿8小時', '喝一杯溫熱水', '享受健康早餐'] },
  { category: '自我探索', items: ['寫下3個優點', '讀一章喜歡的書', '記錄開心的小事'] },
  { category: '生活儀式', items: ['買一束花給自己', '嘗試一家新餐廳', '吃塊喜歡的蛋糕'] }
];

const App = () => {
  const currentTheme = useTimeTheme(); 
  const isNight = currentTheme.name === 'night' || currentTheme.name === 'evening';
  const [activeTab, setActiveTab] = useState('schedule'); 
  const [scheduleSubTab, setScheduleSubTab] = useState('today');
  const appContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null); 
  const loveFileInputRef = useRef(null); 
  const posterRef = useRef(null); 
  const todayRef = useRef(null); 
  const [assigningItem, setAssigningItem] = useState(null);
  const [selectedAssignDates, setSelectedAssignDates] = useState([]);
  const draggedItemRef = useRef(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); 
  const [rhythmType, setRhythmType] = useState('fixed');
  const [shiftStartDate, setShiftStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [memoryTags, setMemoryTags] = useState([]); 
  const [pocketListFilter, setPocketListFilter] = useState('全部');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [focusGoal, setFocusGoal] = useState('');

  const handleDragLeave = () => setDragOverDate(null);
  const handleDragOver = (e, dateStr) => { e.preventDefault(); if (dragOverDate !== dateStr) setDragOverDate(dateStr); };

  const handleTopRightPlusClick = () => {
    if (activeTab === 'schedule') setIsEventModalOpen(true);
    else if (activeTab === 'accounting') openAccountingModal();
    else if (activeTab === 'love') setIsLoveLibraryOpen(true);
    else setIsEventModalOpen(true);
  };

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [messageDialog, setMessageDialog] = useState({ isOpen: false, title: '', message: '' });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoveLibraryOpen, setIsLoveLibraryOpen] = useState(false);
  const [isLoveCompleteModalOpen, setIsLoveCompleteModalOpen] = useState(false);
  const [activeLoveItem, setActiveLoveItem] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', recurrence: 'none', category: '臨時待辦', icon: '✨', content: '', photo: null, link: '' }); 
  const [isAccountingModalOpen, setIsAccountingModalOpen] = useState(false);
  const [accountingForm, setAccountingForm] = useState({ id: null, category: '餐飲', title: '', amount: '', date: '', note: '' });
  const [loveForm, setLoveForm] = useState({ photo: null, reflection: '' });

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const getFormattedDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayString = getFormattedDate(today.getFullYear(), today.getMonth(), today.getDate());

  const getBlockInfo = (date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    let blockNumber = Math.ceil(dayOfYear / 10);
    let isBuffer = false;
    if (blockNumber > 36) { blockNumber = 36; isBuffer = true; }
    const blockStartDate = new Date(date.getFullYear(), 0, (blockNumber - 1) * 10 + 1);
    const dayOfBlock = isBuffer ? (dayOfYear - 360) : ((dayOfYear - 1) % 10) + 1;
    const daysLeft = isBuffer ? (new Date(date.getFullYear(), 11, 31).getDate() - date.getDate()) : (10 - dayOfBlock);
    return { blockNumber, dayOfBlock, daysLeft, isBuffer, blockStartDate, dayOfYear };
  };
  const blockData = getBlockInfo(today);

  const scheduleDays = Array.from({length: 10}, (_, i) => {
    const d = new Date(blockData.blockStartDate); 
    d.setDate(blockData.blockStartDate.getDate() + i);
    const dateStr = getFormattedDate(d.getFullYear(), d.getMonth(), d.getDate());
    return { day: d.getDate(), date: dateStr, weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()], isToday: dateStr === todayString };
  });

  const monthGrid = Array(new Date(currentYear, currentMonth, 1).getDay()).fill(null).concat(Array.from({length: new Date(currentYear, currentMonth + 1, 0).getDate()}, (_, i) => {
    const dateStr = getFormattedDate(currentYear, currentMonth, i+1);
    return { day: i+1, date: dateStr, isToday: dateStr === todayString };
  }));

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };

  const getThemeByString = (str) => {
    const s = String(str || '');
    if (s.includes('愛自己')) return { color: 'text-[#C27A7E]', bgColor: 'bg-[#F7EBEB]' };
    if (s.includes('學習')) return { color: 'text-[#6B8A9C]', bgColor: 'bg-[#EBF1F5]' };
    if (s.includes('生活')) return { color: 'text-[#9CA986]', bgColor: 'bg-[#F2F4ED]' };
    if (s.includes('每日')) return { color: 'text-[#D49A89]', bgColor: 'bg-[#F9EDE8]' };
    return { color: 'text-[#5C4D3C]', bgColor: 'bg-[#E8E2D9]' };
  };

  const [user, setUser] = useState(null); 
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]); 
  const [listItems, setListItems] = useState([]); 
  const [loveItems, setLoveItems] = useState([]); 
  const [particles, setParticles] = useState([]);
  const [quickInputText, setQuickInputText] = useState('');
  const [bubuState, setBubuState] = useState('idle');
  const [bubuMsg, setBubuMsg] = useState(''); 
  const bubuTimeoutRef = useRef(null);
  
  // LINE 狀態
  const [liffProfile, setLiffProfile] = useState(null);
  const [isLineLoading, setIsLineLoading] = useState(true); // 追蹤 LINE SDK 是否還在載入中

  const initialGreetings = useMemo(() => {
    let base = [
      `${userName ? String(userName) + '，' : ''}今天也前進一小步了呢！`,
      '累了就休息一下吧 ✨',
      '今天過得好嗎？',
      'Bubu 在這裡陪著你喔！',
      '慢慢來，比較快 🐢',
      '別忘了喝口水喔！💧'
    ];
    if (activeTab === 'accounting') {
        const total = expenses.filter(e => e.date === todayString).reduce((sum, e) => sum + Number(e.amount || 0), 0);
        base = [`今天目前花了 $${total} 元囉 💰`, total > 1000 ? '要注意預算喔！⚠️' : '控盤得很穩定呢！✨'];
    } else {
        if (String(focusGoal || '').includes('質感生活')) base.push('今天有好好吃頓飯嗎？🍚');
        if (String(focusGoal || '').includes('自我成長')) base.push('今天的你也比昨天更進步了！🌱');
    }
    return base;
  }, [userName, focusGoal, activeTab, expenses, todayString]);

  const triggerBubu = useCallback((state, message, duration = 5000) => {
    setBubuState(state); setBubuMsg(String(message || ''));
    if (bubuTimeoutRef.current) clearTimeout(bubuTimeoutRef.current);
    if (duration) {
      bubuTimeoutRef.current = setTimeout(() => { setBubuState('idle'); setBubuMsg(''); }, duration);
    }
  }, []); 

  useEffect(() => {
    if (bubuMsg === '' && onboardingStep === 0 && !isLineLoading) {
        const timer = setTimeout(() => {
            const randomMsg = initialGreetings[Math.floor(Math.random() * initialGreetings.length)];
            triggerBubu('idle', randomMsg, 4500); 
        }, 15000);
        return () => clearTimeout(timer);
    }
  }, [bubuMsg, initialGreetings, onboardingStep, triggerBubu, isLineLoading]);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hey_bubu_has_visited');
    if (!hasVisited) setOnboardingStep(1);
    else {
      const prefs = JSON.parse(localStorage.getItem('hey_bubu_user_prefs') || '{}');
      if (prefs.userName) setUserName(String(prefs.userName));
      if (prefs.focusGoal) setFocusGoal(String(prefs.focusGoal));
      if (prefs.rhythmType) setRhythmType(String(prefs.rhythmType));
    }
  }, []);

  const saveToDb = async (colName, item) => { if (db && user) await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/${colName}`, String(item.id)), item).catch(console.error); };
  const delFromDb = (colName, id) => { if (db && user) deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/${colName}`, String(id))); };

  // 💡 階段三：核心修改 - Firebase 與 LINE 登入整合
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. 先嘗試載入 LINE LIFF
        const liff = await loadLIFF();
        
        if (LIFF_ID) {
           await liff.init({ liffId: LIFF_ID });
           
           if (liff.isLoggedIn()) {
             // 💡 已經登入 LINE
             const profile = await liff.getProfile();
             setLiffProfile(profile);
             setUserName(profile.displayName);
             
             // ✨ 將 LINE 的 userId 轉為 Firebase 的 Custom Token
             // (注意：這裡先使用匿名登入作為示範，真正的做法需要透過你的伺服器發行 Firebase Token)
             // 為了確保你能馬上看到畫面不報錯，我們先維持匿名登入，但資料路徑會開始準備綁定
             console.log("LINE 登入成功，使用者的 LINE ID 是:", profile.userId);
             triggerBubu('celebrate', `歡迎回來，${profile.displayName}！`);
           }
        }
      } catch (err) {
        console.error("LIFF 初始化失敗，或尚未設定 LIFF_ID:", err);
      } finally {
        setIsLineLoading(false);
      }

      // 2. 初始化 Firebase 驗證 (無論有沒有登入 LINE 都先確保有 Firebase 權限存取資料庫)
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token).catch(console.error);
      } else {
          await signInAnonymously(auth).catch(console.error);
      }
    };
    
    initApp();
    
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // 💡 LINE 登入動作
  const handleLineLogin = async () => {
    if (!LIFF_ID) {
      triggerBubu('idle', '我們需要先去申請一組 LIFF ID 才能串聯 LINE 喔！快去設定吧！', 6000);
      return;
    }
    const liff = await loadLIFF();
    if (!liff.isLoggedIn()) {
      // 點擊後，網頁會跳轉到 LINE 的登入畫面
      liff.login();
    }
  };
  
  // 💡 LINE 登出動作
  const handleLineLogout = async () => {
     const liff = await loadLIFF();
     if (liff.isLoggedIn()) {
         liff.logout();
         setLiffProfile(null);
         triggerBubu('idle', '已經登出 LINE 囉！');
     }
  }

  // 資料庫訂閱
  useEffect(() => {
    if (!user || !db) return;
    
    // 💡 未來進階：如果 liffProfile 存在，可以將資料路徑改為使用 LINE 的 userId
    // const actualUserId = liffProfile ? liffProfile.userId : user.uid;
    const path = `artifacts/${appId}/users/${user.uid}`;
    
    const unsubTasks = onSnapshot(collection(db, path, 'tasks'), snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubExpenses = onSnapshot(collection(db, path, 'expenses'), snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLove = onSnapshot(collection(db, path, 'loveItems'), snap => setLoveItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubTasks(); unsubExpenses(); unsubLove(); };
  }, [user, liffProfile]);

  const drawBlindBox = useCallback(() => {
    const allItems = LOVE_YOURSELF_LIBRARY.flatMap(g => g.items);
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    const newItem = { id: Date.now().toString(), text: String(`驚喜：${randomItem}`), category: '盲盒', status: 'pending', photo: null, reflection: '', timestamp: Date.now() };
    setLoveItems(prev => [...prev, newItem]); saveToDb('loveItems', newItem);
    triggerBubu('celebrate', `為你抽出：${randomItem}！ ✨`, 4000);
  }, [triggerBubu]);

  const saveLoveDetail = () => {
    if (!activeLoveItem) return;
    const updated = { ...activeLoveItem, photo: loveForm.photo, reflection: String(loveForm.reflection), status: 'done', completedAt: Date.now() };
    setLoveItems(prev => prev.map(i => i.id === activeLoveItem.id ? updated : i)); saveToDb('loveItems', updated);
    setIsLoveCompleteModalOpen(false); setActiveLoveItem(null);
    triggerBubu('celebrate', '回憶收妥囉！💖', 3000);
  };

  const handleLoveImageUpload = (e) => {
    const file = e.target.files[0];
    if(!file || !user) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * (MAX_WIDTH / img.width);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async (blob) => {
              try {
                const storageRef = ref(storage, `artifacts/${appId}/users/${user.uid}/images/${Date.now()}.jpg`);
                await uploadBytes(storageRef, blob);
                const url = await getDownloadURL(storageRef);
                setLoveForm(prev => ({...prev, photo: url}));
              } catch (err) { console.error(err); }
            }, 'image/jpeg', 0.6);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInputText.trim()) return;
    const input = quickInputText;
    if (activeTab === 'schedule') {
        const newTask = { id: Date.now().toString(), text: String(input), category: '臨時待辦', status: 'assigned', date: todayString, time: '', icon: '📝', ...getThemeByString('臨時'), timestamp: Date.now() };
        setTasks(prev => [...prev, newTask]); saveToDb('tasks', newTask);
    } else if (activeTab === 'accounting') {
        const matches = input.match(/\d+/g);
        const amount = matches ? matches[matches.length - 1] : 0;
        const newExpense = { id: Date.now().toString(), category: '其他', title: String(input.replace(/\d+/g, '').trim() || '消費'), amount: String(amount), date: todayString, note: '' };
        setExpenses(prev => [...prev, newExpense]); saveToDb('expenses', newExpense);
    }
    setQuickInputText('');
    triggerBubu('celebrate', '記下來囉！✍️', 3000);
  };

  const handleDragStart = (e, source, payload) => { draggedItemRef.current = { source, payload }; e.dataTransfer.setData('source', source); e.dataTransfer.setData('payload', payload); };
  const handleDragEnd = () => { draggedItemRef.current = null; setDragOverDate(null); };
  const handleDrop = (e, targetDateStr) => {
    e.preventDefault(); setDragOverDate(null);
    let source = e.dataTransfer.getData('source'); let payload = e.dataTransfer.getData('payload');
    if (!source && draggedItemRef.current) { source = draggedItemRef.current.source; payload = draggedItemRef.current.payload; }
    if (source === 'task') {
      const task = tasks.find(t => t.id === payload);
      if (task) { const updated = { ...task, date: targetDateStr }; setTasks(prev => prev.map(t => t.id === payload ? updated : t)); saveToDb('tasks', updated); }
    }
  };

  const toggleTaskStatus = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) { 
      const updated = { ...task, status: task.status === 'done' ? 'assigned' : 'done' }; 
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t)); saveToDb('tasks', updated); 
    }
  };

  const openFullEditor = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) { setEditingTaskId(task.id); setEventForm({ title: String(task.text || ''), date: String(task.date), time: String(task.time || ''), recurrence: 'none', category: String(task.category || '臨時待辦'), icon: String(task.icon || '💼'), content: String(task.content || ''), photo: task.photo || null, link: String(task.link || '') }); setIsEventModalOpen(true); }
  };

  const openAccountingModal = (item = null) => {
    if (item) setAccountingForm({ id: item.id, category: String(item.category), title: String(item.title), amount: String(item.amount), date: String(item.date), note: String(item.note || '') });
    else setAccountingForm({ id: null, category: '餐飲', title: '', amount: '', date: todayString, note: '' });
    setIsAccountingModalOpen(true);
  };

  const handleSaveAccountingModal = () => {
    if (!accountingForm.title.trim() || !accountingForm.amount) return;
    if (accountingForm.id) {
      setExpenses(prev => prev.map(item => item.id === accountingForm.id ? { ...item, ...accountingForm } : item)); saveToDb('expenses', accountingForm);
    } else {
      const newItem = { ...accountingForm, id: Date.now().toString() };
      setExpenses(prev => [...prev, newItem]); saveToDb('expenses', newItem);
    }
    setIsAccountingModalOpen(false);
  };

  const requestDelete = (type, id) => {
    setConfirmDialog({ isOpen: true, title: '確定要丟掉嗎？', onConfirm: () => {
        if (type === 'task') { setTasks(prev => prev.filter(t => t.id !== id)); delFromDb('tasks', id); } 
        else if (type === 'expense') { setExpenses(prev => prev.filter(item => item.id !== id)); delFromDb('expenses', id); }
        else if (type === 'love') { setLoveItems(prev => prev.filter(item => item.id !== id)); delFromDb('loveItems', id); }
        setConfirmDialog({isOpen: false});
    }});
  };

  // --- UI 元件渲染 ---
  function renderOnboarding() {
    if (onboardingStep === 0) return null;
    return (
      <div className="fixed inset-0 bg-[#3C5A66]/40 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-500">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EAE4D9] relative w-full mb-6 polaroid-effect">
            {onboardingStep > 1 && <button onClick={() => setOnboardingStep(prev => prev - 1)} className="absolute top-5 left-5 text-[#C9C2B5] hover:text-[#8A7967] bg-[#F9F6F0] rounded-full p-1.5 transition-colors active:scale-95"><ChevronLeft size={20} strokeWidth={3} /></button>}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-b border-r border-[#EAE4D9] rotate-45"></div>
            <div className="flex justify-center gap-1.5 mb-6 mt-1">
              {[1, 2, 3, 4].map(step => <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${onboardingStep === step ? 'w-6 bg-[#8A9A5B]' : onboardingStep > step ? 'w-2 bg-[#A4B494]' : 'w-2 bg-[#F9F6F0]'}`} />)}
            </div>
            <div className="text-center min-h-[70px] flex items-center justify-center mb-6">
              <p className="text-[#5C4D3C] font-black text-base leading-relaxed tracking-wide whitespace-pre-wrap" style={{ fontFamily: "'SetoFont', 'YuanTi', 'Comic Sans MS', cursive" }}>
                {onboardingStep === 1 && "嗨！我是 Bubu。\n我該怎麼稱呼你呢？"}
                {onboardingStep === 2 && `很高興認識你，${userName}！\n在接下來這 10 天的小挑戰裡，\n你想要把重心放在哪裡？`}
                {onboardingStep === 3 && "為了讓陪伴更貼心，\n你是固定週休二日，\n還是有特殊的排班節奏呢？"}
                {onboardingStep === 4 && "我們不追求完美，只追求持續。\n準備好開始第一個 10 天了嗎？"}
              </p>
            </div>
            <div className="w-full flex flex-col justify-end min-h-[140px]">
              {onboardingStep === 1 && <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in">
                <input type="text" value={userName} onChange={e => setUserName(String(e.target.value))} placeholder="請輸入暱稱..." className="w-full h-12 bg-[#F9F6F0] rounded-xl px-4 text-center text-lg text-[#5C4D3C] font-black focus:outline-none focus:ring-2 focus:ring-[#8A9A5B] border border-[#EAE4D9]" onKeyDown={e => { if (e.key === 'Enter' && userName.trim()) setOnboardingStep(2); }} autoFocus />
                <button onClick={() => setOnboardingStep(2)} disabled={!userName.trim()} className="w-full h-12 bg-[#8A9A5B] text-white rounded-xl shadow-sm disabled:opacity-40 hover:bg-[#7A8A4B] active:scale-95 transition-all font-bold tracking-widest flex justify-center items-center gap-1">下一步 <ChevronRight size={18}/></button>
              </div>}
              {onboardingStep === 2 && <div className="flex flex-col gap-2.5 animate-in slide-in-from-bottom-2 fade-in">
                  {[
                    { id: '🌻 質感生活', desc: '好好吃飯、好好睡覺' }, 
                    { id: '🌿 自我成長', desc: '閱讀、運動、學新事物' }, 
                    { id: '💼 職場精進', desc: '專注工作、提升效率' }
                  ].map(goal => (
                    <button key={goal.id} onClick={() => { setFocusGoal(String(goal.id)); setOnboardingStep(3); }} className="w-full p-3 bg-white text-left rounded-xl shadow-sm border border-[#EAE4D9] hover:bg-[#F9F6F0] hover:border-[#A4B494] active:scale-95 transition-all group flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F9F6F0] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{String(goal.id).split(' ')[0]}</div>
                      <div className="flex-1">
                        <div className="text-[#5C4D3C] font-black text-sm tracking-wide">{String(goal.id).split(' ')[1]}</div>
                        <div className="text-[#8A7967] text-[10px] font-bold opacity-80">{String(goal.desc)}</div>
                      </div>
                    </button>
                  ))}
              </div>}
              {onboardingStep === 3 && <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in">
                  <button onClick={() => { setRhythmType('fixed'); setOnboardingStep(4); }} className="w-full p-3 bg-white text-left rounded-xl shadow-sm border border-[#EAE4D9] hover:bg-[#F9F6F0] hover:border-[#8A9A5B] active:scale-95 transition-all group flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EAF0EB] text-[#7A907C] flex items-center justify-center group-hover:scale-110 transition-transform"><CalendarDays size={20} /></div>
                    <div>
                      <div className="text-[#5C4D3C] font-black text-sm tracking-wide">固定規律</div>
                      <div className="text-[#8A7967] text-[10px] font-bold opacity-80">週休二日、朝九晚五</div>
                    </div>
                  </button>
                  <button onClick={() => { setRhythmType('shift'); setOnboardingStep(4); }} className="w-full p-3 bg-white text-left rounded-xl shadow-sm border border-[#EAE4D9] hover:bg-[#F9F6F0] hover:border-[#D4A373] active:scale-95 transition-all group flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F9F3EA] text-[#D4A373] flex items-center justify-center group-hover:scale-110 transition-transform"><Clock size={20} /></div>
                    <div>
                      <div className="text-[#5C4D3C] font-black text-sm tracking-wide">特殊排班</div>
                      <div className="text-[#8A7967] text-[10px] font-bold opacity-80">做二休二、輪班制</div>
                    </div>
                  </button>
              </div>}
              {onboardingStep === 4 && <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2 fade-in w-full text-center">
                  <div className="bg-[#F9F6F0] p-3 rounded-xl border border-[#EAE4D9]">
                    <span className="text-[10px] font-bold text-[#8A7967] block mb-1">你的專屬設定</span>
                    <div className="text-sm font-black text-[#5C4D3C]">{String(focusGoal)} <span className="text-[#C9C2B5] mx-1">|</span> {rhythmType === 'fixed' ? '固定作息' : '彈性排班'}</div>
                  </div>
                  <button onClick={() => {
                    localStorage.setItem('hey_bubu_has_visited', 'true');
                    localStorage.setItem('hey_bubu_user_prefs', JSON.stringify({ userName, focusGoal, rhythmType }));
                    setOnboardingStep(0);
                    let goalTaskText = String(focusGoal).includes('質感生活') ? '好好吃一頓飯 🍽️' : String(focusGoal).includes('自我成長') ? '讀 10 頁書 📖' : '列出重要工作 💼';
                    const newTask = { id: Date.now().toString(), text: `[目標啟動] ${goalTaskText}`, category: '每日計畫', status: 'assigned', date: todayString, time: '', icon: '🎯', ...getThemeByString('每日'), timestamp: Date.now() };
                    setTasks(prev => [...prev, newTask]); saveToDb('tasks', newTask);
                    triggerBubu('celebrate', `出發吧，${userName}！✨`, 5000);
                  }} className="w-full h-12 bg-[#8A9A5B] text-white font-black text-sm rounded-xl shadow-md hover:bg-[#7A8A4B] active:scale-95 flex items-center justify-center gap-2 transition-all tracking-widest"><Sparkles size={18} />開始拾光</button>
              </div>}
            </div>
          </div>
          <div className="w-24 h-24 animate-[float_3s_ease-in-out_infinite] z-20"><img src="圖片1.png" alt="Bubu" className="w-full h-full object-contain drop-shadow-xl" onError={(e) => { e.target.style.display='none'; }} /></div>
        </div>
      </div>
    );
  }

  function renderScheduleTab() {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[100px]">
        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-full w-fit mx-auto mb-6 shadow-sm border border-white/40">
          <button onClick={() => setScheduleSubTab('today')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${scheduleSubTab === 'today' ? 'bg-[#5C4D3C] text-white shadow-sm' : 'text-[#5C4D3C]'}`}>拾光小路</button>
          <button onClick={() => setScheduleSubTab('calendar')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${scheduleSubTab === 'calendar' ? 'bg-[#5C4D3C] text-white shadow-sm' : 'text-[#5C4D3C]'}`}>整月日曆</button>
        </div>
        {scheduleSubTab === 'today' ? (
          <div className="space-y-6">
            <div className="rounded-3xl p-6 text-[#5C4D3C] bg-white/70 backdrop-blur-xl border border-white/60 polaroid-effect flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                 <div className="inline-block bg-white/50 px-3 py-1 rounded-full text-xs font-bold text-[#8A7967]">第 {blockData.blockNumber} 篇章</div>
                 {focusGoal && <div className="inline-block bg-[#F9F6F0] px-3 py-1 rounded-full text-xs font-bold ml-2 text-[#A4B494] border border-[#EAE4D9]">{String(focusGoal)}</div>}
                 <h2 className="text-3xl font-black mt-2">Day {blockData.dayOfBlock} <span className="text-lg font-medium opacity-60">/ 10</span></h2>
               </div>
               <div className="flex-1 w-full sm:max-w-[280px]"><CompactForestOfLight dayOfBlock={blockData.dayOfBlock} /></div>
            </div>
            <div className="bg-white/80 rounded-2xl shadow-sm border border-white/50 overflow-hidden">
               {scheduleDays.map((day) => (
                 <div key={day.date} ref={day.isToday ? todayRef : null} className={`flex border-b border-[#EAE4D9]/50 min-h-[64px] ${day.isToday ? 'bg-[#F9F6F0]/30' : ''}`} onDragOver={(e) => handleDragOver(e, day.date)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, day.date)}>
                   <div className={`w-[60px] shrink-0 flex flex-col items-center justify-center ${day.isToday ? 'bg-[#5C4D3C] text-white shadow-inner' : 'bg-[#F9F6F0]/50 text-[#5C4D3C]'}`}>
                     <span className="text-2xl font-black">{day.day}</span>
                     <span className="text-[10px] font-bold opacity-80">{day.weekday.replace('周','')}</span>
                   </div>
                   <div className="flex-1 p-3 flex flex-col justify-center gap-2">
                      {tasks.filter(t => t.date === day.date).map(task => (
                         <div key={task.id} className="relative flex items-start gap-2 group cursor-pointer hover:bg-white p-2 rounded-xl" onClick={() => openFullEditor(task.id)}>
                            <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }} className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border ${task.status === 'done' ? 'bg-[#A4B494] text-white' : 'border-[#C9C2B5]'}`}>{task.status === 'done' && <Check size={10} strokeWidth={3}/>}</button>
                            <span className={`text-sm font-bold truncate ${task.status === 'done' ? 'line-through text-[#C9C2B5]' : 'text-[#5C4D3C]'}`}>{String(task.text || '未命名')}</span>
                         </div>
                      ))}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        ) : (
           <div className="bg-white/80 rounded-3xl p-5 shadow-sm border border-white/50">
             <div className="flex justify-between items-center mb-4"><button onClick={prevMonth} className="p-2 text-[#8A7967]"><ChevronLeft size={20}/></button><h2 className="font-black text-[#5C4D3C] text-lg">{currentYear} 年 {currentMonth + 1} 月</h2><button onClick={nextMonth} className="p-2 text-[#8A7967]"><ChevronRight size={20}/></button></div>
             <div className="grid grid-cols-7 gap-1">{monthGrid.map((dayObj, i) => <div key={i} className={`min-h-[60px] rounded-lg border p-1 ${dayObj?.isToday ? 'border-[#8A9A5B] bg-[#F2F4ED]/50 shadow-sm' : 'border-[#EAE4D9] bg-white'}`}>{dayObj && <span className="text-[10px] font-black">{dayObj.day}</span>}</div>)}</div>
           </div>
        )}
      </div>
    );
  }

  function renderAccountingTab() {
    const total = expenses.filter(e => e.date === todayString).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[100px]">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-[#5C4D3C] flex items-center gap-2 tracking-wide drop-shadow-sm"><Wallet size={24} className="text-[#8A9A5B]"/> 我的記帳</h2><button onClick={() => openAccountingModal()} className="bg-[#8A9A5B] text-white p-2.5 rounded-xl shadow-md"><Plus size={20}/></button></div>
        <div className="bg-white/80 rounded-2xl p-5 mb-5 shadow-sm border border-white/50 flex justify-between items-center polaroid-effect">
            <div className="text-sm font-bold text-[#8A7967]">今日花費</div>
            <div className="text-3xl font-black text-[#5C4D3C]">${total}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(item => {
            const cat = ACCOUNTING_CATEGORIES.find(c => c.key === item.category) || ACCOUNTING_CATEGORIES[9];
            return (
              <div key={item.id} className="p-3 rounded-2xl border-2 border-white bg-white/90 shadow-sm polaroid-effect flex flex-col transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2.5">
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cat.bgColor} ${cat.color}`}>{String(cat.icon)} {String(item.category)}</span>
                   <div className="flex gap-1">
                      <button onClick={() => openAccountingModal(item)} className="p-1 text-[#A4B494]"><Edit3 size={11}/></button>
                      <button onClick={() => requestDelete('expense', item.id)} className="p-1 text-[#D49A89]"><Trash2 size={11}/></button>
                   </div>
                </div>
                <h4 className="font-black text-[#5C4D3C] text-sm truncate">{String(item.title)}</h4>
                <div className="text-lg font-black text-[#8A9A5B] mt-1">${String(item.amount)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderLoveYourselfTab() {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
        <div className="bg-gradient-to-br from-[#E2B49A] to-[#C28C5B] rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden mb-6 polaroid-effect">
           <Heart size={80} className="absolute -right-4 -top-4 opacity-20 fill-white"/>
           <div className="relative z-10"><h2 className="text-2xl font-black mb-2">愛自己，不設限</h2><p className="text-white/90 text-sm font-bold">累積了 {loveItems.filter(i => i.status === 'done').length} 件溫暖小事</p></div>
        </div>
        <button onClick={drawBlindBox} className="w-full bg-white text-[#D4A373] p-4 rounded-2xl font-black mb-4 flex items-center justify-center gap-2 shadow-sm border border-[#EAE4D9]"><Gift size={20}/> 抽一個生活驚喜</button>
        <div className="grid grid-cols-2 gap-3">
          {loveItems.map((item, index) => (
            <div key={item.id} onClick={() => item.status !== 'done' && (setActiveLoveItem(item), setLoveForm({photo: null, reflection: ''}), setIsLoveCompleteModalOpen(true))} className={`relative rounded-2xl p-4 shadow-sm border-2 border-white transition-all ${item.status === 'done' ? 'bg-white' : 'bg-white/80'}`}>
               <button onClick={(e) => { e.stopPropagation(); requestDelete('love', item.id); }} className="absolute top-2 right-2 text-[#C27A7E] opacity-50"><Trash2 size={12}/></button>
               <div className="text-[10px] font-black text-[#D4A373] mb-2">No.{index + 1}</div>
               <div className="font-black text-sm text-[#5C4D3C] mb-2">{String(item.text)}</div>
               {item.status === 'done' ? <div className="text-[10px] text-[#A4B494] font-bold">達成 🎉</div> : <div className="text-[10px] text-[#D4A373] flex items-center gap-1"><Camera size={12}/> 點擊紀錄</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderReflectionTab() {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border-2 border-white polaroid-effect text-center">
                <h2 className="text-2xl font-black text-[#5C4D3C] mb-4">本篇章結算</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F2F4ED] rounded-2xl"><div className="text-2xl font-black text-[#8A9A5B]">{tasks.filter(t => t.status === 'done').length}</div><div className="text-[10px] font-bold text-[#8A7967]">計畫達成</div></div>
                    <div className="p-4 bg-[#F7EBEB] rounded-2xl"><div className="text-2xl font-black text-[#C27A7E]">{loveItems.filter(i => i.status === 'done').length}</div><div className="text-[10px] font-bold text-[#8A7967]">愛自己</div></div>
                </div>
            </div>
          </div>
      </div>
    );
  }

  function renderConfirmDialog() {
    if (!confirmDialog.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-[#3C5A66]/60 z-[400] flex p-4 backdrop-blur-sm animate-in fade-in">
        <div className="bg-[#F9F6F0] rounded-[24px] w-full max-w-sm p-6 shadow-xl relative m-auto polaroid-effect">
          <h3 className="font-black text-xl text-[#5C4D3C] mb-6 text-center">{confirmDialog.title}</h3>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDialog({isOpen: false})} className="flex-1 py-3 bg-white text-[#8A7967] rounded-xl font-bold">取消</button>
            <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 bg-[#D49A89] text-white rounded-xl font-bold">確認</button>
          </div>
        </div>
      </div>
    );
  }

  function renderLoveCompleteModal() {
    if (!isLoveCompleteModalOpen || !activeLoveItem) return null;
    return (
      <div className="fixed inset-0 bg-[#3C5A66]/60 z-[200] flex p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
        <div className="bg-[#F9F6F0] rounded-3xl w-full max-w-sm p-6 shadow-xl m-auto polaroid-effect relative">
          <button onClick={() => setIsLoveCompleteModalOpen(false)} className="absolute top-4 right-4 text-[#8A7967]"><X size={20}/></button>
          <h3 className="font-black text-xl text-[#5C4D3C] mb-4 text-center">{String(activeLoveItem.text)}</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-dashed border-[#EAE4D9] text-center cursor-pointer" onClick={() => loveFileInputRef.current.click()}>
              <input type="file" accept="image/*" ref={loveFileInputRef} className="hidden" onChange={handleLoveImageUpload} />
              {loveForm.photo ? <img src={loveForm.photo} className="w-full h-32 object-cover rounded-xl" alt="Memory" /> : <div className="py-8 text-[#8A7967] flex flex-col items-center"><Camera size={32}/><span className="text-xs mt-1">上傳照片</span></div>}
            </div>
            <textarea value={loveForm.reflection} onChange={e => setLoveForm({...loveForm, reflection: e.target.value})} placeholder="今天的心情感言..." className="w-full h-24 bg-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#D4A373] outline-none" />
            <button onClick={saveLoveDetail} className="w-full h-12 bg-[#D4A373] text-white font-black rounded-xl shadow-md">儲存回憶</button>
          </div>
        </div>
      </div>
    );
  }

  function renderEventModal() {
    if (!isEventModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-[#3C5A66]/60 z-[200] flex p-4 backdrop-blur-md animate-in fade-in overflow-y-auto">
        <div className="bg-[#F9F6F0] rounded-3xl w-full max-w-sm p-6 shadow-xl m-auto polaroid-effect relative">
          <button onClick={() => setIsEventModalOpen(false)} className="absolute top-4 right-4 text-[#8A7967]"><X size={20}/></button>
          <h3 className="font-black text-xl text-[#5C4D3C] mb-5">計畫細節</h3>
          <div className="space-y-4">
            <input type="text" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: String(e.target.value) })} placeholder="要做的事..." className="w-full h-12 bg-white rounded-xl px-4 font-black focus:ring-1 focus:ring-[#5C4D3C] outline-none" />
            <button onClick={() => {
                const theme = getThemeByString(eventForm.category);
                const newTask = { id: editingTaskId || Date.now().toString(), text: String(eventForm.title), status: 'assigned', date: todayString, ...theme };
                setTasks(prev => editingTaskId ? prev.map(t => t.id === editingTaskId ? newTask : t) : [...prev, newTask]);
                saveToDb('tasks', newTask); setIsEventModalOpen(false);
                setEditingTaskId(null);
            }} className="w-full h-12 bg-[#5C4D3C] text-white font-black rounded-xl">儲存計畫</button>
          </div>
        </div>
      </div>
    );
  }

  function renderAccountingModal() {
    if (!isAccountingModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-[#3C5A66]/60 z-[200] flex p-4 backdrop-blur-md animate-in fade-in overflow-y-auto">
        <div className="bg-[#F9F6F0] rounded-3xl w-full max-w-sm p-6 shadow-xl m-auto polaroid-effect relative">
          <button onClick={() => setIsAccountingModalOpen(false)} className="absolute top-4 right-4 text-[#8A7967]"><X size={20}/></button>
          <h3 className="font-black text-xl text-[#5C4D3C] mb-5">{accountingForm.id ? '修改花費' : '記下一筆'}</h3>
          <div className="space-y-4">
            <input type="text" value={accountingForm.title} onChange={e => setAccountingForm({...accountingForm, title: String(e.target.value)})} placeholder="消費項目" className="w-full h-12 bg-white rounded-xl px-4 focus:ring-1 focus:ring-[#8A9A5B] outline-none" />
            <input type="number" value={accountingForm.amount} onChange={e => setAccountingForm({...accountingForm, amount: String(e.target.value)})} placeholder="金額" className="w-full h-12 bg-white rounded-xl px-4 outline-none" />
            <select value={accountingForm.category} onChange={e => setAccountingForm({...accountingForm, category: String(e.target.value)})} className="w-full h-12 bg-white rounded-xl px-4 outline-none">
               {ACCOUNTING_CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.icon} {cat.key}</option>)}
            </select>
            <button onClick={handleSaveAccountingModal} className="w-full h-12 bg-[#8A9A5B] text-white font-black rounded-xl">儲存</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full relative font-sans transition-colors duration-1000 overflow-x-hidden bg-gradient-to-br ${currentTheme.bgClass}`}>
      {isNight && <StarryNight />}
      {particles.map(p => <div key={p.id} className="fixed pointer-events-none z-[9999] rounded-full bg-[#FFF275] shadow-[0_0_12px_#FFF275]" style={{ left: p.x, top: p.y, width: p.size, height: p.size, animation: `floatParticle 1s ease-out forwards` }} />)}
      
      <div className="max-w-xl mx-auto relative min-h-screen pb-[100px] shadow-2xl bg-white/5 backdrop-blur-sm border-x border-white/20">
        <header className="sticky top-0 z-[50] bg-white/40 backdrop-blur-xl border-b border-white/30 px-5 py-3.5 flex justify-between items-center shadow-sm">
          <h1 className="text-xl font-black flex items-center gap-1.5 text-[#5C4D3C]" style={{ fontFamily: "'SetoFont', 'YuanTi', 'Comic Sans MS', cursive" }}>
            <Star size={20} className="text-[#FFF275] fill-[#FFF275]" /> 小步拾光
          </h1>
          <div className="flex items-center gap-2.5">
            {/* 💡 修改：加上載入中狀態與登出功能 */}
            {isLineLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-white/50 bg-white/20 animate-pulse flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white"/></div>
            ) : liffProfile ? (
              <div className="relative group">
                 <img src={liffProfile.pictureUrl} alt="LINE" className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" />
                 {/* 滑過頭像顯示登出按鈕 */}
                 <div className="absolute right-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <button onClick={handleLineLogout} className="bg-white text-[#D49A89] text-xs font-bold py-1 px-3 rounded shadow-md whitespace-nowrap">登出 LINE</button>
                 </div>
              </div>
            ) : (
              <button onClick={handleLineLogin} className="bg-[#06C755] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md active:scale-95 flex items-center gap-1">
                LINE 登入
              </button>
            )}
            <button onClick={handleTopRightPlusClick} className="bg-[#5C4D3C] text-white border border-[#4A3D2F] p-2 rounded-full shadow-md active:scale-95"><Plus size={18} /></button>
          </div>
        </header>

        <main className="p-4 sm:p-6 relative z-10">
          {activeTab === 'schedule' && renderScheduleTab()}
          {activeTab === 'accounting' && renderAccountingTab()}
          {activeTab === 'love' && renderLoveYourselfTab()}
          {activeTab === 'reflection' && renderReflectionTab()}
        </main>

        <BubuEngine state={bubuState} message={bubuMsg} />

        {(activeTab === 'schedule' || activeTab === 'accounting') && (
          <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-full max-w-xl z-[60] px-4 sm:px-6">
            <form onSubmit={handleQuickSubmit} className="bg-white/80 backdrop-blur-2xl border-2 border-white p-1.5 rounded-2xl shadow-lg flex items-center gap-2 polaroid-effect">
              <div className="bg-[#F2F4ED] p-2 rounded-xl text-[#8A9A5B] shadow-inner">{activeTab === 'schedule' ? <CalendarPlus size={18} /> : <Coins size={18} />}</div>
              <input type="text" value={quickInputText} onChange={e => setQuickInputText(e.target.value)} placeholder={activeTab === 'schedule' ? "對 Bubu 說些什麼..." : "午餐 120 元..."} className="flex-1 bg-transparent text-sm font-black focus:outline-none"/>
              <button type="submit" disabled={!quickInputText.trim()} className="p-2.5 bg-[#8A9A5B] text-white rounded-xl shadow-sm border border-[#7A8A4B] active:scale-95 transition-all"><Send size={18} /></button>
            </form>
          </div>
        )}

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-[50] bg-white/60 backdrop-blur-xl border-t border-white/50 pt-2 px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-around max-w-md mx-auto">
            <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-all ${activeTab === 'schedule' ? 'text-[#8A9A5B] bg-white shadow-sm border border-white' : 'text-[#8A7967]'}`}><Calendar size={22}/><span className="text-xs font-black mt-1">拾光</span></button>
            <button onClick={() => setActiveTab('accounting')} className={`flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-all ${activeTab === 'accounting' ? 'text-[#8A9A5B] bg-white shadow-sm border border-white' : 'text-[#8A7967]'}`}><Wallet size={22}/><span className="text-xs font-black mt-1">記帳</span></button>
            <button onClick={() => setActiveTab('love')} className={`flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-all ${activeTab === 'love' ? 'text-[#C27A7E] bg-white shadow-sm border border-white' : 'text-[#8A7967]'}`}><Heart size={22}/><span className="text-xs font-black mt-1">愛自己</span></button>
            <button onClick={() => setActiveTab('reflection')} className={`flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-all ${activeTab === 'reflection' ? 'text-[#6B8A9C] bg-white shadow-sm border border-white' : 'text-[#8A7967]'}`}><Star size={22}/><span className="text-xs font-black mt-1">回顧</span></button>
          </div>
        </nav>
      </div>

      {renderOnboarding()}
      {renderEventModal()}
      {renderAccountingModal()}
      {renderLoveCompleteModal()}
      {renderConfirmDialog()}

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap'); 
        body { background-color: #f3f4f6; } 
        .custom-scrollbar::-webkit-scrollbar { display: none; } 
        .pb-safe { padding-bottom: calc(env(safe-area-inset-bottom) + 8px); } 
        .touch-manipulation { touch-action: pan-y; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; } 
        .polaroid-effect { box-shadow: 0 4px 15px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.6); transform: rotate(0deg); transition: transform 0.2s ease, box-shadow 0.2s ease; } 
        @keyframes twinkle { 0% { transform: scale(1); opacity: 0.2; } 50% { transform: scale(1.5); opacity: 1; box-shadow: 0 0 10px rgba(255,255,255,0.9); } 100% { transform: scale(1); opacity: 0.2; } } 
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } } 
        @keyframes floatParticle { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(0, -40px) scale(0); opacity: 0; } } 
        * { font-family: 'Nunito', 'Noto Sans TC', 'PingFang TC', sans-serif; }
      `}} />
    </div>
  );
};
export default App;