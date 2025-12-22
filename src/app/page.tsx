'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useTranslation } from '@/lib/i18n-context';
import { useState, useEffect } from 'react';

export default function Home() {
  const { data: session, isPending: loading } = authClient.useSession();
  const isAuthenticated = !!session;
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-100/40 to-cyan-100/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-teal-100/30 to-blue-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-white/50 to-transparent rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-blue-100/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                <Image
                  src="/LOGO-SOUSS-MASSA-1033x308px-removebg-preview.png"
                  alt="Société Régionale Multiservices SOUSS MASSA"
                  width={150}
                  height={45}
                  className="h-12 w-auto relative z-10 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-2.5 rounded-full shadow-lg shadow-blue-300/50 transition-all duration-300 hover:scale-105 hover:shadow-blue-400/60 group">
                    <span className="relative z-10">{t('landing.hero.accessDashboard')}</span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/sign-in">
                    <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all duration-300 rounded-full px-6">
                      {t('landing.hero.signIn')}
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-2.5 rounded-full shadow-lg shadow-blue-300/50 transition-all duration-300 hover:scale-105 hover:shadow-blue-400/60 group">
                      <span className="relative z-10">{t('landing.hero.createAccount')}</span>
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-20 relative z-10">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-full px-6 py-3 mb-10 shadow-lg shadow-blue-100/50 group hover:border-blue-300 hover:shadow-blue-200/60 transition-all duration-300">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping absolute"></div>
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
              </div>
              <span className="text-blue-700 text-sm font-semibold tracking-wide">{t('landing.hero.welcome')}</span>
              <svg className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
              <span className="block text-gray-900 mb-2 animate-fade-in">
                {t('landing.hero.title')}
              </span>
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                {t('landing.hero.subtitle')}
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              {t('landing.hero.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg px-12 py-7 rounded-full shadow-2xl shadow-blue-300/50 transition-all duration-300 hover:scale-110 hover:shadow-blue-400/70">
                    <span className="relative z-10 flex items-center gap-3">
                      {t('landing.hero.accessDashboard')}
                      <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg px-12 py-7 rounded-full shadow-2xl shadow-blue-300/50 transition-all duration-300 hover:scale-110 hover:shadow-blue-400/70">
                      <span className="relative z-10 flex items-center gap-3">
                        {t('landing.hero.createAccount')}
                        <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Button>
                  </Link>
                  <Link href="/auth/sign-in">
                    <Button size="lg" variant="outline" className="text-lg px-12 py-7 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 font-bold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 bg-white/50 shadow-lg shadow-blue-100/50">
                      {t('landing.hero.signIn')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mt-32">
            {/* Feature 1 - Interventions */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-30 group-hover:opacity-50"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border-2 border-blue-200 rounded-3xl p-10 hover:border-blue-300 transition-all duration-500 hover:-translate-y-2 shadow-xl shadow-blue-100/50 hover:shadow-2xl hover:shadow-blue-200/60">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                  {t('landing.features.interventions.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {t('landing.features.interventions.description')}
                </p>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-3xl"></div>
              </div>
            </div>

            {/* Feature 2 - Reclamations */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-orange-200 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-30 group-hover:opacity-50"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border-2 border-amber-200 rounded-3xl p-10 hover:border-amber-300 transition-all duration-500 hover:-translate-y-2 shadow-xl shadow-amber-100/50 hover:shadow-2xl hover:shadow-amber-200/60">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-amber-700 transition-colors duration-300">
                  {t('landing.features.reclamations.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {t('landing.features.reclamations.description')}
                </p>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-3xl"></div>
              </div>
            </div>

            {/* Feature 3 - Reports */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-30 group-hover:opacity-50"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border-2 border-emerald-200 rounded-3xl p-10 hover:border-emerald-300 transition-all duration-500 hover:-translate-y-2 shadow-xl shadow-emerald-100/50 hover:shadow-2xl hover:shadow-emerald-200/60">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors duration-300">
                  {t('landing.features.reports.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {t('landing.features.reports.description')}
                </p>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 backdrop-blur-xl bg-white/50 py-16 mt-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <span className="text-white font-black text-2xl">H</span>
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">H2k Physio</span>
          </div>
          <p className="text-gray-600">
            {t('landing.footer.copyright')}
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}