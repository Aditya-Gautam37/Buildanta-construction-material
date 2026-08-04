"use client"

import { useEffect } from "react"

export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error(error)},[error])
  return <main className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-12"><section className="w-full rounded-3xl border border-rose-200 bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-rose-700">Unable to load operations</p><h1 className="mt-2 text-3xl font-bold">This workspace could not be loaded.</h1><p className="mt-3 text-slate-600">Check that the Inventory API is running, then try again. No information was changed.</p><button type="button" onClick={reset} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Try again</button></section></main>
}
