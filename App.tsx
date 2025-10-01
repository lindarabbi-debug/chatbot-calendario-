import React, { useState, useEffect, useCallback, useRef, FC } from 'react';
import { CalendarEvent, ChatMessage, Settings, AIActionType, AIResponse } from './types';
import { processUserRequest, getDailySummary } from './services/geminiService';

// --- HELPER & UI COMPONENTS (defined outside App to prevent re-renders) ---

interface IconProps {
  name: 'mic' | 'mic-off' | 'send' | 'settings' | 'spinner' | 'calendar' | 'clock' | 'robot' | 'paperclip' | 'x';
  className?: string;
}
const Icon: FC<IconProps> = ({ name, className = 'w-6 h-6' }) => {
    const icons: { [key: string]: JSX.Element } = {
        'mic': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
        'mic-off': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16" x2="16" y1="13" y2="21"/><line x1="8" x2="8" y1="21" y2="13"/><line x1="12" x2="12" y1="17" y2="21"/><path d="M12 1a5 5 0 0 0-5 5v4"/><path d="m21 10-6 6"/><path d="m3 16 6-6"/><path d="M17 11a5 5 0 0 0-10 0v2a5 5 0 0 0 5 5Z"/></svg>,
        'send': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg>,
        'settings': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
        'spinner': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
        'calendar': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
        'clock': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        'robot': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="12" x="4" y="4" rx="2" /><path d="M12 16v4" /><path d="M8 16v4" /><path d="M16 16v4" /><path d="M12 12h.01" /><path d="M8 9h.01" /><path d="M16 9h.01" /></svg>,
        'paperclip': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
        'x': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    };
    return <div className={className}>{icons[name]}</div>;
};

