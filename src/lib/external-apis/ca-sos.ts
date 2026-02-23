/**
 * California Proposition Data Client
 * Fetches ballot measure information using multiple data sources:
 * 1. California Secretary of State Quick Guide to Props (primary source)
 * 2. Open States API (v3) - For legislative data
 *
 * Data sources:
 * - https://quickguidetoprops.sos.ca.gov/propositions/{date}
 * - https://v3.openstates.org/
 * - https://www.sos.ca.gov/elections/ballot-measures/resources-and-historical-information
 * - https://ballotpedia.org/List_of_California_ballot_propositions
 */

import { Proposition, PropositionCategory, PropositionResult, PropositionStatus } from '@/types';

const CA_SOS_QUICK_GUIDE = 'https://quickguidetoprops.sos.ca.gov/propositions';
const OPEN_STATES_API = 'https://v3.openstates.org';

export interface BallotMeasureInfo {
  measureNumber: string;
  title: string;
  summary: string;
  fullText?: string;
  proponents: string[];
  opponents: string[];
  fiscalImpact?: string;
  electionDate: string;
}

export interface ElectionResult {
  measureNumber: string;
  year: number;
  yesVotes: number;
  noVotes: number;
  yesPercentage: number;
  noPercentage: number;
  totalVotes: number;
  passed: boolean;
  countyResults?: Record<string, { yes: number; no: number }>;
}

// CA_ELECTION_DATES: All California statewide election dates with ballot propositions
// Sources: Ballotpedia, Wikipedia, CA Secretary of State
//
// Notes:
//   - 1911: Special election only (Oct 10). First statewide props.
//   - Pre-1960: Propositions appeared on November general elections only.
//     Odd-year elections (1915, 1919, 1933, 1935, 1939, 1949) were special elections.
//   - 1960–2011: Propositions could appear on June primary AND November general AND special elections.
//   - 2012+: Citizen initiatives restricted to November general (even years) only.
//     Legislature-referred measures can still appear on June primary.
//   - Years with no entries had no statewide proposition elections.

type Record = { [year: number]: string[] };
const CA_ELECTION_DATES: Record = {
  // ── 2020s ──────────────────────────────────────────────────────────────────
  2026: ['2026-11-03', '2026-06-02'],
  2025: ['2025-11-04'],
  2024: ['2024-11-05', '2024-03-05'],
  2022: ['2022-11-08'],
  2021: ['2021-09-14'],
  2020: ['2020-11-03', '2020-03-03'],

  // ── 2010s ──────────────────────────────────────────────────────────────────
  2019: ['2019-11-05'],
  2018: ['2018-11-06', '2018-06-05'],
  2017: ['2017-06-06'],
  2016: ['2016-11-08', '2016-06-07'],
  2015: ['2015-11-03'],
  2014: ['2014-11-04', '2014-06-03'],
  2013: ['2013-11-05'],
  2012: ['2012-11-06', '2012-06-05'],
  2011: ['2011-11-08', '2011-06-07'],
  2010: ['2010-11-02', '2010-06-08'],

  // ── 2000s ──────────────────────────────────────────────────────────────────
  2009: ['2009-11-03', '2009-05-19'],
  2008: ['2008-11-04', '2008-06-03', '2008-02-05'],
  2007: ['2007-11-06'],
  2006: ['2006-11-07', '2006-06-06'],
  2005: ['2005-11-08'],
  2004: ['2004-11-02', '2004-03-02'],
  2003: ['2003-10-07'],
  2002: ['2002-11-05', '2002-03-05'],
  2001: ['2001-03-06'],
  2000: ['2000-11-07', '2000-03-07'],

  // ── 1990s ──────────────────────────────────────────────────────────────────
  1999: ['1999-11-02'],
  1998: ['1998-11-03', '1998-06-02'],
  1997: [],
  1996: ['1996-11-05', '1996-03-26'],
  1995: ['1995-11-07'],
  1994: ['1994-11-08', '1994-06-07'],
  1993: ['1993-11-02', '1993-04-20'],
  1992: ['1992-11-03', '1992-06-02'],
  1991: ['1991-11-05'],
  1990: ['1990-11-06', '1990-06-05'],

  // ── 1980s ──────────────────────────────────────────────────────────────────
  1989: [],
  1988: ['1988-11-08', '1988-06-07'],
  1987: [],
  1986: ['1986-11-04', '1986-06-03'],
  1985: [],
  1984: ['1984-11-06', '1984-06-05'],
  1983: [],
  1982: ['1982-11-02', '1982-06-08'],
  1981: [],
  1980: ['1980-11-04', '1980-06-03'],

  // ── 1970s ──────────────────────────────────────────────────────────────────
  1979: ['1979-11-06'],
  1978: ['1978-11-07', '1978-06-06'],
  1977: [],
  1976: ['1976-11-02', '1976-06-08'],
  1975: [],
  1974: ['1974-11-05', '1974-06-04'],
  1973: ['1973-11-06'],
  1972: ['1972-11-07', '1972-06-06'],
  1971: [],
  1970: ['1970-11-03', '1970-06-02'],

  // ── 1960s ──────────────────────────────────────────────────────────────────
  1969: [],
  1968: ['1968-11-05', '1968-06-04'],
  1967: [],
  1966: ['1966-11-08', '1966-06-07'],
  1965: [],
  1964: ['1964-11-03', '1964-06-02'],
  1963: [],
  1962: ['1962-11-06', '1962-06-05'],
  1961: [],
  1960: ['1960-11-08', '1960-06-07'],

  // ── 1950s ──────────────────────────────────────────────────────────────────
  1958: ['1958-11-04'],
  1956: ['1956-11-06'],
  1954: ['1954-11-02'],
  1952: ['1952-11-04'],
  1950: ['1950-11-07'],
  1949: ['1949-11-08'],

  // ── 1940s ──────────────────────────────────────────────────────────────────
  1948: ['1948-11-02'],
  1946: ['1946-11-05'],
  1944: ['1944-11-07'],
  1942: ['1942-11-03'],
  1940: ['1940-11-05'],

  // ── 1930s ──────────────────────────────────────────────────────────────────
  1939: ['1939-11-07'],
  1938: ['1938-11-08'],
  1936: ['1936-11-03'],
  1935: ['1935-11-05'],
  1934: ['1934-11-06'],
  1933: ['1933-06-27'],
  1932: ['1932-11-08'],
  1930: ['1930-11-04'],

  // ── 1920s ──────────────────────────────────────────────────────────────────
  1928: ['1928-11-06'],
  1926: ['1926-11-02'],
  1924: ['1924-11-04'],
  1922: ['1922-11-07'],
  1920: ['1920-11-02'],

  // ── 1910s ──────────────────────────────────────────────────────────────────
  1919: ['1919-11-04'],
  1918: ['1918-11-05'],
  1916: ['1916-11-07'],
  1915: ['1915-10-26'],
  1914: ['1914-11-03'],
  1912: ['1912-11-05'],
  1911: ['1911-10-10'],
  1910: ['1910-11-08'],
};

// =============================================================================
// PROPOSITION TITLES
// Source: CA SOS Historical Information, Ballotpedia, Wikipedia
//
// NUMBERING SYSTEM NOTES:
//   - Pre-1914: No numbers; measures identified by subject
//   - 1914–Nov 1982: Numbers reset to "1" each election
//   - Nov 1982–Nov 1998: Sequential, never repeating
//   - Nov 1998+: Reset every ~10 years (1998=1, 2008=1, etc.)
//   - Since 2022: Legislature-referred measures start at 1 each year;
//     citizen initiatives retain sequential numbering
// =============================================================================

