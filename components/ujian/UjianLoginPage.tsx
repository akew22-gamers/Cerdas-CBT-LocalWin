"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, QrCode, Keyboard, ArrowRight, Camera, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UjianLoginPageProps {
  schoolName: string
  ujianId?: string
  siswaId?: string
  kodeUjian?: string
}

export function UjianLoginPage({ schoolName, ujianId, siswaId, kodeUjian }: UjianLoginPageProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "manual">("qr")
  const [nisn, setNisn] = useState("")
  const [password, setPassword] = useState("")
  const [kodeUjianInput, setKodeUjianInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const scannerRef = useRef<any>(null)
  const scannerInitialized = useRef(false)

  useEffect(() => {
    if (kodeUjian) {
      setKodeUjianInput(kodeUjian)
    }
    if (siswaId && ujianId) {
      setActiveTab("manual")
    }
  }, [siswaId, ujianId, kodeUjian])

  const handleQrLogin = useCallback((uId: string, sId: string, kode: string) => {
    setIsLoading(true)
    fetch('/api/ujian/login/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ujian_id: uId, siswa_id: sId, kode_ujian: kode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast.success("QR Code berhasil dipindai! Mengarahkan ke ujian...")
          window.location.href = data.data.redirect_url || "/siswa/ujian"
        } else {
          throw new Error(data.error?.message || "Gagal masuk menggunakan QR code")
        }
      })
      .catch(err => {
        toast.error(err.message || "Gagal masuk menggunakan QR code")
        setIsLoading(false)
      })
  }, [])

  // Initialize/cleanup scanner based on isScanning state
  useEffect(() => {
    if (!isScanning) {
      // Cleanup when scanning stops
      if (scannerRef.current && scannerInitialized.current) {
        try {
          scannerRef.current.clear()
        } catch (e) {
          // ignore cleanup errors
        }
        scannerRef.current = null
        scannerInitialized.current = false
      }
      return
    }

    // Wait for next frame to ensure DOM is ready
    const timer = setTimeout(() => {
      const el = document.getElementById("qr-reader")
      if (!el || scannerInitialized.current) return

      // Dynamically import to avoid SSR issues
      import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
        if (!document.getElementById("qr-reader")) return

        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          },
          false
        )

        scannerRef.current = scanner
        scannerInitialized.current = true

        scanner.render(
          (decodedText: string) => {
            // Stop scanning immediately
            try {
              scanner.clear()
            } catch (e) {
              // ignore
            }
            scannerInitialized.current = false
            setIsScanning(false)

            // Parse URL
            try {
              const url = new URL(decodedText, window.location.origin)
              const params = url.searchParams
              const uId = params.get('u')
              const sId = params.get('s')
              const kode = params.get('k')

              if (uId && sId && kode) {
                handleQrLogin(uId, sId, kode)
              } else {
                toast.error("QR Code tidak valid. Gunakan login manual.")
              }
            } catch {
              toast.error("Gagal membaca QR Code. Gunakan login manual.")
            }
          },
          (_errorMessage: string) => {
            // Silent - normal scan miss, don't spam
          }
        )

        setScannerReady(true)
      }).catch(() => {
        toast.error("Gagal memuat scanner QR")
        setIsScanning(false)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [isScanning, handleQrLogin])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerInitialized.current) {
        try {
          scannerRef.current.clear()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  const startScanner = useCallback(async () => {
    // Check if we're in a secure context (HTTPS)
    if (!window.isSecureContext) {
      toast.error("QR Scanner memerlukan HTTPS")
      return
    }

    // Check for mediaDevices support
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      toast.error("Browser tidak mendukung kamera")
      return
    }

    try {
      // Request camera permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      stream.getTracks().forEach(track => track.stop())

      // Now set scanning - this will trigger the useEffect to initialize Html5QrcodeScanner
      setScannerReady(false)
      setIsScanning(true)
    } catch (err: any) {
      console.error("Camera access error:", err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error("Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser.")
      } else if (err.name === 'NotFoundError') {
        toast.error("Kamera tidak ditemukan di perangkat ini.")
      } else {
        toast.error("Gagal mengakses kamera.")
      }
    }
  }, [])

  const stopScanner = useCallback(() => {
    setIsScanning(false)
    setScannerReady(false)
  }, [])

  const validateForm = (): boolean => {
    if (!nisn.trim()) {
      toast.error("NISN harus diisi")
      return false
    }
    if (!password) {
      toast.error("Password harus diisi")
      return false
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter")
      return false
    }
    if (!kodeUjianInput.trim()) {
      toast.error("Kode Ujian harus diisi")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/ujian/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nisn: nisn.trim(),
          password,
          kode_ujian: kodeUjianInput.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Login gagal")
      }

      toast.success("Login berhasil! Mengarahkan ke ujian...")

      if (data.data?.redirect_url) {
        window.location.href = data.data.redirect_url
      } else {
        window.location.href = "/siswa/ujian"
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Masuk Ujian</h2>
        <p className="text-sm text-slate-500 mt-1">
          Pilih cara masuk untuk memulai ujian
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab("qr"); stopScanner(); }}
          className={`
            relative flex flex-col items-center justify-center p-3 rounded-xl
            transition-all duration-200 ease-out border
            ${activeTab === "qr" 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border-transparent" 
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
            }
          `}
        >
          <QrCode className={`w-5 h-5 mb-1.5 ${activeTab === "qr" ? "text-white" : "text-slate-500"}`} />
          <span className="text-xs font-semibold">Scan QR</span>
          {activeTab === "qr" && <div className="absolute inset-0 rounded-xl ring-2 ring-white/50" />}
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("manual"); stopScanner(); }}
          className={`
            relative flex flex-col items-center justify-center p-3 rounded-xl
            transition-all duration-200 ease-out border
            ${activeTab === "manual" 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border-transparent" 
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
            }
          `}
        >
          <Keyboard className={`w-5 h-5 mb-1.5 ${activeTab === "manual" ? "text-white" : "text-slate-500"}`} />
          <span className="text-xs font-semibold">Login Manual</span>
          {activeTab === "manual" && <div className="absolute inset-0 rounded-xl ring-2 ring-white/50" />}
        </button>
      </div>

      <div className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeTab === "qr" 
                ? "Arahkan kamera ke QR code pada kartu ujian Anda untuk masuk secara otomatis"
                : "Masukkan NISN, password, dan kode ujian yang tertera pada kartu ujian Anda"
              }
            </p>
          </div>
        </div>
      </div>

      {activeTab === "qr" && (
        <div className="space-y-4">
          {!isScanning ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full aspect-square max-w-xs bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center p-4">
                  <QrCode className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Klik tombol di bawah untuk memulai pemindaian QR</p>
                </div>
              </div>
              <Button
                onClick={startScanner}
                disabled={isLoading}
                className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                Mulai Scan QR
              </Button>
              <p className="text-xs text-slate-500 text-center">
                Pastikan browser Anda mendukung kamera dan menggunakan HTTPS
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div id="qr-reader" className="w-full max-w-xs mx-auto" />
                {!scannerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-sm text-slate-500">Memuat kamera...</p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={stopScanner}
                className="w-full max-w-xs mx-auto flex"
              >
                <X className="w-4 h-4 mr-2" />
                Batalkan Scan
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm text-slate-600 font-medium">Memproses login...</span>
            </div>
          )}
        </div>
      )}

      {activeTab === "manual" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nisn" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              NISN
            </Label>
            <Input
              id="nisn"
              type="text"
              placeholder="Masukkan NISN Anda"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              disabled={isLoading}
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 pr-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kode_ujian" className="text-sm font-medium text-slate-700">
              Kode Ujian
            </Label>
            <Input
              id="kode_ujian"
              type="text"
              placeholder="Masukkan kode ujian"
              value={kodeUjianInput}
              onChange={(e) => setKodeUjianInput(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all uppercase"
            />
            <p className="text-xs text-slate-400">
              Kode ujian tertera pada kartu ujian Anda
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-white font-semibold shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Memuat...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Masuk Ujian
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      )}

      <div className="text-center pt-2">
        <p className="text-xs text-slate-400">
          Masuk ke ujian online <span className="font-medium text-slate-500">{schoolName}</span>
        </p>
      </div>
    </div>
  )
}