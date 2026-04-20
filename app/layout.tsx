import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EasyLaptops - Laptops a precios increíbles",
  description: "Equipos de alto rendimiento, probados y listos para usar al mejor precio de Paraguay.",
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body 
        className="min-h-full flex flex-col bg-white text-slate-900"
        suppressHydrationWarning
      >
        {children}

        {/* SCRIPT DE ANIMACIÓN DE PESTAÑA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var text = "EasyLaptops";
                
                var mode = "typing"; // typing, blinking, deleting
                var charIdx = 0;
                var blinkCount = 0;
                var timer;

                function loop() {
                  if (mode === "typing") {
                    document.title = text.substring(0, charIdx) + " |";
                    charIdx++;
                    if (charIdx > text.length) {
                      mode = "blinking";
                      blinkCount = 0;
                      timer = setTimeout(loop, 500); 
                    } else {
                      timer = setTimeout(loop, 150); // Velocidad de tipeo
                    }
                  } else if (mode === "blinking") {
                    if (blinkCount % 2 === 0) {
                      document.title = text + " |";
                    } else {
                      // Usamos un caracter invisible (Left-to-Right Mark) para que el navegador no recorte el espacio 
                      // final y el texto se quede 100% quieto en el tab.
                      document.title = text + " \\u200E";
                    }
                    blinkCount++;
                    if (blinkCount >= 20) { // 20 parpadeos a 500ms = 10 segundos
                      mode = "deleting";
                    }
                    timer = setTimeout(loop, 500);
                  } else if (mode === "deleting") {
                    document.title = text.substring(0, charIdx) + " |";
                    charIdx--;
                    if (charIdx < 0) {
                      mode = "typing";
                      charIdx = 0;
                      timer = setTimeout(loop, 1000); // Pausa breve antes de reescribir
                    } else {
                      timer = setTimeout(loop, 50); // Velocidad de borrado rápido
                    }
                  }
                }

                timer = setTimeout(loop, 500);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
