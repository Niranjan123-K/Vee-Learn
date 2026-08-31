import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, ArrowRightLeft, History, Award } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import './LedgerPage.css';

// Robust helper to classify any credit transaction regardless of case or alias
const isEarnTransaction = (t, userId) => {
  const type = t?.type?.toLowerCase() || '';
  if (['earn', 'bonus', 'refund', 'initial'].includes(type)) return true;
  if (['spend', 'expense'].includes(type)) return false;
  if (type === 'transfer') return String(t.to_user_id) === String(userId);
  return String(t.to_user_id) === String(userId);
};

export default function LedgerPage() {
  const user = useAuthStore(state => state.user);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'earned', 'spent'

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
<<<<<<< Updated upstream
        // Hitting the correct /credits/history endpoint instead of invalid 404 /ledger route
=======
>>>>>>> Stashed changes
        const res = await api.get('/credits/history');
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error('Failed to load ledger history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalEarned = transactions
    .filter(t => isEarnTransaction(t, user?.id))
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const totalSpent = transactions
    .filter(t => !isEarnTransaction(t, user?.id))
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    const isEarn = isEarnTransaction(t, user?.id);
    if (filter === 'earned') return isEarn;
    if (filter === 'spent') return !isEarn;
    return true;
  });

  return (
    <div className="page-container fade-in">
      <PageHeader 
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Ledger' }]}
        title="Credit Ledger"
        description="Organize and monitor your time credit transactions, balances, and earning history."
      />

      {/* Structured Summary Metric Cards */}
      <div className="ledger-summary">
        <div className="ledger-stat-card">
          <div className="ledger-stat-icon balance">
            <Wallet size={26} />
          </div>
          <div className="ledger-stat-content">
            <span className="ledger-stat-label">Current Balance</span>
            <span className="ledger-stat-value">{user?.credit_balance || 0}</span>
          </div>
        </div>
        
        <div className="ledger-stat-card">
          <div className="ledger-stat-icon earned">
            <ArrowUpRight size={26} />
          </div>
          <div className="ledger-stat-content">
            <span className="ledger-stat-label">Total Earned</span>
            <span className="ledger-stat-value">{totalEarned}</span>
          </div>
        </div>
        
        <div className="ledger-stat-card">
          <div className="ledger-stat-icon spent">
            <ArrowDownLeft size={26} />
          </div>
          <div className="ledger-stat-content">
            <span className="ledger-stat-label">Total Spent</span>
            <span className="ledger-stat-value">{totalSpent}</span>
          </div>
        </div>
      </div>

      {/* Organized Transaction History */}
      <div className="ledger-history-card">
        <div className="ledger-history-header">
          <h3 className="ledger-history-title">
            <History size={22} className="text-accent" />
            Transaction History
          </h3>
          
          <div className="ledger-filter-pills">
            <button className={`ledger-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All Transactions
            </button>
            <button className={`ledger-pill ${filter === 'earned' ? 'active' : ''}`} onClick={() => setFilter('earned')}>
              Earned / Received
            </button>
            <button className={`ledger-pill ${filter === 'spent' ? 'active' : ''}`} onClick={() => setFilter('spent')}>
              Spent / Used
            </button>
          </div>
        </div>
        
        <div className="ledger-history-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: '76px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="transaction-list">
              {filteredTransactions.map(t => {
                const isEarn = isEarnTransaction(t, user?.id);
                const typeLower = t?.type?.toLowerCase() || '';
                
                let title = t.type;
                let badge = 'Transaction';
                let iconClass = isEarn ? 'earn' : 'spend';

                if (typeLower === 'initial' || typeLower === 'bonus') {
                  title = 'Welcome Bonus Grant';
                  badge = 'Bonus';
                  iconClass = 'grant';
                } else if (typeLower === 'earn') {
                  title = 'Received for Teaching Session';
                  badge = 'Income';
                } else if (typeLower === 'spend') {
                  title = 'Paid for Learning Session';
                  badge = 'Expense';
                } else if (typeLower === 'refund') {
                  title = 'Session Cancellation Refund';
                  badge = 'Refund';
                } else if (typeLower === 'transfer') {
                  title = isEarn ? 'Received for Session' : 'Paid for Session';
                  badge = isEarn ? 'Income' : 'Expense';
                }

                return (
                  <div key={t.id} className="transaction-card-item">
                    <div className="transaction-main">
                      <div className={`transaction-icon-box ${iconClass}`}>
                        {iconClass === 'grant' ? <Award size={22} /> : isEarn ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                      </div>
                      
                      <div className="transaction-info">
                        <div className="transaction-title-row">
                          <h4 className="transaction-title">{title}</h4>
                          <span className="transaction-badge">{badge}</span>
                        </div>
                        <p className="transaction-desc">{t.description || (isEarn ? 'Credits received' : 'Credits deducted')}</p>
                      </div>
                    </div>
                    
                    <div className="transaction-meta">
                      <span className={`transaction-amount ${isEarn ? 'plus' : 'minus'}`}>
                        {isEarn ? '+' : '-'}{t.amount} {Math.abs(t.amount) === 1 ? 'Credit' : 'Credits'}
                      </span>
                      <span className="transaction-date">
                        {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={ArrowRightLeft}
              title={filter === 'all' ? "No transactions found yet" : `No transactions found under '${filter === 'earned' ? 'Earned / Received' : 'Spent / Used'}'`}
              description={filter === 'all' ? "You haven't earned or spent any credits yet." : `Try switching filters or explore sessions to start transacting credits.`}
              action={filter === 'all' ? { label: 'Explore Teachers & Earn Credits', to: '/explore' } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
