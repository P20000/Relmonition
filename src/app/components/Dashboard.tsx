import { Activity, Calendar, Heart, TrendingUp, MessageCircle, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data
const communicationData = [
  { day: 'Mon', messages: 45, sentiment: 0.8 },
  { day: 'Tue', messages: 52, sentiment: 0.75 },
  { day: 'Wed', messages: 38, sentiment: 0.65 },
  { day: 'Thu', messages: 61, sentiment: 0.85 },
  { day: 'Fri', messages: 48, sentiment: 0.9 },
  { day: 'Sat', messages: 72, sentiment: 0.88 },
  { day: 'Sun', messages: 55, sentiment: 0.82 },
];

const responseLatencyData = [
  { hour: '9AM', you: 3, partner: 5 },
  { hour: '12PM', you: 2, partner: 4 },
  { hour: '3PM', you: 8, partner: 6 },
  { hour: '6PM', you: 2, partner: 3 },
  { hour: '9PM', you: 1, partner: 2 },
];

const sharedTimeSlots = [
  { day: 'Wed', time: '7:00 PM', duration: '2h', activity: 'Dinner opportunity' },
  { day: 'Fri', time: '6:30 PM', duration: '3h', activity: 'Movie night' },
  { day: 'Sat', time: '10:00 AM', duration: '4h', activity: 'Brunch & walk' },
];

export function Dashboard() {
  const healthScore = 87;
  const gottmanRatio = 5.2;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="mb-2">The Pulse</h1>
          <p className="text-muted-foreground">Your relationship wellness dashboard</p>
        </header>

        {/* Connection Meter - Hero Widget */}
        <div
          className="relative mb-8 p-8 rounded-3xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-8 h-8 text-primary" aria-hidden="true" />
                  <h2>Connection Health</h2>
                </div>
                <p className="text-muted-foreground">Overall relationship wellness score</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-primary" aria-label={`Health score: ${healthScore} out of 100`}>
                  {healthScore}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                style={{ width: `${healthScore}%` }}
                role="progressbar"
                aria-valuenow={healthScore}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" aria-hidden="true" />
              <span className="text-muted-foreground">
                <span className="text-green-500 font-medium">+3 points</span> from last week
              </span>
            </div>
          </div>

          {/* Decorative gradient */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Communication Frequency */}
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3>Communication Frequency</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Daily message exchange patterns</p>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={communicationData}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="var(--chart-1)"
                  fillOpacity={1}
                  fill="url(#colorMessages)"
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-4 text-sm text-muted-foreground">
              Average: <span className="text-foreground font-medium">53 messages/day</span>
            </div>
          </div>

          {/* Response Latency */}
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3>Response Latency</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Average time to reply (minutes)</p>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={responseLatencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  key="line-you"
                  type="monotone"
                  dataKey="you"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  name="You"
                />
                <Line
                  key="line-partner"
                  type="monotone"
                  dataKey="partner"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  name="Partner"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">You: </span>
                <span className="text-foreground font-medium">3.2 min</span>
              </div>
              <div>
                <span className="text-muted-foreground">Partner: </span>
                <span className="text-foreground font-medium">4.0 min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gottman Ratio & Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gottman 5:1 Ratio */}
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3>Gottman 5:1 Ratio</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Positive to negative interactions during conflict
            </p>

            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <svg className="w-48 h-48" viewBox="0 0 200 200" aria-label={`Gottman ratio: ${gottmanRatio} to 1`}>
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="16"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="16"
                    strokeDasharray={`${(gottmanRatio / 7) * 502.4} 502.4`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-4xl font-bold text-primary">{gottmanRatio}</div>
                  <div className="text-sm text-muted-foreground">to 1</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target:</span>
                <span className="text-foreground font-medium">5.0+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-500 font-medium">Healthy</span>
              </div>
            </div>
          </div>

          {/* Shared Calendar */}
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3>Shared Time Opportunities</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Overlapping free time this week
            </p>

            <div className="space-y-3">
              {sharedTimeSlots.map((slot, index) => (
                <button
                  key={index}
                  className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                  aria-label={`Schedule ${slot.activity} on ${slot.day} at ${slot.time}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{slot.day}</div>
                      <div className="text-sm text-muted-foreground">{slot.time}</div>
                    </div>
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {slot.duration}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{slot.activity}</div>
                </button>
              ))}
            </div>

            <button
              className="w-full mt-4 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="View full calendar"
            >
              View Full Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
