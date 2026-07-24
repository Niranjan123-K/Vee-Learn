import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Zap, ArrowRightLeft } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import './LedgerPage.css';

export default function LedgerPage() {
  const user = useAuthStore(state => state.user);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'earned', 'spent'

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/ledger');
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error('Failed to load ledger', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalEarned = transactions
    .filter(t => t.type === 'EARN' || (t.type === 'TRANSFER' && t.to_user_id === user?.id))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'SPEND' || (t.type === 'TRANSFER' && t.from_user_id === user?.id))
    .reduce((acc, t) => acc + t.amount, 0);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    const isEarn = t.type === 'EARN' || (t.type === 'TRANSFER' && t.to_user_id === user?.id);
    if (filter === 'earned') return isEarn;
    if (filter === 'spent') return !isEarn;
    return true;
  });

  return (
    <div className="page-container fade-in">
      <PageHeader 
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Ledger' }]}
        title="Credit Ledger"
        description="Track your time credits earned from teaching and spent on learning."
      />

      {/* Summary Cards */}
      <div className="ledger-summary">
        <div className="card stat-card">
          <div className="stat-icon-wrapper text-warning"><Zap size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Current Balance</span>
            <span className="stat-value">{user?.credit_balance || 0}</span>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon-wrapper text-success"><ArrowUpRight size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Earned</span>
            <span className="stat-value">{totalEarned}</span>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon-wrapper text-info"><ArrowDownLeft size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{totalSpent}</span>
          </div>
        </div>
      </div>

      <div className="card mt-xl">
        <div className="card-header">
          <h3 className="card-header-title">Transaction History</h3>
          <div className="tabs" style={{borderBottom: 'none'}}>
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`tab ${filter === 'earned' ? 'active' : ''}`} onClick={() => setFilter('earned')}>Earned</button>
            <button className={`tab ${filter === 'spent' ? 'active' : ''}`} onClick={() => setFilter('spent')}>Spent</button>
          </div>
        </div>
        
        <div className="card-body" style={{padding: 0}}>
          {loading ? (
            <div className="p-lg">
              <div className="skeleton" style={{ height: '60px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ height: '60px', marginBottom: '10px' }} />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="transaction-list">
              {filteredTransactions.map(t => {
                const isEarn = t.type === 'EARN' || (t.type === 'TRANSFER' && t.to_user_id === user?.id);
                
                return (
                  <div key={t.id} className="transaction-item">
                    <div className="transaction-icon">
                      {t.type === 'TRANSFER' ? (
                        <div className={`icon-circle ${isEarn ? 'bg-success-muted text-success' : 'bg-info-muted text-info'}`}>
                           {isEarn ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        </div>
                      ) : (
                        <div className="icon-circle bg-warning-muted text-warning">
                          <Zap size={18} />
                        </div>
                      )}
                    </div>
                    
                    <div className="transaction-content">
                      <h4 className="transaction-title">
                        {t.type === 'INITIAL' ? 'Initial Grant' : 
                         t.type === 'TRANSFER' ? (isEarn ? 'Received for Session' : 'Paid for Session') : 
                         t.type}
                      </h4>
                      <p className="transaction-desc">{t.description}</p>
                    </div>
                    
                    <div className="transaction-meta">
                      <span className={`transaction-amount ${isEarn ? 'text-success' : 'text-info'}`}>
                        {isEarn ? '+' : '-'}{t.amount} {Math.abs(t.amount) === 1 ? 'Credit' : 'Credits'}
                      </span>
                      <span className="transaction-date">
                        {new Date(t.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={ArrowRightLeft}
              title="No transactions found"
              description="You haven't earned or spent any credits yet."
              action={{ label: 'Earn Credits', to: '/explore' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
