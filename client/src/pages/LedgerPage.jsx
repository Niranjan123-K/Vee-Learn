import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import CreditBadge from '../components/CreditBadge';
import { formatDate, formatCredits } from '../utils/formatters';
import api from '../utils/api';
import './LedgerPage.css';

const typeFilters = ['All', 'Earned', 'Spent', 'Bonus'];

export default function LedgerPage() {
  const [transactions, setTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/ledger?page=${page}&limit=10`);
        const data = res.data;
        setTransactions(data.transactions || data || []);
        setBalance(data.balance ?? 0);
        setTotalEarned(data.totalEarned ?? 0);
        setTotalSpent(data.totalSpent ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch {
        setTransactions([]);
      }
      setLoading(false);
    };
    fetchLedger();
  }, [page]);

  const filtered = transactions.filter((tx) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Earned') return tx.type === 'earn' || tx.amount > 0;
    if (activeFilter === 'Spent') return tx.type === 'spend' || tx.amount < 0;
    return tx.type === 'bonus';
  });

  const getTypeIcon = (tx) => {
    if (tx.type === 'bonus' || tx.type === 'signup') return <Gift size={16} />;
    if (tx.amount > 0) return <ArrowUpRight size={16} />;
    return <ArrowDownRight size={16} />;
  };

  const getTypeColor = (tx) => {
    if (tx.type === 'bonus' || tx.type === 'signup') return 'var(--accent-primary)';
    if (tx.amount > 0) return 'var(--success)';
    return 'var(--danger)';
  };

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">
          Credit <span className="gradient-text">Ledger</span>
        </h1>
        <p className="section-subtitle">Track your credit earnings and spending</p>
      </motion.div>

      {/* Balance Header */}
      <motion.div
        className="ledger-balance glass-card-static"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="ledger-balance-main">
          <span className="ledger-balance-label">Current Balance</span>
          <CreditBadge amount={balance} size="lg" />
        </div>
        <div className="ledger-balance-stats">
          <div className="ledger-stat">
            <TrendingUp size={18} style={{ color: 'var(--success)' }} />
            <div>
              <span className="ledger-stat-value" style={{ color: 'var(--success)' }}>
                +{formatCredits(totalEarned)}
              </span>
              <span className="ledger-stat-label">Total Earned</span>
            </div>
          </div>
          <div className="ledger-stat">
            <TrendingDown size={18} style={{ color: 'var(--danger)' }} />
            <div>
              <span className="ledger-stat-value" style={{ color: 'var(--danger)' }}>
                -{formatCredits(totalSpent)}
              </span>
              <span className="ledger-stat-label">Total Spent</span>
            </div>
          </div>
          <div className="ledger-stat">
            <Wallet size={18} style={{ color: 'var(--accent-secondary)' }} />
            <div>
              <span className="ledger-stat-value">{formatCredits(balance)}</span>
              <span className="ledger-stat-label">Net Balance</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter */}
      <div className="filter-pills" style={{ marginBottom: 'var(--space-lg)' }}>
        {typeFilters.map((f) => (
          <button
            key={f}
            className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      <motion.div
        className="ledger-table glass-card-static"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {loading ? (
          <div style={{ padding: 'var(--space-xl)', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => (
                  <motion.tr
                    key={tx._id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td>{formatDate(tx.createdAt)}</td>
                    <td>
                      <span
                        className="ledger-type-badge"
                        style={{ color: getTypeColor(tx) }}
                      >
                        {getTypeIcon(tx)}
                        {tx.type || (tx.amount > 0 ? 'earn' : 'spend')}
                      </span>
                    </td>
                    <td>{tx.description || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="ledger-amount"
                        style={{ color: getTypeColor(tx) }}
                      >
                        {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Wallet size={48} />
            <h3>No transactions</h3>
            <p>Your credit history will appear here</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3),
            Math.min(totalPages, page + 2)
          ).map((p) => (
            <button
              key={p}
              className={p === page ? 'active' : ''}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