const CalendarPanel: FC<{
    events: CalendarEvent[];
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}> = ({ events, settings, onSettingsChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    }

    const generateCalendarDays = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthLastDay - i);
            days.push({ date: d, isCurrentMonth: false, isToday: false, events: [] });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dateString = d.toISOString().split('T')[0];
            const dayEvents = events.filter(e => e.date === dateString);
            days.push({ 
                date: d, 
                isCurrentMonth: true, 
                isToday: d.getTime() === today.getTime(),
                events: dayEvents 
            });
        }
        
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            const d = new Date(year, month + 1, i);
             days.push({ date: d, isCurrentMonth: false, isToday: false, events: [] });
        }

        return days;
    }, [events]);
    
    const calendarDays = generateCalendarDays(currentDate);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const eventsForSelectedDay = events.filter(e => e.date === selectedDateString).sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'));

    return (
        <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Smart Calendar</h2>
            
            <div>
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">&lt;</button>
                    <h3 className="text-lg font-semibold text-slate-700 w-40 text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-500">
                    {weekdays.map(day => <div key={day} className="font-medium pb-2">{day}</div>)}
                    {calendarDays.map(({ date, isCurrentMonth, isToday, events: dayEvents }, index) => {
                        const isSelected = date.toISOString().split('T')[0] === selectedDateString;
                        return (
                            <div
                                key={index}
                                onClick={() => { setSelectedDate(date); if (!isCurrentMonth) setCurrentDate(date); }}
                                className="p-1 cursor-pointer flex flex-col items-center justify-start h-14 rounded-lg transition-colors hover:bg-slate-100"
                            >
                                <span
                                    className={`
                                        flex items-center justify-center w-8 h-8 rounded-full text-sm
                                        ${isCurrentMonth ? 'text-slate-800' : 'text-slate-400'}
                                        ${isToday ? 'bg-blue-600 text-white' : ''}
                                        ${isSelected ? 'ring-2 ring-blue-500' : ''}
                                    `}
                                >
                                    {date.getDate()}
                                </span>
                                <div className="flex gap-0.5 mt-1 h-1">
                                    {dayEvents.slice(0, 3).map((event, i) => (
                                        <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <button onClick={goToToday} className="w-full text-center text-sm mt-3 text-blue-600 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">Go to Today</button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 mt-4 border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">
                    Events for {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {eventsForSelectedDay.length > 0 ? (
                    <ul className="space-y-3">
                        {eventsForSelectedDay.map(event => (
                            <li key={event.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-3">
                                {event.imageBase64 && (
                                    <img src={event.imageBase64} alt={event.title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                )}
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-800">{event.title}</p>
                                    {event.time && (
                                        <div className="flex items-center text-sm text-slate-500 mt-1">
                                            <span className="flex items-center gap-1.5"><Icon name="clock" className="w-4 h-4" /> {event.time}</span>
                                        </div>
                                    )}
                                    {event.description && <p className="text-xs text-slate-600 mt-2">{event.description}</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 text-sm p-4 text-center bg-slate-50 rounded-lg">No events scheduled.</p>
                )}
            </div>
            
            <div className="mt-auto border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2"><Icon name="settings" className="w-5 h-5" /> Settings</h3>
                <div className="space-y-3 text-sm">
                    <div>
                        <label htmlFor="triggerWord" className="block font-medium text-slate-600 mb-1">Voice Trigger Word</label>
                        <input
                            type="text"
                            id="triggerWord"
                            value={settings.triggerWord}
                            onChange={e => onSettingsChange({ triggerWord: e.target.value.toLowerCase() })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="summaryTime" className="block font-medium text-slate-600 mb-1">Daily Summary Time</label>
                        <input
                            type="time"
                            id="summaryTime"
                            value={settings.summaryTime}
                            onChange={e => onSettingsChange({ summaryTime: e.target.value })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                     <div className="flex items-center justify-between pt-1">
                        <label htmlFor="summaryEnabled" className="font-medium text-slate-600">Enable Daily Summary</label>
                        <button
                            id="summaryEnabled"
                            onClick={() => onSettingsChange({ summaryEnabled: !settings.summaryEnabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${settings.summaryEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.summaryEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChatPanel: FC<{
    messages: ChatMessage[];
    onSendMessage: (text: string, imageBase64?: string | null) => void;
    isLoading: boolean;
    isListening: boolean;
    onToggleListening: () => void;
    voiceStatus: string;
    settings: Settings;
}> = ({ messages, onSendMessage, isLoading, isListening, onToggleListening, voiceStatus, settings }) => {
    const [inputValue, setInputValue] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((inputValue.trim() || imagePreview) && !isLoading) {
            onSendMessage(inputValue.trim(), imagePreview);
            setInputValue('');
            setImagePreview(null);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg h-full flex flex-col">
            <div ref={chatWindowRef} className="flex-grow p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender !== 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0"><Icon name={msg.sender === 'ai' ? 'robot' : 'settings'} className="w-5 h-5"/></div>}
                        <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl text-sm ${
                            msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' :
                            msg.sender === 'ai' ? 'bg-slate-200 text-slate-800 rounded-bl-none' :
                            'bg-yellow-100 text-yellow-800 rounded-bl-none text-center w-full'
                        }`}>
                           <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0"><Icon name='robot' className="w-5 h-5"/></div>
                        <div className="bg-slate-200 text-slate-800 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                        </div>
                     </div>
                )}
            </div>
            <div className="p-4 border-t border-slate-200">
                {imagePreview && (
                    <div className="relative w-20 h-20 mb-2 p-1 border rounded-md bg-slate-100">
                        <img src={imagePreview} alt="Image preview" className="w-full h-full object-cover rounded" />
                        <button
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-2 -right-2 bg-slate-700 text-white rounded-full p-0.5 hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-500"
                            title="Remove image"
                        >
                            <Icon name="x" className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Attach image"
                    >
                       <Icon name="paperclip" className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask me to add an event..."
                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                     <button
                        type="button"
                        onClick={onToggleListening}
                        className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isListening ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        title={isListening ? 'Stop listening' : `Start listening (Trigger: "${settings.triggerWord}")`}
                    >
                       <Icon name={isListening ? 'mic' : 'mic-off'} className="w-5 h-5" />
                    </button>
                    <button type="submit" disabled={isLoading || (!inputValue.trim() && !imagePreview)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {isLoading ? <Icon name="spinner" className="w-5 h-5" /> : <Icon name="send" className="w-5 h-5" />}
                    </button>
                </form>
                 <p className="text-xs text-slate-500 mt-2 text-center h-4">{voiceStatus}</p>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App() {
    const [settings, setSettings] = useState<Settings>({
        triggerWord: 'hey assistant',
        summaryTime: '08:00',
        summaryEnabled: true,
    });
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
      {id: '1', title: 'Team Stand-up', date: new Date().toISOString().split('T')[0], time: '09:00', description: 'Daily sync'},
      {id: '2', title: 'Design Review', date: new Date().toISOString().split('T')[0], time: '14:30', description: 'Review new mockups'},
    ]);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'init', text: `Hello! I'm your smart calendar assistant. You can ask me to add, find, or summarize events. Try saying "${settings.triggerWord}, add an event for tomorrow at 10am called project kickoff".`, sender: 'ai' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('Click the mic to enable voice commands.');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const addMessage = (text: string, sender: 'user' | 'ai' | 'system') => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text, sender }]);
    };

    const handleSendMessage = useCallback(async (text: string, imageBase64: string | null = null) => {
        if (text) addMessage(text, 'user');
        setIsLoading(true);

        // Fix: Changed `imageB64` to `imageBase64` to match the parameter name.
        const aiResponse = await processUserRequest(text, calendarEvents, imageBase64);
        
        switch (aiResponse.action) {
            case AIActionType.CREATE_EVENT:
                if (aiResponse.eventDetails) {
                    const newEvent: CalendarEvent = {
                        id: Date.now().toString(),
                        title: aiResponse.eventDetails.title,
                        date: aiResponse.eventDetails.date,
                        time: aiResponse.eventDetails.time,
                        description: aiResponse.eventDetails.description || '',
                        imageBase64: imageBase64, // Persist image with the event
                    };
                    setCalendarEvents(prev => [...prev, newEvent]);
                    const timeText = newEvent.time ? ` at ${newEvent.time}`: '';
                    addMessage(`OK, I've added "${newEvent.title}" to your calendar for ${newEvent.date}${timeText}.`, 'ai');
                }
                break;
            case AIActionType.READ_EVENTS:
                const date = aiResponse.queryDate || new Date().toISOString().split('T')[0];
                const foundEvents = calendarEvents.filter(e => e.date === date);
                if (foundEvents.length > 0) {
                     addMessage(`Here are your events for ${date}:\n${foundEvents.map(e => `- ${e.time || 'All-day'}: ${e.title}`).join('\n')}`, 'ai');
                } else {
                     addMessage(`You have no events scheduled for ${date}.`, 'ai');
                }
                break;
            case AIActionType.SUMMARIZE_DAY:
                addMessage(aiResponse.summary || "I couldn't generate a summary.", 'ai');
                break;
            case AIActionType.OPEN_APP:
                if (aiResponse.appName) {
                    addMessage(`Attempting to open ${aiResponse.appName}...`, 'system');
                    window.location.href = `${aiResponse.appName}://`;
                }
                break;
            default:
                 addMessage(aiResponse.responseText || "I'm not sure how to help with that. Can you rephrase?", 'ai');
        }

        setIsLoading(false);
    }, [calendarEvents]);

    const handleSettingsChange = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };
    
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceStatus('Voice recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            if (transcript.startsWith(settings.triggerWord)) {
                const command = transcript.substring(settings.triggerWord.length).trim();
                if (command) {
                    setVoiceStatus(`Command received: "${command}"`);
                    handleSendMessage(command);
                }
            }
        };
        
        recognition.onstart = () => {
            setIsListening(true);
            setVoiceStatus(`Listening... Say "${settings.triggerWord}" followed by your command.`);
        };
        
        recognition.onend = () => {
            setIsListening(false);
            setVoiceStatus('Click the mic to re-enable voice commands.');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setVoiceStatus(`Error: ${event.error}. Please try again.`);
        };
        
    }, [settings.triggerWord, handleSendMessage]);
    
    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Could not start recognition:", e)
            }
        }
    };

    useEffect(() => {
        if (!settings.summaryEnabled) return;
        
        const checkTime = () => {
            const now = new Date();
            const [hour, minute] = settings.summaryTime.split(':').map(Number);
            
            if(now.getHours() === hour && now.getMinutes() === minute) {
                 const today = new Date().toISOString().split('T')[0];
                 getDailySummary(calendarEvents, today).then(summary => {
                    addMessage(summary, 'system');
                 });
            }
        };

        const intervalId = setInterval(checkTime, 60 * 1000);
        return () => clearInterval(intervalId);

    }, [settings.summaryEnabled, settings.summaryTime, calendarEvents]);

    return (
        <main className="h-full bg-slate-100 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="lg:w-1/3 h-auto lg:h-full lg:max-w-md">
                <CalendarPanel events={calendarEvents} settings={settings} onSettingsChange={handleSettingsChange} />
            </div>
            <div className="lg:w-2/3 h-full">
                <ChatPanel 
                    messages={messages} 
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    isListening={isListening}
                    onToggleListening={toggleListening}
                    voiceStatus={voiceStatus}
                    settings={settings}
                />
            </div>
        </main>
    );
}