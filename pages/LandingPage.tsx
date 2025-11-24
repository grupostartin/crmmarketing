import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  CheckSquare, 
  Users, 
  FileText, 
  ArrowRight, 
  Zap, 
  Menu, 
  X, 
  Filter,
  Kanban,
  MessageCircle
} from 'lucide-react';


// --- Hooks ---


const useScrollY = () => {
  const [scrollY, setScrollY] = useState(0);


  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return scrollY;
};


// --- Components ---


const PixelButton = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick 
}: { 
  children?: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'; 
  className?: string;
  onClick?: () => void;
}) => {
  const baseStyles = "font-body text-xl font-bold border-2 border-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none px-6 py-2 uppercase tracking-wide hover:scale-105";
  
  const variants = {
    primary: "bg-primary text-black shadow-pixel hover:shadow-pixel-white hover:bg-[#0fd4b4]",
    secondary: "bg-secondary text-white shadow-pixel hover:shadow-pixel-white hover:bg-[#004ec2]",
    outline: "bg-transparent text-primary border-primary shadow-[4px_4px_0px_0px_#13ecc8] hover:bg-primary/10 hover:shadow-[4px_4px_0px_0px_#ffffff]",
    danger: "bg-retro-red text-white shadow-pixel hover:shadow-pixel-white" // Added fallback for existing app consistency if needed, but landing page has its own palette
  };

  // Fallback for variants not in the LP but might be passed or if TS complains
  const variantClass = variants[variant as keyof typeof variants] || variants.primary;

  return (
    <button onClick={onClick} className={`${baseStyles} ${variantClass} ${className}`}>
      {children}
    </button>
  );
};


const Typewriter = ({ 
  text, 
  speed = 50, 
  startDelay = 0, 
  className = "", 
  cursor = false, 
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  startDelay?: number; 
  className?: string; 
  cursor?: boolean;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);


  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);


  useEffect(() => {
    if (!started) return;
    
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setCompleted(true);
        if (onComplete) onComplete();
      }
    }, speed);


    return () => clearInterval(interval);
  }, [started, text, speed, onComplete]);


  return (
    <span className={className}>
      {displayedText}
      {cursor && !completed && <span className="animate-pulse">_</span>}
    </span>
  );
};


const RevealOnScroll: React.FC<{ 
  children?: React.ReactNode; 
  className?: string; 
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}> = ({ 
  children, 
  className = "", 
  delay = 0,
  direction = 'up'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );


    if (ref.current) observer.observe(ref.current);


    return () => observer.disconnect();
  }, []);


  const getTransform = () => {
    if (isVisible) return "opacity-100 translate-x-0 translate-y-0";
    
    switch (direction) {
      case 'up': return "opacity-0 translate-y-12";
      case 'down': return "opacity-0 -translate-y-12";
      case 'left': return "opacity-0 -translate-x-12";
      case 'right': return "opacity-0 translate-x-12";
      default: return "opacity-0 translate-y-12";
    }
  };


  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
};


const BackgroundGrid = () => {
  const scrollY = useScrollY();
  
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Moving Grid Floor with Parallax */}
      <div 
        className="absolute inset-0 [transform:perspective(500px)_rotateX(60deg)] origin-top h-[150%] -top-[25%]"
        style={{
          transform: `perspective(500px) rotateX(60deg) translateY(${scrollY * 0.1}px)` 
        }}
      >
        <div 
          className="absolute inset-0 animate-grid-flow"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(48, 54, 61, 0.6) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(48, 54, 61, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      
      {/* Gradient Mask for fading out */}
      <div className="absolute inset-0 bg-gradient-to-b from-bgDark via-transparent to-bgDark" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0D1117_90%)]" />
    </div>
  );
};


