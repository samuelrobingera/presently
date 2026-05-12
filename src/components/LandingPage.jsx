import React from 'react';
import { Clock, Users, Zap, Shield, Smartphone, Globe, ArrowRight } from 'lucide-react';

const LandingPage = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold tracking-tight">Presently</span>
            </div>
            <button 
              onClick={onLaunch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-all transform hover:scale-105 active:scale-95 shadow-md"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Perfectly timed <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Presentations.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Professional presentation timing for speakers. 
            Multi-phase management, real-time synchronization, and haptic alerts to keep you on track.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={onLaunch}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              Start Timing Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <a 
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything speakers need</h2>
            <p className="mt-4 text-lg text-gray-600">Built for precision, reliability, and ease of use.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              title="Multi-Phase Timing"
              description="Automatically transitions through Preparation, Presentation, and Q&A phases with custom durations."
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6 text-blue-500" />}
              title="Real-Time Sync"
              description="Synchronize your timer across multiple devices instantly using Firebase Realtime Database."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-purple-500" />}
              title="Room Management"
              description="Keep track of conference room availability and session occupancy in real-time."
            />
            <FeatureCard 
              icon={<Smartphone className="w-6 h-6 text-green-500" />}
              title="Haptic Feedback"
              description="Discreet vibration alerts at critical thresholds (5, 2, and 1 minute remaining)."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-red-500" />}
              title="Secure Auth"
              description="Sign in securely with Google or Facebook to save your personalized settings."
            />
            <FeatureCard 
              icon={<Clock className="w-6 h-6 text-indigo-500" />}
              title="PWA Ready"
              description="Install Presently on your home screen for a full-screen, app-like experience."
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Call to Action */}
      <section className="py-24 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready for your best presentation yet?</h2>
          <p className="text-xl text-blue-100 mb-12">
            Join other speakers using Presently to stay on track and focus on their message.
          </p>
          <button 
            onClick={onLaunch}
            className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-xl text-xl font-bold transition-all shadow-xl"
          >
            Launch Presently Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Clock className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-lg font-bold text-gray-900">Presently</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2024 Presently. Professional presentation timing.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
    <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
