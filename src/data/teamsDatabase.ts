import { TeamReference } from '../types';

export interface SportOption {
  id: string;
  name: string;
  category: string;
  icon: string;
  popularLeagues: string[];
}

export const ONBOARDING_SPORTS: SportOption[] = [
  { id: 'NFL', name: 'NFL', category: 'Football', icon: '🏈', popularLeagues: ['NFL'] },
  { id: 'COLLEGE_FOOTBALL', name: 'College Football', category: 'Football', icon: '🎓', popularLeagues: ['NCAA_FB'] },
  { id: 'NBA', name: 'NBA', category: 'Basketball', icon: '🏀', popularLeagues: ['NBA'] },
  { id: 'COLLEGE_BASKETBALL', name: 'College Basketball', category: 'Basketball', icon: '🎒', popularLeagues: ['NCAA_BB'] },
  { id: 'MLB', name: 'MLB', category: 'Baseball', icon: '⚾', popularLeagues: ['MLB'] },
  { id: 'NHL', name: 'NHL', category: 'Hockey', icon: '🏒', popularLeagues: ['NHL'] },
  { id: 'MLS', name: 'MLS', category: 'Soccer', icon: '⚽', popularLeagues: ['MLS'] },
  { id: 'SOCCER', name: 'Soccer (EPL / Champions)', category: 'Soccer', icon: '🏆', popularLeagues: ['SOCCER', 'EPL'] },
  { id: 'UFC', name: 'UFC / MMA', category: 'Combat', icon: '🥊', popularLeagues: ['UFC'] },
  { id: 'BOXING', name: 'Boxing', category: 'Combat', icon: '🥊', popularLeagues: ['BOXING'] },
  { id: 'GOLF', name: 'Golf', category: 'Golf', icon: '⛳', popularLeagues: ['PGA'] },
  { id: 'TENNIS', name: 'Tennis', category: 'Tennis', icon: '🎾', popularLeagues: ['ATP', 'WTA'] },
  { id: 'NASCAR', name: 'NASCAR', category: 'Racing', icon: '🏁', popularLeagues: ['NASCAR'] },
  { id: 'OTHER', name: 'Other Sports', category: 'General', icon: '🎯', popularLeagues: ['OTHER'] }
];