const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  color = "text-primary"
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  color?: string;
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;


    // Calculate rotation degrees (max 10 degrees)
    const rotateX = ((y - centerY) / centerY) * -10; 
    const rotateY = ((x - centerX) / centerX) * 10;


    setRotation({ x: rotateX, y: rotateY });
    setIsHovering(true);
  };


  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovering(false);
  };


  return (
    <div className="perspective-1000 h-full">
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
        }}
        className="bg-cardDark border-4 border-black shadow-pixel p-6 flex flex-col gap-4 group cursor-default relative z-10 h-full backface-hidden preserve-3d"
      >
        <div className={`w-12 h-12 border-2 border-black shadow-pixel-sm flex items-center justify-center bg-bgDark ${color} group-hover:scale-110 transition-transform duration-200 [transform:translateZ(20px)]`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <h3 className="font-display text-lg leading-tight mt-2 [transform:translateZ(10px)]">{title}</h3>
        <p className="font-body text-xl text-gray-400 leading-relaxed [transform:translateZ(5px)]">{description}</p>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </div>
  );
};


const StepCard = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="relative pl-8 md:pl-0 group">
    <div className="md:hidden absolute left-0 top-0 bottom-0 w-1 bg-borderDark group-hover:bg-primary transition-colors duration-300"></div>
    <div className="flex flex-col gap-2 transition-transform duration-300 group-hover:translate-x-2">
      <span className="font-display text-4xl text-primary opacity-50 group-hover:opacity-100 transition-opacity">{number}</span>
      <h3 className="font-display text-xl">{title}</h3>
      <p className="font-body text-xl text-gray-400">{text}</p>
    </div>
  </div>
);


const FloatingWhatsAppButton = () => {
  return (
    <a 
      href="https://wa.me/5531982781618" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25D366] text-white border-2 border-black shadow-pixel hover:shadow-pixel-white hover:scale-105 transition-all duration-200 px-4 py-3"
    >
      <MessageCircle size={24} color="white" fill="white" />
      <span className="font-body text-xl font-bold uppercase tracking-wide">Precisa de ajuda?</span>
    </a>
  );
};


// --- Main Layout ---


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);


  return (
    <nav className="sticky top-0 z-50 bg-bgDark/90 backdrop-blur-md border-b-4 border-black py-4 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary border-2 border-black shadow-pixel-sm"></div>
          <div className="flex flex-col">
            <span className="font-display text-lg text-white">StartinOS</span>
            <span className="font-body text-gray-400 text-sm leading-none">Marketing CRM</span>
          </div>
        </div>


        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-body text-xl">
          <a href="#features" className="text-white hover:text-primary hover:underline decoration-2 underline-offset-4 transition-colors">Funcionalidades</a>
          <a href="#how-it-works" className="text-white hover:text-primary hover:underline decoration-2 underline-offset-4 transition-colors">Como Funciona</a>
          <a href="#pricing" className="text-white hover:text-primary hover:underline decoration-2 underline-offset-4 transition-colors">Planos</a>
          <PixelButton className="text-lg py-1 px-4" onClick={() => window.location.href = '/login'}>Login</PixelButton>
        </div>


        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white hover:text-primary transition-colors" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>


      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-cardDark border-b-4 border-black p-6 flex flex-col gap-4 font-body text-2xl shadow-pixel">
          <a href="#features" onClick={() => setIsOpen(false)} className="text-white hover:text-primary">Funcionalidades</a>
          <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-white hover:text-primary">Como Funciona</a>
          <a href="#pricing" onClick={() => setIsOpen(false)} className="text-white hover:text-primary">Planos</a>
          <PixelButton className="w-full" onClick={() => window.location.href = '/login'}>Login</PixelButton>
        </div>
      )}
    </nav>
  );
};


