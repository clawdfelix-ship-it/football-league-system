export type CaptainContact = {
  name: string;
  email?: string;
  phone?: string;
};

export type CoachContact = {
  name: string;
  email?: string;
  phone?: string;
};

export type ManagerContact = {
  name: string;
  email?: string;
  phone?: string;
};

export type TeamContact = {
  team: string;
  teamZh: string;
  color: string;
  shortName: string;
  venue?: string;
  coach?: CoachContact;
  manager?: ManagerContact;
  captains: CaptainContact[];
};

export const TEAM_CONTACTS: TeamContact[] = [
  {
    team: 'NOMURA',
    teamZh: '野村證券',
    shortName: 'NOMURA',
    color: 'from-red-600 to-red-800',
    venue: '香港大球場',
    coach: { name: 'Terrence Tan', phone: '+852 9123 4567', email: 'terrence.tan@nomura.com' },
    manager: { name: 'Kenneth Miranda', phone: '+852 9123 4568', email: 'kenneth.miranda@nomura.com' },
    captains: [
      { name: 'Terrence Tan', email: 'terrence.tan@nomura.com', phone: '+852 9123 4567' },
      { name: 'Kenneth Miranda', email: 'kenneth.miranda@nomura.com', phone: '+852 9123 4568' },
    ],
  },
  {
    team: 'BBVA',
    teamZh: '西班牙對外銀行',
    shortName: 'BBVA',
    color: 'from-blue-600 to-blue-800',
    venue: '九龍仔公園',
    coach: { name: 'Ibai Garatea', phone: '+852 9222 1111', email: 'ibai.garatea1@bbva.com' },
    manager: { name: 'Yassine Ayadi', phone: '+852 9222 2222', email: 'yassine.ayadi@bbva.com' },
    captains: [
      { name: 'Ibai Garatea', email: 'ibai.garatea1@bbva.com', phone: '+852 9222 1111' },
      { name: 'Yassine Ayadi', email: 'yassine.ayadi@bbva.com', phone: '+852 9222 2222' },
    ],
  },
  {
    team: 'LGT',
    teamZh: 'LGT 銀行',
    shortName: 'LGT',
    color: 'from-purple-600 to-purple-800',
    venue: '將軍澳運動場',
    coach: { name: 'David Pun', phone: '+852 9333 1111', email: 'david.pun@lgt.com' },
    manager: { name: 'Alvin Li', phone: '+852 9333 2222', email: 'alvin.li@lgt.com' },
    captains: [
      { name: 'David Pun', email: 'david.pun@lgt.com', phone: '+852 9333 1111' },
      { name: 'Alvin Li', email: 'alvin.li@lgt.com', phone: '+852 9333 2222' },
    ],
  },
  {
    team: 'CACIB',
    teamZh: '法興銀行',
    shortName: 'CACIB',
    color: 'from-green-600 to-green-800',
    venue: '九龍仔公園',
    coach: { name: 'Maxime Bonte', phone: '+852 9444 1111', email: 'maxime.bonte@ca-cib.com' },
    manager: { name: 'Victor Romier', phone: '+852 9444 2222', email: 'victor.romier@ca-cib.com' },
    captains: [
      { name: 'Maxime Bonte', email: 'maxime.bonte@ca-cib.com', phone: '+852 9444 1111' },
      { name: 'Victor Romier', email: 'victor.romier@ca-cib.com', phone: '+852 9444 2222' },
    ],
  },
  {
    team: 'CITI',
    teamZh: '花旗銀行',
    shortName: 'CITI',
    color: 'from-blue-400 to-blue-600',
    venue: '香港大球場',
    coach: { name: 'Michael Mak', phone: '+852 9555 1111', email: 'michael.mak@citi.com' },
    manager: { name: 'Toan Nguyen', phone: '+852 9555 2222', email: 'toan.dc.nguyen@citi.com' },
    captains: [
      { name: 'Michael Mak', email: 'michael.mak@citi.com', phone: '+852 9555 1111' },
      { name: 'Toan Nguyen', email: 'toan.dc.nguyen@citi.com', phone: '+852 9555 2222' },
    ],
  },
  {
    team: 'SCB',
    teamZh: '渣打銀行',
    shortName: 'SCB',
    color: 'from-red-400 to-red-600',
    venue: '將軍澳運動場',
    coach: { name: 'David Oliveira', phone: '+852 9666 1111', email: 'david.oliveira@sc.com' },
    manager: { name: 'Andy Wan', phone: '+852 9666 2222', email: 'andyty.wan@sc.com' },
    captains: [
      { name: 'David Oliveira', email: 'david.oliveira@sc.com', phone: '+852 9666 1111' },
      { name: 'Andy Wan', email: 'andyty.wan@sc.com', phone: '+852 9666 2222' },
    ],
  },
  {
    team: 'UBS',
    teamZh: '瑞銀集團',
    shortName: 'UBS',
    color: 'from-yellow-500 to-orange-600',
    venue: '九龍仔公園',
    coach: { name: 'Mo', phone: '+852 9777 1111', email: 'mortadha.lagha@ubs.com' },
    manager: { name: 'Keith Kwok', phone: '+852 9777 2222', email: 'keith.kwok@ubs.com' },
    captains: [
      { name: 'Mo', email: 'mortadha.lagha@ubs.com', phone: '+852 9777 1111' },
      { name: 'Fu Bong', email: 'fu-bong.chan@ubs.com', phone: '+852 9777 3333' },
      { name: 'Keith Kwok', email: 'keith.kwok@ubs.com', phone: '+852 9777 2222' },
      { name: 'Eugene Lam', email: 'eugene.lam@ubs.com', phone: '+852 9777 4444' },
    ],
  },
  {
    team: 'HSBC',
    teamZh: '匯豐銀行',
    shortName: 'HSBC',
    color: 'from-red-500 to-red-700',
    venue: '香港大球場',
    coach: { name: 'Jimmy Chan', phone: '+852 9888 1111', email: 'jimmy.k.p.chan@hsbc.com.hk' },
    manager: { name: 'Jimmy Chan', phone: '+852 9888 1111', email: 'jimmy.k.p.chan@hsbc.com.hk' },
    captains: [
      { name: 'Jimmy Chan', email: 'jimmy.k.p.chan@hsbc.com.hk', phone: '+852 9888 1111' },
    ],
  },
  {
    team: 'KPMG',
    teamZh: '畢馬威',
    shortName: 'KPMG',
    color: 'from-indigo-600 to-indigo-800',
    venue: '將軍澳運動場',
    coach: { name: 'Terrence Chan', phone: '+852 9999 1111', email: 'terrence.chan@kpmg.com' },
    manager: { name: 'Andrew Chan', phone: '+852 9999 2222', email: 'andrew.chan@kpmg.com' },
    captains: [
      { name: 'Terrence Chan', email: 'terrence.chan@kpmg.com', phone: '+852 9999 1111' },
      { name: 'Andrew Chan', email: 'andrew.chan@kpmg.com', phone: '+852 9999 2222' },
    ],
  },
  {
    team: 'DEMO',
    teamZh: '示範隊',
    shortName: 'DEMO',
    color: 'from-slate-600 to-slate-800',
    venue: '香港大球場',
    coach: { name: 'Demo Coach', phone: '+852 9000 0001', email: 'coach@demo.com' },
    manager: { name: 'Demo Manager', phone: '+852 9000 0002', email: 'hello@zenex-sports.com' },
    captains: [
      { name: 'Demo Captain', email: 'hello@zenex-sports.com', phone: '+852 9000 0003' },
    ],
  },
];