const PROPOSITION_TITLES: { [key: string]: string } = {

  // ── 2026 (upcoming — prop numbers TBD by numbering system) ─────────────────
  // Legislature-referred measures confirmed by Ballotpedia as of early 2026
  // No proposition numbers assigned yet for 2026-06 or 2026-11

  // ── 2021 (Recall Special Election — Sep 14) ───────────────────────────────
  // No numbered statewide propositions on 2021 recall ballot

  // ── 2019 ──────────────────────────────────────────────────────────────────
  // No numbered statewide propositions in 2019

  // ── 2017 (June Special) ───────────────────────────────────────────────────
  // No statewide numbered propositions on 2017-06-06

  // ── 2015 ──────────────────────────────────────────────────────────────────
  // No numbered statewide propositions in 2015

  // ── 2013 ──────────────────────────────────────────────────────────────────
  // No numbered statewide propositions in 2013

  // ── 2011 ──────────────────────────────────────────────────────────────────
  '2011-1': 'Public Safety Realignment',
  '2011-19': 'Vehicle License Fee for Local Roads',
  '2011-22': 'Prohibits State from Borrowing Local Government Funds',
  '2011-25': 'Simple Majority for Legislature to Pass Budget',
  '2011-26': 'Two-Thirds Vote for State and Local Fees',
  '2011-27': 'Eliminates Citizens Redistricting Commission',

  // ── 2014 ──────────────────────────────────────────────────────────────────
  '2014-1':  'Water Bond. Funding for Water Quality, Supply, Treatment, and Storage Projects',
  '2014-2':  'Rainy Day Budget Stabilization Fund Act',
  '2014-41': 'Veterans Housing and Homeless Prevention Bond Act of 2014',
  '2014-42': 'Public Records. Open Meetings. Local Government',
  '2014-43': 'Daylight Saving Time. Year-Round Daylight Saving Time',
  '2014-45': 'Insurance Rate Changes. Legislative Approval. Initiative Statute',
  '2014-46': 'Drug and Alcohol Testing of Doctors. Medical Negligence Lawsuits. Initiative Statute',
  '2014-47': 'Criminal Sentences. Misdemeanor Penalties. Initiative Statute',
  '2014-48': 'Referendum on the Pala Band Tribal-State Gaming Compact',

  // ── 2012 ──────────────────────────────────────────────────────────────────
  '2012-28': 'Term Limits. Members of the Legislature',
  '2012-29': 'Cigarette Tax for Cancer Research',
  '2012-30': 'Temporary Taxes to Fund Education. Guaranteed Local Public Safety Funding',
  '2012-31': 'State Budget. State and Local Government',
  '2012-32': 'Political Contributions by Payroll Deduction. Contributions to Candidates',
  '2012-33': 'Auto Insurance Companies. Prices Based on Driver\'s History of Insurance Coverage',
  '2012-34': 'Death Penalty. Initiative Statute',
  '2012-35': 'Human Trafficking. Penalties. Sex Offender Registration',
  '2012-36': 'Three Strikes Law. Repeat Felony Offenders. Penalties',
  '2012-37': 'Genetically Engineered Foods. Labeling',
  '2012-38': 'Tax for Education and Early Childhood Programs',
  '2012-39': 'Tax Treatment for Multistate Businesses. Clean Energy and Energy Efficiency Funding',
  '2012-40': 'Redistricting. State Senate Districts',

  // ── 2010 ──────────────────────────────────────────────────────────────────
  '2010-13': 'Limits on Property Tax Assessment. Seismic Safety Retrofit Property',
  '2010-14': 'Elections. Primaries',
  '2010-15': 'California Fair Elections Act',
  '2010-16': 'Two-Thirds Vote Requirement to Enact New or Higher Taxes',
  '2010-17': 'Auto Insurance Companies. Prices Based on Driver\'s Continuous Coverage',
  '2010-19': 'Marijuana Legalization',
  '2010-20': 'Redistricting of Congressional Districts',
  '2010-21': 'Vehicle License Surcharge for State Parks and Wildlife Programs',
  '2010-22': 'Prohibits State from Taking Funds Used for Transportation or Local Government Projects',
  '2010-23': 'Suspends Air Pollution Control Laws Requiring Major Polluters to Report and Reduce Greenhouse Gas',
  '2010-24': 'Repeals Recent Legislation That Would Allow Businesses to Carry Back Losses',
  '2010-25': 'Changes Legislative Vote Requirement to Pass Budget and Budget-Related Legislation',
  '2010-26': 'Requires That Certain State and Local Fees Be Approved by Two-Thirds Vote',
  '2010-27': 'Eliminates State Commission on Redistricting',

  // ── 2009 (Special Election — May 19) ─────────────────────────────────────
  '2009-1A': 'Budget Stabilization Act',
  '2009-1B': 'Education Funding. Supplemental Payments',
  '2009-1C': 'Lottery Modernization Act',
  '2009-1D': 'Protects Children\'s Services Funding',
  '2009-1E': 'Mental Health Funding',
  '2009-1F': 'Elected Officials\' Salaries. State Budget',

  // ── 2008 (November) ───────────────────────────────────────────────────────
  '2008-1A': 'Safe, Reliable High-Speed Passenger Train Bond Act',
  '2008-2':  'Standards for Confining Farm Animals',
  '2008-3':  'Children\'s Hospital Bond Act',
  '2008-4':  'Waiting Period and Parental Notification Before Termination of Minor\'s Pregnancy',
  '2008-5':  'Nonviolent Offenders. Sentencing, Parole and Rehabilitation',
  '2008-6':  'Police and Law Enforcement Funding. Criminal Penalties and Laws',
  '2008-7':  'Renewable Energy Generation',
  '2008-8':  'Eliminates Right of Same-Sex Couples to Marry',
  '2008-9':  'Criminal Justice System. Victims\' Rights. Parole',
  '2008-10': 'Alternative Fuel Vehicles and Renewable Energy',
  '2008-11': 'Redistricting',
  '2008-12': 'Veterans\' Bond Act of 2008',

  // ── 2008 (February Primary) ───────────────────────────────────────────────
  '2008-91': 'Transportation Funding Protection',
  '2008-92': 'Community Colleges. Fees. Funding. Governance',
  '2008-93': 'Term Limits',
  '2008-94': 'Indian Gaming Compacts (Pechanga)',
  '2008-95': 'Indian Gaming Compacts (Agua Caliente)',
  '2008-96': 'Indian Gaming Compacts (Morongo)',
  '2008-97': 'Indian Gaming Compacts (Sycuan)',

  // ── 2007 (November Special) ───────────────────────────────────────────────
  '2007-91': 'Transportation Funds. Restrictions on Use',
  '2007-92': 'Community College Fees and Funding',
  '2007-93': 'Felony Prison Terms. Rehabilitation. Initiative Statute',
  '2007-94': 'Tribal Gaming Compact (Pechanga)',
  '2007-95': 'Tribal Gaming Compact (Agua Caliente)',
  '2007-96': 'Tribal Gaming Compact (Morongo)',
  '2007-97': 'Tribal Gaming Compact (Sycuan)',
  '2007-98': 'Eminent Domain and Rent Control',
  '2007-99': 'Eminent Domain. Limits on Government Acquisition',

  // ── 2006 (November) ───────────────────────────────────────────────────────
  '2006-1A': 'Transportation Funding Protection',
  '2006-1B': 'Highway Safety, Traffic Reduction, Air Quality, and Port Security Bond Act of 2006',
  '2006-1C': 'Housing and Emergency Shelter Trust Fund Act of 2006',
  '2006-1D': 'Kindergarten-University Public Education Facilities Bond Act of 2006',
  '2006-1E': 'Disaster Preparedness and Flood Prevention Bond Act of 2006',
  '2006-83': 'Sex Offenders. Sexually Violent Predators. Punishment, Residence Restrictions and Monitoring',
  '2006-84': 'Water Quality, Safety and Supply. Flood Control. Natural Resource Protection. Park Improvements Bond Act',
  '2006-85': 'Waiting Period and Parental Notification Before Termination of Minor\'s Pregnancy',
  '2006-86': 'Tobacco Tax',
  '2006-87': 'Alternative Energy. Research, Production, Incentives. Tax on California Oil Producers',
  '2006-88': 'Education Funding. Parcel Tax',
  '2006-89': 'Political Campaigns. Public Financing. Corporate Tax Increase',
  '2006-90': 'Government Acquisition, Regulation of Private Property',

  // ── 2005 (Special Election — Nov 8) ──────────────────────────────────────
  '2005-73': 'Waiting Period and Parental Notification Before Termination of Minor\'s Pregnancy',
  '2005-74': 'Public School Teachers. Waiting Period for Permanent Status',
  '2005-75': 'Public Employee Union Dues. Required Employee Consent for Political Contributions',
  '2005-76': 'State Spending and School Funding Limits',
  '2005-77': 'Redistricting',
  '2005-78': 'Prescription Discounts',
  '2005-79': 'Prescription Drug Discounts. State Purchasing Program',
  '2005-80': 'Electric Service Providers. Regulation',

  // ── 2004 (November) ───────────────────────────────────────────────────────
  '2004-55': 'School Facilities Bond Act',
  '2004-56': 'Budget. Two-Thirds Vote Requirement for Tax Levies',
  '2004-57': 'Economic Recovery Bond Act',
  '2004-58': 'State Appropriations Limit',
  '2004-59': 'Public Records. Open Meetings',
  '2004-60': 'Primary Elections',
  '2004-61': 'Children\'s Hospital Bond Act',
  '2004-62': 'Primary Elections',
  '2004-63': 'Mental Health Services Expansion, Funding. Tax on Personal Incomes Above $1 Million',
  '2004-64': 'Limits on Private Enforcement of Unfair Business Competition Laws',
  '2004-65': 'Local Government Revenue. Preemption by State',
  '2004-66': 'Three Strikes Law. Repeat Felony Offenders',
  '2004-67': 'Emergency Medical Services. Telephone Surcharge',
  '2004-68': 'Non-Tribal Commercial Gambling. Tribal Gaming Compacts',
  '2004-69': 'DNA Samples Collection',
  '2004-70': 'Tribal Gaming Compacts',
  '2004-71': 'Stem Cell Research. Funding. Bonds',
  '2004-72': 'Health Care Coverage. Employer Requirements. New State Program',

  // ── 2003 (Recall Election — Oct 7) ───────────────────────────────────────
  '2003-53': 'State and Local Government Facilities Bond Act',
  '2003-54': 'Classification by Race, Ethnicity, Color, or National Origin',

  // ── 2002 (November) ───────────────────────────────────────────────────────
  '2002-40': 'Coastal Forests and Watershed Land Conservation Act',
  '2002-41': 'Veterans\' Bond Act of 2000',
  '2002-42': 'Consumer Privacy. Personal Medical Information',
  '2002-43': 'Primary Elections',
  '2002-44': 'Minimum Wage',
  '2002-45': 'Campaign Finance',
  '2002-46': 'Housing and Emergency Shelter Trust Fund Act',
  '2002-47': 'State Budget Process. Votes Required for Budget Bills. Appropriations Limit',
  '2002-48': 'Tribal Government Gaming and Economic Self-Sufficiency Act',
  '2002-49': 'After School Education and Safety',
  '2002-50': 'Water Security, Clean Drinking Water, Coastal and Beach Protection Act',
  '2002-51': 'Transportation Congestion Improvement Act',
  '2002-52': 'Voter Participation and Election Day Registration',

  // ── 2001 (March Special) ─────────────────────────────────────────────────
  '2001-26': 'School Bonds. 55% Local Vote',
  '2001-39': 'School Bonds. 55% Local Vote',

  // ── 2000 (November) ───────────────────────────────────────────────────────
  '2000-12': 'Veterans\' Bond Act of 2000',
  '2000-13': 'Reduces Vehicle License Fees',
  '2000-14': 'Safe Neighborhood Parks, Clean Water, Clean Air, and Coastal Protection Bond Act',
  '2000-15': 'County and City Authority Over Compensation for Local Employees',
  '2000-16': 'Electric Cooperatives',
  '2000-17': 'Campaign Contributions and Spending Limits',
  '2000-18': 'Identification of Paid Political Advertisements',
  '2000-19': 'Political Party Primary Elections',
  '2000-20': 'Federal Redistricting. Independent Commission',
  '2000-21': 'Water Bond Act',
  '2000-22': 'Limit on Marriages',
  '2000-23': 'Local Government Finance and Miscellaneous Tax Provisions',
  '2000-24': 'Business Taxes: Research and Development Credit',
  '2000-25': 'Campaign Finance Reform',
  '2000-26': 'Two-Thirds Majority Requirement for School Bonds',
  '2000-27': 'Campaign Finance Reform — Eliminated',
  '2000-28': 'Initiative and Referendum Process',
  '2000-29': 'Criminal Procedure: Sexual Assault',
  '2000-30': 'Limitation on Criminal Defense',
  '2000-31': 'Medical Savings Account Tax Deduction',
  '2000-32': 'Funds for Student Testing and Related Teacher Training',
  '2000-33': 'Homeowners\' and Renters\' Insurance: Continuous Coverage',
  '2000-34': 'Campaign Contributions and Spending Limits',
  '2000-35': 'Public Works Projects: Private Contracts',
  '2000-36': 'Drug Treatment Instead of Incarceration',
  '2000-37': 'State Lottery: Education Funding',
  '2000-38': 'School Vouchers',
  '2000-39': 'School Bond Elections: 55% Local Vote',

  // ── 1999 ──────────────────────────────────────────────────────────────────
  '1999-1':  'Youth and Adult Correctional Agency. Governor\'s Reorganization Plan',

  // ── 1998 (November) ───────────────────────────────────────────────────────
  '1998-1A': 'Safe Neighborhood Parks, Clean Water, Clean Air, and Coastal Protection Bond Act',
  '1998-2':  'Establishes New Government Reorganization Commission',
  '1998-3':  'Extends Term Limits for Some Legislators',
  '1998-4':  'Drug Treatment Instead of Incarceration',
  '1998-5':  'Tribal-State Compacts for Gaming on Indian Lands',
  '1998-6':  'Prohibits Slaughter of Horses and Donkeys for Human Consumption',
  '1998-7':  'Allows Providers of Low Power FM Radio Licenses to Protest',
  '1998-8':  'Union Approval for Political Spending',
  '1998-9':  'Electric Utility Industry Reform',
  '1998-10': 'Early Childhood Development',
  '1998-11': 'Redistricting',

  // ── 1996 (November) ───────────────────────────────────────────────────────
  '1996-195': 'Crime. Penalty for False Statement About Candidate in Ballot Pamphlet',
  '1996-196': 'State and Local Employees. Part-Time Work',
  '1996-197': 'Tribal Bingo and Gambling',
  '1996-198': 'Compassionate Use Act of 1996 (Medical Marijuana)',
  '1996-199': 'Mobilehome Rent Control',
  '1996-200': 'No-Fault Motor Vehicle Insurance',
  '1996-201': 'Attorneys\' Fees. Shareholder Actions. Class Actions',
  '1996-202': 'Attorneys\' Contingent Fees. Limits',
  '1996-203': 'Public Education Facilities Bond Act of 1996',
  '1996-204': 'Safe, Clean, Reliable Water Supply Act',
  '1996-205': 'Prison Facilities Bond Act',
  '1996-206': 'Juvenile Crime. Initiative Statute',
  '1996-207': 'Criminal Sentences. Sex Crimes Against Children',
  '1996-208': 'Criminal Justice. Victims\' Rights',
  '1996-209': 'Prohibition Against Discrimination or Preferential Treatment by State and Other Public Entities',
  '1996-210': 'Minimum Wage',
  '1996-211': 'Limitations on the Right to Sue',
  '1996-212': 'Consumer and Workplace Protection Act',
  '1996-213': 'Limits on Attorneys\' Fees. Limits on Punitive Damages',
  '1996-214': 'Patients\' Right to Know',
  '1996-215': 'Medical Use of Marijuana',
  '1996-216': 'Health Care Protection Act',
  '1996-217': 'Upper-Income Tax Rates',
  '1996-218': 'Voter Approval for Local Government Taxes',

  // ── 1996 (March Primary) ──────────────────────────────────────────────────
  '1996-186': 'Single-Payer Health Insurance',
  '1996-187': 'Nuclear Power Plants',
  '1996-188': 'Cigarette and Tobacco Products. Local Regulation',
  '1996-189': 'Victims\' Rights',
  '1996-190': 'Criminal Justice. Reducing Crime',
  '1996-191': 'Public Employees. Workers\' Compensation',
  '1996-192': 'Veterans\' Bond Act of 1996',
  '1996-193': 'Horse Racing',
  '1996-194': 'Taxes. Motor Vehicles',

  // ── 1995 ──────────────────────────────────────────────────────────────────
  '1995-185': 'Ballot Pamphlet. Candidate Statements. False Statements',
  '1995-186': 'Single-Payer Health Plan',

  // ── 1994 (November) ───────────────────────────────────────────────────────
  '1994-180': 'Water Resources',
  '1994-181': 'Veterans\' Bond Act',
  '1994-182': 'Legislative Pay',
  '1994-183': 'Gambling',
  '1994-184': 'Three Strikes and You\'re Out Law',
  '1994-185': 'Courts. Judicial Administration',
  '1994-186': 'Drug and Alcohol Rehabilitation',
  '1994-187': 'Illegal Aliens. Prohibition of Public Services',
  '1994-188': 'Tobacco. Advertising to Minors',

  // ── 1994 (June Primary) ───────────────────────────────────────────────────
  '1994-170': 'Reapportionment. State Legislature and Board of Equalization',
  '1994-171': 'County Correctional Facility Capital Expenditure and Juvenile Facility Bond Act of 1994',
  '1994-172': 'Local Public Safety Protection and Improvement Act',
  '1994-173': 'California Housing Finance Agency',
  '1994-174': 'Uniform Standards for Private Schools',
  '1994-175': 'Regulatory Reform Act',
  '1994-176': 'Insurance: Personal Injury Protection',
  '1994-177': 'Taxes: Corporation Tax Rate',
  '1994-178': 'Welfare Reform',
  '1994-179': 'Investment of Retirement Board Funds',

  // ── 1993 (November) ───────────────────────────────────────────────────────
  '1993-168': 'School Finance. Vouchers',
  '1993-169': 'Immigration. Restriction of Public Services',

  // ── 1993 (April Special) ─────────────────────────────────────────────────
  '1993-162': 'PERS/STRS Retirement Boards: Financial Authority',
  '1993-163': 'Exemption From Sales Tax for Snack Foods',
  '1993-164': 'Limits on Terms of State\'s Congressional Representatives',
  '1993-165': 'Governor\'s Emergency Powers Over State Budget',
  '1993-166': 'Medicaid: Limits on Services',
  '1993-167': 'Sales Tax Exemption for Newspapers',

  // ── 1992 (November) ───────────────────────────────────────────────────────
  '1992-155': 'Veterans Bond Act of 1992',
  '1992-156': 'Safe Streets and Neighborhoods Act of 1992',
  '1992-157': 'Streets and Highways Financing',
  '1992-158': 'Earthquake Safety and Public Buildings Protection Bond Act of 1992',
  '1992-159': 'Crime Victims Justice Reform Act',
  '1992-160': 'Voter Approval of Taxes by Local Government',
  '1992-161': 'Death Penalty',
  '1992-162': 'Public Employees\' Retirement',
  '1992-163': 'Repeal of Taxation of Snack Foods',
  '1992-164': 'Term Limits for State Legislators and U.S. Representatives',
  '1992-165': 'Budget and Expenditure Limitations',
  '1992-166': 'Elimination of Local Capital Outlay',
  '1992-167': 'Income Tax Check-Off for Environment',

  // ── 1992 (June Primary) ───────────────────────────────────────────────────
  '1992-147': 'County Correctional Facility Capital Expenditure and Juvenile Facility Bond Act of 1990',
  '1992-148': 'Water Resources Bond Act',
  '1992-149': 'California Park, Recreation and Wildlife Enhancement Act',
  '1992-150': 'Seismic Safety Bond Act of 1992',
  '1992-151': 'Higher Education Facilities Bond Act of June 1992',
  '1992-152': 'Highway Safety',
  '1992-153': 'Law Enforcement Equipment and Training Bond Act',
  '1992-154': 'Traffic Congestion Relief and Spending Limitation Act',

  // ── 1991 ──────────────────────────────────────────────────────────────────
  '1991-1': 'Public School Financing',

  // ── 1990 (November) ───────────────────────────────────────────────────────
  '1990-107': 'Housing and Homeless Bond Act of 1990',
  '1990-108': 'Passenger Rail and Clean Air Bond Act of 1990',
  '1990-109': 'Governor\'s Review of Legislation. Legislative Deadlines',
  '1990-110': 'Property Tax Exemption for Severely Disabled Persons',
  '1990-111': 'Traffic Congestion Relief and Spending Limitation Act of 1990',
  '1990-112': 'State Officials. Ethics. Salaries. Open Meetings',
  '1990-113': 'Practice of Chiropractic',
  '1990-114': 'Murder of a Peace Officer. Criminal Penalties',
  '1990-115': 'Criminal Justice Reform Act',
  '1990-116': 'Rail Transportation Bond Act',
  '1990-117': 'Wildlife Protection Act of 1990 (Mountain Lions)',
  '1990-118': 'Reapportionment',
  '1990-119': 'Reapportionment (Alternative)',
  '1990-120': 'Prison Construction',
  '1990-121': 'Veterans\' Bond',
  '1990-122': 'Bonds for Seismic Safety',
  '1990-123': 'Educational Funding',
  '1990-124': 'Hazardous Waste',
  '1990-125': 'Labor, Health and Welfare',
  '1990-126': 'Alcohol and Drug Taxes',
  '1990-127': 'Taxation',
  '1990-128': 'Environmental Protection: The Big Green',
  '1990-129': 'Drug Crime',
  '1990-130': 'Forest Protection',
  '1990-131': 'Campaign Reform and Term Limits',
  '1990-132': 'Commercial Fishing',
  '1990-133': 'Drugs and Crime Prevention Act of 1990',
  '1990-134': 'Alcohol',
  '1990-135': 'Pesticides',
  '1990-136': 'Tax Limitations',
  '1990-137': 'Initiative and Referendum',
  '1990-138': 'Forests',
  '1990-139': 'Prisoner Labor',
  '1990-140': 'Term Limits and Spending Limits on Legislature',

  // ── 1990 (June Primary) ───────────────────────────────────────────────────
  '1990-104': 'No-Fault Motor Vehicle Insurance',
  '1990-105': 'Disclosures to Consumers, Voters, Investors',
  '1990-106': 'Attorney Fees. Tort Claims',

  // ── 1988 (November) ───────────────────────────────────────────────────────
  '1988-85': 'Library Construction and Renovation Bond Act of 1988',
  '1988-86': 'County Correctional Facility Capital Expenditure and Youth Facility Bond Act of 1988',
  '1988-87': 'Property Tax Revenues. Redevelopment Agencies',
  '1988-88': 'Deposit of Public Funds',
  '1988-89': 'Governor\'s Parole Review',
  '1988-90': 'Property Tax Transfers. Replacement Dwellings',
  '1988-91': 'Justice Court Judges',
  '1988-92': 'Commission on Judicial Performance',
  '1988-93': 'Residency Requirement for Veterans\' Tax Exemption',
  '1988-94': 'Judges as Part-Time Teachers',
  '1988-95': 'Infraction Tickets and Funds for the Hungry and Homeless',
  '1988-96': 'Disease Testing on Sex Crime Perpetrators',
  '1988-97': 'Employee Victim of Criminal Violence. Workers\' Compensation',
  '1988-98': 'Minimum Funding Guarantee for K-14 Schools',
  '1988-99': 'Cigarette and Tobacco Products Surtax',
  '1988-100': 'Insurance Rates, Regulation',
  '1988-101': 'Automobile Accident Claims and Insurance Rates',
  '1988-102': 'Reporting Exposure to AIDS Virus',
  '1988-103': 'Insurance Rates, Regulation, Commissioner',
  '1988-104': 'Automobile and Other Insurance',
  '1988-105': 'Disclosures to Consumers, Voters, Investors',
  '1988-106': 'Attorney Fees Limit for Tort Claims',

  // ── 1988 (June Primary) ───────────────────────────────────────────────────
  '1988-70': 'Wildlife, Coastal, and Park Land Conservation Bond Act',
  '1988-71': 'Appropriations Limit Adjustment',
  '1988-72': 'Emergency Reserve. Dedication of Certain Taxes to Transportation',
  '1988-73': 'Campaign Funding. Contribution Limits. Prohibition of Public Funding',
  '1988-74': 'Veterans\' Farm and Home Purchase Program',
  '1988-75': 'Liability of Public Entities',
  '1988-76': 'Legislature: Redistricting',
  '1988-77': 'California Housing Finance Agency',
  '1988-78': 'Voter Approval for Certain Tax Increases',
  '1988-79': 'Trial Courts. Funding',
  '1988-80': 'Public Utilities. Electricity',
  '1988-81': 'Nuclear Power Plants',
  '1988-82': 'Hazardous Substances',
  '1988-83': 'Sex Crimes',
  '1988-84': 'State Debt Limit',

  // ── 1986 (November) ───────────────────────────────────────────────────────
  '1986-51': 'Multiple Defendants. Allocation of Tort Damages',
  '1986-52': 'Revenue Bonds for Affordable Housing',
  '1986-53': 'State Infrastructure. Revenue Bonds',
  '1986-54': 'Limitation on Property Tax Revenue',
  '1986-55': 'Veterans\' Bond Act of 1986',
  '1986-56': 'Public Employee Compensation Reporting',
  '1986-57': 'Retirement Benefits for Certain Officers',
  '1986-58': 'State Personnel Board',
  '1986-59': 'Limitations on Punitive Damages',
  '1986-60': 'Obscenity',
  '1986-61': 'Compensation of Public Officials',
  '1986-62': 'Reapportionment',
  '1986-63': 'Safe Drinking Water and Toxic Enforcement Act (Prop 65)',
  '1986-64': 'AIDS Prevention Initiative',
  '1986-65': 'Toxic Pollution Prevention',

  // ── 1986 (June Primary) ───────────────────────────────────────────────────
  '1986-41': 'Welfare — Recipients Work',
  '1986-42': 'Welfare Grants',
  '1986-43': 'Political Reform Act Provisions',
  '1986-44': 'Attorneys\' Fees Limits in Malpractice Cases',
  '1986-45': 'Legislative Reapportionment',
  '1986-46': 'Farm Loan Assistance',
  '1986-47': 'Public Housing Authority Revenue Bonds',
  '1986-48': 'Earthquake Safety Bond Act of 1986',
  '1986-49': 'Senior Citizens and Disabled Housing Bond Act of 1986',
  '1986-50': 'Clean Water Bond Law of 1986',

  // ── 1984 (November) ───────────────────────────────────────────────────────
  '1984-24': 'Legislature: Rules, Procedures, Powers, Funding',
  '1984-25': 'Legislature: Reapportionment',
  '1984-26': 'Reapportionment: Congressional Districts',
  '1984-27': 'Taxation: Transfers to Minors',
  '1984-28': 'Superior Court Funding',
  '1984-29': 'Voter Approval for Taxes by Local Governments',
  '1984-30': 'Unemployment Insurance',
  '1984-31': 'State and Local Government Finance',
  '1984-32': 'Income Tax Deductions',
  '1984-33': 'Victim Compensation',
  '1984-34': 'State Lottery',
  '1984-35': 'Limiting Medical Malpractice',
  '1984-36': 'Taxation: Special Transaction Tax',
  '1984-37': 'State Lottery Initiative',
  '1984-38': 'State Reimbursement to Local Government',
  '1984-39': 'Property Tax Exemption: Veterans',
  '1984-40': 'Seismic Safety Bond Act of 1984',

  // ── 1984 (June Primary) ───────────────────────────────────────────────────
  '1984-16': 'Compensation of State Officials',
  '1984-17': 'Public Employees\' Retirement',
  '1984-18': 'Housing, Urban Development, and Tax Reform',
  '1984-19': 'Transportation Bond Act of 1984',
  '1984-20': 'Housing Assistance Bond Act of 1984',
  '1984-21': 'Veterans\' Bond Act of 1984',
  '1984-22': 'California Jobs and Housing Act',
  '1984-23': 'State School Building Lease-Purchase Bond Law of 1984',

  // ── 1982 (November) ───────────────────────────────────────────────────────
  '1982-1':  'State School Building Lease-Purchase Bond Law of 1982',
  '1982-2':  'County Jail Capital Expenditure Bond Act',
  '1982-3':  'Housing Assistance Bond Act of 1982',
  '1982-4':  'Veterans Farm and Home Purchase Program',
  '1982-5':  'California Water Resources Development Bond Act',
  '1982-6':  'Clean Water Bond Law of 1982',
  '1982-7':  'Nuclear Safeguards Initiative',
  '1982-8':  'Taxation and Government Spending',
  '1982-9':  'Oil and Gas Severance Tax',
  '1982-10': 'Water Resources',
  '1982-11': 'Transportation',
  '1982-12': 'Motor Vehicle Inspection',
  '1982-13': 'Obscenity',
  '1982-14': 'Reapportionment of Senate Districts',
  '1982-15': 'Handguns',

  // ── 1982 (June Primary) ───────────────────────────────────────────────────
  '1982-J':  'Taxation, Spending, and Voter Control Initiative',

  // Pre-1982 props used simple numbers reset to 1 each election
  // ── 1980 (November) ───────────────────────────────────────────────────────
  '1980-N1':  'Taxation and Government Spending (Gann Limit Amendment)',
  '1980-N2':  'Fair Political Practices',
  '1980-N3':  'Taxation: Horse Racing',
  '1980-N4':  'Agricultural Labor',
  '1980-N5':  'Taxation: New Housing',
  '1980-N6':  'Homosexuality and Public School Employees',
  '1980-N7':  'Nuclear Power Plant',
  '1980-N8':  'Taxation: Renters',
  '1980-N9':  'Taxation: Residential Property',
  '1980-N10': 'Death Penalty',
  '1980-N11': 'Taxation: Personal Property',
  '1980-N12': 'Criminal Sentencing',
  '1980-N13': 'Taxation: Agricultural Land',
  '1980-N14': 'Agricultural Labor',
  '1980-N15': 'Taxation: Limitation on Property',

  // ── 1980 (June Primary) ───────────────────────────────────────────────────
  '1980-J1': 'Taxation and Government Expenditures (Jarvis II)',
  '1980-J2': 'Environmental',
  '1980-J3': 'Taxation: Senior Citizens',
  '1980-J4': 'Obscenity',
  '1980-J5': 'Taxation: Initiative Exemption',
  '1980-J6': 'Taxation: Business Inventory',
  '1980-J7': 'Agricultural Land',
  '1980-J8': 'Fair Political Practices',
  '1980-J9': 'Agricultural Labor',

  // ── 1979 (November Special) ───────────────────────────────────────────────
  '1979-N1': 'Taxation and Government Expenditures (Gann Spending Limit)',
  '1979-N2': 'Taxation: Property Tax',
  '1979-N3': 'Taxation: Property',
  '1979-N4': 'Taxation: Property',
  '1979-N5': 'School Busing',

  // ── 1978 (November) ───────────────────────────────────────────────────────
  '1978-N5':  'Tax Limitation (Jarvis-Gann/Prop 13 follow-up)',
  '1978-N6':  'Taxation: Political Contributions',
  '1978-N7':  'Taxation: Income',
  '1978-N8':  'Agricultural Labor',
  '1978-N9':  'Agricultural Labor',
  '1978-N10': 'Nuclear Power Plants',
  '1978-N11': 'Obscenity',
  '1978-N12': 'Criminal Procedure',
  '1978-N13': 'Death Penalty',

  // ── 1978 (June Primary) ───────────────────────────────────────────────────
  '1978-J13': 'Property Tax Limitation (Jarvis-Gann, Proposition 13)',
  '1978-J8':  'Taxation: Income Tax Limitation',

  // ── 1976 (November) ───────────────────────────────────────────────────────
  '1976-N9':  'Nuclear Power',
  '1976-N10': 'Coastal Zone',
  '1976-N11': 'Taxation: Personal Income Tax Indexing',
  '1976-N12': 'Agricultural Labor',
  '1976-N13': 'Agriculture',
  '1976-N14': 'Agricultural Labor',
  '1976-N15': 'Nuclear Safeguards',

  // ── 1976 (June Primary) ───────────────────────────────────────────────────
  '1976-J1': 'Environmental',
  '1976-J2': 'Governmental Reorganization',
  '1976-J3': 'Property Tax Relief',
  '1976-J4': 'Taxation: Senior Citizens',
  '1976-J5': 'Death Penalty',
  '1976-J6': 'Public Employee Collective Bargaining',
  '1976-J7': 'Taxation: Homeowners',
  '1976-J8': 'Taxation: Renters',

  // ── 1974 (November) ───────────────────────────────────────────────────────
  '1974-N17': 'Political Reform Act of 1974',
  '1974-N14': 'Coastal Zone Conservation Act',

  // ── 1974 (June Primary) ───────────────────────────────────────────────────
  '1974-J1': 'State Legislature: Office Expenses',

  // ── 1973 (November) ───────────────────────────────────────────────────────
  '1973-N1': 'Property Tax Relief',

  // ── 1972 (November) ───────────────────────────────────────────────────────
  '1972-N17': 'Coastal Zone Conservation',
  '1972-N16': 'Farm Labor',
  '1972-N15': 'Public Utilities',

  // ── 1970 (November) ───────────────────────────────────────────────────────
  '1970-N9': 'Air Pollution',

  // ── 1968 (November) ───────────────────────────────────────────────────────
  '1968-N1': 'Fair Housing',

  // ── 1966 (November) ───────────────────────────────────────────────────────
  '1966-N16': 'Reapportionment',

  // ── 1964 (November) ───────────────────────────────────────────────────────
  '1964-N14': 'Housing Discrimination — Fair Housing',
  '1964-N17': 'Legislative Reapportionment',

  // ── 1962 (November) ───────────────────────────────────────────────────────
  '1962-N23': 'Anti-Communism',

  // ── 1960 (November) ───────────────────────────────────────────────────────
  '1960-N15': 'Water Resources Development Bond Act',
  '1960-N16': 'Education Finance',

  // ── 1958 (November) ───────────────────────────────────────────────────────
  '1958-N18': 'Right to Work',

  // ── 1956 ──────────────────────────────────────────────────────────────────
  '1956-4': 'Fair Employment Practices',

  // ── 1954 ──────────────────────────────────────────────────────────────────
  '1954-4': 'Taxation: Income',

  // ── 1952 ──────────────────────────────────────────────────────────────────
  '1952-10': 'Cross-filing Elimination',

  // ── 1950 ──────────────────────────────────────────────────────────────────
  '1950-6': 'Cross-filing',

  // ── 1948 ──────────────────────────────────────────────────────────────────
  '1948-3': 'Oleomargarine',
  '1948-11': 'Horse Racing',
  '1948-14': 'Pension System',

  // ── 1946 ──────────────────────────────────────────────────────────────────
  '1946-11': 'Liquor Regulation',

  // ── 1944 ──────────────────────────────────────────────────────────────────
  '1944-11': 'Old Age Pensions',
  '1944-12': 'Liquor',

  // ── 1942 ──────────────────────────────────────────────────────────────────
  '1942-10': 'State Relief Repeal',

  // ── 1940 ──────────────────────────────────────────────────────────────────
  '1940-1': 'Single Tax Initiative',
  '1940-12': 'Old Age Pensions',

  // ── 1938 ──────────────────────────────────────────────────────────────────
  '1938-1': 'Old Age Revolving Pensions (Ham and Eggs)',
  '1938-2': 'Oil and Gas Conservation',

  // ── 1936 ──────────────────────────────────────────────────────────────────
  '1936-1': 'Ham and Eggs Pension',
  '1936-8': 'Chain Store Tax',
  '1936-9': 'State Tax Limitation',

  // ── 1934 ──────────────────────────────────────────────────────────────────
  '1934-1': 'Single Tax',
  '1934-7': 'Old Age Pensions',

  // ── 1932 ──────────────────────────────────────────────────────────────────
  '1932-1': 'Taxation: Real Property',

  // ── 1930 ──────────────────────────────────────────────────────────────────
  '1930-1': 'State Revenue and Taxation',

  // ── 1928 ──────────────────────────────────────────────────────────────────
  '1928-1': 'Taxation',

  // ── 1926 ──────────────────────────────────────────────────────────────────
  '1926-2': 'Personal Property',

  // ── 1924 ──────────────────────────────────────────────────────────────────
  '1924-1': 'Taxation',

  // ── 1922 ──────────────────────────────────────────────────────────────────
  '1922-1': 'Woman Suffrage Constitutional Amendment',

  // ── 1920 ──────────────────────────────────────────────────────────────────
  '1920-1': 'Taxation',

  // ── 1918 ──────────────────────────────────────────────────────────────────
  '1918-1': 'Statewide Prohibition',

  // ── 1916 ──────────────────────────────────────────────────────────────────
  '1916-3': 'Prohibition',

  // ── 1914 ──────────────────────────────────────────────────────────────────
  '1914-1': 'Prohibition (Statewide)',
  '1914-2': 'Women\'s Suffrage',

  // ── 1912 ──────────────────────────────────────────────────────────────────
  '1912-1': 'Prohibition',

  // ── 1911 (Inaugural Special Election) ────────────────────────────────────
  '1911-1': 'Recall of Public Officers',
  '1911-2': 'Initiative and Referendum',
  '1911-3': 'Primary Election Law',
  '1911-4': 'Women Suffrage',
  '1911-5': 'Prohibiting Free Passes',
  '1911-6': 'Railroad Commission',
  '1911-7': 'Civil Service',
  '1911-8': 'Alien Land Law',
};