const Hero = () => {
  const [line1Done, setLine1Done] = useState(false);
  const scrollY = useScrollY();
  const dashboardRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (dashboardRef.current) {
      // Rotation logic: Tilt backward (X) and rotate slightly sideways (Y) as you scroll down
      // Limit the rotation so it doesn't flip over completely
      const rotateX = Math.min(scrollY * 0.05, 30); // Max 30 deg back
      const rotateY = Math.min(scrollY * 0.08, 15); // Max 15 deg side
      const scale = Math.max(1 - scrollY * 0.0005, 0.9); // Slight shrink
      
      dashboardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(-${rotateY}deg) scale(${scale})`;
    }
  }, [scrollY]);


  return (
    <section className="relative pt-20 pb-48 px-6 overflow-hidden perspective-1000">
      <BackgroundGrid />


      <div className="max-w-5xl mx-auto text-center relative z-10">
        <RevealOnScroll className="inline-block bg-cardDark border-2 border-primary px-3 py-1 mb-8 shadow-pixel-sm hover:scale-105 transition-transform duration-200 cursor-default">
          <span className="font-body text-primary text-lg tracking-widest">NOVO: QUIZ BUILDER 1.0</span>
        </RevealOnScroll>
        
        {/* Parallax Effect on Text */}
        <div style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-tight mb-8 text-white min-h-[160px] md:min-h-[180px] drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <Typewriter 
              text="O CRM Definitivo para" 
              speed={40} 
              onComplete={() => setLine1Done(true)} 
            />
            <br/>
            {line1Done && (
              <span className="text-primary text-shadow-pixel">
                <Typewriter 
                  text="Agências de Marketing" 
                  speed={40} 
                  startDelay={200}
                  cursor
                />
              </span>
            )}
          </h1>
          
          <RevealOnScroll delay={1500}>
            <p className="font-body text-2xl md:text-3xl text-gray-400 mb-12 max-w-3xl mx-auto drop-shadow-md">
              Pare de perder tempo com planilhas. Centralize leads, automatize a qualificação com Quizzes e gerencie contratos em um só lugar.
            </p>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center pointer-events-auto">
              <PixelButton className="w-full md:w-auto text-2xl px-8 py-4 flex items-center gap-3" onClick={() => window.location.href = '/signup'}>
                Começar Gratuitamente <ArrowRight size={24} />
              </PixelButton>
              <PixelButton variant="outline" className="w-full md:w-auto text-2xl px-8 py-4" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver Demo
              </PixelButton>
            </div>
          </RevealOnScroll>
        </div>


        {/* 3D Dashboard Container */}
        <RevealOnScroll delay={1800}>
          <div className="relative mt-20 mx-auto max-w-4xl preserve-3d">
            {/* Glow Effect behind the dashboard */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary/20 blur-[60px] rounded-full pointer-events-none z-0"></div>


            {/* The 3D Object */}
            <div 
              ref={dashboardRef}
              className="relative z-10 origin-center transition-transform duration-100 ease-out preserve-3d threed-thick"
              style={{ transform: 'rotateX(0deg) rotateY(0deg)' }}
            >
              <div className="bg-bgDark border-4 border-black p-2 shadow-pixel md:p-4 backface-hidden">
                 {/* Fake Browser Bar */}
                <div className="bg-borderDark h-8 mb-2 flex items-center px-4 gap-2 border-b-4 border-black">
                   <div className="w-3 h-3 bg-red-500 border border-black hover:bg-red-400"></div>
                   <div className="w-3 h-3 bg-yellow-500 border border-black hover:bg-yellow-400"></div>
                   <div className="w-3 h-3 bg-green-500 border border-black hover:bg-green-400"></div>
                   <div className="ml-4 bg-bgDark h-5 w-2/3 border border-black"></div>
                   <div className="ml-auto w-12 h-5 bg-primary border border-black"></div>
                </div>
                {/* Content Mock */}
                <div className="grid grid-cols-12 gap-4 h-64 md:h-96 bg-cardDark p-4 overflow-hidden relative">
                   {/* Sidebar */}
                   <div className="hidden md:block col-span-2 border-r-4 border-black pr-4 space-y-4">
                      <div className="h-4 w-full bg-borderDark"></div>
                      <div className="h-4 w-3/4 bg-borderDark"></div>
                      <div className="h-4 w-full bg-primary mt-8 shadow-[2px_2px_0_black]"></div>
                      <div className="h-4 w-full bg-borderDark"></div>
                   </div>
                   {/* Main */}
                   <div className="col-span-12 md:col-span-10 space-y-6">
                      <div className="flex justify-between items-end">
                         <div className="h-10 w-1/3 bg-white border-2 border-black"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                         {/* Card 1 - Leads */}
                         <div className="h-24 bg-bgDark border-4 border-black shadow-pixel-sm p-4 hover:border-primary transition-colors flex flex-col justify-center items-center group relative overflow-hidden">
                            <div className="text-primary font-display text-xs mb-2 relative z-10">LEADS</div>
                            <div className="text-white font-body text-4xl relative z-10">128</div>
                            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200"></div>
                         </div>
                         {/* Card 2 - Conversão */}
                         <div className="h-24 bg-bgDark border-4 border-black shadow-pixel-sm p-4 hover:border-accentYellow transition-colors flex flex-col justify-center items-center group relative overflow-hidden">
                             <div className="text-accentYellow font-display text-xs mb-2 relative z-10">CONVERSÃO</div>
                            <div className="text-white font-body text-4xl relative z-10">62%</div>
                            <div className="absolute inset-0 bg-accentYellow/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200"></div>
                         </div>
                         {/* Card 3 - MRR */}
                         <div className="h-24 bg-bgDark border-4 border-black shadow-pixel-sm p-4 hover:border-accentPink transition-colors flex flex-col justify-center items-center group relative overflow-hidden">
                            <div className="text-accentPink font-display text-xs mb-2 relative z-10">MRR</div>
                            <div className="text-white font-body text-4xl relative z-10">$85k</div>
                            <div className="absolute inset-0 bg-accentPink/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200"></div>
                         </div>
                      </div>
                      {/* Pipeline columns (3D parallax effect internally) */}
                      <div className="grid grid-cols-3 gap-4 h-full mt-4 opacity-50 [transform-style:preserve-3d]">
                         <div className="bg-borderDark h-32 border-2 border-black [transform:translateZ(10px)] shadow-lg"></div>
                         <div className="bg-borderDark h-32 border-2 border-black [transform:translateZ(10px)] shadow-lg"></div>
                         <div className="bg-borderDark h-32 border-2 border-black [transform:translateZ(10px)] shadow-lg"></div>
                      </div>
                   </div>
                   
                   {/* Overlay Badge */}
                   <div className="absolute bottom-4 right-4 bg-secondary text-white font-display text-xs px-2 py-1 border-2 border-black shadow-pixel animate-pulse z-20">
                      UI PREVIEW
                   </div>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};


const Features = () => {
  const scrollY = useScrollY();


  return (
    <section id="features" className="bg-bgDark py-24 border-t-4 border-black relative overflow-hidden">
       {/* Small floating particles with Parallax */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-4 h-4 bg-primary/20 border border-primary animate-pulse"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-3 h-3 bg-secondary/20 border border-secondary animate-bounce"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        ></div>
        <div 
          className="absolute bottom-20 left-1/4 w-6 h-6 bg-accentPink/10 border border-accentPink rounded-full"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        ></div>
      </div>


      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <RevealOnScroll className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl text-white mb-4">
            Tudo o que sua Agência Precisa
          </h2>
          <p className="font-body text-2xl text-gray-400">
            Deixe as ferramentas genéricas para trás.
          </p>
        </RevealOnScroll>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: CheckSquare,
              title: "Quiz Builder Nativo",
              description: "Crie formulários interativos que qualificam seus leads automaticamente antes mesmo de falar com eles. Separe curiosos de clientes.",
              color: "text-accentPink"
            },
            {
              icon: Kanban,
              title: "Pipeline Visual",
              description: "Um quadro Kanban focado em serviços. Arraste cards, agende follow-ups e nunca mais perca um deal por falta de contato.",
              color: "text-primary"
            },
            {
              icon: FileText,
              title: "Gestão de Contratos",
              description: "Acompanhe renovações, MRR ativo e churn rate. Saiba exatamente quando um contrato está para vencer.",
              color: "text-accentYellow"
            },
            {
              icon: Filter,
              title: "Filtros Inteligentes",
              description: "Segmente sua base de contatos por temperatura (Frio, Morno, Quente) baseada na pontuação do Quiz.",
              color: "text-secondary"
            },
            {
              icon: BarChart3,
              title: "Analytics Real-time",
              description: "Dashboards executivos com estilo retro para mostrar o ROI e a performance do time de vendas.",
              color: "text-white"
            },
            {
              icon: Users,
              title: "Client Success",
              description: "Área dedicada para onboarding e acompanhamento da satisfação do cliente (NPS) pós-venda.",
              color: "text-green-400"
            }
          ].map((feature, index) => (
            <RevealOnScroll key={index} delay={index * 100} direction="up">
              <FeatureCard {...feature} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};


const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-cardDark py-24 border-t-4 border-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="lg:w-1/2">
              <RevealOnScroll direction="left">
                <div className="bg-primary text-black font-display inline-block px-2 py-1 text-sm border-2 border-black shadow-pixel-sm mb-4">
                  FLUXO AUTOMATIZADO
                </div>
                <h2 className="font-display text-3xl md:text-4xl text-white mb-8 leading-relaxed">
                  Do Lead ao Contrato em <span className="text-primary decoration-4 underline underline-offset-4">3 Passos</span>
                </h2>
              </RevealOnScroll>
              
              <div className="space-y-12">
                {[
                  { number: "01", title: "Captura & Qualificação", text: "O lead responde ao seu Quiz personalizado. O StartinOS calcula o score e define se é um lead quente." },
                  { number: "02", title: "Negociação no Pipeline", text: "Leads qualificados caem direto na coluna 'Novo' do seu Kanban. Seu time recebe um alerta." },
                  { number: "03", title: "Fechamento & Onboarding", text: "Ganhou o deal? Converta em contrato com um clique e inicie o processo de onboarding do cliente." }
                ].map((step, index) => (
                  <RevealOnScroll key={index} delay={index * 150} direction="left">
                    <StepCard {...step} />
                  </RevealOnScroll>
                ))}
              </div>
          </div>


          <div className="lg:w-1/2 w-full">
            <RevealOnScroll delay={300} direction="right">
              <div className="bg-bgDark p-6 border-4 border-black shadow-pixel relative hover:shadow-pixel-white transition-all duration-300 transform hover:-translate-y-2">
                {/* Abstract Representation of the Flow */}
                <div className="flex flex-col gap-4">
                   {/* Step 1 Box */}
                   <div className="bg-accentPink/20 border-2 border-accentPink p-4 text-accentPink font-body text-xl hover:scale-105 hover:bg-accentPink/30 transition-all duration-200 cursor-pointer shadow-pixel-sm hover:shadow-pixel-white">
                      <div className="flex justify-between mb-2">
                         <span>QUIZ SCORE: 95/100</span>
                         <Zap size={20} fill="currentColor" />
                      </div>
                      <div className="h-2 bg-black/50 w-full mb-1">
                         <div className="h-full bg-accentPink w-[95%]"></div>
                      </div>
                      <span>Status: SUPER QUENTE 🔥</span>
                   </div>
                   
                   <div className="flex justify-center">
                      <span className="material-symbols-outlined text-white opacity-50 animate-bounce">⬇</span> 
                   </div>


                   {/* Step 2 Box */}
                   <div className="bg-bgDark border-2 border-white p-4 text-white font-body text-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow-pixel-sm hover:shadow-pixel-white">
                      <div className="flex gap-2 mb-2">
                         <div className="w-4 h-4 rounded-full bg-red-500 border border-black"></div>
                         <div className="w-4 h-4 rounded-full bg-yellow-500 border border-black"></div>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                         <div className="min-w-[100px] h-20 border-2 border-gray-700 bg-gray-900 p-2 text-sm text-gray-500">
                            To-Do
                         </div>
                         <div className="min-w-[100px] h-20 border-2 border-primary bg-primary/10 p-2 text-sm text-primary">
                            <div className="bg-primary text-black px-1 text-xs mb-1">NOVO</div>
                            Lead #402
                         </div>
                         <div className="min-w-[100px] h-20 border-2 border-gray-700 bg-gray-900 p-2 text-sm text-gray-500">
                            Done
                         </div>
                      </div>
                   </div>


                   <div className="flex justify-center">
                      <span className="material-symbols-outlined text-white opacity-50 animate-bounce">⬇</span> 
                   </div>


                   {/* Step 3 Box */}
                   <div className="bg-accentYellow/20 border-2 border-accentYellow p-4 text-accentYellow font-body text-xl flex items-center justify-between hover:scale-105 hover:bg-accentYellow/30 transition-all duration-200 cursor-pointer shadow-pixel-sm hover:shadow-pixel-white">
                      <div className="flex items-center gap-3">
                         <FileText size={24} />
                         <span>CONTRATO ATIVO</span>
                      </div>
                      <span className="bg-accentYellow text-black px-2 py-0.5 text-lg font-bold border border-black">R$ 5k/mês</span>
                   </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>


        </div>
      </div>
    </section>
  );
};


const Pricing = () => {
  return (
    <section id="pricing" className="bg-bgDark py-24 border-t-4 border-black relative overflow-hidden">
      <BackgroundGrid />
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <RevealOnScroll className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl text-white mb-4">
            Investimento
          </h2>
          <p className="font-body text-2xl text-gray-400">
            Comece grátis. Escale quando quiser.
          </p>
        </RevealOnScroll>


        <div className="flex flex-col md:flex-row justify-center gap-8 items-stretch">
          
          {/* Free Plan */}
          <RevealOnScroll className="w-full md:w-1/2 flex flex-col" direction="up">
            <div className="bg-bgDark border-4 border-gray-700 p-8 flex flex-col h-full transition-all duration-300 hover:scale-105 hover:border-white hover:shadow-pixel-white hover:bg-cardDark cursor-default">
               <h3 className="font-display text-2xl text-gray-400 mb-2">Grátis</h3>
               <div className="font-display text-4xl text-white mb-6">R$ 0<span className="text-xl text-gray-500">/mês</span></div>
               <ul className="font-body text-xl text-gray-400 space-y-4 mb-8 flex-1">
                 <li className="flex items-center gap-2"><CheckSquare size={16} /> 1 Quiz (Não editável)</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} /> Até 5 Clientes</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} /> Até 5 Contratos</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} /> Até 2 Usuários</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} /> Marca d'água no Quiz</li>
               </ul>
               <PixelButton variant="outline" className="w-full text-center py-3" onClick={() => window.location.href = '/signup'}>Começar Grátis</PixelButton>
            </div>
          </RevealOnScroll>


          {/* Pro Plan */}
          <RevealOnScroll delay={150} className="w-full md:w-1/2 flex flex-col" direction="up">
            <div className="bg-cardDark border-4 border-primary shadow-pixel p-8 flex flex-col h-full relative transform md:-translate-y-4 transition-all duration-300 hover:scale-[1.05] hover:shadow-pixel-white z-10 cursor-default animate-neon-pulse">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-black font-display text-xs px-3 py-1 border-2 border-black">ILIMITADO</div>
               <h3 className="font-display text-2xl text-primary mb-2">Pro</h3>
               <div className="font-display text-4xl text-white mb-6">R$ 97,90<span className="text-xl text-gray-500">/mês</span></div>
               <ul className="font-body text-xl text-white space-y-4 mb-8 flex-1">
                 <li className="flex items-center gap-2"><CheckSquare size={16} className="text-primary"/> Acesso Ilimitado à Plataforma</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} className="text-primary"/> Quizzes Ilimitados & Editáveis</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} className="text-primary"/> Clientes & Contratos Ilimitados</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} className="text-primary"/> Até 10 Usuários</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} className="text-primary"/> Sem Marca d'água</li>
                 <li className="flex items-center gap-2"><CheckSquare size={16} className="text-primary"/> Suporte Prioritário</li>
               </ul>
               <PixelButton variant="primary" className="w-full text-center py-3 shadow-[0_0_20px_rgba(19,236,200,0.6)]" onClick={() => window.location.href = '/signup'}>Assinar Pro</PixelButton>
            </div>
          </RevealOnScroll>


        </div>
      </div>
    </section>
  );
};


const Footer = () => {
  return (
    <footer className="bg-black py-12 border-t-4 border-gray-800">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 transition-colors"></div>
          <span className="font-display text-gray-400">StartinOS &copy; 2025</span>
        </div>


        <div className="flex gap-8 font-body text-xl text-gray-500">
          <a href="#" className="hover:text-primary transition-colors hover:scale-105 inline-block">Termos</a>
          <a href="#" className="hover:text-primary transition-colors hover:scale-105 inline-block">Privacidade</a>
          <a href="#" className="hover:text-primary transition-colors hover:scale-105 inline-block">Suporte</a>
          <a href="#" className="hover:text-primary transition-colors hover:scale-105 inline-block">Twitter</a>
        </div>


      </div>
    </footer>
  );
};


const LandingPage = () => {
  return (
    <div className="min-h-screen bg-bgDark text-gray-100 selection:bg-primary selection:text-black font-sans">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
};


export default LandingPage;