export const TEAMS_DATABASE: TeamReference[] = [
  // NFL
  { id: 'nfl_dal', name: 'Dallas Cowboys', sportId: 'NFL', league: 'NFL', abbrev: 'DAL', logo: '⭐', color: '#003594' },
  { id: 'nfl_kc', name: 'Kansas City Chiefs', sportId: 'NFL', league: 'NFL', abbrev: 'KC', logo: '🏹', color: '#E31837' },
  { id: 'nfl_hou', name: 'Houston Texans', sportId: 'NFL', league: 'NFL', abbrev: 'HOU', logo: '🐂', color: '#03202F' },
  { id: 'nfl_phi', name: 'Philadelphia Eagles', sportId: 'NFL', league: 'NFL', abbrev: 'PHI', logo: '🦅', color: '#004C54' },
  { id: 'nfl_sf', name: 'San Francisco 49ers', sportId: 'NFL', league: 'NFL', abbrev: 'SF', logo: '⛏️', color: '#AA0000' },
  { id: 'nfl_buf', name: 'Buffalo Bills', sportId: 'NFL', league: 'NFL', abbrev: 'BUF', logo: '🦬', color: '#00338D' },
  { id: 'nfl_det', name: 'Detroit Lions', sportId: 'NFL', league: 'NFL', abbrev: 'DET', logo: '🦁', color: '#0076B6' },
  { id: 'nfl_gb', name: 'Green Bay Packers', sportId: 'NFL', league: 'NFL', abbrev: 'GB', logo: '🧀', color: '#203731' },
  { id: 'nfl_bal', name: 'Baltimore Ravens', sportId: 'NFL', league: 'NFL', abbrev: 'BAL', logo: '🐦', color: '#241773' },
  { id: 'nfl_pit', name: 'Pittsburgh Steelers', sportId: 'NFL', league: 'NFL', abbrev: 'PIT', logo: '⚙️', color: '#FFB612' },
  { id: 'nfl_mia', name: 'Miami Dolphins', sportId: 'NFL', league: 'NFL', abbrev: 'MIA', logo: '🐬', color: '#008E97' },
  { id: 'nfl_cin', name: 'Cincinnati Bengals', sportId: 'NFL', league: 'NFL', abbrev: 'CIN', logo: '🐅', color: '#FB4F14' },

  // College Football (Arkansas Razorbacks is strictly NCAA_FB, NOT NFL!)
  { id: 'ncaa_fb_tex', name: 'Texas Longhorns', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'TEX', logo: '🤘', color: '#BF5700' },
  { id: 'ncaa_fb_tam', name: 'Texas A&M Aggies', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'TAM', logo: '👍', color: '#500000' },
  { id: 'ncaa_fb_ark', name: 'Arkansas Razorbacks', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'ARK', logo: '🐗', color: '#9D2235' },
  { id: 'ncaa_fb_ala', name: 'Alabama Crimson Tide', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'BAMA', logo: '🐘', color: '#9E1B32' },
  { id: 'ncaa_fb_uga', name: 'Georgia Bulldogs', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'UGA', logo: '🐶', color: '#BA0C2F' },
  { id: 'ncaa_fb_ou', name: 'Oklahoma Sooners', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'OU', logo: '🔴', color: '#841617' },
  { id: 'ncaa_fb_osu', name: 'Ohio State Buckeyes', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'OSU', logo: '🌰', color: '#BB0000' },
  { id: 'ncaa_fb_mich', name: 'Michigan Wolverines', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'MICH', logo: '〽️', color: '#00274C' },
  { id: 'ncaa_fb_lsu', name: 'LSU Tigers', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'LSU', logo: '🐯', color: '#461D7C' },
  { id: 'ncaa_fb_nd', name: 'Notre Dame Fighting Irish', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'ND', logo: '☘️', color: '#0C2340' },
  { id: 'ncaa_fb_ore', name: 'Oregon Ducks', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'ORE', logo: '🦆', color: '#154733' },
  { id: 'ncaa_fb_psu', name: 'Penn State Nittany Lions', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'PSU', logo: '🦁', color: '#041E42' },
  { id: 'ncaa_fb_tenn', name: 'Tennessee Volunteers', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'TENN', logo: '🍊', color: '#FF8200' },

  // NBA
  { id: 'nba_sas', name: 'San Antonio Spurs', sportId: 'NBA', league: 'NBA', abbrev: 'SAS', logo: '🏀', color: '#C4CED4' },
  { id: 'nba_dal', name: 'Dallas Mavericks', sportId: 'NBA', league: 'NBA', abbrev: 'DAL', logo: '🐴', color: '#00538C' },
  { id: 'nba_hou', name: 'Houston Rockets', sportId: 'NBA', league: 'NBA', abbrev: 'HOU', logo: '🚀', color: '#CE1141' },
  { id: 'nba_lal', name: 'Los Angeles Lakers', sportId: 'NBA', league: 'NBA', abbrev: 'LAL', logo: '👑', color: '#552583' },
  { id: 'nba_gsw', name: 'Golden State Warriors', sportId: 'NBA', league: 'NBA', abbrev: 'GSW', logo: '🌉', color: '#1D428A' },
  { id: 'nba_bos', name: 'Boston Celtics', sportId: 'NBA', league: 'NBA', abbrev: 'BOS', logo: '🍀', color: '#007A33' },
  { id: 'nba_den', name: 'Denver Nuggets', sportId: 'NBA', league: 'NBA', abbrev: 'DEN', logo: '⛏️', color: '#0E2240' },
  { id: 'nba_mia', name: 'Miami Heat', sportId: 'NBA', league: 'NBA', abbrev: 'MIA', logo: '🔥', color: '#98002E' },
  { id: 'nba_mil', name: 'Milwaukee Bucks', sportId: 'NBA', league: 'NBA', abbrev: 'MIL', logo: '🦌', color: '#00471B' },
  { id: 'nba_nyk', name: 'New York Knicks', sportId: 'NBA', league: 'NBA', abbrev: 'NYK', logo: '🗽', color: '#F58426' },
  { id: 'nba_okc', name: 'Oklahoma City Thunder', sportId: 'NBA', league: 'NBA', abbrev: 'OKC', logo: '⚡', color: '#007AC1' },

  // College Basketball
  { id: 'ncaa_bb_hou', name: 'Houston Cougars', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'HOU', logo: '🐾', color: '#C8102E' },
  { id: 'ncaa_bb_duke', name: 'Duke Blue Devils', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'DUKE', logo: '😈', color: '#003087' },
  { id: 'ncaa_bb_unc', name: 'North Carolina Tar Heels', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'UNC', logo: '🐏', color: '#7BAFD4' },
  { id: 'ncaa_bb_ku', name: 'Kansas Jayhawks', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'KU', logo: '🐦', color: '#0051BA' },
  { id: 'ncaa_bb_uk', name: 'Kentucky Wildcats', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'UK', logo: '🐱', color: '#0033A0' },
  { id: 'ncaa_bb_uconn', name: 'UConn Huskies', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'CONN', logo: '🐺', color: '#000E2F' },
  { id: 'ncaa_bb_gonz', name: 'Gonzaga Bulldogs', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'GONZ', logo: '🐶', color: '#041E42' },
  { id: 'ncaa_bb_bay', name: 'Baylor Bears', sportId: 'COLLEGE_BASKETBALL', league: 'NCAA_BB', abbrev: 'BAY', logo: '🐻', color: '#154734' },

  // MLB
  { id: 'mlb_hou', name: 'Houston Astros', sportId: 'MLB', league: 'MLB', abbrev: 'HOU', logo: '🌟', color: '#EB6E1F' },
  { id: 'mlb_tex', name: 'Texas Rangers', sportId: 'MLB', league: 'MLB', abbrev: 'TEX', logo: '🤠', color: '#003278' },
  { id: 'mlb_nyy', name: 'New York Yankees', sportId: 'MLB', league: 'MLB', abbrev: 'NYY', logo: '⚾', color: '#003087' },
  { id: 'mlb_lad', name: 'Los Angeles Dodgers', sportId: 'MLB', league: 'MLB', abbrev: 'LAD', logo: '🧢', color: '#005A9C' },
  { id: 'mlb_atl', name: 'Atlanta Braves', sportId: 'MLB', league: 'MLB', abbrev: 'ATL', logo: '🪓', color: '#CE1141' },
  { id: 'mlb_chc', name: 'Chicago Cubs', sportId: 'MLB', league: 'MLB', abbrev: 'CHC', logo: '🐻', color: '#0E3386' },
  { id: 'mlb_bos', name: 'Boston Red Sox', sportId: 'MLB', league: 'MLB', abbrev: 'BOS', logo: '🧦', color: '#BD3039' },

  // NHL
  { id: 'nhl_dal', name: 'Dallas Stars', sportId: 'NHL', league: 'NHL', abbrev: 'DAL', logo: '⭐', color: '#006847' },
  { id: 'nhl_vgk', name: 'Vegas Golden Knights', sportId: 'NHL', league: 'NHL', abbrev: 'VGK', logo: '⚔️', color: '#B4975A' },
  { id: 'nhl_col', name: 'Colorado Avalanche', sportId: 'NHL', league: 'NHL', abbrev: 'COL', logo: '🏔️', color: '#6F263D' },
  { id: 'nhl_edm', name: 'Edmonton Oilers', sportId: 'NHL', league: 'NHL', abbrev: 'EDM', logo: '🛢️', color: '#041E42' },
  { id: 'nhl_fla', name: 'Florida Panthers', sportId: 'NHL', league: 'NHL', abbrev: 'FLA', logo: '🐆', color: '#041E42' },
  { id: 'nhl_nyr', name: 'New York Rangers', sportId: 'NHL', league: 'NHL', abbrev: 'NYR', logo: '🗽', color: '#0038A8' },

  // MLS
  { id: 'mls_atx', name: 'Austin FC', sportId: 'MLS', league: 'MLS', abbrev: 'ATX', logo: '🌳', color: '#00B140' },
  { id: 'mls_dal', name: 'FC Dallas', sportId: 'MLS', league: 'MLS', abbrev: 'FCD', logo: '🐂', color: '#E31B23' },
  { id: 'mls_hou', name: 'Houston Dynamo', sportId: 'MLS', league: 'MLS', abbrev: 'HOU', logo: '⚡', color: '#F4911E' },
  { id: 'mls_mia', name: 'Inter Miami CF', sportId: 'MLS', league: 'MLS', abbrev: 'MIA', logo: '🦩', color: '#F7B5CD' },
  { id: 'mls_lafc', name: 'LAFC', sportId: 'MLS', league: 'MLS', abbrev: 'LAFC', logo: '👑', color: '#000000' },
  { id: 'mls_sea', name: 'Seattle Sounders', sportId: 'MLS', league: 'MLS', abbrev: 'SEA', logo: '⚓', color: '#5D9741' },

  // Soccer (Premier League / Champions League / International)
  { id: 'soc_ars', name: 'Arsenal FC', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'ARS', logo: '🔴', color: '#EF0107' },
  { id: 'soc_mci', name: 'Manchester City', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'MCI', logo: '🔵', color: '#6CABDD' },
  { id: 'soc_liv', name: 'Liverpool FC', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'LIV', logo: '🔴', color: '#C8102E' },
  { id: 'soc_che', name: 'Chelsea FC', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'CHE', logo: '🦁', color: '#034694' },
  { id: 'soc_mun', name: 'Manchester United', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'MUN', logo: '👹', color: '#DA291C' },
  { id: 'soc_rm', name: 'Real Madrid', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'RMA', logo: '👑', color: '#FEBE10' },
  { id: 'soc_bar', name: 'FC Barcelona', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'BAR', logo: '🔵🔴', color: '#004D98' },
  { id: 'soc_bay', name: 'Bayern Munich', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'BAY', logo: '🛡️', color: '#DC052D' },

  // Combat / UFC
  { id: 'ufc_ade', name: 'Israel Adesanya', sportId: 'UFC', league: 'UFC', abbrev: 'ADE', logo: '🥊', color: '#D20A0A' },
  { id: 'ufc_dup', name: 'Dricus Du Plessis', sportId: 'UFC', league: 'UFC', abbrev: 'DUP', logo: '🏆', color: '#FFB81C' },
  { id: 'ufc_per', name: 'Alex Pereira', sportId: 'UFC', league: 'UFC', abbrev: 'PER', logo: '🗿', color: '#000000' },
  { id: 'ufc_mak', name: 'Islam Makhachev', sportId: 'UFC', league: 'UFC', abbrev: 'MAK', logo: '🦅', color: '#C4122F' },
  { id: 'ufc_jon', name: 'Jon Jones', sportId: 'UFC', league: 'UFC', abbrev: 'JON', logo: '🐐', color: '#FFB81C' },
  { id: 'ufc_oma', name: 'Sean O\'Malley', sportId: 'UFC', league: 'UFC', abbrev: 'SUG', logo: '🌈', color: '#FF1493' },

  // Boxing
  { id: 'box_can', name: 'Canelo Alvarez', sportId: 'BOXING', league: 'BOXING', abbrev: 'CAN', logo: '🥊', color: '#CE1126' },
  { id: 'box_fur', name: 'Tyson Fury', sportId: 'BOXING', league: 'BOXING', abbrev: 'FUR', logo: '👑', color: '#002B7F' },
  { id: 'box_usy', name: 'Oleksandr Usyk', sportId: 'BOXING', league: 'BOXING', abbrev: 'USY', logo: '🇺🇦', color: '#0057B7' },
  { id: 'box_cra', name: 'Terence Crawford', sportId: 'BOXING', league: 'BOXING', abbrev: 'CRAW', logo: '🥊', color: '#111111' },

  // Golf
  { id: 'golf_sch', name: 'Scottie Scheffler', sportId: 'GOLF', league: 'PGA', abbrev: 'SCH', logo: '⛳', color: '#00539B' },
  { id: 'golf_mci', name: 'Rory McIlroy', sportId: 'GOLF', league: 'PGA', abbrev: 'RORY', logo: '⛳', color: '#004B87' },
  { id: 'golf_tig', name: 'Tiger Woods', sportId: 'GOLF', league: 'PGA', abbrev: 'TIG', logo: '🐅', color: '#D20A0A' },

  // Tennis
  { id: 'ten_alc', name: 'Carlos Alcaraz', sportId: 'TENNIS', league: 'ATP', abbrev: 'ALC', logo: '🎾', color: '#E10600' },
  { id: 'ten_sin', name: 'Jannik Sinner', sportId: 'TENNIS', league: 'ATP', abbrev: 'SIN', logo: '🦊', color: '#FF4500' },
  { id: 'ten_djo', name: 'Novak Djokovic', sportId: 'TENNIS', league: 'ATP', abbrev: 'DJO', logo: '🎾', color: '#002B7F' },
  { id: 'ten_gauf', name: 'Coco Gauff', sportId: 'TENNIS', league: 'WTA', abbrev: 'GAUF', logo: '🎾', color: '#4169E1' },

  // NASCAR
  { id: 'nas_lar', name: 'Kyle Larson', sportId: 'NASCAR', league: 'NASCAR', abbrev: 'LAR', logo: '🏁', color: '#0033A0' },
  { id: 'nas_ell', name: 'Chase Elliott', sportId: 'NASCAR', league: 'NASCAR', abbrev: 'ELL', logo: '🏁', color: '#FFD100' },
  { id: 'nas_ham', name: 'Denny Hamlin', sportId: 'NASCAR', league: 'NASCAR', abbrev: 'HAM', logo: '🏁', color: '#5B06AC' }
];

export function getTeamsForSports(selectedSportIds: string[]): TeamReference[] {
  if (selectedSportIds.length === 0) {
    return TEAMS_DATABASE;
  }
  return TEAMS_DATABASE.filter((t) => selectedSportIds.includes(t.sportId));
}

export function searchTeams(query: string, selectedSportIds: string[] = []): TeamReference[] {
  const baseList = selectedSportIds.length > 0 ? getTeamsForSports(selectedSportIds) : TEAMS_DATABASE;
  const q = query.trim().toLowerCase();
  if (!q) return baseList;

  return baseList.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbrev.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q)
  );
}