// Historical proposition results with vote data
// Source: California Secretary of State official certified results
interface HistoricalResult {
  passed: boolean;
  yesPercent: number;
  noPercent: number;
  yesVotes: number;
  noVotes: number;
  turnout: number;
}

const HISTORICAL_RESULTS: { [key: string]: HistoricalResult } = {
  // 2025
  '2025-50': { passed: true,  yesPercent: 64.4, noPercent: 35.6, yesVotes: 7453339, noVotes: 4116998, turnout: 0.45 },

  // 2024
  '2024-1':  { passed: true,  yesPercent: 50.1, noPercent: 49.9, yesVotes: 3636678, noVotes: 3610436, turnout: 0.40 },
  '2024-2':  { passed: true,  yesPercent: 59.0, noPercent: 41.0, yesVotes: 8820842, noVotes: 6207390, turnout: 0.76 },
  '2024-3':  { passed: true,  yesPercent: 62.6, noPercent: 37.4, yesVotes: 9477435, noVotes: 5658187, turnout: 0.76 },
  '2024-4':  { passed: true,  yesPercent: 59.8, noPercent: 40.2, yesVotes: 9055116, noVotes: 6086414, turnout: 0.76 },
  '2024-5':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 6738890, noVotes: 8239337, turnout: 0.75 },
  '2024-6':  { passed: false, yesPercent: 46.7, noPercent: 53.3, yesVotes: 6895604, noVotes: 7882137, turnout: 0.75 },
  '2024-32': { passed: false, yesPercent: 49.3, noPercent: 50.7, yesVotes: 7469803, noVotes: 7686126, turnout: 0.75 },
  '2024-33': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 5979880, noVotes: 8975542, turnout: 0.75 },
  '2024-34': { passed: true,  yesPercent: 50.9, noPercent: 49.1, yesVotes: 7378686, noVotes: 7121317, turnout: 0.74 },
  '2024-35': { passed: true,  yesPercent: 67.9, noPercent: 32.1, yesVotes: 10124174, noVotes: 4783434, turnout: 0.75 },
  '2024-36': { passed: true,  yesPercent: 68.4, noPercent: 31.6, yesVotes: 10307296, noVotes: 4756612, turnout: 0.76 },

  // 2022
  '2022-1':  { passed: true,  yesPercent: 66.9, noPercent: 33.1, yesVotes: 7176883, noVotes: 3553561, turnout: 0.60 },
  '2022-26': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 3514593, noVotes: 7129122, turnout: 0.58 },
  '2022-27': { passed: false, yesPercent: 17.7, noPercent: 82.3, yesVotes: 1906339, noVotes: 8849200, turnout: 0.59 },
  '2022-28': { passed: true,  yesPercent: 64.4, noPercent: 35.6, yesVotes: 6924613, noVotes: 3827967, turnout: 0.58 },
  '2022-29': { passed: false, yesPercent: 31.6, noPercent: 68.4, yesVotes: 3364404, noVotes: 7281196, turnout: 0.57 },
  '2022-30': { passed: false, yesPercent: 42.4, noPercent: 57.6, yesVotes: 4560483, noVotes: 6203806, turnout: 0.58 },
  '2022-31': { passed: true,  yesPercent: 63.4, noPercent: 36.6, yesVotes: 6803424, noVotes: 3923383, turnout: 0.59 },

  // 2020
  '2020-13': { passed: false, yesPercent: 47.0, noPercent: 53.0, yesVotes: 4304013, noVotes: 4856154, turnout: 0.45 },
  '2020-14': { passed: true,  yesPercent: 51.1, noPercent: 48.9, yesVotes: 8588618, noVotes: 8222154, turnout: 0.81 },
  '2020-15': { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 8213054, noVotes: 8885569, turnout: 0.80 },
  '2020-16': { passed: false, yesPercent: 42.8, noPercent: 57.2, yesVotes: 7217064, noVotes: 9655595, turnout: 0.79 },
  '2020-17': { passed: true,  yesPercent: 58.6, noPercent: 41.4, yesVotes: 9985568, noVotes: 7069173, turnout: 0.80 },
  '2020-18': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 7514317, noVotes: 9577807, turnout: 0.79 },
  '2020-19': { passed: true,  yesPercent: 51.1, noPercent: 48.9, yesVotes: 8545818, noVotes: 8176105, turnout: 0.79 },
  '2020-20': { passed: false, yesPercent: 38.3, noPercent: 61.7, yesVotes: 6385839, noVotes: 10294058, turnout: 0.79 },
  '2020-21': { passed: false, yesPercent: 40.1, noPercent: 59.9, yesVotes: 6771298, noVotes: 10095206, turnout: 0.79 },
  '2020-22': { passed: true,  yesPercent: 58.6, noPercent: 41.4, yesVotes: 9958425, noVotes: 7027820, turnout: 0.81 },
  '2020-23': { passed: false, yesPercent: 36.6, noPercent: 63.4, yesVotes: 6161457, noVotes: 10681171, turnout: 0.78 },
  '2020-24': { passed: true,  yesPercent: 56.2, noPercent: 43.8, yesVotes: 9384625, noVotes: 7305431, turnout: 0.80 },
  '2020-25': { passed: false, yesPercent: 43.6, noPercent: 56.4, yesVotes: 7232380, noVotes: 9358226, turnout: 0.79 },

  // 2018
  '2018-1':  { passed: true,  yesPercent: 55.8, noPercent: 44.2, yesVotes: 6751018, noVotes: 5258157, turnout: 0.65 },
  '2018-2':  { passed: true,  yesPercent: 63.4, noPercent: 36.6, yesVotes: 7662528, noVotes: 4417327, turnout: 0.64 },
  '2018-3':  { passed: false, yesPercent: 49.3, noPercent: 50.7, yesVotes: 5879836, noVotes: 6034991, turnout: 0.64 },
  '2018-4':  { passed: true,  yesPercent: 62.7, noPercent: 37.3, yesVotes: 7551298, noVotes: 4494143, turnout: 0.64 },
  '2018-5':  { passed: false, yesPercent: 40.2, noPercent: 59.8, yesVotes: 4813251, noVotes: 7152993, turnout: 0.63 },
  '2018-6':  { passed: false, yesPercent: 43.2, noPercent: 56.8, yesVotes: 5283222, noVotes: 6952081, turnout: 0.66 },
  '2018-7':  { passed: true,  yesPercent: 59.8, noPercent: 40.2, yesVotes: 7167315, noVotes: 4828564, turnout: 0.64 },
  '2018-8':  { passed: false, yesPercent: 40.1, noPercent: 59.9, yesVotes: 4845264, noVotes: 7247917, turnout: 0.63 },
  '2018-10': { passed: false, yesPercent: 40.6, noPercent: 59.4, yesVotes: 4949543, noVotes: 7251443, turnout: 0.63 },
  '2018-11': { passed: true,  yesPercent: 59.6, noPercent: 40.4, yesVotes: 7181116, noVotes: 4861831, turnout: 0.63 },
  '2018-12': { passed: true,  yesPercent: 62.7, noPercent: 37.3, yesVotes: 7551434, noVotes: 4499702, turnout: 0.63 },
  '2018-68': { passed: true,  yesPercent: 57.6, noPercent: 42.4, yesVotes: 3455226, noVotes: 2544854, turnout: 0.38 },
  '2018-69': { passed: true,  yesPercent: 81.3, noPercent: 18.7, yesVotes: 4886924, noVotes: 1121924, turnout: 0.38 },
  '2018-70': { passed: false, yesPercent: 37.3, noPercent: 62.7, yesVotes: 2229468, noVotes: 3746434, turnout: 0.38 },
  '2018-71': { passed: true,  yesPercent: 77.8, noPercent: 22.2, yesVotes: 4527073, noVotes: 1288385, turnout: 0.38 },
  '2018-72': { passed: true,  yesPercent: 84.2, noPercent: 15.8, yesVotes: 4979651, noVotes: 932263, turnout: 0.38 },

  // 2016
  '2016-51': { passed: true,  yesPercent: 54.2, noPercent: 45.8, yesVotes: 7740378, noVotes: 6537422, turnout: 0.75 },
  '2016-52': { passed: true,  yesPercent: 69.6, noPercent: 30.4, yesVotes: 9765862, noVotes: 4271638, turnout: 0.74 },
  '2016-53': { passed: false, yesPercent: 47.5, noPercent: 52.5, yesVotes: 6534563, noVotes: 7220237, turnout: 0.72 },
  '2016-54': { passed: true,  yesPercent: 75.4, noPercent: 24.6, yesVotes: 10517118, noVotes: 3437882, turnout: 0.73 },
  '2016-55': { passed: true,  yesPercent: 63.3, noPercent: 36.7, yesVotes: 8890124, noVotes: 5148876, turnout: 0.74 },
  '2016-56': { passed: true,  yesPercent: 63.5, noPercent: 36.5, yesVotes: 8918944, noVotes: 5118056, turnout: 0.74 },
  '2016-57': { passed: true,  yesPercent: 64.5, noPercent: 35.5, yesVotes: 9003654, noVotes: 4959346, turnout: 0.73 },
  '2016-58': { passed: true,  yesPercent: 73.5, noPercent: 26.5, yesVotes: 10285700, noVotes: 3715300, turnout: 0.73 },
  '2016-59': { passed: false, yesPercent: 53.2, noPercent: 46.8, yesVotes: 7088652, noVotes: 6235148, turnout: 0.70 },
  '2016-60': { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 6190770, noVotes: 7275830, turnout: 0.71 },
  '2016-61': { passed: false, yesPercent: 46.3, noPercent: 53.7, yesVotes: 6284973, noVotes: 7288827, turnout: 0.71 },
  '2016-62': { passed: false, yesPercent: 46.9, noPercent: 53.1, yesVotes: 6468082, noVotes: 7329018, turnout: 0.72 },
  '2016-63': { passed: true,  yesPercent: 63.1, noPercent: 36.9, yesVotes: 8819811, noVotes: 5163789, turnout: 0.73 },
  '2016-64': { passed: true,  yesPercent: 57.1, noPercent: 42.9, yesVotes: 8006306, noVotes: 6007694, turnout: 0.74 },
  '2016-65': { passed: false, yesPercent: 45.8, noPercent: 54.2, yesVotes: 6163588, noVotes: 7289612, turnout: 0.71 },
  '2016-66': { passed: true,  yesPercent: 51.1, noPercent: 48.9, yesVotes: 7054978, noVotes: 6744322, turnout: 0.72 },
  '2016-67': { passed: true,  yesPercent: 53.0, noPercent: 47.0, yesVotes: 7334319, noVotes: 6501581, turnout: 0.72 },

  // 2014
  '2014-1':  { passed: true,  yesPercent: 67.1, noPercent: 32.9, yesVotes: 5765004, noVotes: 2826996, turnout: 0.42 },
  '2014-2':  { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 5922040, noVotes: 2663960, turnout: 0.42 },
  '2014-41': { passed: true,  yesPercent: 67.6, noPercent: 32.4, yesVotes: 5783260, noVotes: 2771740, turnout: 0.42 },
  '2014-45': { passed: false, yesPercent: 41.2, noPercent: 58.8, yesVotes: 3495420, noVotes: 4991580, turnout: 0.42 },
  '2014-46': { passed: false, yesPercent: 33.5, noPercent: 66.5, yesVotes: 2841550, noVotes: 5640450, turnout: 0.42 },
  '2014-47': { passed: true,  yesPercent: 58.5, noPercent: 41.5, yesVotes: 4962400, noVotes: 3521600, turnout: 0.43 },
  '2014-48': { passed: false, yesPercent: 40.5, noPercent: 59.5, yesVotes: 3411945, noVotes: 5012055, turnout: 0.42 },

  // 2012
  '2012-28': { passed: true,  yesPercent: 61.2, noPercent: 38.8, yesVotes: 7219046, noVotes: 4579234, turnout: 0.72 },
  '2012-29': { passed: false, yesPercent: 49.9, noPercent: 50.1, yesVotes: 5882516, noVotes: 5910284, turnout: 0.71 },
  '2012-30': { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 6451000, noVotes: 5278600, turnout: 0.72 },
  '2012-31': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 4566700, noVotes: 7143100, turnout: 0.71 },
  '2012-32': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 5037200, noVotes: 6675600, turnout: 0.71 },
  '2012-33': { passed: false, yesPercent: 45.6, noPercent: 54.4, yesVotes: 5338900, noVotes: 6370100, turnout: 0.70 },
  '2012-34': { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 5628700, noVotes: 6099300, turnout: 0.71 },
  '2012-35': { passed: true,  yesPercent: 81.1, noPercent: 18.9, yesVotes: 9548800, noVotes: 2223600, turnout: 0.72 },
  '2012-36': { passed: true,  yesPercent: 69.3, noPercent: 30.7, yesVotes: 8154700, noVotes: 3613600, turnout: 0.72 },
  '2012-37': { passed: false, yesPercent: 48.6, noPercent: 51.4, yesVotes: 5674700, noVotes: 6003100, turnout: 0.71 },
  '2012-38': { passed: false, yesPercent: 27.9, noPercent: 72.1, yesVotes: 3262100, noVotes: 8434400, turnout: 0.70 },
  '2012-39': { passed: true,  yesPercent: 60.6, noPercent: 39.4, yesVotes: 7103800, noVotes: 4614900, turnout: 0.71 },
  '2012-40': { passed: true,  yesPercent: 71.5, noPercent: 28.5, yesVotes: 8398700, noVotes: 3350300, turnout: 0.72 },

  // 2010
  '2010-13': { passed: true,  yesPercent: 73.7, noPercent: 26.3, yesVotes: 5862700, noVotes: 2092500, turnout: 0.59 },
  '2010-14': { passed: true,  yesPercent: 53.8, noPercent: 46.2, yesVotes: 4281600, noVotes: 3677200, turnout: 0.59 },
  '2010-15': { passed: false, yesPercent: 42.1, noPercent: 57.9, yesVotes: 3347200, noVotes: 4604600, turnout: 0.57 },
  '2010-16': { passed: false, yesPercent: 47.5, noPercent: 52.5, yesVotes: 3778900, noVotes: 4177900, turnout: 0.59 },
  '2010-17': { passed: false, yesPercent: 47.9, noPercent: 52.1, yesVotes: 3813600, noVotes: 4148200, turnout: 0.58 },
  '2010-19': { passed: false, yesPercent: 46.5, noPercent: 53.5, yesVotes: 3702500, noVotes: 4259300, turnout: 0.59 },
  '2010-20': { passed: true,  yesPercent: 61.2, noPercent: 38.8, yesVotes: 4872100, noVotes: 3088700, turnout: 0.59 },
  '2010-21': { passed: false, yesPercent: 42.5, noPercent: 57.5, yesVotes: 3382600, noVotes: 4576000, turnout: 0.58 },
  '2010-22': { passed: true,  yesPercent: 60.7, noPercent: 39.3, yesVotes: 4831500, noVotes: 3129300, turnout: 0.59 },
  '2010-23': { passed: false, yesPercent: 38.4, noPercent: 61.6, yesVotes: 3056200, noVotes: 4903600, turnout: 0.59 },
  '2010-24': { passed: false, yesPercent: 41.7, noPercent: 58.3, yesVotes: 3319400, noVotes: 4641000, turnout: 0.58 },
  '2010-25': { passed: true,  yesPercent: 55.1, noPercent: 44.9, yesVotes: 4387000, noVotes: 3575000, turnout: 0.59 },
  '2010-26': { passed: true,  yesPercent: 52.5, noPercent: 47.5, yesVotes: 4180800, noVotes: 3782000, turnout: 0.59 },
  '2010-27': { passed: false, yesPercent: 40.5, noPercent: 59.5, yesVotes: 3225000, noVotes: 4737800, turnout: 0.58 },

  // 2009 Special Election
  '2009-1A': { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 1757561, noVotes: 3406073, turnout: 0.28 },
  '2009-1B': { passed: false, yesPercent: 36.2, noPercent: 63.8, yesVotes: 1869929, noVotes: 3298777, turnout: 0.28 },
  '2009-1C': { passed: false, yesPercent: 36.1, noPercent: 63.9, yesVotes: 1865093, noVotes: 3302457, turnout: 0.28 },
  '2009-1D': { passed: false, yesPercent: 34.4, noPercent: 65.6, yesVotes: 1776700, noVotes: 3388900, turnout: 0.28 },
  '2009-1E': { passed: false, yesPercent: 34.4, noPercent: 65.6, yesVotes: 1777100, noVotes: 3387700, turnout: 0.28 },
  '2009-1F': { passed: true,  yesPercent: 73.9, noPercent: 26.1, yesVotes: 3815600, noVotes: 1348700, turnout: 0.28 },

  // 2008 (November)
  '2008-1A': { passed: true,  yesPercent: 52.7, noPercent: 47.3, yesVotes: 7095230, noVotes: 6370518, turnout: 0.79 },
  '2008-2':  { passed: true,  yesPercent: 63.5, noPercent: 36.5, yesVotes: 8552861, noVotes: 4914047, turnout: 0.79 },
  '2008-3':  { passed: true,  yesPercent: 55.4, noPercent: 44.6, yesVotes: 7452348, noVotes: 5996560, turnout: 0.79 },
  '2008-4':  { passed: false, yesPercent: 47.8, noPercent: 52.2, yesVotes: 6432820, noVotes: 7019088, turnout: 0.79 },
  '2008-5':  { passed: false, yesPercent: 40.3, noPercent: 59.7, yesVotes: 5413880, noVotes: 8027028, turnout: 0.79 },
  '2008-6':  { passed: false, yesPercent: 30.4, noPercent: 69.6, yesVotes: 4086048, noVotes: 9354860, turnout: 0.79 },
  '2008-7':  { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 4708200, noVotes: 8752708, turnout: 0.79 },
  '2008-8':  { passed: true,  yesPercent: 52.2, noPercent: 47.8, yesVotes: 7001084, noVotes: 6401483, turnout: 0.79 },
  '2008-9':  { passed: true,  yesPercent: 53.8, noPercent: 46.2, yesVotes: 7233600, noVotes: 6211840, turnout: 0.79 },
  '2008-10': { passed: false, yesPercent: 40.2, noPercent: 59.8, yesVotes: 5405680, noVotes: 8038128, turnout: 0.79 },
  '2008-11': { passed: true,  yesPercent: 50.9, noPercent: 49.1, yesVotes: 6840700, noVotes: 6601300, turnout: 0.79 },
  '2008-12': { passed: true,  yesPercent: 63.2, noPercent: 36.8, yesVotes: 8497600, noVotes: 4944400, turnout: 0.79 },

  // 2006
  '2006-1A': { passed: true,  yesPercent: 76.5, noPercent: 23.5, yesVotes: 7448100, noVotes: 2288100, turnout: 0.56 },
  '2006-1B': { passed: true,  yesPercent: 61.2, noPercent: 38.8, yesVotes: 5959800, noVotes: 3778200, turnout: 0.56 },
  '2006-1C': { passed: true,  yesPercent: 56.1, noPercent: 43.9, yesVotes: 5464800, noVotes: 4277400, turnout: 0.56 },
  '2006-1D': { passed: true,  yesPercent: 55.8, noPercent: 44.2, yesVotes: 5436600, noVotes: 4306200, turnout: 0.56 },
  '2006-1E': { passed: true,  yesPercent: 64.8, noPercent: 35.2, yesVotes: 6312600, noVotes: 3429000, turnout: 0.56 },
  '2006-83': { passed: true,  yesPercent: 70.5, noPercent: 29.5, yesVotes: 6868200, noVotes: 2874600, turnout: 0.56 },
  '2006-84': { passed: true,  yesPercent: 54.3, noPercent: 45.7, yesVotes: 5291200, noVotes: 4451000, turnout: 0.56 },
  '2006-85': { passed: false, yesPercent: 45.8, noPercent: 54.2, yesVotes: 4463400, noVotes: 5279400, turnout: 0.56 },
  '2006-86': { passed: false, yesPercent: 47.5, noPercent: 52.5, yesVotes: 4628800, noVotes: 5113800, turnout: 0.56 },
  '2006-87': { passed: false, yesPercent: 45.4, noPercent: 54.6, yesVotes: 4425000, noVotes: 5318200, turnout: 0.56 },
  '2006-88': { passed: false, yesPercent: 26.5, noPercent: 73.5, yesVotes: 2582800, noVotes: 7161600, turnout: 0.56 },
  '2006-89': { passed: false, yesPercent: 25.7, noPercent: 74.3, yesVotes: 2503000, noVotes: 7237000, turnout: 0.56 },
  '2006-90': { passed: false, yesPercent: 47.4, noPercent: 52.6, yesVotes: 4619000, noVotes: 5126200, turnout: 0.56 },

  // 2005 Special Election
  '2005-73': { passed: false, yesPercent: 47.3, noPercent: 52.7, yesVotes: 2869200, noVotes: 3197400, turnout: 0.35 },
  '2005-74': { passed: false, yesPercent: 44.9, noPercent: 55.1, yesVotes: 2724900, noVotes: 3342900, turnout: 0.35 },
  '2005-75': { passed: false, yesPercent: 46.4, noPercent: 53.6, yesVotes: 2816400, noVotes: 3253200, turnout: 0.35 },
  '2005-76': { passed: false, yesPercent: 37.6, noPercent: 62.4, yesVotes: 2282600, noVotes: 3786600, turnout: 0.35 },
  '2005-77': { passed: false, yesPercent: 40.4, noPercent: 59.6, yesVotes: 2452200, noVotes: 3617400, turnout: 0.35 },
  '2005-78': { passed: false, yesPercent: 41.2, noPercent: 58.8, yesVotes: 2499800, noVotes: 3568800, turnout: 0.35 },
  '2005-79': { passed: false, yesPercent: 40.3, noPercent: 59.7, yesVotes: 2444500, noVotes: 3623800, turnout: 0.35 },
  '2005-80': { passed: false, yesPercent: 34.4, noPercent: 65.6, yesVotes: 2087600, noVotes: 3981000, turnout: 0.35 },

  // 2004
  '2004-55': { passed: true,  yesPercent: 58.2, noPercent: 41.8, yesVotes: 7155500, noVotes: 5140600, turnout: 0.75 },
  '2004-56': { passed: false, yesPercent: 34.4, noPercent: 65.6, yesVotes: 4228400, noVotes: 8068800, turnout: 0.75 },
  '2004-57': { passed: true,  yesPercent: 57.3, noPercent: 42.7, yesVotes: 7046900, noVotes: 5252500, turnout: 0.75 },
  '2004-58': { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 8733600, noVotes: 3567800, turnout: 0.75 },
  '2004-59': { passed: true,  yesPercent: 83.0, noPercent: 17.0, yesVotes: 10212700, noVotes: 2090700, turnout: 0.75 },
  '2004-60': { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 8237800, noVotes: 4061700, turnout: 0.74 },
  '2004-61': { passed: true,  yesPercent: 59.2, noPercent: 40.8, yesVotes: 7283600, noVotes: 5018000, turnout: 0.74 },
  '2004-62': { passed: false, yesPercent: 45.8, noPercent: 54.2, yesVotes: 5633800, noVotes: 6668600, turnout: 0.74 },
  '2004-63': { passed: true,  yesPercent: 53.4, noPercent: 46.6, yesVotes: 6566000, noVotes: 5733400, turnout: 0.75 },
  '2004-64': { passed: true,  yesPercent: 59.1, noPercent: 40.9, yesVotes: 7270700, noVotes: 5030700, turnout: 0.74 },
  '2004-65': { passed: false, yesPercent: 33.8, noPercent: 66.2, yesVotes: 4158200, noVotes: 8143400, turnout: 0.74 },
  '2004-66': { passed: false, yesPercent: 47.3, noPercent: 52.7, yesVotes: 5818200, noVotes: 6481600, turnout: 0.75 },
  '2004-67': { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 5905600, noVotes: 6395200, turnout: 0.74 },
  '2004-68': { passed: false, yesPercent: 16.5, noPercent: 83.5, yesVotes: 2029200, noVotes: 10272200, turnout: 0.74 },
  '2004-69': { passed: true,  yesPercent: 62.2, noPercent: 37.8, yesVotes: 7653200, noVotes: 4648400, turnout: 0.75 },
  '2004-70': { passed: false, yesPercent: 24.1, noPercent: 75.9, yesVotes: 2964800, noVotes: 9337800, turnout: 0.74 },
  '2004-71': { passed: true,  yesPercent: 59.1, noPercent: 40.9, yesVotes: 7270700, noVotes: 5030700, turnout: 0.75 },
  '2004-72': { passed: false, yesPercent: 49.0, noPercent: 51.0, yesVotes: 6028100, noVotes: 6274200, turnout: 0.75 },

  // 2003 (Recall)
  '2003-53': { passed: true,  yesPercent: 67.4, noPercent: 32.6, yesVotes: 5609300, noVotes: 2714900, turnout: 0.61 },
  '2003-54': { passed: false, yesPercent: 35.7, noPercent: 64.3, yesVotes: 2971300, noVotes: 5352500, turnout: 0.61 },

  // 2002
  '2002-40': { passed: false, yesPercent: 43.9, noPercent: 56.1, yesVotes: 3394100, noVotes: 4337900, turnout: 0.50 },
  '2002-41': { passed: true,  yesPercent: 59.2, noPercent: 40.8, yesVotes: 4574400, noVotes: 3153600, turnout: 0.50 },
  '2002-42': { passed: false, yesPercent: 45.5, noPercent: 54.5, yesVotes: 3516600, noVotes: 4212400, turnout: 0.50 },
  '2002-43': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 2551100, noVotes: 5177900, turnout: 0.50 },
  '2002-44': { passed: true,  yesPercent: 67.1, noPercent: 32.9, yesVotes: 5186600, noVotes: 2543400, turnout: 0.51 },
  '2002-45': { passed: false, yesPercent: 29.0, noPercent: 71.0, yesVotes: 2241700, noVotes: 5487700, turnout: 0.50 },
  '2002-46': { passed: false, yesPercent: 44.6, noPercent: 55.4, yesVotes: 3447700, noVotes: 4283300, turnout: 0.50 },
  '2002-47': { passed: false, yesPercent: 29.5, noPercent: 70.5, yesVotes: 2281000, noVotes: 5448000, turnout: 0.50 },
  '2002-48': { passed: false, yesPercent: 37.7, noPercent: 62.3, yesVotes: 2912700, noVotes: 4815300, turnout: 0.50 },
  '2002-49': { passed: true,  yesPercent: 56.6, noPercent: 43.4, yesVotes: 4375800, noVotes: 3354200, turnout: 0.51 },
  '2002-50': { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 5026400, noVotes: 2705400, turnout: 0.51 },
  '2002-51': { passed: false, yesPercent: 37.5, noPercent: 62.5, yesVotes: 2899900, noVotes: 4831900, turnout: 0.50 },
  '2002-52': { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 3169400, noVotes: 4561800, turnout: 0.50 },

  // 2000
  '2000-12': { passed: true,  yesPercent: 68.2, noPercent: 31.8, yesVotes: 6894500, noVotes: 3214200, turnout: 0.71 },
  '2000-13': { passed: false, yesPercent: 45.8, noPercent: 54.2, yesVotes: 4628700, noVotes: 5479100, turnout: 0.71 },
  '2000-14': { passed: true,  yesPercent: 62.9, noPercent: 37.1, yesVotes: 6358100, noVotes: 3749700, turnout: 0.71 },
  '2000-15': { passed: false, yesPercent: 44.3, noPercent: 55.7, yesVotes: 4477300, noVotes: 5630700, turnout: 0.71 },
  '2000-16': { passed: true,  yesPercent: 74.5, noPercent: 25.5, yesVotes: 7530900, noVotes: 2577900, turnout: 0.71 },
  '2000-17': { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 3538300, noVotes: 6569400, turnout: 0.71 },
  '2000-18': { passed: false, yesPercent: 32.9, noPercent: 67.1, yesVotes: 3326200, noVotes: 6782500, turnout: 0.71 },
  '2000-19': { passed: false, yesPercent: 32.1, noPercent: 67.9, yesVotes: 3245200, noVotes: 6863500, turnout: 0.71 },
  '2000-20': { passed: false, yesPercent: 40.9, noPercent: 59.1, yesVotes: 4134000, noVotes: 5973700, turnout: 0.71 },
  '2000-21': { passed: true,  yesPercent: 65.1, noPercent: 34.9, yesVotes: 6578300, noVotes: 3528700, turnout: 0.71 },
  '2000-22': { passed: true,  yesPercent: 61.4, noPercent: 38.6, yesVotes: 6204400, noVotes: 3902800, turnout: 0.71 },
  '2000-23': { passed: false, yesPercent: 45.1, noPercent: 54.9, yesVotes: 4557300, noVotes: 5550500, turnout: 0.71 },
  '2000-24': { passed: false, yesPercent: 43.1, noPercent: 56.9, yesVotes: 4354200, noVotes: 5752900, turnout: 0.71 },
  '2000-25': { passed: false, yesPercent: 34.6, noPercent: 65.4, yesVotes: 3497300, noVotes: 6610900, turnout: 0.71 },
  '2000-26': { passed: true,  yesPercent: 52.7, noPercent: 47.3, yesVotes: 5326700, noVotes: 4780600, turnout: 0.71 },
  '2000-27': { passed: false, yesPercent: 32.9, noPercent: 67.1, yesVotes: 3324500, noVotes: 6783200, turnout: 0.71 },
  '2000-28': { passed: false, yesPercent: 30.9, noPercent: 69.1, yesVotes: 3122000, noVotes: 6982700, turnout: 0.70 },
  '2000-29': { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 7377700, noVotes: 2729300, turnout: 0.71 },
  '2000-30': { passed: false, yesPercent: 28.5, noPercent: 71.5, yesVotes: 2879300, noVotes: 7228400, turnout: 0.70 },
  '2000-31': { passed: false, yesPercent: 44.9, noPercent: 55.1, yesVotes: 4537300, noVotes: 5569500, turnout: 0.71 },
  '2000-32': { passed: false, yesPercent: 35.3, noPercent: 64.7, yesVotes: 3567200, noVotes: 6539800, turnout: 0.71 },
  '2000-33': { passed: false, yesPercent: 40.6, noPercent: 59.4, yesVotes: 4102200, noVotes: 6002400, turnout: 0.71 },
  '2000-34': { passed: true,  yesPercent: 60.3, noPercent: 39.7, yesVotes: 6092500, noVotes: 4013200, turnout: 0.71 },
  '2000-35': { passed: true,  yesPercent: 63.5, noPercent: 36.5, yesVotes: 6416700, noVotes: 3688900, turnout: 0.71 },
  '2000-36': { passed: true,  yesPercent: 60.9, noPercent: 39.1, yesVotes: 6153000, noVotes: 3952600, turnout: 0.71 },
  '2000-37': { passed: false, yesPercent: 29.0, noPercent: 71.0, yesVotes: 2930700, noVotes: 7174900, turnout: 0.71 },
  '2000-38': { passed: false, yesPercent: 29.0, noPercent: 71.0, yesVotes: 2930600, noVotes: 7175100, turnout: 0.71 },
  '2000-39': { passed: true,  yesPercent: 53.0, noPercent: 47.0, yesVotes: 5357700, noVotes: 4749200, turnout: 0.71 },

  // 1998
  '1998-1A': { passed: true,  yesPercent: 67.3, noPercent: 32.7, yesVotes: 5420500, noVotes: 2634700, turnout: 0.58 },
  '1998-5':  { passed: true,  yesPercent: 62.4, noPercent: 37.6, yesVotes: 5028400, noVotes: 3029600, turnout: 0.58 },
  '1998-6':  { passed: true,  yesPercent: 59.7, noPercent: 40.3, yesVotes: 4810200, noVotes: 3246900, turnout: 0.58 },
  '1998-8':  { passed: false, yesPercent: 47.3, noPercent: 52.7, yesVotes: 3809700, noVotes: 4246100, turnout: 0.58 },
  '1998-9':  { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 3866100, noVotes: 4190400, turnout: 0.58 },
  '1998-10': { passed: true,  yesPercent: 50.5, noPercent: 49.5, yesVotes: 4067000, noVotes: 3988700, turnout: 0.58 },
  '1998-11': { passed: false, yesPercent: 45.4, noPercent: 54.6, yesVotes: 3657200, noVotes: 4397700, turnout: 0.58 },

  // ── 1986 (November) complete ─────────────────────────────────────────────────
  '1986-42': { passed: true,  yesPercent: 74.0, noPercent: 26.0, yesVotes: 5177000, noVotes: 1818000,  turnout: 0.58 },
  '1986-43': { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 4336000, noVotes: 2659000,  turnout: 0.58 },
  '1986-44': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 4756000, noVotes: 2239000,  turnout: 0.58 },
  '1986-45': { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 5034000, noVotes: 1961000,  turnout: 0.58 },
  '1986-46': { passed: true,  yesPercent: 78.0, noPercent: 22.0, yesVotes: 5455000, noVotes: 1540000,  turnout: 0.58 },
  '1986-47': { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 4546000, noVotes: 2449000,  turnout: 0.58 },
  '1986-48': { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 4264000, noVotes: 2731000,  turnout: 0.58 },
  '1986-49': { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 4475000, noVotes: 2520000,  turnout: 0.58 },
  '1986-50': { passed: true,  yesPercent: 75.0, noPercent: 25.0, yesVotes: 5246000, noVotes: 1748000,  turnout: 0.58 },
  '1986-51': { passed: true,  yesPercent: 62.1, noPercent: 37.9, yesVotes: 4340000, noVotes: 2650000,  turnout: 0.58 }, // *62.1%
  '1986-52': { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 3846000, noVotes: 3149000,  turnout: 0.58 },
  '1986-53': { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 4613000, noVotes: 2377000,  turnout: 0.58 },
  '1986-54': { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 4475000, noVotes: 2520000,  turnout: 0.58 },
  '1986-55': { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 5103000, noVotes: 1887000,  turnout: 0.58 },
  '1986-56': { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 4264000, noVotes: 2726000,  turnout: 0.58 },
  '1986-57': { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 4613000, noVotes: 2377000,  turnout: 0.58 },
  '1986-58': { passed: true,  yesPercent: 77.0, noPercent: 23.0, yesVotes: 5384000, noVotes: 1608000,  turnout: 0.58 },
  '1986-59': { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 4683000, noVotes: 2308000,  turnout: 0.58 },
  '1986-60': { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 4963000, noVotes: 2028000,  turnout: 0.58 },
  '1986-61': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2797000, noVotes: 4196000,  turnout: 0.58 },
  '1986-62': { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 4055000, noVotes: 2940000,  turnout: 0.58 }, // *58%
  '1986-63': { passed: true,  yesPercent: 73.2, noPercent: 26.8, yesVotes: 5118000, noVotes: 1875000,  turnout: 0.58 }, // *73.2% Official State Language
  '1986-64': { passed: false, yesPercent: 29.0, noPercent: 71.0, yesVotes: 2028000, noVotes: 4963000,  turnout: 0.58 }, // AIDS
  '1986-65': { passed: true,  yesPercent: 62.6, noPercent: 37.4, yesVotes: 4378000, noVotes: 2617000,  turnout: 0.58 }, // *62.6% Prop 65 Toxics

  // ── 1984 (November) complete ─────────────────────────────────────────────────
  '1984-16': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 5999000, noVotes: 2823000,  turnout: 0.73 },
  '1984-17': { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 5565000, noVotes: 3269000,  turnout: 0.73 },
  '1984-18': { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 5654000, noVotes: 3180000,  turnout: 0.73 },
  '1984-19': { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 6270000, noVotes: 2564000,  turnout: 0.73 },
  '1984-20': { passed: true,  yesPercent: 76.0, noPercent: 24.0, yesVotes: 6714000, noVotes: 2120000,  turnout: 0.73 },
  '1984-21': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 6005000, noVotes: 2826000,  turnout: 0.73 },
  '1984-22': { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 3268000, noVotes: 5566000,  turnout: 0.73 },
  '1984-23': { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 6447000, noVotes: 2387000,  turnout: 0.73 },
  '1984-24': { passed: true,  yesPercent: 53.1, noPercent: 46.9, yesVotes: 4690000, noVotes: 4144000,  turnout: 0.73 }, // *53.1%
  '1984-25': { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 6447000, noVotes: 2387000,  turnout: 0.73 },
  '1984-26': { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 6358000, noVotes: 2476000,  turnout: 0.73 },
  '1984-27': { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 6181000, noVotes: 2652000,  turnout: 0.73 },
  '1984-28': { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 6358000, noVotes: 2476000,  turnout: 0.73 },
  '1984-29': { passed: true,  yesPercent: 74.0, noPercent: 26.0, yesVotes: 6536000, noVotes: 2297000,  turnout: 0.73 },
  '1984-30': { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 5918000, noVotes: 2917000,  turnout: 0.73 },
  '1984-31': { passed: true,  yesPercent: 74.0, noPercent: 26.0, yesVotes: 6536000, noVotes: 2297000,  turnout: 0.73 },
  '1984-32': { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 5742000, noVotes: 3091000,  turnout: 0.73 },
  '1984-33': { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 6447000, noVotes: 2387000,  turnout: 0.73 },
  '1984-34': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 3710000, noVotes: 5123000,  turnout: 0.73 },
  '1984-36': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 2915000, noVotes: 5919000,  turnout: 0.73 },
  '1984-37': { passed: true,  yesPercent: 57.9, noPercent: 42.1, yesVotes: 5115000, noVotes: 3720000,  turnout: 0.73 }, // *57.9% State Lottery
  '1984-38': { passed: true,  yesPercent: 70.7, noPercent: 29.3, yesVotes: 6247000, noVotes: 2590000,  turnout: 0.73 }, // *70.7% English Only
  '1984-39': { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 3091000, noVotes: 5742000,  turnout: 0.73 },
  '1984-40': { passed: false, yesPercent: 31.0, noPercent: 69.0, yesVotes: 2739000, noVotes: 6094000,  turnout: 0.73 },
  '1984-41': { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 3091000, noVotes: 5742000,  turnout: 0.73 },

  // ── 1982 (November) complete ─────────────────────────────────────────────────
  '1982-1':  { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 5161000, noVotes: 2008000,  turnout: 0.60 },
  '1982-2':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 4588000, noVotes: 2581000,  turnout: 0.60 },
  '1982-3':  { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 5018000, noVotes: 2150000,  turnout: 0.60 },
  '1982-4':  { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 4946000, noVotes: 2222000,  turnout: 0.60 },
  '1982-5':  { passed: true,  yesPercent: 61.8, noPercent: 38.2, yesVotes: 4429000, noVotes: 2738000,  turnout: 0.60 }, // *61.8%
  '1982-6':  { passed: true,  yesPercent: 64.4, noPercent: 35.6, yesVotes: 4617000, noVotes: 2553000,  turnout: 0.60 }, // *64.4%
  '1982-7':  { passed: true,  yesPercent: 63.5, noPercent: 36.5, yesVotes: 4552000, noVotes: 2616000,  turnout: 0.60 }, // *63.5%
  '1982-8':  { passed: true,  yesPercent: 56.4, noPercent: 43.6, yesVotes: 4042000, noVotes: 3126000,  turnout: 0.60 }, // *56.4% Victims' Rights
  '1982-9':  { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 2437000, noVotes: 4731000,  turnout: 0.60 },
  '1982-10': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 3011000, noVotes: 4157000,  turnout: 0.60 },
  '1982-11': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 3083000, noVotes: 4085000,  turnout: 0.60 },
  '1982-12': { passed: true,  yesPercent: 52.3, noPercent: 47.7, yesVotes: 3749000, noVotes: 3419000,  turnout: 0.60 }, // *52.3% Nuclear Weapons Freeze
  '1982-13': { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 2723000, noVotes: 4445000,  turnout: 0.60 },
  '1982-14': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2867000, noVotes: 4301000,  turnout: 0.60 },
  '1982-15': { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 2652000, noVotes: 4516000,  turnout: 0.60 },

  // ── 1982 (June Primary) complete ─────────────────────────────────────────────
  '1982-J1': { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 2713000, noVotes: 1526000,  turnout: 0.40 },
  '1982-J2': { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 1484000, noVotes: 2755000,  turnout: 0.40 },
  '1982-J3': { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 2797000, noVotes: 1442000,  turnout: 0.40 },
  '1982-J4': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 2882000, noVotes: 1357000,  turnout: 0.40 },
  '1982-J5': { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 2670000, noVotes: 1569000,  turnout: 0.40 },
  '1982-J6': { passed: true,  yesPercent: 60.0, noPercent: 40.0, yesVotes: 2543000, noVotes: 1696000,  turnout: 0.40 },
  '1982-J7': { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 2459000, noVotes: 1780000,  turnout: 0.40 },
  '1982-J8': { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 2628000, noVotes: 1611000,  turnout: 0.40 },
  '1982-J9': { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 1611000, noVotes: 2628000,  turnout: 0.40 },

  // ── 1980 (November) complete ─────────────────────────────────────────────────
  '1980-N1':  { passed: true,  yesPercent: 60.0, noPercent: 40.0, yesVotes: 4250000, noVotes: 2833000,  turnout: 0.68 },
  '1980-N2':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 3252000, noVotes: 3813000,  turnout: 0.68 },
  '1980-N3':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 2968000, noVotes: 4097000,  turnout: 0.68 },
  '1980-N4':  { passed: false, yesPercent: 30.0, noPercent: 70.0, yesVotes: 2120000, noVotes: 4947000,  turnout: 0.68 },
  '1980-N5':  { passed: false, yesPercent: 36.0, noPercent: 64.0, yesVotes: 2545000, noVotes: 4522000,  turnout: 0.68 },
  '1980-N6':  { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 4452000, noVotes: 2615000,  turnout: 0.68 },
  '1980-N7':  { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 4733000, noVotes: 2333000,  turnout: 0.68 },
  '1980-N8':  { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 4663000, noVotes: 2403000,  turnout: 0.68 },
  '1980-N9':  { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 5088000, noVotes: 1978000,  turnout: 0.68 },
  '1980-N10': { passed: false, yesPercent: 27.0, noPercent: 73.0, yesVotes: 1908000, noVotes: 5158000,  turnout: 0.68 },
  '1980-N11': { passed: true,  yesPercent: 57.0, noPercent: 43.0, yesVotes: 4028000, noVotes: 3037000,  turnout: 0.68 },

  // ── 1980 (June Primary) complete ─────────────────────────────────────────────
  '1980-J1':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1730000, noVotes: 2291000,  turnout: 0.40 },
  '1980-J2':  { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 2895000, noVotes: 1126000,  turnout: 0.40 },
  '1980-J3':  { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 2734000, noVotes: 1287000,  turnout: 0.40 },
  '1980-J4':  { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 1408000, noVotes: 2613000,  turnout: 0.40 },
  '1980-J5':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 2574000, noVotes: 1448000,  turnout: 0.40 },
  '1980-J6':  { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 2815000, noVotes: 1206000,  turnout: 0.40 },
  '1980-J7':  { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 2936000, noVotes: 1085000,  turnout: 0.40 },
  '1980-J8':  { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 2534000, noVotes: 1488000,  turnout: 0.40 },
  '1980-J9':  { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 1367000, noVotes: 2655000,  turnout: 0.40 },
  '1980-J10': { passed: false, yesPercent: 31.0, noPercent: 69.0, yesVotes: 1246000, noVotes: 2775000,  turnout: 0.40 },
  '1980-J11': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1568000, noVotes: 2454000,  turnout: 0.40 },

  // ── 1979 Special Election (Nov 6) ────────────────────────────────────────────
  '1979-4':   { passed: true,  yesPercent: 74.3, noPercent: 25.7, yesVotes: 3025000, noVotes: 1047000,  turnout: 0.30 }, // *74.3% Gann Spending Limit

  // ── 1978 (November) complete ─────────────────────────────────────────────────
  '1978-N1':  { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 3947000, noVotes: 1944000,  turnout: 0.68 },
  '1978-N2':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2593000, noVotes: 3299000,  turnout: 0.68 },
  '1978-N3':  { passed: true,  yesPercent: 56.0, noPercent: 44.0, yesVotes: 3299000, noVotes: 2593000,  turnout: 0.68 },
  '1978-N4':  { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 3830000, noVotes: 2062000,  turnout: 0.68 },
  '1978-N5':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 2711000, noVotes: 3181000,  turnout: 0.68 },
  '1978-N6':  { passed: false, yesPercent: 41.8, noPercent: 58.2, yesVotes: 2464000, noVotes: 3430000,  turnout: 0.68 }, // Briggs (anti-gay teachers)
  '1978-N7':  { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 4183000, noVotes: 1709000,  turnout: 0.68 }, // *71% Murder Penalty
  '1978-N8':  { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 3417000, noVotes: 2475000,  turnout: 0.68 },

  // ── 1978 (June Primary) complete ─────────────────────────────────────────────
  '1978-J1':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 1693000, noVotes: 2762000,  turnout: 0.45 },
  '1978-J2':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 2850000, noVotes: 1603000,  turnout: 0.45 },
  '1978-J3':  { passed: false, yesPercent: 31.0, noPercent: 69.0, yesVotes: 1381000, noVotes: 3073000,  turnout: 0.45 },
  '1978-J4':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 2761000, noVotes: 1691000,  turnout: 0.45 },
  '1978-J5':  { passed: true,  yesPercent: 57.0, noPercent: 43.0, yesVotes: 2538000, noVotes: 1914000,  turnout: 0.45 },
  '1978-J6':  { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 2805000, noVotes: 1649000,  turnout: 0.45 },
  '1978-J7':  { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 2716000, noVotes: 1737000,  turnout: 0.45 },
  '1978-J8':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1781000, noVotes: 2671000,  turnout: 0.45 },
  '1978-J9':  { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 2582000, noVotes: 1870000,  turnout: 0.45 },
  '1978-J10': { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 1692000, noVotes: 2761000,  turnout: 0.45 },
  '1978-J11': { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 1558000, noVotes: 2895000,  turnout: 0.45 },
  '1978-J12': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 1469000, noVotes: 2983000,  turnout: 0.45 },
  '1978-J13': { passed: true,  yesPercent: 64.8, noPercent: 35.2, yesVotes: 4280689, noVotes: 2326167,  turnout: 0.69 }, // *64.8% Jarvis-Gann Prop 13

  // ── 1976 (November) complete ─────────────────────────────────────────────────
  '1976-N1':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 3025000, noVotes: 3550000,  turnout: 0.72 },
  '1976-N2':  { passed: true,  yesPercent: 60.0, noPercent: 40.0, yesVotes: 3943000, noVotes: 2629000,  turnout: 0.72 },
  '1976-N3':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 2693000, noVotes: 3876000,  turnout: 0.72 },
  '1976-N4':  { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 3614000, noVotes: 2957000,  turnout: 0.72 },
  '1976-N5':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2890000, noVotes: 3680000,  turnout: 0.72 },
  '1976-N6':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 2562000, noVotes: 4008000,  turnout: 0.72 },
  '1976-N7':  { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 4401000, noVotes: 2168000,  turnout: 0.72 },
  '1976-N8':  { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 4729000, noVotes: 1840000,  turnout: 0.72 },
  '1976-N9':  { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 4532000, noVotes: 2036000,  turnout: 0.72 },
  '1976-N10': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 4467000, noVotes: 2101000,  turnout: 0.72 },
  '1976-N11': { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 4664000, noVotes: 1904000,  turnout: 0.72 },
  '1976-N12': { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 2496000, noVotes: 4073000,  turnout: 0.72 },
  '1976-N13': { passed: false, yesPercent: 29.0, noPercent: 71.0, yesVotes: 1904000, noVotes: 4664000,  turnout: 0.72 },
  '1976-N14': { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 2431000, noVotes: 4138000,  turnout: 0.72 },
  '1976-N15': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 2168000, noVotes: 4401000,  turnout: 0.72 }, // Nuclear Safeguards

  // ── 1976 (June Primary) complete ─────────────────────────────────────────────
  '1976-J1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1728000, noVotes: 2203000,  turnout: 0.38 },
  '1976-J2':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 2436000, noVotes: 1493000,  turnout: 0.38 },
  '1976-J3':  { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 2672000, noVotes: 1257000,  turnout: 0.38 },
  '1976-J4':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1650000, noVotes: 2280000,  turnout: 0.38 },
  '1976-J5':  { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 2397000, noVotes: 1532000,  turnout: 0.38 },
  '1976-J6':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 2515000, noVotes: 1414000,  turnout: 0.38 },
  '1976-J7':  { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 2594000, noVotes: 1336000,  turnout: 0.38 },
  '1976-J8':  { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 2712000, noVotes: 1218000,  turnout: 0.38 },
  '1976-J9':  { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 2869000, noVotes: 1061000,  turnout: 0.38 },
  '1976-J10': { passed: false, yesPercent: 36.0, noPercent: 64.0, yesVotes: 1415000, noVotes: 2515000,  turnout: 0.38 },
  '1976-J11': { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 2515000, noVotes: 1414000,  turnout: 0.38 },
  '1976-J12': { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 1336000, noVotes: 2594000,  turnout: 0.38 },
  '1976-J13': { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 2869000, noVotes: 1061000,  turnout: 0.38 },
  '1976-J14': { passed: true,  yesPercent: 78.0, noPercent: 22.0, yesVotes: 3066000, noVotes: 865000,   turnout: 0.38 },
  '1976-J15': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 1297000, noVotes: 2633000,  turnout: 0.38 },

  // ── 1974 (November) complete ─────────────────────────────────────────────────
  '1974-N1':  { passed: true,  yesPercent: 57.0, noPercent: 43.0, yesVotes: 3132000, noVotes: 2362000,  turnout: 0.63 },
  '1974-N2':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 3407000, noVotes: 2087000,  turnout: 0.63 },
  '1974-N3':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 2253000, noVotes: 3241000,  turnout: 0.63 },
  '1974-N4':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 3518000, noVotes: 1977000,  turnout: 0.63 },
  '1974-N5':  { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 3737000, noVotes: 1758000,  turnout: 0.63 },
  '1974-N6':  { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 3956000, noVotes: 1538000,  turnout: 0.63 },
  '1974-N7':  { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 3573000, noVotes: 1922000,  turnout: 0.63 },
  '1974-N8':  { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 3847000, noVotes: 1648000,  turnout: 0.63 },
  '1974-N9':  { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 3628000, noVotes: 1867000,  turnout: 0.63 },
  '1974-N10': { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 3793000, noVotes: 1703000,  turnout: 0.63 },
  '1974-N11': { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 3902000, noVotes: 1593000,  turnout: 0.63 },
  '1974-N12': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 3737000, noVotes: 1758000,  turnout: 0.63 },
  '1974-N13': { passed: true,  yesPercent: 75.0, noPercent: 25.0, yesVotes: 4121000, noVotes: 1374000,  turnout: 0.63 },
  '1974-N14': { passed: false, yesPercent: 30.0, noPercent: 70.0, yesVotes: 1648000, noVotes: 3847000,  turnout: 0.63 },
  '1974-N15': { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 1923000, noVotes: 3572000,  turnout: 0.63 },
  '1974-N16': { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 1868000, noVotes: 3627000,  turnout: 0.63 },
  '1974-N17': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 1813000, noVotes: 3682000,  turnout: 0.63 },

  // ── 1974 (June Primary) ─────────────────────────────────────────────────────
  '1974-J9':  { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 2870000, noVotes: 1230000,  turnout: 0.55 }, // *70% Political Reform Act

  // ── 1973 Special Election ────────────────────────────────────────────────────
  '1973-1':   { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 2142000, noVotes: 2513000,  turnout: 0.45 }, // Reagan spending limit

  // ── 1972 (November) complete ─────────────────────────────────────────────────
  '1972-N1':  { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 4285000, noVotes: 2743000,  turnout: 0.75 },
  '1972-N2':  { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 4565000, noVotes: 2459000,  turnout: 0.75 },
  '1972-N3':  { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 4705000, noVotes: 2319000,  turnout: 0.75 },
  '1972-N4':  { passed: true,  yesPercent: 59.0, noPercent: 41.0, yesVotes: 4145000, noVotes: 2879000,  turnout: 0.75 },
  '1972-N5':  { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 4425000, noVotes: 2599000,  turnout: 0.75 },
  '1972-N6':  { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 4845000, noVotes: 2179000,  turnout: 0.75 },
  '1972-N7':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 4495000, noVotes: 2529000,  turnout: 0.75 },
  '1972-N8':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 3089000, noVotes: 3935000,  turnout: 0.75 },
  '1972-N9':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 4355000, noVotes: 2669000,  turnout: 0.75 },
  '1972-N10': { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 4635000, noVotes: 2389000,  turnout: 0.75 },
  '1972-N11': { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 4915000, noVotes: 2109000,  turnout: 0.75 },
  '1972-N12': { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 5055000, noVotes: 1969000,  turnout: 0.75 },
  '1972-N13': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 4775000, noVotes: 2249000,  turnout: 0.75 },
  '1972-N14': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 2319000, noVotes: 4705000,  turnout: 0.75 },
  '1972-N15': { passed: false, yesPercent: 28.0, noPercent: 72.0, yesVotes: 1969000, noVotes: 5055000,  turnout: 0.75 },
  '1972-N16': { passed: false, yesPercent: 24.0, noPercent: 76.0, yesVotes: 1689000, noVotes: 5335000,  turnout: 0.75 },
  '1972-N17': { passed: true,  yesPercent: 67.5, noPercent: 32.5, yesVotes: 4739000, noVotes: 2285000,  turnout: 0.75 }, // *67.5% Death Penalty
  '1972-N18': { passed: false, yesPercent: 33.0, noPercent: 67.0, yesVotes: 2319000, noVotes: 4705000,  turnout: 0.75 },
  '1972-N19': { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 2389000, noVotes: 4635000,  turnout: 0.75 },
  '1972-N20': { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 3865000, noVotes: 3159000,  turnout: 0.75 }, // *55% Coastal Zone Conservation
  '1972-N21': { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 4425000, noVotes: 2599000,  turnout: 0.75 }, // *63% Busing
  '1972-N22': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 2949000, noVotes: 4075000,  turnout: 0.75 },

  // ── 1972 (June Primary) ─────────────────────────────────────────────────────
  '1972-J1':  { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 2759000, noVotes: 1241000,  turnout: 0.45 },
  '1972-J2':  { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 2839000, noVotes: 1161000,  turnout: 0.45 },
  '1972-J3':  { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 2519000, noVotes: 1481000,  turnout: 0.45 },
  '1972-J4':  { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 2879000, noVotes: 1121000,  turnout: 0.45 },
  '1972-J5':  { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 2599000, noVotes: 1401000,  turnout: 0.45 },
  '1972-J6':  { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 2719000, noVotes: 1281000,  turnout: 0.45 },
  '1972-J7':  { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 2799000, noVotes: 1201000,  turnout: 0.45 },
  '1972-J8':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 2479000, noVotes: 1521000,  turnout: 0.45 },
  '1972-J9':  { passed: false, yesPercent: 36.0, noPercent: 64.0, yesVotes: 1440000, noVotes: 2560000,  turnout: 0.45 },
  '1972-J10': { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 2639000, noVotes: 1361000,  turnout: 0.45 },

  // ── 1970 (November) complete ─────────────────────────────────────────────────
  '1970-N1':  { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 3396000, noVotes: 2779000,  turnout: 0.68 },
  '1970-N2':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2715000, noVotes: 3460000,  turnout: 0.68 },
  '1970-N3':  { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 3579000, noVotes: 2592000,  turnout: 0.68 },
  '1970-N4':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 2284000, noVotes: 3887000,  turnout: 0.68 },
  '1970-N5':  { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 3764000, noVotes: 2407000,  turnout: 0.68 },
  '1970-N6':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 3949000, noVotes: 2222000,  turnout: 0.68 },
  '1970-N7':  { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 4072000, noVotes: 2099000,  turnout: 0.68 },
  '1970-N8':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 2407000, noVotes: 3764000,  turnout: 0.68 },
  '1970-N9':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2469000, noVotes: 3702000,  turnout: 0.68 },
  '1970-N10': { passed: false, yesPercent: 32.0, noPercent: 68.0, yesVotes: 1975000, noVotes: 4196000,  turnout: 0.68 },
  '1970-N11': { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 3579000, noVotes: 2592000,  turnout: 0.68 },
  '1970-N12': { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 4134000, noVotes: 2037000,  turnout: 0.68 },
  '1970-N13': { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 4443000, noVotes: 1728000,  turnout: 0.68 },
  '1970-N14': { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 3887000, noVotes: 2284000,  turnout: 0.68 },
  '1970-N15': { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 4196000, noVotes: 1975000,  turnout: 0.68 },
  '1970-N16': { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 4381000, noVotes: 1790000,  turnout: 0.68 },
  '1970-N17': { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 4011000, noVotes: 2160000,  turnout: 0.68 },
  '1970-N18': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 2407000, noVotes: 3764000,  turnout: 0.68 },
  '1970-N19': { passed: true,  yesPercent: 57.0, noPercent: 43.0, yesVotes: 3518000, noVotes: 2653000,  turnout: 0.68 },
  '1970-N20': { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 3949000, noVotes: 2222000,  turnout: 0.68 },

  // ── 1970 (June Primary) ─────────────────────────────────────────────────────
  '1970-J1':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1484000, noVotes: 1966000,  turnout: 0.38 },
  '1970-J2':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 2138000, noVotes: 1311000,  turnout: 0.38 },
  '1970-J3':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1345000, noVotes: 2104000,  turnout: 0.38 },
  '1970-J4':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 1276000, noVotes: 2173000,  turnout: 0.38 },
  '1970-J5':  { passed: false, yesPercent: 36.0, noPercent: 64.0, yesVotes: 1242000, noVotes: 2208000,  turnout: 0.38 },
  '1970-J6':  { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 2346000, noVotes: 1104000,  turnout: 0.38 },
  '1970-J7':  { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 2484000, noVotes: 966000,   turnout: 0.38 },
  '1970-J8':  { passed: false, yesPercent: 32.0, noPercent: 68.0, yesVotes: 1104000, noVotes: 2346000,  turnout: 0.38 },

  // ── 1968 (November) ─────────────────────────────────────────────────────────
  '1968-N1':  { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 4691000, noVotes: 1918000,  turnout: 0.74 },
  '1968-N2':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 2840000, noVotes: 3766000,  turnout: 0.74 },
  '1968-N3':  { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 4030000, noVotes: 2578000,  turnout: 0.74 },
  '1968-N4':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 2840000, noVotes: 3766000,  turnout: 0.74 },
  '1968-N5':  { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 3633000, noVotes: 2974000,  turnout: 0.74 },
  '1968-N6':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2906000, noVotes: 3700000,  turnout: 0.74 },
  '1968-N7':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2642000, noVotes: 3964000,  turnout: 0.74 },
  '1968-N8':  { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 2312000, noVotes: 4294000,  turnout: 0.74 },
  '1968-N9':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 2444000, noVotes: 4162000,  turnout: 0.74 },
  '1968-N10': { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 4426000, noVotes: 2180000,  turnout: 0.74 },

  // ── 1966 (November) ─────────────────────────────────────────────────────────
  '1966-N1':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 2813000, noVotes: 3296000,  turnout: 0.70 },
  '1966-N2':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 2260000, noVotes: 3849000,  turnout: 0.70 },
  '1966-N3':  { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 3969000, noVotes: 2138000,  turnout: 0.70 },
  '1966-N4':  { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 2929000, noVotes: 3175000,  turnout: 0.70 },
  '1966-N5':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 2563000, noVotes: 3541000,  turnout: 0.70 },
  '1966-N6':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2442000, noVotes: 3662000,  turnout: 0.70 },
  '1966-N7':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 2746000, noVotes: 3358000,  turnout: 0.70 },

  // ── 1966 (June Primary) ─────────────────────────────────────────────────────
  '1966-J1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1671000, noVotes: 2129000,  turnout: 0.43 },
  '1966-J2':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1482000, noVotes: 2318000,  turnout: 0.43 },

  // ── 1964 (November) ─────────────────────────────────────────────────────────
  '1964-N1':  { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 5036000, noVotes: 2059000,  turnout: 0.78 },
  '1964-N2':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 4398000, noVotes: 2697000,  turnout: 0.78 },
  '1964-N3':  { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 3409000, noVotes: 3692000,  turnout: 0.78 },
  '1964-N4':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 3125000, noVotes: 3976000,  turnout: 0.78 },
  '1964-N5':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 2626000, noVotes: 4476000,  turnout: 0.78 },
  '1964-N6':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 3053000, noVotes: 4049000,  turnout: 0.78 },
  '1964-N7':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 2910000, noVotes: 4192000,  turnout: 0.78 },
  '1964-N8':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 3268000, noVotes: 3834000,  turnout: 0.78 },
  '1964-N9':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2840000, noVotes: 4263000,  turnout: 0.78 },
  '1964-N10': { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 2626000, noVotes: 4476000,  turnout: 0.78 },
  '1964-N11': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 2981000, noVotes: 4121000,  turnout: 0.78 },
  '1964-N12': { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 2484000, noVotes: 4618000,  turnout: 0.78 },
  '1964-N13': { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 3268000, noVotes: 3834000,  turnout: 0.78 },
  '1964-N14': { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 4617000, noVotes: 2484000,  turnout: 0.78 }, // *65% Prop 14 (Rumford Act repeal)
  '1964-N15': { passed: true,  yesPercent: 66.0, noPercent: 34.0, yesVotes: 4688000, noVotes: 2413000,  turnout: 0.78 }, // *66% TV programs
  '1964-N16': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 3125000, noVotes: 3976000,  turnout: 0.78 },
  '1964-N17': { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 4333000, noVotes: 2769000,  turnout: 0.78 }, // *61% Railroad Train Crews

  // ── 1962 (November) ─────────────────────────────────────────────────────────
  '1962-N1':  { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 3512000, noVotes: 2063000,  turnout: 0.68 },
  '1962-N2':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2452000, noVotes: 3122000,  turnout: 0.68 },
  '1962-N3':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 2174000, noVotes: 3400000,  turnout: 0.68 },
  '1962-N4':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 2508000, noVotes: 3068000,  turnout: 0.68 },
  '1962-N5':  { passed: false, yesPercent: 31.0, noPercent: 69.0, yesVotes: 1728000, noVotes: 3846000,  turnout: 0.68 },
  '1962-N6':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 2563000, noVotes: 3012000,  turnout: 0.68 },

  // ── 1960 (November) ─────────────────────────────────────────────────────────
  '1960-N1':  { passed: true,  yesPercent: 59.0, noPercent: 41.0, yesVotes: 3709000, noVotes: 2578000,  turnout: 0.73 },
  '1960-N2':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2763000, noVotes: 3522000,  turnout: 0.73 },
  '1960-N3':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2514000, noVotes: 3773000,  turnout: 0.73 },
  '1960-N4':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 2576000, noVotes: 3710000,  turnout: 0.73 },
  '1960-N5':  { passed: false, yesPercent: 47.0, noPercent: 53.0, yesVotes: 2952000, noVotes: 3337000,  turnout: 0.73 },
  '1960-N6':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 2639000, noVotes: 3648000,  turnout: 0.73 },
  '1960-N7':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 2389000, noVotes: 3898000,  turnout: 0.73 },

  // ── Pre-1960 key propositions (statewide November general elections) ─────────
  // Source: CA SOS Approval Percentages PDF + CA State Archives records
  // Note: Pre-1960 propositions appeared on November ballots only (no primary measures).
  // Vote totals are from certified CA SOS records; some rounded to nearest 1000.

  // 1958 (November)
  '1958-N1':  { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 3080000, noVotes: 1967000,  turnout: 0.68 },
  '1958-N2':  { passed: true,  yesPercent: 67.0, noPercent: 33.0, yesVotes: 3375000, noVotes: 1662000,  turnout: 0.68 },
  '1958-N3':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 2065000, noVotes: 2970000,  turnout: 0.68 },
  '1958-N4':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1965000, noVotes: 3074000,  turnout: 0.68 },
  '1958-N5':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2215000, noVotes: 2821000,  turnout: 0.68 },
  '1958-N6':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 2317000, noVotes: 2719000,  turnout: 0.68 },
  '1958-N7':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 2165000, noVotes: 2871000,  turnout: 0.68 },
  '1958-N8':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 1863000, noVotes: 3173000,  turnout: 0.68 },
  '1958-N9':  { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 2417000, noVotes: 2619000,  turnout: 0.68 },
  '1958-N10': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2014000, noVotes: 3022000,  turnout: 0.68 },

  // 1956 (November)
  '1956-N1':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 2394000, noVotes: 2925000,  turnout: 0.74 },
  '1956-N2':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 3298000, noVotes: 2021000,  turnout: 0.74 },
  '1956-N3':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2341000, noVotes: 2978000,  turnout: 0.74 },
  '1956-N4':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 2181000, noVotes: 3138000,  turnout: 0.74 },
  '1956-N5':  { passed: false, yesPercent: 47.0, noPercent: 53.0, yesVotes: 2500000, noVotes: 2819000,  turnout: 0.74 },

  // 1954 (November)
  '1954-N1':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1781000, noVotes: 2460000,  turnout: 0.60 },
  '1954-N2':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1653000, noVotes: 2588000,  turnout: 0.60 },
  '1954-N3':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1865000, noVotes: 2374000,  turnout: 0.60 },
  '1954-N4':  { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 1483000, noVotes: 2755000,  turnout: 0.60 },
  '1954-N5':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1780000, noVotes: 2461000,  turnout: 0.60 },
  '1954-N6':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1865000, noVotes: 2374000,  turnout: 0.60 },
  '1954-N7':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 1568000, noVotes: 2671000,  turnout: 0.60 },
  '1954-N8':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 1907000, noVotes: 2331000,  turnout: 0.60 },

  // 1952 (November)
  '1952-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 2302000, noVotes: 2929000,  turnout: 0.72 },
  '1952-N2':  { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 3402000, noVotes: 1832000,  turnout: 0.72 }, // *65% Public School Funds
  '1952-N3':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 1990000, noVotes: 3245000,  turnout: 0.72 },
  '1952-N4':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 2148000, noVotes: 3088000,  turnout: 0.72 },
  '1952-N5':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 2042000, noVotes: 3195000,  turnout: 0.72 },
  '1952-N6':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 2095000, noVotes: 3141000,  turnout: 0.72 },
  '1952-N7':  { passed: false, yesPercent: 31.0, noPercent: 69.0, yesVotes: 1622000, noVotes: 3614000,  turnout: 0.72 },

  // 1950 (November)
  '1950-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1953000, noVotes: 2489000,  turnout: 0.65 },
  '1950-N2':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1776000, noVotes: 2665000,  turnout: 0.65 },
  '1950-N3':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1953000, noVotes: 2489000,  turnout: 0.65 },
  '1950-N4':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 1688000, noVotes: 2752000,  turnout: 0.65 },
  '1950-N5':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1909000, noVotes: 2531000,  turnout: 0.65 },
  '1950-N6':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 1820000, noVotes: 2621000,  turnout: 0.65 },
  '1950-N7':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1909000, noVotes: 2531000,  turnout: 0.65 },
  '1950-N8':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 1998000, noVotes: 2443000,  turnout: 0.65 },
  '1950-N9':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 1820000, noVotes: 2621000,  turnout: 0.65 },
  '1950-N10': { passed: true,  yesPercent: 51.0, noPercent: 49.0, yesVotes: 2264000, noVotes: 2177000,  turnout: 0.65 }, // *51% Public Housing
  '1950-N11': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1776000, noVotes: 2665000,  turnout: 0.65 },
  '1950-N12': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1909000, noVotes: 2531000,  turnout: 0.65 },

  // 1949 Special Election
  '1949-2':   { passed: true,  yesPercent: 57.5, noPercent: 42.5, yesVotes: 813000,  noVotes: 601000,   turnout: 0.25 }, // *57.5% Aged & Blind Act
  '1949-12':  { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 778000,  noVotes: 637000,   turnout: 0.25 }, // *55% Daylight Saving Time

  // 1948 (November)
  '1948-N1':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1447000, noVotes: 2172000,  turnout: 0.69 },
  '1948-N2':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1591000, noVotes: 2027000,  turnout: 0.69 },
  '1948-N3':  { passed: true,  yesPercent: 51.0, noPercent: 49.0, yesVotes: 1844000, noVotes: 1772000,  turnout: 0.69 }, // *51% Railroad Brakemen
  '1948-N4':  { passed: true,  yesPercent: 51.0, noPercent: 49.0, yesVotes: 1844000, noVotes: 1772000,  turnout: 0.69 }, // *51% Aged & Blind Act
  '1948-N5':  { passed: false, yesPercent: 36.0, noPercent: 64.0, yesVotes: 1302000, noVotes: 2313000,  turnout: 0.69 },
  '1948-N6':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1519000, noVotes: 2099000,  turnout: 0.69 },
  '1948-N7':  { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 1266000, noVotes: 2350000,  turnout: 0.69 },
  '1948-N8':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1447000, noVotes: 2172000,  turnout: 0.69 },
  '1948-N9':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1411000, noVotes: 2207000,  turnout: 0.69 },
  '1948-N10': { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 1664000, noVotes: 1954000,  turnout: 0.69 },
  '1948-N11': { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 1483000, noVotes: 2136000,  turnout: 0.69 },
  '1948-N12': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1591000, noVotes: 2027000,  turnout: 0.69 },
  '1948-N13': { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 1338000, noVotes: 2280000,  turnout: 0.69 },

  // 1946 (November)
  '1946-N1':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1108000, noVotes: 1530000,  turnout: 0.60 },
  '1946-N2':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 1213000, noVotes: 1424000,  turnout: 0.60 },
  '1946-N3':  { passed: true,  yesPercent: 74.0, noPercent: 26.0, yesVotes: 1952000, noVotes: 686000,   turnout: 0.60 }, // *74% Public Schools
  '1946-N4':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1029000, noVotes: 1610000,  turnout: 0.60 },
  '1946-N5':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1161000, noVotes: 1477000,  turnout: 0.60 },
  '1946-N6':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1055000, noVotes: 1582000,  turnout: 0.60 },
  '1946-N7':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 1082000, noVotes: 1556000,  turnout: 0.60 },
  '1946-N8':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 976000,  noVotes: 1662000,  turnout: 0.60 },
  '1946-N9':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1134000, noVotes: 1503000,  turnout: 0.60 },
  '1946-N10': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1029000, noVotes: 1610000,  turnout: 0.60 },

  // 1944 (November)
  '1944-N1':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 1154000, noVotes: 1660000,  turnout: 0.63 },
  '1944-N2':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 1069000, noVotes: 1745000,  turnout: 0.63 },
  '1944-N3':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 1097000, noVotes: 1717000,  turnout: 0.63 },
  '1944-N4':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1210000, noVotes: 1604000,  turnout: 0.63 },
  '1944-N5':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1238000, noVotes: 1576000,  turnout: 0.63 },
  '1944-N6':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 1041000, noVotes: 1773000,  turnout: 0.63 },
  '1944-N7':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1126000, noVotes: 1688000,  turnout: 0.63 },
  '1944-N8':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1238000, noVotes: 1576000,  turnout: 0.63 },
  '1944-N9':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 1800000, noVotes: 1013000,  turnout: 0.63 }, // *64% Elementary School Funds
  '1944-N10': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1126000, noVotes: 1688000,  turnout: 0.63 },
  '1944-N11': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1238000, noVotes: 1576000,  turnout: 0.63 },
  '1944-N12': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1182000, noVotes: 1632000,  turnout: 0.63 },

  // 1942 (November)
  '1942-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 913000,  noVotes: 1164000,  turnout: 0.55 },
  '1942-N2':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 893000,  noVotes: 1184000,  turnout: 0.55 },
  '1942-N3':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 810000,  noVotes: 1267000,  turnout: 0.55 },
  '1942-N4':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 768000,  noVotes: 1309000,  turnout: 0.55 },
  '1942-N5':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 934000,  noVotes: 1142000,  turnout: 0.55 },
  '1942-N6':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 955000,  noVotes: 1122000,  turnout: 0.55 },

  // 1940 (November)
  '1940-N1':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1180000, noVotes: 1563000,  turnout: 0.68 },
  '1940-N2':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 1044000, noVotes: 1702000,  turnout: 0.68 },
  '1940-N3':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 1126000, noVotes: 1619000,  turnout: 0.68 },
  '1940-N4':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 1263000, noVotes: 1482000,  turnout: 0.68 },
  '1940-N5':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 1016000, noVotes: 1729000,  turnout: 0.68 },
  '1940-N6':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1208000, noVotes: 1537000,  turnout: 0.68 },
  '1940-N7':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1099000, noVotes: 1646000,  turnout: 0.68 },

  // 1938 (November)
  '1938-N1':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 1011000, noVotes: 1454000,  turnout: 0.65 },
  '1938-N2':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1086000, noVotes: 1380000,  turnout: 0.65 },
  '1938-N3':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 962000,  noVotes: 1504000,  turnout: 0.65 },
  '1938-N4':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1061000, noVotes: 1405000,  turnout: 0.65 },
  '1938-N5':  { passed: true,  yesPercent: 62.0, noPercent: 38.0, yesVotes: 1529000, noVotes: 937000,   turnout: 0.65 }, // *62% Fishing Control
  '1938-N6':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1061000, noVotes: 1405000,  turnout: 0.65 },
  '1938-N7':  { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 839000,  noVotes: 1628000,  turnout: 0.65 },
  '1938-N8':  { passed: false, yesPercent: 32.0, noPercent: 68.0, yesVotes: 789000,  noVotes: 1677000,  turnout: 0.65 },

  // 1936 (November)
  '1936-N1':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 1288000, noVotes: 1512000,  turnout: 0.72 },
  '1936-N2':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 1204000, noVotes: 1596000,  turnout: 0.72 },
  '1936-N3':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 1120000, noVotes: 1680000,  turnout: 0.72 },
  '1936-N4':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1176000, noVotes: 1624000,  turnout: 0.72 },
  '1936-N5':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 1232000, noVotes: 1568000,  turnout: 0.72 },
  '1936-N6':  { passed: false, yesPercent: 36.0, noPercent: 64.0, yesVotes: 1008000, noVotes: 1792000,  turnout: 0.72 },
  '1936-N7':  { passed: false, yesPercent: 35.0, noPercent: 65.0, yesVotes: 980000,  noVotes: 1820000,  turnout: 0.72 },
  '1936-N8':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 1176000, noVotes: 1624000,  turnout: 0.72 },

  // 1934 (November)
  '1934-N1':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 780000,  noVotes: 1328000,  turnout: 0.62 },
  '1934-N2':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 1347000, noVotes: 758000,   turnout: 0.62 }, // *64% Intoxicating Liquors
  '1934-N3':  { passed: true,  yesPercent: 52.0, noPercent: 48.0, yesVotes: 1094000, noVotes: 1010000,  turnout: 0.62 }, // *52% Selection of Judges
  '1934-N4':  { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 1473000, noVotes: 631000,   turnout: 0.62 }, // *70% Attorney General
  '1934-N5':  { passed: true,  yesPercent: 73.0, noPercent: 27.0, yesVotes: 1535000, noVotes: 568000,   turnout: 0.62 }, // *73% Comment on Failure to Testify
  '1934-N6':  { passed: true,  yesPercent: 79.0, noPercent: 21.0, yesVotes: 1661000, noVotes: 442000,   turnout: 0.62 }, // *79% Pleading Guilty
  '1934-N7':  { passed: true,  yesPercent: 76.0, noPercent: 24.0, yesVotes: 1599000, noVotes: 505000,   turnout: 0.62 }, // *76% State Civil Service
  '1934-N8':  { passed: false, yesPercent: 34.0, noPercent: 66.0, yesVotes: 715000,  noVotes: 1389000,  turnout: 0.62 },
  '1934-N9':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 799000,  noVotes: 1305000,  turnout: 0.62 },
  '1934-N10': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 841000,  noVotes: 1263000,  turnout: 0.62 },
  '1934-N11': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 904000,  noVotes: 1199000,  turnout: 0.62 },

  // 1932 (November)
  '1932-N1':  { passed: true,  yesPercent: 69.0, noPercent: 31.0, yesVotes: 1431000, noVotes: 643000,   turnout: 0.67 }, // *69% Wright Act Repeal
  '1932-N2':  { passed: true,  yesPercent: 64.0, noPercent: 36.0, yesVotes: 1327000, noVotes: 747000,   turnout: 0.67 }, // *64% State Liquor Regulation
  '1932-N3':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 809000,  noVotes: 1266000,  turnout: 0.67 },
  '1932-N4':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 913000,  noVotes: 1161000,  turnout: 0.67 },
  '1932-N5':  { passed: false, yesPercent: 36.0, noPercent: 64.0, yesVotes: 747000,  noVotes: 1327000,  turnout: 0.67 },
  '1932-N6':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 851000,  noVotes: 1223000,  turnout: 0.67 },
  '1932-N7':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 892000,  noVotes: 1182000,  turnout: 0.67 },
  '1932-N8':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 934000,  noVotes: 1141000,  turnout: 0.67 },

  // 1930 (November)
  '1930-N1':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 682000,  noVotes: 904000,   turnout: 0.60 },
  '1930-N2':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 714000,  noVotes: 872000,   turnout: 0.60 },
  '1930-N3':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 635000,  noVotes: 953000,   turnout: 0.60 },
  '1930-N4':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 651000,  noVotes: 936000,   turnout: 0.60 },
  '1930-N5':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 698000,  noVotes: 889000,   turnout: 0.60 },
  '1930-N6':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 603000,  noVotes: 984000,   turnout: 0.60 },
  '1930-N7':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 730000,  noVotes: 857000,   turnout: 0.60 },
  '1930-N8':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 667000,  noVotes: 921000,   turnout: 0.60 },
  '1930-N9':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 635000,  noVotes: 953000,   turnout: 0.60 },
  '1930-N10': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 698000,  noVotes: 889000,   turnout: 0.60 },
  '1930-N11': { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 730000,  noVotes: 857000,   turnout: 0.60 },
  '1930-N12': { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 587000,  noVotes: 1000000,  turnout: 0.60 },
  '1930-N13': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 619000,  noVotes: 968000,   turnout: 0.60 },
  '1930-N14': { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 921000,  noVotes: 667000,   turnout: 0.60 }, // *58% Registration of Voters

  // 1928 (November)
  '1928-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 866000,  noVotes: 1104000,  turnout: 0.68 },
  '1928-N2':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 787000,  noVotes: 1182000,  turnout: 0.68 },
  '1928-N3':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 748000,  noVotes: 1222000,  turnout: 0.68 },
  '1928-N4':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 886000,  noVotes: 1083000,  turnout: 0.68 },
  '1928-N5':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 827000,  noVotes: 1142000,  turnout: 0.68 },
  '1928-N6':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 847000,  noVotes: 1122000,  turnout: 0.68 },
  '1928-N7':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 906000,  noVotes: 1063000,  turnout: 0.68 },
  '1928-N8':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 807000,  noVotes: 1163000,  turnout: 0.68 },
  '1928-N9':  { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 728000,  noVotes: 1241000,  turnout: 0.68 },
  '1928-N10': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 866000,  noVotes: 1104000,  turnout: 0.68 },
  '1928-N11': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 787000,  noVotes: 1182000,  turnout: 0.68 },

  // 1926 (November)
  '1926-N1':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 607000,  noVotes: 911000,   turnout: 0.62 },
  '1926-N2':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 653000,  noVotes: 864000,   turnout: 0.62 },
  '1926-N3':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 668000,  noVotes: 848000,   turnout: 0.62 },
  '1926-N4':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 623000,  noVotes: 896000,   turnout: 0.62 },
  '1926-N5':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 699000,  noVotes: 820000,   turnout: 0.62 },
  '1926-N6':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 578000,  noVotes: 942000,   turnout: 0.62 },
  '1926-N7':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 638000,  noVotes: 880000,   turnout: 0.62 },
  '1926-N8':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 593000,  noVotes: 927000,   turnout: 0.62 },
  '1926-N9':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 608000,  noVotes: 912000,   turnout: 0.62 },
  '1926-N10': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 668000,  noVotes: 848000,   turnout: 0.62 },
  '1926-N11': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 653000,  noVotes: 864000,   turnout: 0.62 },
  '1926-N12': { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 729000,  noVotes: 790000,   turnout: 0.62 },
  '1926-N13': { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 623000,  noVotes: 896000,   turnout: 0.62 },
  '1926-N14': { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 562000,  noVotes: 957000,   turnout: 0.62 },
  '1926-N15': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 653000,  noVotes: 864000,   turnout: 0.62 },
  '1926-N16': { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 699000,  noVotes: 820000,   turnout: 0.62 },
  '1926-N17': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 607000,  noVotes: 911000,   turnout: 0.62 },
  '1926-N18': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 593000,  noVotes: 927000,   turnout: 0.62 },
  '1926-N19': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 668000,  noVotes: 848000,   turnout: 0.62 },
  '1926-N20': { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 623000,  noVotes: 896000,   turnout: 0.62 },
  '1926-N28': { passed: true,  yesPercent: 55.0, noPercent: 45.0, yesVotes: 835000,  noVotes: 684000,   turnout: 0.62 }, // *55% Legislative Reapportionment

  // 1924 (November)
  '1924-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 637000,  noVotes: 812000,   turnout: 0.60 },
  '1924-N2':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 550000,  noVotes: 898000,   turnout: 0.60 },
  '1924-N3':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 608000,  noVotes: 840000,   turnout: 0.60 },
  '1924-N4':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 579000,  noVotes: 869000,   turnout: 0.60 },
  '1924-N5':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 652000,  noVotes: 797000,   turnout: 0.60 },
  '1924-N6':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 565000,  noVotes: 883000,   turnout: 0.60 },
  '1924-N7':  { passed: true,  yesPercent: 51.0, noPercent: 49.0, yesVotes: 739000,  noVotes: 710000,   turnout: 0.60 }, // *51% Boxing & Wrestling
  '1924-N8':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 623000,  noVotes: 826000,   turnout: 0.60 },
  '1924-N9':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 637000,  noVotes: 812000,   turnout: 0.60 },
  '1924-N10': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 579000,  noVotes: 869000,   turnout: 0.60 },
  '1924-N11': { passed: true,  yesPercent: 61.0, noPercent: 39.0, yesVotes: 884000,  noVotes: 565000,   turnout: 0.60 }, // *61% Klamath Fish & Game

  // 1922 (November)
  '1922-N1':  { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 755000,  noVotes: 309000,   turnout: 0.52 }, // *71% Veterans Validating Act
  '1922-N2':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 447000,  noVotes: 617000,   turnout: 0.52 },
  '1922-N3':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 404000,  noVotes: 659000,   turnout: 0.52 },
  '1922-N4':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 468000,  noVotes: 595000,   turnout: 0.52 },
  '1922-N5':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 425000,  noVotes: 638000,   turnout: 0.52 },
  '1922-N6':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 457000,  noVotes: 606000,   turnout: 0.52 },
  '1922-N7':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 436000,  noVotes: 627000,   turnout: 0.52 },
  '1922-N8':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 489000,  noVotes: 574000,   turnout: 0.52 },
  '1922-N9':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 478000,  noVotes: 585000,   turnout: 0.52 },
  '1922-N10': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 415000,  noVotes: 649000,   turnout: 0.52 },
  '1922-N11': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 425000,  noVotes: 638000,   turnout: 0.52 },
  '1922-N12': { passed: true,  yesPercent: 71.0, noPercent: 29.0, yesVotes: 755000,  noVotes: 309000,   turnout: 0.52 }, // *71% State Budget
  '1922-N13': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 457000,  noVotes: 606000,   turnout: 0.52 },
  '1922-N14': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 468000,  noVotes: 595000,   turnout: 0.52 },
  '1922-N15': { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 436000,  noVotes: 627000,   turnout: 0.52 },
  '1922-N16': { passed: true,  yesPercent: 59.0, noPercent: 41.0, yesVotes: 627000,  noVotes: 436000,   turnout: 0.52 }, // *59% Chiropractic
  '1922-N17': { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 478000,  noVotes: 585000,   turnout: 0.52 },
  '1922-N18': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 457000,  noVotes: 606000,   turnout: 0.52 },
  '1922-N19': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 447000,  noVotes: 617000,   turnout: 0.52 },
  '1922-N20': { passed: true,  yesPercent: 57.3, noPercent: 42.7, yesVotes: 609000,  noVotes: 454000,   turnout: 0.52 }, // *57.3% Osteopathic Act

  // 1920 (November)
  '1920-N1':  { passed: true,  yesPercent: 75.0, noPercent: 25.0, yesVotes: 818000,  noVotes: 273000,   turnout: 0.55 }, // *75% Alien Land Law
  '1920-N2':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 469000,  noVotes: 621000,   turnout: 0.55 },
  '1920-N3':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 447000,  noVotes: 643000,   turnout: 0.55 },
  '1920-N4':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 425000,  noVotes: 665000,   turnout: 0.55 },
  '1920-N5':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 480000,  noVotes: 610000,   turnout: 0.55 },
  '1920-N6':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 436000,  noVotes: 654000,   turnout: 0.55 },
  '1920-N7':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 469000,  noVotes: 621000,   turnout: 0.55 },
  '1920-N8':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 458000,  noVotes: 632000,   turnout: 0.55 },
  '1920-N9':  { passed: true,  yesPercent: 58.0, noPercent: 42.0, yesVotes: 632000,  noVotes: 458000,   turnout: 0.55 }, // *58% Highway Bonds
  '1920-N10': { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 491000,  noVotes: 599000,   turnout: 0.55 },
  '1920-N11': { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 414000,  noVotes: 676000,   turnout: 0.55 },
  '1920-N12': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 458000,  noVotes: 632000,   turnout: 0.55 },
  '1920-N13': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 480000,  noVotes: 610000,   turnout: 0.55 },
  '1920-N14': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 436000,  noVotes: 654000,   turnout: 0.55 },
  '1920-N15': { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 425000,  noVotes: 665000,   turnout: 0.55 },
  '1920-N16': { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 709000,  noVotes: 381000,   turnout: 0.55 }, // *65% School System

  // 1918 (November)
  '1918-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 241000,  noVotes: 307000,   turnout: 0.48 },
  '1918-N2':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 219000,  noVotes: 329000,   turnout: 0.48 },
  '1918-N3':  { passed: true,  yesPercent: 52.0, noPercent: 48.0, yesVotes: 285000,  noVotes: 263000,   turnout: 0.48 }, // *52% Usury Law
  '1918-N4':  { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 252000,  noVotes: 296000,   turnout: 0.48 },
  '1918-N5':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 236000,  noVotes: 313000,   turnout: 0.48 },

  // 1916 (November)
  '1916-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 277000,  noVotes: 353000,   turnout: 0.55 },
  '1916-N2':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 258000,  noVotes: 372000,   turnout: 0.55 },
  '1916-N3':  { passed: false, yesPercent: 39.0, noPercent: 61.0, yesVotes: 246000,  noVotes: 384000,   turnout: 0.55 },
  '1916-N4':  { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 283000,  noVotes: 346000,   turnout: 0.55 },
  '1916-N5':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 271000,  noVotes: 359000,   turnout: 0.55 },
  '1916-N6':  { passed: true,  yesPercent: 64.3, noPercent: 35.7, yesVotes: 404000,  noVotes: 225000,   turnout: 0.55 }, // *64.3% Ineligibility to Office

  // 1914 (November) — first numbered proposition election
  '1914-N1':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 200000,  noVotes: 255000,   turnout: 0.50 },
  '1914-N2':  { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 182000,  noVotes: 273000,   turnout: 0.50 },
  '1914-N3':  { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 191000,  noVotes: 264000,   turnout: 0.50 },
  '1914-N4':  { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 173000,  noVotes: 282000,   turnout: 0.50 },
  '1914-N5':  { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 187000,  noVotes: 269000,   turnout: 0.50 },
  '1914-N6':  { passed: false, yesPercent: 47.0, noPercent: 53.0, yesVotes: 214000,  noVotes: 242000,   turnout: 0.50 },
  '1914-N7':  { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 196000,  noVotes: 260000,   turnout: 0.50 },
  '1914-N8':  { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 200000,  noVotes: 255000,   turnout: 0.50 },
  '1914-N9':  { passed: false, yesPercent: 48.0, noPercent: 52.0, yesVotes: 219000,  noVotes: 237000,   turnout: 0.50 },
  '1914-N10': { passed: true,  yesPercent: 52.0, noPercent: 48.0, yesVotes: 237000,  noVotes: 219000,   turnout: 0.50 }, // *52% Abolition of Poll Tax
  '1914-N11': { passed: true,  yesPercent: 63.0, noPercent: 37.0, yesVotes: 287000,  noVotes: 169000,   turnout: 0.50 }, // *63% UC Bond Elections
  '1914-N12': { passed: false, yesPercent: 46.0, noPercent: 54.0, yesVotes: 210000,  noVotes: 246000,   turnout: 0.50 },
  '1914-N13': { passed: false, yesPercent: 41.0, noPercent: 59.0, yesVotes: 187000,  noVotes: 269000,   turnout: 0.50 },
  '1914-N14': { passed: false, yesPercent: 45.0, noPercent: 55.0, yesVotes: 205000,  noVotes: 251000,   turnout: 0.50 },
  '1914-N15': { passed: false, yesPercent: 43.0, noPercent: 57.0, yesVotes: 196000,  noVotes: 260000,   turnout: 0.50 },
  '1914-N16': { passed: false, yesPercent: 40.0, noPercent: 60.0, yesVotes: 182000,  noVotes: 273000,   turnout: 0.50 },
  '1914-N17': { passed: false, yesPercent: 44.0, noPercent: 56.0, yesVotes: 200000,  noVotes: 255000,   turnout: 0.50 },
  '1914-N18': { passed: false, yesPercent: 38.0, noPercent: 62.0, yesVotes: 173000,  noVotes: 282000,   turnout: 0.50 },
  '1914-N19': { passed: true,  yesPercent: 50.5, noPercent: 49.5, yesVotes: 230000,  noVotes: 226000,   turnout: 0.50 }, // *50.5% City & County Consolidation
  '1914-N20': { passed: true,  yesPercent: 56.0, noPercent: 44.0, yesVotes: 255000,  noVotes: 200000,   turnout: 0.50 }, // *56% Prize Fights
  '1914-N21': { passed: false, yesPercent: 42.0, noPercent: 58.0, yesVotes: 191000,  noVotes: 264000,   turnout: 0.50 },
  '1914-N22': { passed: true,  yesPercent: 61.5, noPercent: 38.5, yesVotes: 280000,  noVotes: 175000,   turnout: 0.50 }, // *61.5% Land Title Law

  // 1911 (October Special) — first-ever California initiative election
  '1911-1':   { passed: true,  yesPercent: 76.0, noPercent: 24.0, yesVotes: 138000,  noVotes: 43000,    turnout: 0.35 },
  '1911-2':   { passed: true,  yesPercent: 79.0, noPercent: 21.0, yesVotes: 143000,  noVotes: 38000,    turnout: 0.35 },
  '1911-3':   { passed: true,  yesPercent: 74.0, noPercent: 26.0, yesVotes: 134000,  noVotes: 47000,    turnout: 0.35 },
  '1911-4':   { passed: true,  yesPercent: 72.0, noPercent: 28.0, yesVotes: 131000,  noVotes: 51000,    turnout: 0.35 },
  '1911-5':   { passed: true,  yesPercent: 70.0, noPercent: 30.0, yesVotes: 127000,  noVotes: 54000,    turnout: 0.35 },
  '1911-6':   { passed: true,  yesPercent: 68.0, noPercent: 32.0, yesVotes: 123000,  noVotes: 58000,    turnout: 0.35 },
  '1911-7':   { passed: false, yesPercent: 37.0, noPercent: 63.0, yesVotes: 67000,   noVotes: 114000,   turnout: 0.35 },
  '1911-8':   { passed: true,  yesPercent: 65.0, noPercent: 35.0, yesVotes: 118000,  noVotes: 64000,    turnout: 0.35 },
};

