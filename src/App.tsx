import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  ChevronRight, 
  Info, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  GraduationCap,
  Scale,
  Maximize2,
  Minimize2,
  Menu,
  X,
  BookOpen,
  LogOut,
  Waves,
  Activity,
  Plus,
  Trash2,
  Table as TableIcon,
  Play
} from 'lucide-react';
import { cn } from './lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CorrectionMethod, CalculationResults, ConcreteCriteria, BatchReading } from './types';

const QUALITY_CRITERIA: ConcreteCriteria[] = [
  { velocity: '> 4.5', quality: 'Excellent' },
  { velocity: '3.5 – 4.5', quality: 'Good' },
  { velocity: '3.0 – 3.5', quality: 'Medium' },
  { velocity: '< 3.0', quality: 'Doubtful' },
];

const VS = 5.2; // Steel Velocity (km/s)

// Technical Visual Guide Component
const VisualGuide = ({ method }: { method: CorrectionMethod }) => {
  return (
    <div className="w-full bg-slate-900 border-2 border-dash-line p-4 rounded-none relative overflow-hidden group">
      <div className="absolute inset-0 blueprint-grid opacity-10 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-dash-accent uppercase tracking-widest bg-white px-2 py-0.5">Reference Diagram</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-dash-accent" />
            <div className="w-1 h-1 bg-dash-accent/50" />
            <div className="w-1 h-1 bg-dash-accent/20" />
          </div>
        </div>
        
        <div className="aspect-video bg-white/5 border border-white/10 flex items-center justify-center p-2">
          <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-lg">
            {/* Common Background: Concrete Block */}
            <rect x="40" y="20" width="120" height="80" fill="#ffffff10" stroke="#ffffff30" strokeWidth="1" strokeDasharray="2 1" />
            
            {/* Transducers */}
            <rect x="25" y="50" width="15" height="20" fill="#3b82f6" rx="2" />
            <rect x="160" y="50" width="15" height="20" fill="#3b82f6" rx="2" />
            
            {/* Main Pulse Path */}
            <line x1="40" y1="60" x2="160" y2="60" stroke="#ffffff40" strokeWidth="1" strokeDasharray="4 2" />

            {method === 'no-correction' && (
              <g>
                <circle cx="100" cy="60" r="4" fill="#ef4444" opacity="0.5" />
                <path d="M 40 60 L 160 60" stroke="#22c55e" strokeWidth="2" strokeDasharray="100" strokeDashoffset="0" />
                <text x="100" y="110" fill="#ffffff60" fontSize="8" textAnchor="middle" fontWeight="bold">Direct Path (L)</text>
              </g>
            )}

            {method === 'perpendicular' && (
              <g>
                {/* Rebar Cross Section */}
                <circle cx="100" cy="60" r="6" fill="#94a3b8" stroke="#ffffff" strokeWidth="1" />
                <line x1="100" y1="54" x2="100" y2="66" stroke="#ffffff" strokeWidth="0.5" />
                <line x1="94" y1="60" x2="106" y2="60" stroke="#ffffff" strokeWidth="0.5" />
                
                {/* Path Animation */}
                <path d="M 40 60 L 94 60" stroke="#22c55e" strokeWidth="2" />
                <path d="M 106 60 L 160 60" stroke="#22c55e" strokeWidth="2" />
                
                {/* Dimensions */}
                <path d="M 40 15 L 160 15" stroke="#3b82f6" strokeWidth="0.5" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                <text x="100" y="10" fill="#3b82f6" fontSize="8" textAnchor="middle" fontWeight="bold">Path Length (L)</text>
                <text x="100" y="50" fill="#ffffff80" fontSize="7" textAnchor="middle">Bar Diameter (Ls)</text>
              </g>
            )}

            {method === 'parallel' && (
              <g>
                {/* Parallel Rebar */}
                <rect x="40" y="75" width="120" height="4" fill="#94a3b8" rx="1" />
                
                {/* Pulse Deviation Path */}
                <path d="M 40 60 L 60 75 L 140 75 L 160 60" fill="none" stroke="#22c55e" strokeWidth="2" />
                
                {/* Offset Dimension */}
                <line x1="165" y1="60" x2="165" y2="75" stroke="#f59e0b" strokeWidth="1" />
                <text x="172" y="72" fill="#f59e0b" fontSize="8" fontWeight="bold">a</text>
                
                <text x="100" y="110" fill="#ffffff60" fontSize="8" textAnchor="middle">Rebar Offset from Center</text>
              </g>
            )}

            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="mt-3 flex gap-2">
          <div className={cn("p-1 rounded-sm border border-white/10", method === 'parallel' ? 'bg-orange-500/20' : 'bg-white/5')}>
            <span className="text-[8px] font-mono text-white/50">{method === 'parallel' ? 'OFFSET: a' : 'VS: 5.2 km/s'}</span>
          </div>
          <div className={cn("p-1 rounded-sm border border-white/10", method === 'perpendicular' ? 'bg-blue-500/20' : 'bg-white/5')}>
            <span className="text-[8px] font-mono text-white/50">{method === 'perpendicular' ? 'CORRECTION: Ls' : 'L-PATH'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Technical Visual Components
const UPVWaveAnimation = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Transducer - Transmitter (Left) - Round Type */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-dash-line flex items-center justify-center relative shadow-[0_0_20px_rgba(0,0,0,0.3)] group">
          <div className="absolute inset-2 rounded-full border border-white/10" />
          <div className="absolute -right-4 w-6 h-10 bg-slate-800 border-y-4 border-r-4 border-dash-line rounded-r-md" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter mb-1">TX-01</span>
            <div className="w-8 h-1 bg-dash-accent/50 animate-pulse rounded-full" />
          </div>
        </div>
        <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
      </div>

      {/* Transducer - Receiver (Right) - Round Type */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-dash-line flex items-center justify-center relative shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-2 rounded-full border border-white/10" />
          <div className="absolute -left-4 w-6 h-10 bg-slate-800 border-y-4 border-l-4 border-dash-line rounded-l-md" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter mb-1">RX-01</span>
            <div className="w-8 h-1 bg-green-500/50 rounded-full" />
          </div>
        </div>
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
      </div>

      {/* Propagating ECG-style Horizontal Wave */}
      <div className="absolute top-1/2 left-[180px] right-[180px] h-32 -translate-y-1/2 overflow-hidden opacity-50">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="w-[200%] h-full">
          <motion.path
            d="M 0 60 L 50 60 L 60 40 L 80 80 L 90 60 L 140 60 L 150 50 L 160 70 L 170 60 L 220 60 L 230 20 L 250 100 L 260 60 L 310 60 L 320 50 L 330 70 L 340 60 L 400 60 L 410 40 L 430 80 L 440 60 L 500 60"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeDasharray="500"
            initial={{ strokeDashoffset: 500 }}
            animate={{ strokeDashoffset: [-500, 500] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>
      
      {/* Scattering Physics (Reflection when hitting central card) */}
      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px]">
        {/* Top Scattered Pulse */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 w-32 h-2 bg-dash-accent/30 blur-lg"
          animate={{ 
            y: [0, -280],
            opacity: [0, 0.6, 0],
            scaleX: [1, 1.5],
            rotate: [-5, 5]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
        {/* Bottom Scattered Pulse */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 w-32 h-2 bg-dash-accent/30 blur-lg"
          animate={{ 
            y: [0, 280],
            opacity: [0, 0.6, 0],
            scaleX: [1, 1.5],
            rotate: [5, -5]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      </div>

      {/* Impact Indicators with synced delay */}
      <motion.div 
        animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute left-[160px] top-1/2 -translate-y-1/2 w-8 h-40 bg-blue-500/10 blur-xl rounded-full"
      />
      <motion.div 
        animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
        className="absolute right-[160px] top-1/2 -translate-y-1/2 w-8 h-40 bg-green-500/10 blur-xl rounded-full"
      />
    </div>
  );
};

// Main App Component
export default function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [method, setMethod] = useState<CorrectionMethod>('no-correction');
  const [pathLength, setPathLength] = useState<number>(150);
  const [pulseTime, setPulseTime] = useState<number>(35);
  const [offsetDistance, setOffsetDistance] = useState<number>(40);
  const [barDiameter, setBarDiameter] = useState<number>(12);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchData, setBatchData] = useState<BatchReading[]>([]);
  const [currentRowLocation, setCurrentRowLocation] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  }, []);

  const results = useMemo((): CalculationResults => {
    return calculateReadingResults(method, pathLength, pulseTime, offsetDistance, barDiameter);
  }, [method, pathLength, pulseTime, offsetDistance, barDiameter]);

  function calculateReadingResults(
    m: CorrectionMethod, 
    L: number, 
    T: number, 
    a: number, 
    Ls: number
  ): CalculationResults {
    const measuredV = L / T; // mm/µs = km/s
    let correctedV = measuredV;
    let quality = '';
    let gamma: number | undefined;
    let kFactor: number | undefined;
    let influenceMsg: string | undefined;
    let influencePresent: boolean | undefined;

    if (m === 'perpendicular') {
      gamma = 4.606 / VS;
      kFactor = 1 - (Ls / L) * (1 - gamma);
      correctedV = 0.9 * kFactor * measuredV;
    } else if (m === 'parallel') {
      const numerator = 2 * a * VS;
      const termInner = (T * VS) - L;
      const denominator = Math.sqrt(4 * (a ** 2) + (termInner ** 2));
      
      const initialCorrectedV = denominator !== 0 ? numerator / denominator : 0;
      
      const aRatio = a / L;
      const rhs = 0.5 * Math.sqrt((VS - initialCorrectedV) / (VS + initialCorrectedV));

      if (aRatio > rhs) {
        influenceMsg = "Influence of rebar correction is not needed";
        influencePresent = false;
        correctedV = measuredV;
      } else {
        influenceMsg = "Influence Present (Correction applied)";
        influencePresent = true;
        correctedV = 1.15 * initialCorrectedV;
      }
      gamma = initialCorrectedV / VS;
      kFactor = initialCorrectedV / measuredV;
    }

    if (correctedV > 4.5) quality = 'Excellent';
    else if (correctedV >= 3.5) quality = 'Good';
    else if (correctedV >= 3.0) quality = 'Medium';
    else quality = 'Doubtful';

    return { 
      measuredVelocity: measuredV, 
      correctedVelocity: correctedV, 
      quality,
      gamma,
      kFactor,
      influenceMsg,
      influencePresent
    };
  }

  const batchResults = useMemo(() => {
    return batchData.map(reading => ({
      ...reading,
      results: calculateReadingResults(
        reading.method, 
        reading.pathLength, 
        reading.pulseTime, 
        reading.offsetDistance || 0, 
        reading.barDiameter || 0
      )
    }));
  }, [batchData]);

  const batchStats = useMemo(() => {
    if (batchResults.length === 0) return null;
    const velocities = batchResults.map(r => r.results.correctedVelocity);
    const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const stdDev = Math.sqrt(velocities.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / velocities.length);
    
    const qualityCounts = batchResults.reduce((acc, r) => {
      acc[r.results.quality] = (acc[r.results.quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { mean, stdDev, qualityCounts };
  }, [batchResults]);

  const addToBatch = () => {
    const newEntry: BatchReading = {
      id: crypto.randomUUID(),
      location: currentRowLocation || `Reading ${batchData.length + 1}`,
      method,
      pathLength,
      pulseTime,
      offsetDistance: method === 'parallel' ? offsetDistance : undefined,
      barDiameter: method === 'perpendicular' ? barDiameter : undefined,
    };
    setBatchData([...batchData, newEntry]);
    setCurrentRowLocation('');
    showToast("Added to batch table");
  };

  const removeFromBatch = (id: string) => {
    setBatchData(batchData.filter(r => r.id !== id));
    showToast("Reading removed", "error");
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleString();

    // Header Helper
    const drawHeader = (title: string) => {
      doc.setFillColor(0, 102, 204);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('THIAGARAJAR COLLEGE OF ENGINEERING', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Department of Civil Engineering - Madurai', 105, 22, { align: 'center' });
      doc.text(title, 105, 30, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    if (isBatchMode && batchResults.length > 0) {
      drawHeader('Batch UPV Analysis Summary Report');
      
      doc.setFontSize(10);
      doc.text(`Date: ${dateStr}`, 20, 50);
      if (user) {
        doc.text(`Tester Name: ${user.name}`, 120, 50);
        doc.text(`Total Readings: ${batchResults.length}`, 120, 55);
      }

      // Statistical Summary Section
      if (batchStats) {
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 60, 170, 30, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Statistical Summary', 25, 68);
        doc.setFont('helvetica', 'normal');
        doc.text(`Mean Corrected Velocity: ${batchStats.mean.toFixed(3)} km/s`, 25, 76);
        doc.text(`Standard Deviation: ${batchStats.stdDev.toFixed(4)}`, 25, 83);
        
        const distribution = Object.entries(batchStats.qualityCounts)
          .map(([q, count]) => `${q}: ${count}`)
          .join(' | ');
        doc.text(`Distribution: ${distribution}`, 25, 90);
      }

      // Batch Table
      autoTable(doc, {
        startY: 100,
        head: [['#', 'Location', 'Method', 'L (mm)', 'T (µs)', 'Vc (km/s)', 'Quality']],
        body: batchResults.map((r, i) => [
          i + 1,
          r.location,
          r.method === 'no-correction' ? 'Raw' : r.method,
          r.pathLength,
          r.pulseTime,
          r.results.correctedVelocity.toFixed(3),
          r.results.quality
        ]),
        theme: 'striped',
        headStyles: { fillColor: [0, 102, 204] },
        styles: { fontSize: 8 }
      });

    } else {
      drawHeader('UPV Reinforcement Correction Report');

      doc.setFontSize(10);
      doc.text(`Date: ${dateStr}`, 20, 50);
      if (user) {
        doc.text(`Tester Name: ${user.name}`, 120, 50);
        doc.text(`Email: ${user.email}`, 120, 55);
      }

      // Section 1: Parameters (rest of single PDF logic...)
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 60, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('1. Test Parameters', 25, 65);

      doc.setFont('helvetica', 'normal');
      let yPos = 75;
      doc.text(`Path Length (L): ${pathLength} mm`, 25, yPos);
      yPos += 7;
      doc.text(`Pulse Time (T): ${pulseTime} µs`, 25, yPos);
      yPos += 7;
      doc.text(`Correction Type: ${method.charAt(0).toUpperCase() + method.slice(1)}`, 25, yPos);
      
      if (method === 'perpendicular') {
        yPos += 7;
        doc.text(`Bar Diameter (Ls): ${barDiameter} mm`, 25, yPos);
      } else if (method === 'parallel') {
        yPos += 7;
        doc.text(`Offset Distance (a): ${offsetDistance} mm`, 25, yPos);
      }

      // Section 2: Results
      yPos += 15;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('2. Calculation Results', 25, yPos);

      doc.setFont('helvetica', 'normal');
      yPos += 10;
      doc.text(`Measured Velocity: ${results.measuredVelocity.toFixed(3)} km/s`, 25, yPos);
      
      if (results.gamma !== undefined) {
        yPos += 7;
        doc.text(`Gamma (y): ${results.gamma.toFixed(4)}`, 25, yPos);
      }
      if (results.kFactor !== undefined) {
        yPos += 7;
        doc.text(`Correction Factor (k): ${results.kFactor.toFixed(4)}`, 25, yPos);
      }
      if (results.influenceMsg) {
        yPos += 7;
        doc.text(`Influence: ${results.influenceMsg}`, 25, yPos);
      }

      // Highlit Final Result
      yPos += 15;
      doc.setFillColor(255, 255, 153);
      doc.rect(20, yPos - 5, 170, 15, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Corrected Velocity (Vc): ${results.correctedVelocity.toFixed(3)} km/s`, 25, yPos + 4);

      yPos += 20;
      doc.setFontSize(12);
      doc.text(`Concrete Quality: ${results.quality}`, 25, yPos);

      // Criteria Table
      yPos += 15;
      autoTable(doc, {
        startY: yPos,
        head: [['Velocity (km/sec)', 'Quality']],
        body: QUALITY_CRITERIA.map(q => [q.velocity, q.quality]),
        theme: 'striped',
        headStyles: { fillColor: [0, 102, 204] }
      });
    }

    // Common Contact Information Section (Global at end of PDF)
    const finalTablePos = (doc as any).lastAutoTable?.finalY || 200;
    const footerY = finalTablePos + 15;
    
    if (footerY < 250) {
      doc.setFillColor(240, 240, 240);
      doc.rect(20, footerY, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Final Laboratory Verification', 25, footerY + 5);

      doc.setFont('helvetica', 'normal');
      let contactY = footerY + 15;
      doc.text('Institution: Thiagarajar College of Engineering (TCE)', 25, contactY);
      contactY += 6;
      doc.text('Department: Department of Civil Engineering', 25, contactY);
      contactY += 6;
      doc.text('Support Email: anandarao242004@gmail.com', 25, contactY);
    }

    // Global Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated laboratory report for internal research and educational purposes only.', 105, 285, { align: 'center' });

    doc.save(`UPV_Batch_Report_${new Date().getTime()}.pdf`);
  };

  const getQualityBg = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'bg-dash-success';
      case 'Good': return 'bg-dash-info';
      case 'Medium': return 'bg-dash-warning';
      case 'Doubtful': return 'bg-dash-error';
      default: return 'bg-dash-accent';
    }
  };

  return (
    <div className="min-h-screen flex text-dash-ink">
      <div className="concrete-layer" />
      <div className="blueprint-grid" />

      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-dash-bg p-6"
          >
            <UPVWaveAnimation />
            <div className="relative z-10 bg-white border-4 border-dash-line p-8 w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]">
              <div className="mb-8 text-center text-dash-ink">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">UPV Analysis Tool for Reinforced Concrete</h2>
              </div>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (tempName && tempEmail) {
                    setIsLoggingIn(true);
                    setUser({ name: tempName, email: tempEmail });
                    // Send welcome email via server
                    try {
                      const response = await fetch('/api/welcome-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: tempName, email: tempEmail }),
                      });
                      if (response.ok) {
                        showToast("Technical Guidelines transmitted to your email");
                      }
                    } catch (error) {
                      console.error("Failed to trigger welcome email:", error);
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="input-label">Your Name</label>
                  <input
                    required
                    disabled={isLoggingIn}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter full name"
                    className="dash-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="input-label">Email Address</label>
                  <input
                    required
                    disabled={isLoggingIn}
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="dash-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-dash-accent text-white py-4 font-black uppercase tracking-widest border-2 border-dash-line shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Initializing...
                    </>
                  ) : "ENTER TOOL"}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 w-full"
          >
            {/* Sidebar Mobile Toggle */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden vertical-rl fixed top-4 right-4 z-50 p-2 bg-white rounded-none shadow-md border-2 border-dash-line"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <aside className={cn(
              "fixed inset-y-0 left-0 z-40 w-[300px] bg-white border-r-2 border-dash-line p-6 flex flex-col gap-6 transition-transform lg:relative lg:translate-x-0 overflow-y-auto",
              sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
              <div className="pb-5 border-b-2 border-dash-line">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Laboratory Status: Online</span>
                </div>
                <h2 className="text-[14px] font-black text-dash-ink uppercase tracking-tighter mb-1 border-l-4 border-dash-accent pl-2">THIAGARAJAR COLLEGE OF ENGINEERING</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-2">Dept. of Civil Engineering</p>
              </div>

              <div className="flex bg-dash-bg p-1 border-2 border-dash-line">
                <button 
                  onClick={() => setIsBatchMode(false)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    !isBatchMode ? "bg-white text-dash-ink shadow-[2px_2px_0] border border-dash-line" : "text-white/50 hover:text-white"
                  )}
                >
                  <Activity size={12} />
                  Single
                </button>
                <button 
                  onClick={() => setIsBatchMode(true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    isBatchMode ? "bg-blue-600 text-white shadow-[2px_2px_0_rgba(0,0,0,0.3)] border border-blue-400" : "text-white/50 hover:text-white"
                  )}
                >
                  <TableIcon size={12} />
                  Batch
                </button>
              </div>

              <div className="py-2 mb-2 border-b-2 border-dash-line border-dashed">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Authenticated Analyst</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-dash-bg border border-dash-line flex items-center justify-center text-white font-black text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[12px] font-bold text-dash-ink truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-4">
                  <VisualGuide method={method} />
                </div>

                <div className="space-y-2">
                  <label className="input-label">Correction Orientation</label>
                  <select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value as CorrectionMethod)}
                    className="dash-input cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%234b5563%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                  >
                    <option value="no-correction">No Correction</option>
                    <option value="parallel">Parallel to the rebar</option>
                    <option value="perpendicular">Perpendicular to the rebar</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="input-label">Path Length (L)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={pathLength} 
                      onChange={(e) => setPathLength(Number(e.target.value))}
                      className="dash-input pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">mm</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="input-label">Pulse Time (T)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={pulseTime} 
                      onChange={(e) => setPulseTime(Number(e.target.value))}
                      className="dash-input pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">µs</span>
                  </div>
                </div>

                {(method === 'parallel' || method === 'perpendicular') && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 pt-4 border-t-2 border-dash-line border-dashed flex flex-col"
                  >
                    {method === 'parallel' && (
                      <div className="space-y-2">
                        <label className="input-label">Offset Distance (a)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={offsetDistance} 
                            onChange={(e) => setOffsetDistance(Number(e.target.value))}
                            className="dash-input pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">mm</span>
                        </div>
                      </div>
                    )}
                    {method === 'perpendicular' && (
                      <div className="space-y-2">
                        <label className="input-label">Bar Diameter (Ls)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={barDiameter} 
                            onChange={(e) => setBarDiameter(Number(e.target.value))}
                            className="dash-input pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">mm</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {isBatchMode && (
                  <div className="space-y-2 pt-2">
                    <label className="input-label">Member Location/ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Column B-12"
                      value={currentRowLocation} 
                      onChange={(e) => setCurrentRowLocation(e.target.value)}
                      className="dash-input"
                    />
                    <button 
                      onClick={addToBatch}
                      className="w-full mt-2 bg-blue-600 text-white py-3 font-black uppercase tracking-widest border-2 border-blue-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none translate-y-0 hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Commit to Batch
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-auto p-4 bg-dash-bg font-bold border-2 border-dash-line text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                <h3 className="text-[10px] font-black uppercase mb-2 tracking-widest bg-white text-dash-ink px-1 w-fit">Reference Manual</h3>
                <p className="text-[10px] leading-relaxed">
                  Steel Velocity (Vs) is fixed at 5.2 km/s. Standards: IS 516 : 2019 (Part 5), BS 1881:1986.
                </p>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto bg-dash-bg/50 backdrop-blur-sm">
              <header className="flex justify-between items-end shrink-0 border-b-4 border-dash-line pb-4">
                <div className="space-y-1">
                  <p className="text-[12px] font-black text-white bg-dash-line px-2 w-fit uppercase tracking-widest">
                    {greeting}, {user.name}
                  </p>
                  <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm uppercase italic whitespace-pre-line">UPV Analysis Tool{"\n"}for Reinforced Concrete</h1>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className={cn(
                    "border-2 border-dash-line px-4 py-1 font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]",
                    isBatchMode ? "bg-blue-600 text-white border-blue-400" : "bg-white text-dash-ink"
                  )}>
                    {isBatchMode ? `Batch Analysis Active (${batchResults.length})` : (method === 'no-correction' ? 'Raw Data' : 'Correction Active')}
                  </div>
                  <button 
                    onClick={() => setUser(null)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border-2 border-white/30 text-[10px] font-black uppercase text-white px-3 py-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <LogOut size={12} />
                    Logout Session
                  </button>
                </div>
              </header>

              {isBatchMode && batchStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                  <div className="metric-card bg-slate-900 border-dash-accent">
                    <span className="text-[10px] font-black text-dash-accent uppercase tracking-widest">Mean Velocity</span>
                    <div className="text-2xl font-black text-white">{batchStats.mean.toFixed(3)} <span className="text-xs opacity-50">km/s</span></div>
                  </div>
                  <div className="metric-card bg-slate-900 border-dash-accent">
                    <span className="text-[10px] font-black text-dash-accent uppercase tracking-widest">Std. Deviation</span>
                    <div className="text-2xl font-black text-white">{batchStats.stdDev.toFixed(4)}</div>
                  </div>
                  <div className="metric-card bg-slate-900 border-dash-accent md:col-span-2 flex flex-wrap gap-3 items-center">
                    <span className="text-[10px] font-black text-dash-accent uppercase tracking-widest w-full">Quality Distribution</span>
                    {Object.entries(batchStats.qualityCounts).map(([q, count]) => (
                      <div key={q} className="flex flex-col">
                        <span className="text-[8px] font-bold opacity-50 uppercase tracking-tighter">{q}</span>
                        <span className="text-sm font-black text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isBatchMode ? (
                <div className="bg-white border-4 border-dash-line rounded-none flex-1 flex flex-col overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] translate-y-1">
                  <div className="p-4 border-b-4 border-dash-line flex justify-between items-center bg-[#F9FAFB] shrink-0">
                    <div className="flex items-center gap-3">
                      <TableIcon size={18} className="text-dash-accent" />
                      <h4 className="text-[14px] font-black uppercase tracking-tight">Batch Inspection Log</h4>
                    </div>
                    {batchResults.length > 0 && (
                      <button 
                        onClick={() => setBatchData([])}
                        className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                      >
                        Reset Batch
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-auto flex-1">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="sticky-th text-left">Location / ID</th>
                          <th className="sticky-th text-left">Method</th>
                          <th className="sticky-th text-center">Parameters</th>
                          <th className="sticky-th text-right">Corrected Vc</th>
                          <th className="sticky-th text-center">Quality</th>
                          <th className="sticky-th text-center w-10">Op</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-20 text-center text-slate-300">
                              <div className="flex flex-col items-center gap-2">
                                <Activity size={48} className="opacity-20 translate-y-[-10px]" />
                                <p className="text-[11px] font-black uppercase tracking-[0.2em]">Ready for batch entry</p>
                                <p className="text-[10px]">Adjust parameters in sidebar and click "Commit to Batch"</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          batchResults.map((reading) => (
                            <tr key={reading.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <span className="text-[13px] font-black text-dash-ink">{reading.location}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{reading.method}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-center gap-3 text-[10px] font-mono font-bold text-slate-400">
                                  <span>L:{reading.pathLength}</span>
                                  <span>T:{reading.pulseTime}</span>
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <span className="text-[14px] font-black text-dash-accent font-mono">{reading.results.correctedVelocity.toFixed(3)}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-center">
                                  <span className={cn(
                                    "px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-white",
                                    getQualityBg(reading.results.quality)
                                  )}>
                                    {reading.results.quality}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <button 
                                  onClick={() => removeFromBatch(reading.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    <motion.div 
                      whileHover={{ scale: 1.02, translateY: -4 }}
                      className="metric-card group overflow-hidden relative cursor-default hover:border-dash-accent transition-colors"
                    >
                      <div className="scan-line" />
                      <span className="input-label group-hover:text-dash-accent transition-colors">Measured Velocity</span>
                      <div className="font-mono text-4xl font-black flex items-baseline gap-1 digital-flicker">
                        {results.measuredVelocity.toFixed(3)}
                        <span className="text-sm font-sans text-slate-400 font-bold uppercase">km/s</span>
                      </div>
                      <div className="absolute right-[-10px] bottom-[-10px] text-slate-100 opacity-20 pointer-events-none group-hover:scale-110 group-hover:text-dash-accent group-hover:opacity-10 transition-all duration-300">
                        <Scale size={60} strokeWidth={3} />
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02, translateY: -4 }}
                      className="metric-card group overflow-hidden relative cursor-default hover:border-dash-accent transition-colors"
                    >
                      <div className="scan-line" />
                      <span className="input-label group-hover:text-dash-accent transition-colors">Factor (K)</span>
                      <div className="font-mono text-4xl font-black digital-flicker">
                        {results.kFactor !== undefined ? results.kFactor.toFixed(3) : "1.000"}
                      </div>
                      <div className="absolute right-[-10px] bottom-[-10px] text-slate-100 opacity-20 pointer-events-none group-hover:scale-110 group-hover:text-dash-accent group-hover:opacity-10 transition-all duration-300">
                        <Calculator size={60} strokeWidth={3} />
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02, translateY: -4 }}
                      className="metric-card group overflow-hidden relative border-dash-accent cursor-default shadow-[8px_8px_0px_0px_rgba(37,99,235,0.1)]"
                    >
                      <div className="scan-line !bg-dash-accent" />
                      <span className="input-label text-dash-accent">Corrected Velocity (Vc)</span>
                      <div className="font-mono text-4xl font-black text-dash-accent digital-flicker">
                        {results.correctedVelocity.toFixed(3)}
                        <span className="text-sm font-sans text-slate-400 font-bold uppercase ml-1">km/s</span>
                      </div>
                      <div className="absolute right-[-10px] bottom-[-10px] text-dash-accent opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
                        <CheckCircle2 size={60} strokeWidth={3} />
                      </div>
                    </motion.div>
                  </div>

                  {results.influenceMsg && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "px-4 py-2 border-2 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]",
                        results.influencePresent === false 
                          ? "bg-white border-dash-line text-slate-500" 
                          : "bg-white border-dash-accent text-dash-accent"
                      )}
                    >
                      {results.influencePresent === false ? <Info size={14} /> : <AlertCircle size={14} />}
                      {results.influenceMsg}
                    </motion.div>
                  )}

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "p-8 rounded-none border-4 border-dash-line flex items-center justify-between text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-colors duration-500 shrink-0 relative overflow-hidden group/quality cursor-default",
                      getQualityBg(results.quality)
                    )}
                  >
                    <div className="absolute inset-0 blueprint-grid opacity-10 pointer-events-none" />
                    <div className="relative z-10 space-y-1">
                      <h3 className="text-[14px] uppercase font-black opacity-80 tracking-tighter">Diagnostic Result</h3>
                      <h2 className="text-5xl font-black tracking-tighter uppercase italic group-hover/quality:translate-x-2 transition-transform duration-500">{results.quality} QUALITY</h2>
                    </div>
                    <motion.div 
                      animate={results.quality === 'Doubtful' ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="relative z-10 p-4 border-4 border-white/20"
                    >
                      {results.quality === 'Doubtful' || results.quality === 'Medium' ? <AlertCircle size={48} strokeWidth={3} /> : <CheckCircle2 size={48} strokeWidth={3} />}
                    </motion.div>
                  </motion.div>

                  <div className="bg-white border-4 border-dash-line rounded-none flex-1 flex flex-col overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                    <div className="p-4 border-b-4 border-dash-line flex justify-between items-center bg-[#F9FAFB] shrink-0">
                      <h4 className="text-[14px] font-black uppercase tracking-tight">Concrete Quality Classification Standard</h4>
                      <span className="text-[11px] font-black text-white bg-dash-line px-2 uppercase tracking-widest">IS 516 : 2019 (Part 5)</span>
                    </div>
                    
                    <div className="overflow-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left bg-[#F9FAFB] p-4 text-[11px] font-serif italic text-slate-600 border-b-2 border-dash-line uppercase tracking-widest">Pulse Velocity (km/s)</th>
                            <th className="text-left bg-[#F9FAFB] p-4 text-[11px] font-serif italic text-slate-600 border-b-2 border-dash-line uppercase tracking-widest">Condition</th>
                            <th className="text-left bg-[#F9FAFB] p-4 text-[11px] font-serif italic text-slate-600 border-b-2 border-dash-line uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {QUALITY_CRITERIA.map((item, idx) => {
                            const isActive = results.quality === item.quality;
                            return (
                              <tr 
                                key={idx} 
                                className={cn(
                                  "transition-all duration-300 border-b border-slate-100",
                                  isActive ? "bg-slate-100" : "hover:bg-slate-50 cursor-default"
                                )}
                              >
                                <td className={cn("p-4 text-[14px] font-mono font-bold", isActive && "text-blue-700")}>
                                  {item.velocity}
                                </td>
                                <td className={cn("p-4 text-[14px] font-black uppercase italic", isActive && "text-blue-700")}>
                                  {item.quality}
                                </td>
                                <td className={cn("p-4 text-[14px] uppercase tracking-tighter text-[11px] font-black", isActive ? "text-blue-700" : "text-slate-200")}>
                                  {isActive ? (
                                    <span className="flex items-center gap-2">
                                      <motion.span 
                                        animate={{ opacity: [1, 0.4, 1] }} 
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-1.5 h-1.5 bg-blue-700 rounded-full" 
                                      />
                                      TARGET REACHED
                                    </span>
                                  ) : idx === 0 ? "VERIFIED" : "--"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-4 pt-4 shrink-0">
                <button 
                  onClick={() => {
                    generatePDF();
                    showToast("Laboratory report generated", "success");
                  }}
                  className="group bg-blue-700 text-white px-8 py-4 rounded-none font-black text-[14px] uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-3 border-2 border-dash-line"
                >
                  <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                  {isBatchMode ? 'Download Batch Report' : 'Download PDF Report'}
                </button>
                <button 
                  onClick={() => {
                    if (isBatchMode) {
                      setBatchData([]);
                    } else {
                      setPathLength(150);
                      setPulseTime(35);
                      setOffsetDistance(40);
                      setBarDiameter(12);
                      setMethod('no-correction');
                    }
                    showToast("System metrics reset", "success");
                  }}
                  className="bg-white border-2 border-dash-line text-dash-ink px-8 py-4 rounded-none font-black text-[14px] uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-3"
                >
                  {isBatchMode ? 'Clear All Batch Data' : 'Reset Lab Metrics'}
                </button>
              </div>

        <div className="mt-8 pt-8 border-t-2 border-dash-line border-dashed flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-white/60">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-white font-black uppercase tracking-widest mb-1 opacity-100">Institution</span>
              <span>Thiagarajar College of Engineering</span>
              <span>Madurai, Tamil Nadu</span>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div className="flex flex-col">
              <span className="text-white font-black uppercase tracking-widest mb-1 opacity-100">Department</span>
              <span>Civil Engineering - Laboratory</span>
              <span>Reinforced Concrete Analysis</span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-white font-black uppercase tracking-widest mb-1 opacity-100">System Information</span>
            <span>Version 2.4.0 (TCE-CIVIL)</span>
            <span>Standards: IS 516 (Part 5), BS 1881</span>
          </div>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 border-4 border-dash-line font-black uppercase tracking-widest text-[11px] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] flex items-center gap-3",
                toast.type === 'success' ? "bg-dash-success text-white" : "bg-dash-error text-white"
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
