import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Aqua Sight · แชทคุณภาพน้ำ',description:'สนทนาเพื่อดูข้อมูลคุณภาพน้ำ รายเดือน ภาพแผนที่ และผลพยากรณ์ Aqua Sight'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="th"><body>{children}</body></html>;}
