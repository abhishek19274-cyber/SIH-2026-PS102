/**
 * Transaction Service
 * Connects to /api/transactions/*
 */
import { get, post } from "./api";

export async function getTransactions(params = {}) {
  return get("/api/transactions/", params);
}

export async function getTransaction(id) {
  return get(`/api/transactions/${id}`);
}

export async function evaluateTransaction(id) {
  return post("/api/transactions/evaluate", { transaction_id: Number(id) });
}

export async function getTransactionStats() {
  return get("/api/transactions/stats");
}

export const transactionService = {
  getTransactions,
  getTransaction,
  evaluateTransaction,
  getTransactionStats,
};

export default transactionService;
