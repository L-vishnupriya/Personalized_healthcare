"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

const Dashboard = dynamic(() => import('../components/Dashboard'), { ssr: false });

interface AgentResponse {
  response: string;
  status: string;
  data?: any;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'success' | 'error' | 'normal';
}

export default function HomePage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{ 
    name: string; 
    city: string; 
    dietary_preference: string; 
    medical_conditions: string 
  } | null>(null);
  const [realCgmData, setRealCgmData] = useState<{ timestamp: string; reading: number }[]>([]);
  const [realMoodData, setRealMoodData] = useState<{ timestamp: string; mood: string; score: number }[]>([]);
  const [realFoodData, setRealFoodData] = useState<{ timestamp: string; meal: string }[]>([]);
  const [currentMealPlan, setCurrentMealPlan] = useState<string | null>(null);

  // Function to fetch user's real data
  const fetchUserData = async (userId: number) => {
    try {
      // Fetch user logs from backend
      const response = await axios.get(`${process.env.NEXT_PUBLIC_AGENT_URL}/users/${userId}/logs`);
      const logs = response.data;
      
      // Separate CGM, mood, and food data
      const cgmLogs = logs.filter((log: any) => log.log_type === 'cgm');
      const moodLogs = logs.filter((log: any) => log.log_type === 'mood');
      const foodLogs = logs.filter((log: any) => log.log_type === 'food');
      
      // Convert to chart format
      const cgmData = cgmLogs.map((log: any) => ({
        timestamp: log.timestamp.split('T')[0],
        reading: parseInt(log.value)
      }));
      
      const moodData = moodLogs.map((log: any) => ({
        timestamp: log.timestamp.split('T')[0],
        mood: log.value,
        score: getMoodScore(log.value)
      }));
      
      const foodData = foodLogs.map((log: any) => ({
        timestamp: log.timestamp,
        meal: log.value
      }));
      
      setRealCgmData(cgmData);
      setRealMoodData(moodData);
      setRealFoodData(foodData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Helper function to convert mood to score
  const getMoodScore = (mood: string): number => {
    const moodScores: { [key: string]: number } = {
      'happy': 8, 'excited': 9, 'energetic': 8, 'content': 7,
      'calm': 6, 'tired': 4, 'sad': 2, 'anxious': 3, 'stressed': 3
    };
    return moodScores[mood.toLowerCase()] || 5;
  };

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || message;
    if (!messageToSend.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: 'user',
      timestamp: new Date(),
      type: 'normal'
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    const currentMessage = messageToSend;
    if (!customMessage) {
      setMessage('');
    }
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_AGENT_URL}/ag-ui-agent`, {
        message: currentMessage,
        user_id: currentUserId || null, // Always send user_id, even if null
        session_id: 'demo-session'
      });
      
      // Extract clean response content from RunResponse object
      let cleanResponseText = '';
      
      if (typeof response.data.response === 'string') {
        cleanResponseText = response.data.response;
      } else if (response.data.response && response.data.response.content) {
        cleanResponseText = response.data.response.content;
      } else if (response.data.response) {
        cleanResponseText = String(response.data.response);
      } else {
        cleanResponseText = 'No response content';
      }
      
      // Add agent response to chat
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: cleanResponseText,
        sender: 'agent',
        timestamp: new Date(),
        type: response.data.status === 'error' ? 'error' : 'success'
      };
      setChatMessages(prev => [...prev, agentMessage]);

      // If user ID is available, fetch updated data for dashboard
      if (currentUserId) {
        fetchUserData(currentUserId);
      }

      // Check if this is a meal plan request and update dashboard
      const isMealPlanRequest = currentMessage.toLowerCase().includes('meal plan') || 
                               currentMessage.toLowerCase().includes('generate meal') ||
                               currentMessage.toLowerCase().includes('what should i eat') ||
                               currentMessage.toLowerCase().includes('meal recommendation');
      
      const isMealPlanResponse = (cleanResponseText.toLowerCase().includes('personalized meal plan') ||
                                cleanResponseText.toLowerCase().includes('breakfast') ||
                                cleanResponseText.toLowerCase().includes('lunch') ||
                                cleanResponseText.toLowerCase().includes('dinner') ||
                                cleanResponseText.toLowerCase().includes('🍳') ||
                                cleanResponseText.toLowerCase().includes('🍚') ||
                                cleanResponseText.toLowerCase().includes('🥗')) &&
                                !cleanResponseText.toLowerCase().includes('hello') &&
                                !cleanResponseText.toLowerCase().includes('nice to meet you');
      
      if (isMealPlanRequest || isMealPlanResponse) {
        setCurrentMealPlan(cleanResponseText);
      }
      
      // Extract user ID if mentioned
      if (currentMessage.toLowerCase().includes('my id is') || currentMessage.toLowerCase().includes('user id') || currentMessage.toLowerCase().includes('id ')) {
        const idMatch = currentMessage.match(/\d+/);
        if (idMatch) {
          const userId = parseInt(idMatch[0]);
          setCurrentUserId(userId);
          
          // Fetch user profile
          try {
            const profileResponse = await axios.get(`${process.env.NEXT_PUBLIC_AGENT_URL}/users/${userId}`);
            const profile = profileResponse.data;
            setUserProfile({
              name: `${profile.first_name} ${profile.last_name}`,
              city: profile.city,
              dietary_preference: profile.dietary_preference,
              medical_conditions: profile.medical_conditions
            });
            
            // Fetch user's historical data
            fetchUserData(userId);
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Error: Could not connect to the healthcare agent. Please check your connection and try again.',
        sender: 'agent',
        timestamp: new Date(),
        type: 'error'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
              <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Personalized Healthcare 🩺
                </h1>
              </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* 1. Main Dashboard/Welcome Area */}
        <div className="flex-1 overflow-auto p-8">
                  <h1 className="text-4xl font-bold text-gray-800 mb-6">
                    Personalized Healthcare 🩺
                  </h1>
          
                  <Dashboard 
                    userId={currentUserId}
                    cgmData={realCgmData}
                    moodData={realMoodData}
                    foodData={realFoodData}
                    profile={userProfile}
                    mealPlan={currentMealPlan}
                    onSendMessage={(message) => {
                      sendMessage(message);
                    }}
                    onDataUpdate={() => {
                      if (currentUserId) {
                        fetchUserData(currentUserId);
                      }
                    }}
                  />
          
        </div>

        {/* 2. WhatsApp-Style Chat Interface - Desktop */}
        <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-green-600 text-white">
            <h2 className="text-lg font-semibold">🩺 Health Assistant</h2>
            <p className="text-sm text-green-100">
              {userProfile ? `Chatting with ${userProfile.name}` : "Start by entering your User ID"}
            </p>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-sm">Hello! I'm your Healthcare Coordinator.</p>
                <p className="text-xs mt-1">Try: "My ID is 42"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-green-500 text-white rounded-br-sm'
                          : msg.type === 'error'
                          ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 border border-gray-200 rounded-lg rounded-bl-sm shadow-sm px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !message.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Dashboard */}
        <div className="p-4 pb-24">
          <Dashboard 
            userId={currentUserId}
            cgmData={realCgmData}
            moodData={realMoodData}
            foodData={realFoodData}
            profile={userProfile}
            mealPlan={currentMealPlan}
            onSendMessage={(message) => {
              sendMessage(message);
            }}
            onDataUpdate={() => {
              if (currentUserId) {
                fetchUserData(currentUserId);
              }
            }}
          />
        </div>

        {/* Mobile Chat Interface - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !message.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Try: "My ID is 42" or "I'm feeling tired"
          </p>
        </div>
      </div>
    </main>
  );
}