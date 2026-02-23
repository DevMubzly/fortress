const NetworkBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Animated glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      {/* Network nodes SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(250 91% 60%)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        
        {/* Connection lines */}
        <g stroke="url(#lineGradient)" strokeWidth="1" fill="none">
          <path d="M100,200 Q300,100 500,250" className="animate-dash" strokeDasharray="10 5" />
          <path d="M200,400 Q400,300 600,450" className="animate-dash" strokeDasharray="10 5" style={{ animationDelay: '1s' }} />
          <path d="M50,300 Q250,400 450,350" className="animate-dash" strokeDasharray="10 5" style={{ animationDelay: '2s' }} />
          <path d="M300,100 Q500,200 700,150" className="animate-dash" strokeDasharray="10 5" style={{ animationDelay: '3s' }} />
          <path d="M150,500 Q350,400 550,550" className="animate-dash" strokeDasharray="10 5" style={{ animationDelay: '4s' }} />
        </g>
        
        {/* Nodes */}
        <g fill="hsl(217 91% 60%)">
          <circle cx="100" cy="200" r="4" className="animate-pulse-slow" />
          <circle cx="500" cy="250" r="3" className="animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
          <circle cx="200" cy="400" r="5" className="animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <circle cx="600" cy="450" r="3" className="animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <circle cx="50" cy="300" r="4" className="animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <circle cx="450" cy="350" r="3" className="animate-pulse-slow" style={{ animationDelay: '2.5s' }} />
          <circle cx="300" cy="100" r="5" className="animate-pulse-slow" style={{ animationDelay: '3s' }} />
          <circle cx="700" cy="150" r="4" className="animate-pulse-slow" style={{ animationDelay: '3.5s' }} />
          <circle cx="150" cy="500" r="3" className="animate-pulse-slow" style={{ animationDelay: '4s' }} />
          <circle cx="550" cy="550" r="4" className="animate-pulse-slow" style={{ animationDelay: '4.5s' }} />
        </g>
      </svg>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
};

export default NetworkBackground;
