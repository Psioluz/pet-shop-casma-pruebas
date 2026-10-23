import { lazy, Suspense, type ComponentType } from 'react';
// The downloadable build is entirely client-side; the Next.js app keeps next/dynamic.
export default function dynamic<Props extends object>(loader:()=>Promise<{default:ComponentType<Props>}>,options:{loading?:ComponentType;ssr?:boolean}={}){
  const Loaded=lazy(loader);
  return function BrowserComponent(props:Props){
    const Loading=options.loading;
    return <Suspense fallback={Loading?<Loading/>:null}><Loaded {...props}/></Suspense>;
  };
}
