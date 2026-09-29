import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Sree Pranavam Yoga',description:'Yoga education, mindful practice and holistic wellbeing.',icons:{icon:'/assets/logo.jpg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