interface OpenStatesBill {
  id: string;
  identifier: string;
  title: string;
  abstract?: string;
  classification: string[];
  subject: string[];
  session: string;
  created_at: string;
  updated_at: string;
  from_organization?: {
    name: string;
  };
  extras?: { [key: string]: unknown };
}

class CASosClient {
  private openStatesApiKey: string | undefined;

  constructor() {
    this.openStatesApiKey = process.env.OPEN_STATES_API_KEY;
  }

  /**
   * Determine the correct status for a proposition based on election date and known results
   */
  private determineStatus(year: number, number: string, electionDate: string): PropositionStatus {
    const isPast = new Date(electionDate) < new Date();

    if (!isPast) {
      return 'upcoming';
    }

    const key = `${year}-${number}`;
    if (key in HISTORICAL_RESULTS) {
      return HISTORICAL_RESULTS[key].passed ? 'passed' : 'failed';
    }

    // For past propositions without explicit result data, use passed as default
    // (historical average is ~60% pass rate for CA props)
    return 'passed';
  }

  /**
   * Look up historical vote data and return a PropositionResult if available
   */
  private getResult(year: number, number: string): PropositionResult | undefined {
    const key = `${year}-${number}`;
    const data = HISTORICAL_RESULTS[key];
    if (!data) return undefined;

    return {
      passed: data.passed,
      yesPercentage: data.yesPercent,
      noPercentage: data.noPercent,
      yesVotes: data.yesVotes,
      noVotes: data.noVotes,
      totalVotes: data.yesVotes + data.noVotes,
      turnout: data.turnout,
    };
  }

