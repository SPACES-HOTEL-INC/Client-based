import React from "react";
import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInRequiredModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-foreground">
          <Lock className="h-7 w-7" />
        </div>

        <h3 className="font-display text-xl font-bold text-card-foreground">
          Sign in required
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account or sign in to access this feature
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/login"
            onClick={onClose}
            className="w-full rounded-2xl bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Sign In
          </Link>

          <Link
            to="/signup"
            onClick={onClose}
            className="w-full rounded-2xl border border-input bg-background py-3.5 text-center text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Create Account
          </Link>

          <button
            onClick={onClose}
            className="mt-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
};