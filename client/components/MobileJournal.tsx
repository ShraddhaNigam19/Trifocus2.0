import { useState } from "react";
import { Plus, Search, BookOpen, Calendar, Clock, Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  emoji: string;
  date: string;
  time: string;
  tags: string[];
  color: string;
}

interface MobileJournalProps {
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  viewMode: 'list' | 'calendar';
  setViewMode: (mode: 'list' | 'calendar') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterTag: string;
  setFilterTag: (tag: string) => void;
  allTags: string[];
  setIsCreating: (creating: boolean) => void;
  editEntry: (entry: JournalEntry) => void;
  deleteEntry: (id: number) => void;
  getStreakDays: () => number;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  getEntriesForDate: (date: Date) => JournalEntry[];
  getDaysInMonth: (date: Date) => (Date | null)[];
  formatMonthYear: (date: Date) => string;
  navigateMonth: (direction: 'prev' | 'next') => void;
  setEditingId: (id: number | null) => void;
  setNewTitle: (title: string) => void;
  setCurrentTags: (tags: string[]) => void;
  setSelectedEmoji: (emoji: string) => void;
  setWordCount: (count: number) => void;
  setCurrentMood: (mood: string) => void;
  setWeatherToday: (weather: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

const MobileJournal = ({
  entries,
  filteredEntries,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  filterTag,
  setFilterTag,
  allTags,
  setIsCreating,
  editEntry,
  deleteEntry,
  getStreakDays,
  currentDate,
  selectedDate,
  setSelectedDate,
  getEntriesForDate,
  getDaysInMonth,
  formatMonthYear,
  navigateMonth,
  setEditingId,
  setNewTitle,
  setCurrentTags,
  setSelectedEmoji,
  setWordCount,
  setCurrentMood,
  setWeatherToday,
  editorRef
}: MobileJournalProps) => {
  return (
    <div className="block lg:hidden min-h-screen min-h-[100dvh] bg-gray-50">
      
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-4 pb-6" style={{paddingTop: 'max(60px, env(safe-area-inset-top) + 20px)'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-lg leading-tight">Journal</h1>
              <p className="text-pink-100 text-sm">Capture your thoughts</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsCreating(true);
              setEditingId(null);
              setNewTitle('');
              setCurrentTags([]);
              setSelectedEmoji('😊');
              if (editorRef.current) editorRef.current.innerHTML = '';
              setWordCount(0);
              setCurrentMood('');
              setWeatherToday('');
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Mobile Stats & View Toggle */}
      <div className="px-4 pb-6 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{getStreakDays()}</div>
              <div className="text-pink-100 text-sm">Day Streak 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{entries.length}</div>
              <div className="text-pink-100 text-sm">Total Entries</div>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/20 rounded-2xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-pink-600' : 'text-white'
            }`}
          >
            📝 List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'calendar' ? 'bg-white text-pink-600' : 'text-white'
            }`}
          >
            📅 Calendar
          </button>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="px-4 pt-6 pb-48 space-y-6">
        {/* Mobile Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search your entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mobile Filter Tags */}
        {allTags.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTag('')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterTag === '' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filterTag === tag ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Journal Content */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
                <p className="text-gray-500 mb-6 px-4">
                  {searchQuery || filterTag ? "No entries match your filter." : "Start writing your first journal entry."}
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Write First Entry
                </button>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${entry.color} rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                      {entry.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-2 leading-tight">{entry.title}</h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          <span className="whitespace-nowrap">{entry.date}</span>
                        </div>
                        <span className="mx-2 flex-shrink-0">•</span>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="whitespace-nowrap">{entry.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => editEntry(entry)}
                        className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3 line-clamp-3" dangerouslySetInnerHTML={{ __html: entry.content }} />

                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <span
                          key={`${entry.id}-${tag}-${index}`}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Mobile Calendar View */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {formatMonthYear(currentDate)}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((day, index) => {
                  if (!day) {
                    return <div key={index} className="p-2 h-16"></div>;
                  }

                  const dayEntries = getEntriesForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                  return (
                    <div
                      key={day.toDateString()}
                      className={`p-1 h-16 border border-gray-200 rounded-lg transition-colors relative ${
                        isToday
                          ? 'bg-purple-50 border-purple-300'
                          : isSelected
                          ? 'bg-purple-100 border-purple-400'
                          : dayEntries.length > 0
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedDate(day)}
                        className="w-full h-full text-left flex flex-col"
                      >
                        <div className={`text-xs font-medium mb-1 flex-shrink-0 ${
                          isToday ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {dayEntries.slice(0, 1).map(entry => (
                            <div
                              key={entry.id}
                              className="text-xs px-1 py-0.5 rounded bg-white/90 border border-gray-200 shadow-sm mb-1"
                              title={entry.title}
                            >
                              <div className="flex items-center space-x-1">
                                <span className="text-xs">{entry.emoji}</span>
                                <span className="truncate text-xs">
                                  {entry.title.length > 6 ? entry.title.substring(0, 6) + '...' : entry.title}
                                </span>
                              </div>
                            </div>
                          ))}
                          {dayEntries.length > 1 && (
                            <div className="text-xs text-gray-500 px-1">
                              +{dayEntries.length - 1}
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <button
                    onClick={() => {
                      setIsCreating(true);
                      setEditingId(null);
                      setNewTitle('');
                      setCurrentTags([]);
                      setSelectedEmoji('😊');
                      if (editorRef.current) editorRef.current.innerHTML = '';
                      setWordCount(0);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="w-3 h-3 mr-1 inline" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {getEntriesForDate(selectedDate).map(entry => (
                    <div key={entry.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 bg-gradient-to-r ${entry.color} rounded-lg flex items-center justify-center text-lg`}>
                            {entry.emoji}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">{entry.title}</h4>
                            <p className="text-xs text-gray-500">{entry.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => editEntry(entry)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: entry.content }} />
                    </div>
                  ))}
                  {getEntriesForDate(selectedDate).length === 0 && (
                    <div className="text-center py-6">
                      <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm mb-3">No entries for this date</p>
                      <button
                        onClick={() => {
                          setIsCreating(true);
                          setEditingId(null);
                          setNewTitle('');
                          setCurrentTags([]);
                          setSelectedEmoji('😊');
                          if (editorRef.current) editorRef.current.innerHTML = '';
                          setWordCount(0);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-medium"
                      >
                        <Plus className="w-3 h-3 mr-1 inline" />
                        Create Entry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default MobileJournal;
