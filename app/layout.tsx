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
                var mode = "typing"; 
                var charIdx = 0;
                var blinkCount = 0;
                var timer;

                function loop() {
                  if (document.hidden) {
                    // Si el usuario no está viendo la pestaña, la dejamos quieta 
                    // para evitar que el navegador la ralentice y se vea lagueada.
                    document.title = text;
                    return;
                  }

                  if (mode === "typing") {
                    document.title = text.substring(0, charIdx) + " |";
                    charIdx++;
                    if (charIdx > text.length) {
                      mode = "blinking";
                      blinkCount = 0;
                      timer = setTimeout(loop, 500); 
                    } else {
                      timer = setTimeout(loop, 150);
                    }
                  } else if (mode === "blinking") {
                    if (blinkCount % 2 === 0) {
                      document.title = text + " |";
                    } else {
                      document.title = text + " \\u200E";
                    }
                    blinkCount++;
                    if (blinkCount >= 20) { 
                      mode = "deleting";
                    }
                    timer = setTimeout(loop, 500);
                  } else if (mode === "deleting") {
                    document.title = text.substring(0, charIdx) + " |";
                    charIdx--;
                    if (charIdx < 0) {
                      mode = "typing";
                      charIdx = 0;
                      timer = setTimeout(loop, 1000);
                    } else {
                      timer = setTimeout(loop, 50);
                    }
                  }
                }

                // Escuchar cuando el usuario vuelve o se va de la pestaña
                document.addEventListener("visibilitychange", function() {
                  if (!document.hidden) {
                    // Cuando vuelve, reiniciamos el loop
                    clearTimeout(timer);
                    mode = "typing";
                    charIdx = 0;
                    loop();
                  }
                });

                timer = setTimeout(loop, 500);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
