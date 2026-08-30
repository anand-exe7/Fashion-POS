import { ShoppingBag, MapPin, Clock, Phone, Mail } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5EFE6] text-[#000000] font-sans flex flex-col justify-between selection:bg-[#C1272D] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#E0D5C3]/50 py-6 px-6 sm:px-12 flex justify-center items-center bg-white/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFFFFF] rounded-xl flex items-center justify-center shadow-md p-1 border border-black/10">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-sm font-black text-[#C1272D] tracking-wider uppercase block">
              Daddy's Home
            </span>
            <span className="text-[9px] text-[#9E1B20] font-bold tracking-widest block uppercase -mt-0.5">
              Premium Menswear & Accessories
            </span>
          </div>
        </div>
      </header>

      {/* Main Info */}
      <main className="flex-1 max-w-xl mx-auto w-full px-6 flex flex-col justify-center items-center py-16">
        <div className="bg-[#FAF7F2] border border-[#E0D5C3] rounded-2xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.06)] w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C1272D]" />
          
          <span className="inline-block px-3 py-1 bg-[#C1272D]/10 border border-[#C1272D]/25 text-[#9E1B20] text-[10px] font-bold rounded-full tracking-wider uppercase mb-6">
            Store Directory & Contacts
          </span>
          
          <h1 className="text-3xl font-black text-[#C1272D] leading-tight tracking-tight mb-2">
            Daddy's Home
          </h1>
          <p className="text-xs text-[#9E1B20] font-black tracking-widest uppercase mb-8">
            Menswear & Accessories
          </p>

          <div className="space-y-6 text-left max-w-sm mx-auto text-sm font-semibold text-[#4A4038] border-t border-[#E0D5C3]/50 pt-8">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-[#9E1B20] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#6B5F52]/85 uppercase tracking-wider mb-0.5">Address</p>
                <p className="text-[#000000] leading-relaxed">
                  East 2nd Street, Near Bombay Bhavan, 1st Floor, Pudukkottai - 622001.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-[#9E1B20] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#6B5F52]/85 uppercase tracking-wider mb-0.5">Phone Number</p>
                <p className="text-[#000000]">
                  +91 8056642706
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-[#9E1B20] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#6B5F52]/85 uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-[#000000] break-all">
                  divyadarshan409@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-[#9E1B20] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#6B5F52]/85 uppercase tracking-wider mb-0.5">Business Hours</p>
                <p className="text-[#000000]">
                  Open Daily: 10:00 AM - 9:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E0D5C3]/50 py-6 text-center bg-[#EDE4D6]">
        <p className="text-[10px] font-bold text-[#9E1B20] tracking-widest uppercase">
          Daddy's Home • Pudukkottai
        </p>
        <p className="text-[9px] font-semibold text-[#6B5F52]/85 uppercase tracking-wider mt-1">
          © {new Date().getFullYear()} All Rights Reserved • Powered by Cenexa Systems
        </p>
      </footer>
    </div>
  );
}