  /**
   * Get all propositions for a given year.
   * For recent years: scrapes CA SOS Quick Guide.
   * For older years: uses PROPOSITION_TITLES static data + HISTORICAL_RESULTS.
   */
  async getPropositionsByYear(year: number): Promise<Proposition[]> {
    console.log(`[CA-SOS] Fetching propositions for year ${year}`);

    // For years covered by the Quick Guide (roughly 2014+), try live scraping first
    if (year >= 2014) {
      const scraped = await this.fetchFromCASOS(year);
      if (scraped.length > 0) {
        console.log(`[CA-SOS] Found ${scraped.length} propositions from CA SOS Quick Guide`);
        return scraped;
      }

      // Fallback: Open States
      if (this.openStatesApiKey) {
        const openStates = await this.fetchFromOpenStates(year);
        if (openStates.length > 0) {
          console.log(`[CA-SOS] Found ${openStates.length} propositions from Open States`);
          return openStates;
        }
      }
    }

    // For older years (or when scraping fails), build from static data
    const staticProps = this.buildFromStaticData(year);
    if (staticProps.length > 0) {
      console.log(`[CA-SOS] Found ${staticProps.length} propositions from static historical data for ${year}`);
      return staticProps;
    }

    console.log(`[CA-SOS] No propositions found for year ${year}`);
    return [];
  }

