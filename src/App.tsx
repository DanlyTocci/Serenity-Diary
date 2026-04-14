/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Smile, 
  Meh, 
  Frown, 
  CloudRain, 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  Calendar,
  Sparkles,
  Quote,
  ChevronRight,
  ChevronLeft,
  Camera
} from 'lucide-react';
import { format, isToday, parseISO, subDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { DiaryEntry, DailyInspiration } from './types';
import { getDailyInspiration } from './services/aiService';

// --- Components ---

const Avatar = ({ mood }: { mood?: string }) => {
  const getExpression = () => {
    switch (mood) {
      case 'great': return 'M 30 65 Q 50 85 70 65';
      case 'good': return 'M 35 65 Q 50 75 65 65';
      case 'neutral': return 'M 35 70 L 65 70';
      case 'bad': return 'M 35 75 Q 50 65 65 75';
      case 'terrible': return 'M 30 80 Q 50 60 70 80';
      default: return 'M 35 70 Q 50 80 65 70';
    }
  };

  return (
    <motion.div 
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="w-24 h-24 mx-auto mb-6"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ccd9cc" />
            <stop offset="100%" stopColor="#5a7a5a" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#avatarGrad)" />
        {/* Eyes */}
        <circle cx="35" cy="40" r="4" fill="#3a4d3a" />
        <circle cx="65" cy="40" r="4" fill="#3a4d3a" />
        {/* Mouth */}
        <path 
          d={getExpression()} 
          fill="none" 
          stroke="#3a4d3a" 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        {/* Blush */}
        <circle cx="25" cy="55" r="5" fill="#e4ebe4" opacity="0.4" />
        <circle cx="75" cy="55" r="5" fill="#e4ebe4" opacity="0.4" />
      </svg>
    </motion.div>
  );
};

interface MoodButtonProps {
  mood: string;
  icon: any;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  key?: string | number;
}

const MoodButton = ({ 
  mood, 
  icon: Icon, 
  label, 
  isSelected, 
  onClick 
}: MoodButtonProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${
      isSelected 
        ? 'bg-sage-600 text-white scale-110 shadow-md' 
        : 'bg-white text-sage-800 hover:bg-sage-100'
    }`}
  >
    <Icon size={24} />
    <span className="text-xs mt-1 font-medium">{label}</span>
  </button>
);

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [yesterdayEntry, setYesterdayEntry] = useState<DiaryEntry | null>(null);
  const [currentMood, setCurrentMood] = useState<DiaryEntry['mood'] | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [inspiration, setInspiration] = useState<DailyInspiration | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingInspiration, setIsLoadingInspiration] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedEntries = localStorage.getItem('serenity_entries');
    if (savedEntries) {
      const parsedEntries: DiaryEntry[] = JSON.parse(savedEntries);
      setEntries(parsedEntries);
      
      // Find yesterday's entry
      const yesterday = subDays(new Date(), 1);
      const found = parsedEntries.find(e => isSameDay(parseISO(e.date), yesterday));
      if (found) {
        setYesterdayEntry(found);
      }
    }

    const fetchInspiration = async () => {
      setIsLoadingInspiration(true);
      const data = await getDailyInspiration();
      setInspiration(data);
      setIsLoadingInspiration(false);
    };

    fetchInspiration();
  }, []);

  useEffect(() => {
    localStorage.setItem('serenity_entries', JSON.stringify(entries));
  }, [entries]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveEntry = () => {
    if (!currentMood) return;

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood: currentMood,
      gratitude,
      notes,
      photo: photo || undefined,
    };

    setEntries([newEntry, ...entries]);
    resetForm();
  };

  const resetForm = () => {
    setCurrentMood(null);
    setGratitude('');
    setNotes('');
    setPhoto(null);
    setIsFormOpen(false);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    if (yesterdayEntry?.id === id) setYesterdayEntry(null);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted" && yesterdayEntry) {
      new Notification("Ricordo di Ieri", {
        body: `Ieri hai scritto: "${yesterdayEntry.gratitude}"`,
        icon: "/favicon.ico"
      });
    }
  };

  const moods = [
    { id: 'great', icon: Heart, label: 'Fantastico' },
    { id: 'good', icon: Smile, label: 'Bene' },
    { id: 'neutral', icon: Meh, label: 'Così così' },
    { id: 'bad', icon: Frown, label: 'Male' },
    { id: 'terrible', icon: CloudRain, label: 'Pessimo' },
  ];

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-12">
      <header className="text-center mb-12">
        <Avatar mood={currentMood || undefined} />
        <h1 className="text-4xl font-bold text-sage-800 mb-2">Serenity Diary</h1>
        <p className="text-sage-600 italic">Il tuo spazio di pace quotidiano</p>
      </header>

      <main className="space-y-8">
        {/* Yesterday's Memory Reminder */}
        <AnimatePresence>
          {yesterdayEntry && (
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sage-100/50 border border-sage-200 rounded-3xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sage-800">
                  <Calendar size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">Ricordo di Ieri</span>
                </div>
                <button 
                  onClick={requestNotificationPermission}
                  className="text-xs bg-white/50 hover:bg-white px-3 py-1 rounded-full text-sage-600 transition-colors flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  Attiva Reminder
                </button>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-sage-100">
                <p className="text-sage-600 text-xs uppercase font-bold mb-2">La tua cosa bella di ieri:</p>
                <p className="text-lg font-serif italic text-sage-800 leading-relaxed">
                  "{yesterdayEntry.gratitude}"
                </p>
                {yesterdayEntry.photo && (
                  <div className="mt-3 h-24 w-full rounded-xl overflow-hidden">
                    <img src={yesterdayEntry.photo} alt="Yesterday" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Inspiration Card */}
        <section>
          <AnimatePresence mode="wait">
            {isLoadingInspiration ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/50 border border-sage-100 rounded-3xl p-8 text-center animate-pulse"
              >
                <div className="h-4 bg-sage-100 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto"></div>
              </motion.div>
            ) : inspiration && (
              <motion.div 
                key="inspiration"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-sage-100 rounded-3xl p-8 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Quote size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-sage-600 mb-4">
                    <Sparkles size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Ispirazione del giorno</span>
                  </div>
                  <p className="text-xl font-serif italic mb-2 leading-relaxed">
                    "{inspiration.quote}"
                  </p>
                  <p className="text-sm text-sage-600 mb-6">— {inspiration.author}</p>
                  
                  <div className="bg-sage-50 rounded-2xl p-4 border-l-4 border-sage-600">
                    <p className="text-sm font-medium text-sage-800">
                      <span className="block text-xs uppercase tracking-tighter text-sage-600 mb-1">Riflessione:</span>
                      {inspiration.reflectionPrompt}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Action Button */}
        {!isFormOpen && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFormOpen(true)}
            className="w-full bg-sage-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Registra il tuo momento
          </motion.button>
        )}

        {/* Entry Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-sage-100 rounded-3xl p-8 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Come ti senti?</h2>
                  <button onClick={resetForm} className="text-sage-600 hover:text-sage-800">
                    <ChevronLeft size={24} />
                  </button>
                </div>

                <div className="flex justify-between gap-2">
                  {moods.map((m) => (
                    <MoodButton
                      key={m.id}
                      mood={m.id}
                      icon={m.icon}
                      label={m.label}
                      isSelected={currentMood === m.id}
                      onClick={() => setCurrentMood(m.id as DiaryEntry['mood'])}
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-sage-600 mb-2 uppercase tracking-wide">
                      Una cosa bella di oggi
                    </label>
                    <input
                      type="text"
                      value={gratitude}
                      onChange={(e) => setGratitude(e.target.value)}
                      placeholder="Cosa ti ha reso felice?"
                      className="w-full p-4 bg-sage-50 border-none rounded-2xl focus:ring-2 focus:ring-sage-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-sage-600 mb-2 uppercase tracking-wide">
                      Note e riflessioni
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Scrivi i tuoi pensieri..."
                      rows={4}
                      className="w-full p-4 bg-sage-50 border-none rounded-2xl focus:ring-2 focus:ring-sage-600 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-sage-600 mb-2 uppercase tracking-wide">
                      Una foto del momento
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 bg-sage-50 border-2 border-dashed border-sage-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-sage-100 transition-all overflow-hidden"
                    >
                      {photo ? (
                        <img src={photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <>
                          <Camera className="text-sage-400 mb-2" size={32} />
                          <span className="text-sm text-sage-400">Clicca per caricare</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>

                <button
                  disabled={!currentMood}
                  onClick={saveEntry}
                  className={`w-full py-4 rounded-2xl font-bold shadow-md transition-all ${
                    currentMood 
                      ? 'bg-sage-800 text-white hover:bg-black' 
                      : 'bg-sage-100 text-sage-400 cursor-not-allowed'
                  }`}
                >
                  Salva nel diario
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">I tuoi ricordi</h2>
            <div className="flex items-center gap-2 text-sage-600 text-sm">
              <Calendar size={16} />
              <span>{entries.length} voci</span>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {entries.map((entry) => {
                const MoodIcon = moods.find(m => m.id === entry.mood)?.icon || Meh;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white border border-sage-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sage-50 rounded-xl text-sage-600">
                          <MoodIcon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-sage-800">
                            {isToday(parseISO(entry.date)) ? 'Oggi' : format(parseISO(entry.date), 'EEEE d MMMM', { locale: it })}
                          </p>
                          <p className="text-xs text-sage-400">
                            {format(parseISO(entry.date), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteEntry(entry.id)}
                        className="text-sage-100 group-hover:text-red-300 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {entry.gratitude && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-sage-400 uppercase tracking-widest mb-1">Gratitudine</p>
                        <p className="text-sage-800 font-medium italic">"{entry.gratitude}"</p>
                      </div>
                    )}

                    {entry.notes && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-sage-400 uppercase tracking-widest mb-1">Riflessioni</p>
                        <p className="text-sage-600 text-sm leading-relaxed">{entry.notes}</p>
                      </div>
                    )}

                    {entry.photo && (
                      <div className="mt-4 rounded-2xl overflow-hidden h-48">
                        <img src={entry.photo} alt="Memory" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {entries.length === 0 && (
              <div className="text-center py-12 bg-sage-50/50 rounded-3xl border border-dashed border-sage-200">
                <p className="text-sage-400">Non hai ancora registrato nulla.</p>
                <p className="text-sage-400 text-sm">Inizia oggi il tuo viaggio verso la serenità.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-20 text-center text-sage-400 text-xs">
        <p>© {new Date().getFullYear()} Serenity Diary • Creato con cura</p>
      </footer>
    </div>
  );
}
