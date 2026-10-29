import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Debt, FixedExpense, Expense, DashboardData, CreditCardInvoice } from '../types';
import { api } from '../services/api';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  debts: Debt[];
  fixedExpenses: FixedExpense[];
  expenses: Expense[];
  invoices: CreditCardInvoice[];
  dashboard: DashboardData | null;
  isLoading: boolean;
  loadFinanceData: () => Promise<void>;
  addDebt: (data: Partial<Debt>) => Promise<Debt>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<Debt>;
  payDebtInstallment: (id: string, amount?: number, date?: string) => Promise<void>;
  unpayDebtInstallment: (id: string, month?: string) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addFixedExpense: (data: Partial<FixedExpense>) => Promise<FixedExpense>;
  updateFixedExpense: (id: string, data: Partial<FixedExpense>) => Promise<FixedExpense>;
  payFixedExpense: (id: string, date?: string, amount?: number) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  addExpense: (data: Partial<Expense>) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  addInvoice: (data: any) => Promise<CreditCardInvoice>;
  addInvoiceItem: (invoiceId: string, itemData: any) => Promise<CreditCardInvoice>;
  payInvoice: (id: string) => Promise<void>;
  unpayInvoice: (id: string) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  deleteInvoiceItem: (itemId: string, deleteAllInstallments?: boolean) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast, triggerRefresh, refreshTrigger, selectedMonth } = useApp();
  const { isAuthenticated } = useAuth();

  const loadFinanceData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const [debtsData, fixedData, expensesData, dashboardData, invoicesData] = await Promise.all([
        api.get<Debt[]>('/debts', { month: selectedMonth }),
        api.get<FixedExpense[]>('/fixed-expenses'),
        api.get<Expense[]>('/expenses'),
        api.get<DashboardData>('/dashboard', { month: selectedMonth }),
        api.get<CreditCardInvoice[]>('/invoices').catch(() => [] as CreditCardInvoice[]),
      ]);
      setDebts(debtsData);
      setFixedExpenses(fixedData);
      setExpenses(expensesData);
      setDashboard(dashboardData);
      setInvoices(invoicesData || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFinanceData();
    }
  }, [loadFinanceData, refreshTrigger, isAuthenticated]);

  const addDebt = async (data: Partial<Debt>): Promise<Debt> => {
    try {
      const created = await api.post<Debt>('/debts', data);
      showToast('Contrato de dívida cadastrado!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar dívida', 'error');
      throw err;
    }
  };

  const updateDebt = async (id: string, data: Partial<Debt>): Promise<Debt> => {
    try {
      const updated = await api.put<Debt>(`/debts/${id}`, data);
      showToast('Contrato atualizado com sucesso!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar dívida', 'error');
      throw err;
    }
  };

  const payDebtInstallment = async (id: string, amount?: number, date?: string) => {
    try {
      let targetDate = date;
      if (!targetDate && selectedMonth) {
        const d = debts.find(debt => debt.id === id);
        const dueDay = d?.dueDay || 10;
        const parts = selectedMonth.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const lastDay = new Date(y, m, 0).getDate();
          const validDay = Math.min(Math.max(1, Number(dueDay)), lastDay);
          targetDate = `${parts[0]}-${parts[1]}-${String(validDay).padStart(2, '0')}`;
        }
      }
      await api.post(`/debts/${id}/pay`, { amount, date: targetDate, month: selectedMonth });
      showToast('Baixa de parcela registrada com sucesso!', 'success');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar baixa de parcela', 'error');
      throw err;
    }
  };

  const unpayDebtInstallment = async (id: string, month?: string) => {
    try {
      await api.post(`/debts/${id}/unpay`, { month: month || selectedMonth });
      showToast('Pagamento da parcela estornado com sucesso!', 'info');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao estornar parcela', 'error');
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await api.delete(`/debts/${id}`);
      showToast('Contrato de dívida excluído', 'info');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir dívida', 'error');
      throw err;
    }
  };

  const addFixedExpense = async (data: Partial<FixedExpense>): Promise<FixedExpense> => {
    try {
      const created = await api.post<FixedExpense>('/fixed-expenses', data);
      showToast('Despesa fixa cadastrada!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar despesa fixa', 'error');
      throw err;
    }
  };

  const updateFixedExpense = async (id: string, data: Partial<FixedExpense>): Promise<FixedExpense> => {
    try {
      const updated = await api.put<FixedExpense>(`/fixed-expenses/${id}`, data);
      showToast('Despesa fixa atualizada!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar despesa fixa', 'error');
      throw err;
    }
  };

  const payFixedExpense = async (id: string, date?: string, amount?: number) => {
    try {
      let targetDate = date;
      if (!targetDate && selectedMonth) {
        const fe = fixedExpenses.find(f => f.id === id);
        const dueDay = fe?.dueDay || 10;
        const parts = selectedMonth.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const lastDay = new Date(y, m, 0).getDate();
          const validDay = Math.min(Math.max(1, Number(dueDay)), lastDay);
          targetDate = `${parts[0]}-${parts[1]}-${String(validDay).padStart(2, '0')}`;
        }
      }
      await api.post(`/fixed-expenses/${id}/pay`, { date: targetDate, amount, month: selectedMonth });
      showToast('Pagamento da mensalidade registrado!', 'success');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar pagamento', 'error');
      throw err;
    }
  };

  const deleteFixedExpense = async (id: string) => {
    try {
      await api.delete(`/fixed-expenses/${id}`);
      showToast('Despesa fixa excluída', 'info');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir despesa fixa', 'error');
      throw err;
    }
  };

  const addExpense = async (data: Partial<Expense>): Promise<Expense> => {
    try {
      const created = await api.post<Expense>('/expenses', data);
      showToast('Lançamento financeiro registrado!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao lançar despesa', 'error');
      throw err;
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>): Promise<Expense> => {
    try {
      const updated = await api.put<Expense>(`/expenses/${id}`, data);
      showToast('Lançamento financeiro atualizado!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar lançamento', 'error');
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      showToast('Lançamento removido', 'info');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover lançamento', 'error');
      throw err;
    }
  };

  const addInvoice = async (data: any): Promise<CreditCardInvoice> => {
    try {
      const created = await api.post<CreditCardInvoice>('/invoices', data);
      showToast('Fatura de cartão registrada com sucesso!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar fatura de cartão', 'error');
      throw err;
    }
  };

  const addInvoiceItem = async (invoiceId: string, itemData: any): Promise<CreditCardInvoice> => {
    try {
      const updated = await api.post<CreditCardInvoice>(`/invoices/${invoiceId}/items`, itemData);
      showToast('Compra adicionada à fatura com sucesso!', 'success');
      await loadFinanceData();
      triggerRefresh();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erro ao adicionar compra à fatura', 'error');
      throw err;
    }
  };

  const payInvoice = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/pay`);
      showToast('Fatura marcada como paga!', 'success');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao quitar fatura', 'error');
      throw err;
    }
  };

  const unpayInvoice = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/unpay`);
      showToast('Pagamento da fatura estornado!', 'info');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao estornar pagamento da fatura', 'error');
      throw err;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await api.delete(`/invoices/${id}`);
      showToast('Fatura excluída com sucesso!', 'info');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir fatura', 'error');
      throw err;
    }
  };

  const deleteInvoiceItem = async (itemId: string, deleteAllInstallments = false) => {
    try {
      await api.delete(`/invoices/items/${itemId}?deleteAllInstallments=${deleteAllInstallments}`);
      showToast(deleteAllInstallments ? 'Compra e parcelas excluídas!' : 'Item excluído da fatura!', 'info');
      await loadFinanceData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir item da fatura', 'error');
      throw err;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        debts,
        fixedExpenses,
        expenses,
        invoices,
        dashboard,
        isLoading,
        loadFinanceData,
        addDebt,
        updateDebt,
        payDebtInstallment,
        unpayDebtInstallment,
        deleteDebt,
        addFixedExpense,
        updateFixedExpense,
        payFixedExpense,
        deleteFixedExpense,
        addExpense,
        updateExpense,
        deleteExpense,
        addInvoice,
        addInvoiceItem,
        payInvoice,
        unpayInvoice,
        deleteInvoice,
        deleteInvoiceItem,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  return context;
};
