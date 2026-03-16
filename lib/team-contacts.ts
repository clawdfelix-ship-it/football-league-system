export type CaptainContact = {
  name: string;
  email?: string;
};

export type TeamContact = {
  team: string;
  captains: CaptainContact[];
};

export const TEAM_CONTACTS: TeamContact[] = [
  {
    team: 'BBVA',
    captains: [
      { name: 'Ibai Garatea', email: 'ibai.garatea1@bbva.com' },
      { name: 'Yassine Ayadi', email: 'yassine.ayadi@bbva.com' },
    ],
  },
  {
    team: 'CACIB',
    captains: [
      { name: 'Maxime Bonte', email: 'maxime.bonte@ca-cib.com' },
      { name: 'Victor Romier', email: 'victor.romier@ca-cib.com' },
    ],
  },
  {
    team: 'CITI',
    captains: [
      { name: 'Michael Mak', email: 'michael.mak@citi.com' },
      { name: 'Toan Nguyen', email: 'toan.dc.nguyen@citi.com' },
    ],
  },
  {
    team: 'LGT',
    captains: [
      { name: 'David Pun', email: 'david.pun@lgt.com' },
      { name: 'Alvin Li', email: 'alvin.li@lgt.com' },
    ],
  },
  {
    team: 'NOMURA',
    captains: [
      { name: 'Terrence Tan', email: 'terrence.tan@nomura.com' },
      { name: 'Kenneth Miranda', email: 'kenneth.miranda@nomura.com' },
    ],
  },
  {
    team: 'SCB',
    captains: [
      { name: 'David Oliveira', email: 'david.oliviera@sc.com' },
      { name: 'Andy Wan', email: 'andyty.wan@sc.com' },
    ],
  },
  {
    team: 'UBS',
    captains: [
      { name: 'Mo', email: 'mortadha.lagha@ubs.com' },
      { name: 'Fu Bong', email: 'fu-bong.chan@ubs.com' },
    ],
  },
  {
    team: 'HSBC',
    captains: [{ name: 'Jimmy Chan', email: 'jimmy.k.p.chan@hsbc.com.hk' }],
  },
  {
    team: 'KPMG',
    captains: [
      { name: 'Terrence Chan', email: 'terrence.chan@kpmg.com' },
      { name: 'Andrew Chan', email: 'andrew.chan@kpmg.com' },
    ],
  },
];

