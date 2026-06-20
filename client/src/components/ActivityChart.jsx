import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import './ActivityChart.css';

const defaultData = [
  { month: 'Jan', sessions: 4 },
  { month: 'Feb', sessions: 7 },
  { month: 'Mar', sessions: 5 },
  { month: 'Apr', sessions: 12 },
  { month: 'May', sessions: 9 },
  { month: 'Jun', sessions: 15 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{payload[0].value} sessions</p>
    </div>
  );
}

export default function ActivityChart({ data = defaultData, title = 'Session Activity' }) {
  return (
    <motion.div
      className="activity-chart glass-card-static"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="activity-chart-title">{title}</h3>
      <div className="activity-chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#4ECDC4" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6C63FF" />
                <stop offset="100%" stopColor="#4ECDC4" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B6D7B', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B6D7B', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="url(#strokeGradient)"
              strokeWidth={2.5}
              fill="url(#colorSessions)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#6C63FF',
                stroke: '#4ECDC4',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
