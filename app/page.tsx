import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Monitor, 
  Shield, 
  Clock, 
  BarChart3, 
  Users, 
  FileText, 
  ChevronRight,
  GraduationCap,
  Laptop,
  Smartphone,
  Zap,
  Lock,
  Database
} from 'lucide-react'
import { AnimatedSection, AnimatedCard } from '@/components/landing/AnimatedSection'

async function getSetupStatus() {
  try {
    const supabase = createAdminClient()
    
    const { data: identitasSekolah, error } = await supabase
      .from('identitas_sekolah')
      .select('id, setup_wizard_completed')
      .maybeSingle()

    if (error || !identitasSekolah || !identitasSekolah.setup_wizard_completed) {
      return { isSetupComplete: false }
    }

    return { isSetupComplete: true }
  } catch {
    return { isSetupComplete: false }
  }
}

const features = [
  {
    icon: Monitor,
    title: 'Ujian Online',
    description: 'Pelaksanaan ujian berbasis komputer dengan antarmuka yang intuitif dan mudah digunakan.'
  },
  {
    icon: Shield,
    title: 'Keamanan Ujian',
    description: 'Sistem anti-cheating dengan deteksi perpindahan tab dan keluar dari mode fullscreen.'
  },
  {
    icon: Clock,
    title: 'Pengaturan Waktu',
    description: 'Timer otomatis dengan durasi yang dapat dikustomisasi per ujian.'
  },
  {
    icon: BarChart3,
    title: 'Analisis Hasil',
    description: 'Statistik lengkap dan laporan hasil ujian dalam bentuk grafik dan tabel.'
  },
  {
    icon: Users,
    title: 'Manajemen Pengguna',
    description: 'Pengelolaan data siswa, guru, dan kelas dengan mudah dan terstruktur.'
  },
  {
    icon: FileText,
    title: 'Export Data',
    description: 'Ekspor hasil ujian ke format Excel untuk keperluan pelaporan.'
  }
]

const advantages = [
  {
    icon: Zap,
    title: 'Performa Cepat',
    description: 'Dioptimasi dengan query paralel dan caching untuk respons yang optimal.'
  },
  {
    icon: Smartphone,
    title: 'Responsif',
    description: 'Tampilan yang menyesuaikan dengan berbagai ukuran layar perangkat.'
  },
  {
    icon: Lock,
    title: 'Aman & Terpercaya',
    description: 'Menggunakan Supabase dengan enkripsi data dan autentikasi yang aman.'
  },
  {
    icon: Database,
    title: 'Cloud-Based',
    description: 'Data tersimpan di cloud, dapat diakses kapan saja dan dari mana saja.'
  }
]

export default async function LandingPage() {
  const setupStatus = await getSetupStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="fixed top-20 right-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="bg-white rounded-xl p-2 shadow-lg border border-slate-100 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                <img
                  src="/images/logo_kemendikdasmen.svg"
                  alt="Logo Kemendikdasmen"
                  className="h-10 w-auto"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Cerdas-CBT</h1>
                <p className="text-xs text-slate-500">Platform Ujian Berbasis Komputer</p>
              </div>
            </div>
            <Link href={setupStatus.isSetupComplete ? '/login' : '/setup'}>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Mulai
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                Solusi Ujian Digital untuk Sekolah
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={100}>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Cerdas-CBT
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ujian Berbasis Komputer
                </span>
              </h2>
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10">
                Platform ujian online yang aman, cepat, dan mudah digunakan untuk membantu sekolah
                melaksanakan ujian berbasis komputer dengan fitur anti-cheating dan analisis hasil yang lengkap.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={setupStatus.isSetupComplete ? '/login' : '/setup'}>
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 h-12 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    Mulai Sekarang
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <a href="#fitur">
                  <Button variant="outline" size="lg" className="text-lg px-8 h-12 transition-all duration-300 hover:scale-105">
                    Lihat Fitur
                  </Button>
                </a>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="mt-16 flex justify-center gap-4 flex-wrap">
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 border border-slate-100 transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-default">
                  <Laptop className="w-16 h-16 text-blue-500" />
                  <p className="text-sm text-slate-600 mt-2 font-medium">Desktop</p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 border border-slate-100 transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-default">
                  <Smartphone className="w-16 h-16 text-indigo-500" />
                  <p className="text-sm text-slate-600 mt-2 font-medium">Mobile</p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 border border-slate-100 transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-default">
                  <Monitor className="w-16 h-16 text-purple-500" />
                  <p className="text-sm text-slate-600 mt-2 font-medium">Tablet</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section id="fitur" className="relative z-10 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Fitur Utama</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Dilengkapi dengan berbagai fitur untuk mendukung pelaksanaan ujian yang aman dan efisien
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedCard key={index} delay={index * 100}>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h4>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Mengapa Cerdas-CBT?</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Dibangun dengan teknologi modern untuk memberikan pengalaman terbaik
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advantages.map((advantage, index) => (
              <AnimatedCard key={index} delay={index * 100}>
                <div className="flex gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-lg">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110">
                    <advantage.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{advantage.title}</h4>
                    <p className="text-slate-600 text-sm">{advantage.description}</p>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center text-white">
              <h3 className="text-3xl font-bold mb-4">Tentang Kami</h3>
              <div className="max-w-3xl mx-auto">
                <p className="text-blue-100 text-lg mb-8">
                  Cerdas-CBT dikembangkan oleh EAS Creative Studio untuk membantu sekolah dalam melaksanakan 
                  ujian berbasis komputer dengan aman, efisien, dan modern. Platform ini dirancang 
                  menggunakan teknologi terkini dengan fokus pada kemudahan penggunaan dan keamanan data.
                </p>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 hover:bg-white/15">
                  <h4 className="text-xl font-semibold mb-4">Hubungi Kami</h4>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-200">Email:</span>
                      <a href="mailto:eas.creative.studio@gmail.com" className="text-white hover:underline transition-colors">
                        eas.creative.studio@gmail.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-200">Website:</span>
                      <a href="https://eas.biz.id" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">
                        eas.biz.id
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Siap Memulai Ujian Online?
            </h3>
            <p className="text-slate-600 mb-8">
              Bergabunglah dengan sekolah-sekolah yang telah menggunakan Cerdas-CBT
            </p>
            <Link href={setupStatus.isSetupComplete ? '/login' : '/setup'}>
              <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-10 h-12 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Mulai Sekarang
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <footer className="relative z-10 py-8 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo_kemendikdasmen.svg"
                alt="Logo Kemendikdasmen"
                className="h-8 w-auto"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">Cerdas-CBT</p>
                <p className="text-xs text-slate-500">Platform Ujian Berbasis Komputer</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 Cerdas-CBT by EAS Creative Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}