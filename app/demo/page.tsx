import Link from "next/link";
import Planner from "../planner";
import { SiteHeader, SiteFooter } from "../components/site-chrome";

export default function DemoPage() {
  return <><SiteHeader /><main id="main"><div className="app-heading no-print"><p className="eyebrow">Live demo · no account needed</p><h1>Try a little time together.</h1><p>Explore the same planning tools a caregiver uses for a person living with dementia. This demo is temporary: refreshing clears it. <Link href="/sign-up" prefetch={false}>Create an account to save your own sessions.</Link></p></div><Planner mode="demo" /></main><SiteFooter /></>;
}
