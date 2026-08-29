import { useEffect, useState } from "react";
import { SpacesLogo } from "./Logo";

export function Splash() {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("spaces.splash") === "seen") {
      setShow(false);
      return;
    }
    const t1 = setTimeout(() => setFading(true), 2000);
    const t2 = setTimeout(() => {
      sessionStorage.setItem("spaces.splash", "seen");
      setShow(false);
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden={fading}
    >
      <div className="animate-splash-in flex flex-col items-center">
        <SpacesLogo size="lg" />
        <p className="mt-4 text-sm tracking-wide text-brand-foreground/70">
          Elite stays, shortlets &amp; experiences
        </p>
      </div>
    </div>
  );
}
