"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  userId: number | null;
  cgmData: { timestamp: string; reading: number }[];
  moodData: { timestamp: string; mood: string; score: number }[];
  foodData: { timestamp: string; meal: string }[];
  profile: { name: string; city: string; dietary_preference: string; medical_conditions: string } | null;
  mealPlan: string | null;
  onDataUpdate?: () => void;
  onSendMessage?: (message: string) => void;
}

export default function Dashboard({ userId, cgmData, moodData, foodData, profile, mealPlan, onSendMessage }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [foodLog, setFoodLog] = useState('');
  const [cgmReading, setCgmReading] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showFoodSuccess, setShowFoodSuccess] = useState(false);
  const [showCgmSuccess, setShowCgmSuccess] = useState(false);
  const [showMoodSuccess, setShowMoodSuccess] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<string | null>(mealPlan);

  // Update local meal plan state when prop changes
  useEffect(() => {
    setCurrentMealPlan(mealPlan);
  }, [mealPlan]);

  // Use real data if available, otherwise show empty state
  const displayCgmData = cgmData.length > 0 ? cgmData : [];
  const displayMoodData = moodData.length > 0 ? moodData : [];
  
  // Check for high glucose alerts
  const latestGlucose = displayCgmData[displayCgmData.length - 1]?.reading;
  const hasHighGlucose = latestGlucose && latestGlucose > 300;
  const hasLowGlucose = latestGlucose && latestGlucose < 80;

  // Get current mood and last meal from real data
  const currentMood = displayMoodData[displayMoodData.length - 1]?.mood || 'No mood logged yet';
  const lastMealEntry = foodData[foodData.length - 1];
  const lastMeal = lastMealEntry ? 
    `${lastMealEntry.meal} at ${new Date(lastMealEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
    'No meals logged yet';

  // Daily health tip
  const dailyTips = [
    "Stay hydrated — drink at least 2L water today",
    "Take a 10-minute walk after meals 🚶‍♀️",
    "Get 7-8 hours of sleep tonight ",
    "Include fiber-rich foods in your diet ",
    "Practice deep breathing for 5 minutes 🧘‍♀️"
  ];
  const [dailyTip] = useState(dailyTips[Math.floor(Math.random() * dailyTips.length)]);

  const handleFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (foodLog.trim() && userId) {
      if (onSendMessage) {
        onSendMessage(`I ate ${foodLog}`);
      }
      setFoodLog('');
      setShowFoodSuccess(true);
      setTimeout(() => setShowFoodSuccess(false), 3000);
    }
  };

  const handleCgmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cgmReading.trim() && userId) {
      if (onSendMessage) {
        onSendMessage(`My glucose reading is ${cgmReading}`);
      }
      setCgmReading('');
      setShowCgmSuccess(true);
      setTimeout(() => setShowCgmSuccess(false), 3000);
    }
  };

  const handleMoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMood && userId) {
      if (onSendMessage) {
        onSendMessage(`I am feeling ${selectedMood.toLowerCase()}`);
      }
      setSelectedMood('');
      setShowMoodSuccess(true);
      setTimeout(() => setShowMoodSuccess(false), 3000);
    }
  };

  const handleMealPlanGenerate = () => {
    console.log('Meal plan button clicked', { userId, profile });
    if (userId && profile) {
      try {
        // Generate a meal plan directly in the dashboard
        const mealPlan = generateMealPlan(profile);
        console.log('Generated meal plan:', mealPlan);
        setCurrentMealPlan(mealPlan);
      } catch (error) {
        console.error('Error generating meal plan:', error);
        alert('Error generating meal plan. Please try again.');
      }
    } else {
      console.log('Missing userId or profile:', { userId, profile });
      alert('Please enter your User ID first to generate a meal plan.');
    }
  };

  // Function to generate meal plan based on user profile
  const generateMealPlan = (profile: any) => {
    console.log('Generating meal plan for profile:', profile);
    const dietaryPreference = profile.dietary_preference?.toLowerCase() || 'non-vegetarian';
    const medicalConditions = profile.medical_conditions || 'None';
    const userName = profile.name?.split(' ')[0] || 'User';
    
    console.log('Meal plan parameters:', { dietaryPreference, medicalConditions, userName });
    
    let mealPlan = `🍽️ PERSONALIZED MEAL PLAN for ${userName}\n\n`;
    mealPlan += `📊 Health Status: Balanced nutrition plan\n`;
    mealPlan += `🥗 Diet: ${dietaryPreference}\n`;
    mealPlan += `🩺 Conditions: ${medicalConditions}\n\n`;
    
    if (dietaryPreference === 'vegetarian') {
      mealPlan += "🌅 BREAKFAST (7-8 AM):\n";
      mealPlan += "• Oats with almond milk + berries + nuts\n";
      mealPlan += "• Carbs: 35g | Protein: 12g | Fat: 8g\n\n";
      
      mealPlan += "🌞 LUNCH (12-1 PM):\n";
      mealPlan += "• Brown rice + dal + mixed vegetables + yogurt\n";
      mealPlan += "• Carbs: 45g | Protein: 18g | Fat: 6g\n\n";
      
      mealPlan += "🌙 DINNER (7-8 PM):\n";
      mealPlan += "• Ragi dosa + sambar + coconut chutney\n";
      mealPlan += "• Carbs: 30g | Protein: 15g | Fat: 10g\n\n";
      
    } else if (dietaryPreference === 'vegan') {
      mealPlan += "🌅 BREAKFAST (7-8 AM):\n";
      mealPlan += "• Quinoa porridge with coconut milk + fruits\n";
      mealPlan += "• Carbs: 40g | Protein: 10g | Fat: 12g\n\n";
      
      mealPlan += "🌞 LUNCH (12-1 PM):\n";
      mealPlan += "• Buddha bowl with chickpeas + quinoa + vegetables\n";
      mealPlan += "• Carbs: 50g | Protein: 20g | Fat: 8g\n\n";
      
      mealPlan += "🌙 DINNER (7-8 PM):\n";
      mealPlan += "• Lentil curry + brown rice + steamed vegetables\n";
      mealPlan += "• Carbs: 35g | Protein: 18g | Fat: 6g\n\n";
      
    } else { // non-vegetarian
      mealPlan += "🌅 BREAKFAST (7-8 AM):\n";
      mealPlan += "• Scrambled eggs + whole grain toast + avocado\n";
      mealPlan += "• Carbs: 25g | Protein: 20g | Fat: 15g\n\n";
      
      mealPlan += "🌞 LUNCH (12-1 PM):\n";
      mealPlan += "• Grilled chicken + quinoa + roasted vegetables\n";
      mealPlan += "• Carbs: 30g | Protein: 35g | Fat: 12g\n\n";
      
      mealPlan += "🌙 DINNER (7-8 PM):\n";
      mealPlan += "• Baked fish + sweet potato + green salad\n";
      mealPlan += "• Carbs: 25g | Protein: 30g | Fat: 10g\n\n";
    }
    
    mealPlan += "🍎 SNACK SUGGESTIONS:\n";
    mealPlan += "• Nuts and seeds (10-15 pieces)\n";
    mealPlan += "• Greek yogurt with berries\n";
    mealPlan += "• Vegetable sticks with hummus\n\n";
    
    mealPlan += "⏰ TIMING RECOMMENDATIONS:\n";
    mealPlan += "• Eat every 3-4 hours\n";
    mealPlan += "• Don't skip meals\n";
    mealPlan += "• Finish dinner 2-3 hours before bedtime";
    
    return mealPlan;
  };

  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,CGM Reading,Mood,Score\n" +
      displayCgmData.map((item, index) => 
        `${item.timestamp},${item.reading},${displayMoodData[index]?.mood || 'N/A'},${displayMoodData[index]?.score || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `health_data_${userId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!userId || !profile) {
    return (
      <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Your Health Dashboard</h2>
        <p className="text-lg text-gray-600">
          Please enter your User ID in the chat to access your personalized healthcare dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Overview of your health data, charts, and quick actions' },
          { id: 'history', label: 'History', icon: '📋', description: 'View your past CGM readings, mood logs, and meal history' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title={tab.description}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* A. Summary Section (Top) */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Hello, {profile.name.split(' ')[0]} 👋</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Profile Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">👤</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{profile.name}</h3>
                    <p className="text-sm text-gray-600">{profile.city}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="flex items-center mb-1">
                    <span className="mr-2">🍽️</span>
                    <span className="text-gray-700">{profile.dietary_preference || 'Not specified'}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">🩺</span>
                    <span className="text-gray-700">{profile.medical_conditions || 'No conditions'}</span>
                  </p>
                </div>
              </div>

              {/* Current Mood */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">😊</span>
                  <h3 className="font-semibold text-gray-800">Current Mood</h3>
                </div>
                <p className="text-lg text-green-700">{currentMood}</p>
              </div>

              {/* Last CGM Reading */}
              <div className={`border rounded-lg p-4 ${
                hasHighGlucose ? 'bg-red-50 border-red-200' : 
                hasLowGlucose ? 'bg-yellow-50 border-yellow-200' : 
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">📈</span>
                  <h3 className="font-semibold text-gray-800">Last CGM</h3>
                </div>
                <p className={`text-lg ${
                  hasHighGlucose ? 'text-red-700' : 
                  hasLowGlucose ? 'text-yellow-700' : 
                  'text-green-700'
                }`}>
                  {latestGlucose} mg/dL
                </p>
                <p className="text-sm text-gray-600">
                  {hasHighGlucose ? '🚨 High' : hasLowGlucose ? '⚠️ Low' : '✅ Normal'}
                </p>
              </div>

              {/* Last Meal */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🍽️</span>
                  <h3 className="font-semibold text-gray-800">Last Meal</h3>
                </div>
                <p className="text-sm text-gray-700">{lastMeal}</p>
              </div>
            </div>
          </div>

          {/* B. Charts Section (Middle) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* CGM Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Your Glucose Levels Over the Last 7 Days
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={displayCgmData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reading" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Mood Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Mood Pattern This Week
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={displayMoodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* C. Input & Recommendations Section (Bottom) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Input Forms */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              
              {/* Food Log */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">🍴 Log Food Intake</h4>
                {showFoodSuccess && (
                  <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                    ✅ Meal logged successfully! (45g carbs, 8g protein, 6g fat)
                  </div>
                )}
                <form onSubmit={handleFoodSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={foodLog}
                    onChange={(e) => setFoodLog(e.target.value)}
                    placeholder="What did you eat?"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Log
                  </button>
                </form>
              </div>

              {/* CGM Reading */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">📈 Add CGM Reading</h4>
                {showCgmSuccess && (
                  <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                    ✅ Reading recorded.
                  </div>
                )}
                <form onSubmit={handleCgmSubmit} className="flex gap-2">
                  <input
                    type="number"
                    value={cgmReading}
                    onChange={(e) => setCgmReading(e.target.value)}
                    placeholder="Enter glucose value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Mood Log */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">😊 Log Mood</h4>
                {showMoodSuccess && (
                  <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                    ✅ Mood recorded.
                  </div>
                )}
                <form onSubmit={handleMoodSubmit} className="flex gap-2">
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select mood</option>
                    <option value="Happy">😊 Happy</option>
                    <option value="Sad">😔 Sad</option>
                    <option value="Tired">😴 Tired</option>
                    <option value="Excited">🤩 Excited</option>
                    <option value="Stressed">😰 Stressed</option>
                    <option value="Calm">😌 Calm</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Log
                  </button>
                </form>
              </div>

              {/* Meal Plan Button */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🍲 Generate Meal Plan</h4>
                <button
                  onClick={handleMealPlanGenerate}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Generate Personalized Meal Plan
                </button>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🍲 Recommended Meals</h3>
              
              {currentMealPlan ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2 text-sm">Your Personalized Meal Plan:</h4>
                    <div className="text-green-700 text-sm whitespace-pre-line">{currentMealPlan}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-600 text-sm py-8">
                  <div className="text-4xl mb-2">🍽️</div>
                  <p>Click "Generate Personalized Meal Plan" to get your custom meal recommendations based on your profile.</p>
                </div>
              )}

              {/* Daily Tips */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 Daily Health Tip</h4>
                <p className="text-blue-700 text-sm">{dailyTip}</p>
              </div>

              {/* Download CSV */}
              <div className="mt-4">
                <button
                  onClick={downloadCSV}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  📥 Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Health History</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recent CGM Readings</h4>
              <div className="space-y-2">
                {displayCgmData.slice(-5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.timestamp}</span>
                    <span className="text-sm font-medium">{item.reading} mg/dL</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recent Mood Logs</h4>
              <div className="space-y-2">
                {displayMoodData.slice(-5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.timestamp}</span>
                    <span className="text-sm font-medium">{item.mood} ({item.score}/10)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}