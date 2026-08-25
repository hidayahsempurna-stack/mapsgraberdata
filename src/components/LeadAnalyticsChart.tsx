import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { BusinessLead } from '../types';
import { extractCityFromAddress } from '../utils/whatsappTemplates';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  MapPin, 
  Stethoscope, 
  Globe, 
  MessageSquare, 
  CheckCircle2 
} from 'lucide-react';

interface LeadAnalyticsChartProps {
  leads: BusinessLead[];
}

const CATEGORY_COLORS = ['#D4FF44', '#58A6FF', '#7EE787', '#FFA657', '#F0883E', '#A371F7', '#FF7B72', '#79C0FF'];
const STATUS_COLORS: Record<string, string> = {
  'Baru': '#7E8B99',
  'Sudah Dihubungi': '#58A6FF',
  'Tertarik': '#E3B341',
  'Deal Closing': '#7EE787',
  'Menolak': '#F85149'
};

const NICHE_COLORS = ['#58A6FF', '#D4FF44'];

export const LeadAnalyticsChart: React.FC<LeadAnalyticsChartProps> = ({ leads }) => {
  // 1. Data Distribusi Berdasarkan Kategori Bisnis
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      const cat = lead.category?.trim() || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Ambil top 7
  }, [leads]);

  // 2. Data Distribusi Berdasarkan Kota / Lokasi
  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      const city = lead.city || extractCityFromAddress(lead.address) || 'Lainnya';
      counts[city] = (counts[city] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Ambil top 6 kota
  }, [leads]);

  // 3. Distribusi Target Penawaran (Rekam Medis vs Website)
  const targetData = useMemo(() => {
    const medical = leads.filter(l => l.isMedicalLead).length;
    const general = leads.length - medical;
    return [
      { name: 'Rekam Medis (RME)', value: medical, color: '#58A6FF' },
      { name: 'Website Bisnis', value: general, color: '#D4FF44' }
    ].filter(item => item.value > 0);
  }, [leads]);

  // 4. Status Kontak Outreach
  const outreachStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      'Baru': 0,
      'Sudah Dihubungi': 0,
      'Tertarik': 0,
      'Deal Closing': 0,
      'Menolak': 0
    };

    leads.forEach(lead => {
      if (lead.contactStatus === 'deal') counts['Deal Closing']++;
      else if (lead.contactStatus === 'interested') counts['Tertarik']++;
      else if (lead.contactStatus === 'contacted' || lead.firstContactedAt) counts['Sudah Dihubungi']++;
      else if (lead.contactStatus === 'not_interested') counts['Menolak']++;
      else counts['Baru']++;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || '#7E8B99' }))
      .filter(item => item.value > 0);
  }, [leads]);

  if (leads.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24292E] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#D4FF44]/10 text-[#D4FF44] border border-[#D4FF44]/30">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-sans">
              Visualisasi Analitik Distribusi Prospek
            </h3>
            <p className="text-[11px] text-[#9BA7B4]">
              Grafik distribusi kategori usaha, persebaran kota/wilayah, dan progres penawaran WhatsApp
            </p>
          </div>
        </div>
        <div className="text-xs text-[#7E8B99] font-mono">
          Total Sample: <strong className="text-white">{leads.length}</strong> Bisnis
        </div>
      </div>

      {/* Grid Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik 1: Kategori Bisnis Teratas */}
        <div className="bg-[#131518] border border-[#24292E] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-[#D4FF44]"></span>
              <span>Top Kategori Bisnis</span>
            </div>
            <span className="text-[10px] text-[#7E8B99] font-mono">{categoryData.length} Kategori</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#7E8B99" fontSize={10} allowDecimals={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#9BA7B4" 
                  fontSize={11} 
                  width={110}
                  tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C2128', borderColor: '#30363D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#D4FF44' }}
                  formatter={(value: any) => [`${value} Bisnis`, 'Jumlah']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 2: Persebaran Berdasarkan Kota */}
        <div className="bg-[#131518] border border-[#24292E] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <MapPin className="w-3.5 h-3.5 text-[#58A6FF]" />
              <span>Persebaran Lokasi / Kota</span>
            </div>
            <span className="text-[10px] text-[#7E8B99] font-mono">{cityData.length} Wilayah Terdeteksi</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="city" 
                  stroke="#9BA7B4" 
                  fontSize={10} 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0}
                  tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}..` : val}
                />
                <YAxis stroke="#7E8B99" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C2128', borderColor: '#30363D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#58A6FF' }}
                  formatter={(value: any) => [`${value} Bisnis`, 'Total Prospek']}
                />
                <Bar dataKey="count" fill="#58A6FF" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 3: Target Niche (Rekam Medis vs Website Umum) */}
        <div className="bg-[#131518] border border-[#24292E] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <PieChartIcon className="w-3.5 h-3.5 text-[#7EE787]" />
              <span>Segmentasi Target Penawaran</span>
            </div>
            <span className="text-[10px] text-[#7E8B99]">Faskes vs Usaha Umum</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={targetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {targetData.map((entry, index) => (
                    <Cell key={`cell-niche-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C2128', borderColor: '#30363D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 4: Status Pipeline Outreach WhatsApp */}
        <div className="bg-[#131518] border border-[#24292E] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <MessageSquare className="w-3.5 h-3.5 text-[#FFA657]" />
              <span>Status Tindak Lanjut & Outreach</span>
            </div>
            <span className="text-[10px] text-[#7E8B99]">Progres Kontak</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outreachStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {outreachStatusData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C2128', borderColor: '#30363D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