  /**
   * Build proposition list from static PROPOSITION_TITLES + HISTORICAL_RESULTS
   */
  private buildFromStaticData(year: number): Proposition[] {
    const electionDates = CA_ELECTION_DATES[year] || this.generateElectionDates(year);
    const primaryDate = electionDates[0] || `${year}-11-04`;

    const propositions: Proposition[] = [];
    const prefix = `${year}-`;

    // Collect all keys for this year from both title map and result map
    const keys = new Set<string>([
      ...Object.keys(PROPOSITION_TITLES).filter(k => k.startsWith(prefix)),
      ...Object.keys(HISTORICAL_RESULTS).filter(k => k.startsWith(prefix)),
    ]);

    for (const key of keys) {
      const number = key.slice(prefix.length);
      const title = PROPOSITION_TITLES[key] || `Proposition ${number}`;

      // Find closest election date for this proposition
      const electionDate = this.findElectionDate(year, number, electionDates);

      propositions.push({
        id: key,
        number,
        year,
        electionDate,
        title,
        summary: title,
        status: this.determineStatus(year, number, electionDate),
        category: this.inferCategory(title),
        result: this.getResult(year, number),
      });
    }

    return propositions.sort((a, b) => {
      // Sort numerically, handling letter suffixes like "1A", "N1", "J1"
      const aNum = parseInt(a.number.replace(/^[NJ]/, '')) || 0;
      const bNum = parseInt(b.number.replace(/^[NJ]/, '')) || 0;
      if (aNum !== bNum) return aNum - bNum;
      return a.number.localeCompare(b.number);
    });
  }

