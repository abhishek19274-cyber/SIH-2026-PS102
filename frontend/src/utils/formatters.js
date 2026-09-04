import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function riskTone(score) {
  if (score >= 70) return "critical";
  if (score >= 45) return "elevated";
  return "normal";
}

export function riskLabel(score) {
  if (score >= 70) return "High Risk";
  if (score >= 45) return "Moderate";
  return "Low Risk";
}

export function formatCurrencyCr(amount) {
  if (amount == null) return "₹0.00 Cr";
  return `₹${Number(amount).toFixed(2)} Cr`;
}

export function formatPercent(val) {
  if (val == null) return "0%";
  return `${Number(val).toFixed(0)}%`;
}
