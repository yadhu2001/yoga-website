'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="wrap section"><h1 style={{fontSize:40}}>We’ll be back shortly.</h1><p style={{margin:'20px 0'}}>We couldn’t load this page. Please try again.</p><button className="btn" onClick={reset}>Try again</button></main>}