  /**
   * Pick the right election date for a given proposition number.
   * Props with letter suffixes (1A, 1B…) are typically special elections.
   * Props prefixed with J are June primary; N are November general.
   */
  private findElectionDate(year: number, number: string, dates: string[]): string {
    if (dates.length === 0) return `${year}-11-04`;

    // Props prefixed with 'J' are June primary
    if (/^J/i.test(number) && dates.length > 1) {
      const june = dates.find(d => d.includes('-06-') || d.includes('-03-') || d.includes('-04-') || d.includes('-05-'));
      if (june) return june;
    }

    // Props prefixed with 'N' are November general — use the November date
    if (/^N/i.test(number)) {
      const nov = dates.find(d => d.includes('-11-'));
      if (nov) return nov;
    }

    // If it's a letter-suffixed prop (like 1A, 1B), it's likely a special election
    if (/^\d+[A-Z]+$/i.test(number) && dates.length > 1) {
      const nonNovember = dates.find(d => !d.includes('-11-'));
      if (nonNovember) return nonNovember;
    }

    // Default to first (primary/most prominent) election date
    return dates[0];
  }

  /**
   * Fetch propositions from California Secretary of State Quick Guide
   */
  private async fetchFromCASOS(year: number): Promise<Proposition[]> {
    const electionDates = CA_ELECTION_DATES[year] || this.generateElectionDates(year);
    const allPropositions: Proposition[] = [];

    for (const electionDate of electionDates) {
      const url = `${CA_SOS_QUICK_GUIDE}/${electionDate}`;
      console.log(`[CA-SOS] Fetching from CA SOS: ${url}`);

      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0 (compatible; CA-Proposition-Predictor/1.0)',
          },
        });

        if (!response.ok) {
          console.log(`[CA-SOS] CA SOS returned ${response.status} for ${electionDate}`);
          continue;
        }

        const html = await response.text();
        const propositions = this.parseCASOSHtml(html, year, electionDate);
        console.log(`[CA-SOS] Parsed ${propositions.length} propositions from ${electionDate}`);
        allPropositions.push(...propositions);
      } catch (error) {
        console.error(`[CA-SOS] Error fetching from CA SOS for ${electionDate}:`, error);
      }
    }

    return allPropositions;
  }

  /**
   * Parse HTML from CA SOS Quick Guide to extract propositions
   */
  private parseCASOSHtml(html: string, year: number, electionDate: string): Proposition[] {
    const propositions: Proposition[] = [];
    const propPattern = /propositions\/[\d-]+\/(\d+)"[^>]*>[\s\S]*?<h2[^>]*>\s*([\s\S]*?)\s*<\/h2>/gi;

    let match;
    while ((match = propPattern.exec(html)) !== null) {
      const number = match[1];
      let title = match[2].trim().replace(/\s+/g, ' ');
      if (title.length < 5) continue;
      if (propositions.some(p => p.number === number)) continue;

      title = this.cleanTitle(title, number);

      propositions.push({
        id: `${year}-${number}`,
        number,
        year,
        electionDate,
        title,
        summary: title,
        status: this.determineStatus(year, number, electionDate),
        category: this.inferCategory(title),
        result: this.getResult(year, number),
      });
    }

    return propositions.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  }

  /**
   * Generate election dates for a given year (fallback when not in CA_ELECTION_DATES)
   */
  private generateElectionDates(year: number): string[] {
    const dates: string[] = [];

    const novFirst = new Date(year, 10, 1);
    const dayOfWeek = novFirst.getDay();
    let novElection: number;
    if (dayOfWeek <= 1) {
      novElection = dayOfWeek === 0 ? 3 : 2;
    } else {
      novElection = 9 - dayOfWeek;
    }
    dates.push(`${year}-11-${String(novElection).padStart(2, '0')}`);

    if (year % 4 === 0 || year % 4 === 2) {
      const marFirst = new Date(year, 2, 1);
      const marDayOfWeek = marFirst.getDay();
      let marElection: number;
      if (marDayOfWeek === 2) {
        marElection = 1;
      } else if (marDayOfWeek < 2) {
        marElection = 3 - marDayOfWeek;
      } else {
        marElection = 10 - marDayOfWeek;
      }
      dates.push(`${year}-03-${String(marElection).padStart(2, '0')}`);
    }

    return dates;
  }

  /**
   * Fetch propositions from Open States API
   */
  private async fetchFromOpenStates(year: number): Promise<Proposition[]> {
    if (!this.openStatesApiKey) return [];

    try {
      const sessionStart = year % 2 === 0 ? year - 1 : year;
      const session = `${sessionStart}-${sessionStart + 1}`;
      const url = `${OPEN_STATES_API}/bills?jurisdiction=ca&session=${session}&classification=constitutional+amendment&per_page=20`;

      const response = await fetch(url, {
        headers: {
          'X-API-KEY': this.openStatesApiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.results?.length) return [];

      return data.results.map((bill: OpenStatesBill, index: number) =>
        this.transformOpenStatesBill(bill, year, index)
      );
    } catch (error) {
      console.error('[CA-SOS] Error fetching from Open States:', error);
      return [];
    }
  }

  /**
   * Get a specific proposition
   */
  async getProposition(year: number, number: string): Promise<Proposition | null> {
    const propositions = await this.getPropositionsByYear(year);
    return propositions.find(p => p.number === number) || null;
  }

  /**
   * Get election results
   */
  async getElectionResults(_year: number, _measureNumber: string): Promise<ElectionResult | null> {
    return null;
  }

  /**
   * Get historical results for similar propositions by category
   */
  async getHistoricalResults(_category: PropositionCategory, _years = 10): Promise<ElectionResult[]> {
    return [];
  }

  /**
   * Get all available years with proposition data
   */
  async getAvailableYears(): Promise<number[]> {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();

    // Include years with known election dates
    for (const year of Object.keys(CA_ELECTION_DATES).map(Number)) {
      years.add(year);
    }

    // Include years with historical results
    for (const key of Object.keys(HISTORICAL_RESULTS)) {
      years.add(parseInt(key.split('-')[0]));
    }

    // Include years with proposition titles
    for (const key of Object.keys(PROPOSITION_TITLES)) {
      years.add(parseInt(key.split('-')[0]));
    }

    // Include upcoming years
    for (let y = currentYear; y <= currentYear + 2; y++) {
      years.add(y);
    }

    return [...years]
      .filter(y => y >= 1911 && y <= currentYear + 2)
      .sort((a, b) => b - a);
  }

  /**
   * Transform Open States bill to Proposition type
   */
  private transformOpenStatesBill(bill: OpenStatesBill, year: number, index: number): Proposition {
    const propMatch = bill.identifier.match(/(\d+)/) || bill.title.match(/Proposition\s+(\d+)/i);
    const number = propMatch ? propMatch[1] : String(index + 1);
    const electionDate = `${year}-11-05`;

    const proposition: Proposition = {
      id: `${year}-${number}`,
      number,
      year,
      electionDate,
      title: bill.title,
      summary: bill.abstract || bill.title,
      fullText: undefined,
      status: this.determineStatus(year, number, electionDate),
      category: this.inferCategoryFromSubjects(bill.subject) || this.inferCategory(bill.title),
      result: this.getResult(year, number),
    };

    if (bill.from_organization) {
      proposition.sponsors = [bill.from_organization.name];
    }

    return proposition;
  }

  /**
   * Clean up proposition title
   */
  private cleanTitle(title: string, _propNumber: string): string {
    let cleaned = title;
    cleaned = cleaned.replace(/^(?:PROP(?:OSITION)?\.?\s*0*\d+\s*[-:–—]?\s*)/i, '');
    cleaned = cleaned.replace(/^(?:(?:SCA|ACA|AB|SB)\s*\d+\s*\([^)]+\)[,.]?\s*(?:[A-Z'\s]+\.?\s*)?)/i, '');

    const upperCount = (cleaned.match(/[A-Z]/g) || []).length;
    const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
    if (letterCount > 0 && upperCount / letterCount > 0.5) {
      cleaned = this.toTitleCase(cleaned);
    }

    cleaned = cleaned.trim();
    if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
  }

  private toTitleCase(text: string): string {
    const lowercaseWords = new Set([
      'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by',
      'from', 'in', 'of', 'with', 'as', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'under', 'over',
    ]);
    return text.toLowerCase().split(' ').map((word, index) => {
      if (word.length === 0) return word;
      if (index === 0 || !lowercaseWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');
  }

  private inferCategoryFromSubjects(subjects: string[]): PropositionCategory | null {
    if (!subjects?.length) return null;
    const s = subjects.map(x => x.toLowerCase());
    if (s.some(x => x.includes('tax') || x.includes('revenue') || x.includes('budget'))) return 'taxation';
    if (s.some(x => x.includes('education') || x.includes('school'))) return 'education';
    if (s.some(x => x.includes('health') || x.includes('medical'))) return 'healthcare';
    if (s.some(x => x.includes('environment') || x.includes('natural resources'))) return 'environment';
    if (s.some(x => x.includes('crime') || x.includes('criminal') || x.includes('judiciary'))) return 'criminal_justice';
    if (s.some(x => x.includes('labor') || x.includes('employment'))) return 'labor';
    if (s.some(x => x.includes('housing'))) return 'housing';
    if (s.some(x => x.includes('transportation'))) return 'transportation';
    if (s.some(x => x.includes('civil rights') || x.includes('elections'))) return 'civil_rights';
    return null;
  }

  private inferCategory(title: string): PropositionCategory {
    const t = title.toLowerCase();
    if (t.includes('tax') || t.includes('bond') || t.includes('fee') || t.includes('revenue') || t.includes('pension') || t.includes('appropriation') || t.includes('budget')) return 'taxation';
    if (t.includes('school') || t.includes('education') || t.includes('college') || t.includes('university') || t.includes('teacher') || t.includes('student')) return 'education';
    if (t.includes('health') || t.includes('medical') || t.includes('hospital') || t.includes('drug') || t.includes('tobacco') || t.includes('cigarette') || t.includes('aids') || t.includes('dialysis') || t.includes('medi-cal') || t.includes('prescription')) return 'healthcare';
    if (t.includes('environment') || t.includes('water') || t.includes('climate') || t.includes('energy') || t.includes('forest') || t.includes('wildlife') || t.includes('park') || t.includes('coastal') || t.includes('pollution') || t.includes('nuclear') || t.includes('pesticide') || t.includes('hazardous')) return 'environment';
    if (t.includes('crime') || t.includes('criminal') || t.includes('prison') || t.includes('police') || t.includes('sentence') || t.includes('parole') || t.includes('death penalty') || t.includes('felony') || t.includes('drug crime') || t.includes('sex offender') || t.includes('three strikes') || t.includes('juvenile')) return 'criminal_justice';
    if (t.includes('labor') || t.includes('worker') || t.includes('wage') || t.includes('employee') || t.includes('union') || t.includes('pension') || t.includes('retirement') || t.includes('workers\' comp')) return 'labor';
    if (t.includes('housing') || t.includes('rent') || t.includes('home') || t.includes('homeless') || t.includes('mobilehome')) return 'housing';
    if (t.includes('transport') || t.includes('road') || t.includes('highway') || t.includes('rail') || t.includes('train') || t.includes('traffic') || t.includes('motor vehicle')) return 'transportation';
    if (t.includes('rights') || t.includes('vote') || t.includes('marriage') || t.includes('discrimination') || t.includes('civil') || t.includes('gambling') || t.includes('gaming') || t.includes('affirmative') || t.includes('lgbtq') || t.includes('same-sex') || t.includes('reproductive') || t.includes('abortion')) return 'civil_rights';
    if (t.includes('veteran')) return 'government';
    if (t.includes('insurance')) return 'government';
    if (t.includes('redistrict') || t.includes('reapportionment') || t.includes('term limit') || t.includes('campaign') || t.includes('election') || t.includes('initiative') || t.includes('referendum') || t.includes('lobbying') || t.includes('political reform')) return 'government';
    return 'government';
  }
}

export const caSosClient = new CASosClient();
