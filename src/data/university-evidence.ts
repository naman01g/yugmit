/**
 * Evidence Manifest — university-dataset-v1
 *
 * Every non-trivial claim in the universities dataset is traceable here.
 * This manifest exists for auditability and future dataset maintenance.
 *
 * Version: university-dataset-v1
 * Generated: 2026-09-04
 */

export interface EvidenceEntry {
  institution: string
  category:
    | 'departments'
    | 'facilities'
    | 'previousProjects'
    | 'expertise'
    | 'innovationCapability'
    | 'studentCapabilities'
    | 'collaborations'
    | 'identity'
  claim: string
  sourceUrl: string
  sourceType:
    | 'official website'
    | 'official PDF'
    | 'government portal'
    | 'official subdomain'
    | 'news report'
    | 'partner website'
  evidenceQuality: 'high' | 'medium' | 'low'
}

export const EVIDENCE_MANIFEST: EvidenceEntry[] = [
  // =========================================================================
  // IIT (ISM) Dhanbad
  // =========================================================================
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'identity',
    claim: '17 academic departments listed on official academics page',
    sourceUrl: 'https://people.iitism.ac.in/~academics/Academic/department_wise',
    sourceType: 'official subdomain',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'facilities',
    claim: 'Central Research Facility with 30+ named analytical instruments including LCMS HRTEM FESEM and XRD',
    sourceUrl: 'https://people.iitism.ac.in/~research/crf/index.php',
    sourceType: 'official subdomain',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'facilities',
    claim: 'High Performance Computing Facility',
    sourceUrl: 'https://people.iitism.ac.in/~research/',
    sourceType: 'official subdomain',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'innovationCapability',
    claim: 'Five innovation and incubation centres: NVCTI CIIE CIL Innovation Centre ACIC and TEXMiN',
    sourceUrl: 'https://www.iitism.ac.in/incubation-diie',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'previousProjects',
    claim: 'Centre for Societal Mission under Unnat Bharat Abhiyan adopted villages around Dhanbad since 2015',
    sourceUrl: 'https://people.iitism.ac.in/~csm/',
    sourceType: 'official subdomain',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'previousProjects',
    claim: 'Centre of Excellence for Tribal Welfare funded by Ministry of Tribal Affairs',
    sourceUrl: 'https://people.iitism.ac.in/~inmedia/press%20release/CoE.pdf',
    sourceType: 'official PDF',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'previousProjects',
    claim: 'TEXMiN Technology Innovation Hub for Mining 4.0 funded under National Mission on Cyber Physical Systems with 110 crore',
    sourceUrl: 'https://texmin.in/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'previousProjects',
    claim: 'DRDO funded antenna research and optoelectronic oscillator projects',
    sourceUrl: 'https://www.iitism.ac.in/electronics-engineering-completed-research',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'previousProjects',
    claim: 'ISRO funded photonic beam-forming for satellite communication',
    sourceUrl: 'https://www.iitism.ac.in/electronics-engineering-completed-research',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIT (ISM) Dhanbad',
    category: 'previousProjects',
    claim: '46 MoUs signed with international universities documented on IR portal',
    sourceUrl: 'https://ir.iitism.ac.in/information-portal/collaborations.php',
    sourceType: 'official subdomain',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // BIT Mesra
  // =========================================================================
  {
    institution: 'BIT Mesra',
    category: 'identity',
    claim: '20 academic departments listed on official department page',
    sourceUrl: 'https://bitmesra.ac.in/edudepartment/1/0',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'facilities',
    claim: 'Central Instrumentation Facility serving 1500 internal and 500 external users per year',
    sourceUrl: 'https://bitmesra.ac.in/Visit-Other-Department/1/190',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'facilities',
    claim: 'DST-PURSE Lab and ARMLEGS Center for ML-based geospatial monitoring for Jharkhand state',
    sourceUrl: 'https://purse.bitmesra.ac.in/',
    sourceType: 'official subdomain',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'facilities',
    claim: 'AICTE IDEA Lab sanctioned June 2021 only institute in Jharkhand with this facility',
    sourceUrl: 'https://sites.google.com/bitmesra.ac.in/bitmesra-aicteidealab/home',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'previousProjects',
    claim: 'ISRO sponsored Reusable Launch Vehicle aerodynamic characterization project 2019-2022',
    sourceUrl: 'https://bitmesra.ac.in/edudepartment/content/1/167/59',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'previousProjects',
    claim: 'NRSC ISRO and Jharkhand Forest Department MoU for Phenocam-based Forest Phenology Monitoring June 2025',
    sourceUrl: 'https://biznewsdesk.com/business/bit-mesra-nrsc-hyderabad-and-jharkhand-forest-department-sign-mou-for-forest-phenology-monitoring/',
    sourceType: 'news report',
    evidenceQuality: 'medium',
  },
  {
    institution: 'BIT Mesra',
    category: 'previousProjects',
    claim: 'ICMR supported multicentric AI-based non-invasive anemia detection project hosted on BIT domain',
    sourceUrl: 'https://deepscience.bitmesra.ac.in/',
    sourceType: 'official subdomain',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'previousProjects',
    claim: 'Architecture Department Ranchi Smart City SAAR 2.0 case study for RSCCL and heritage consultation for 8 centrally protected monuments',
    sourceUrl: 'https://bitmesra.ac.in/edudepartment/content/1/49/894',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'innovationCapability',
    claim: '3 patents granted 60 published 68 filed as per IIC Annual Report 2023-24',
    sourceUrl: 'https://bitmesra.ac.in/UploadedDocuments/adminiic/files/Final%20_IIC%20Annual%20Report%20%202023-2024.pdf',
    sourceType: 'official PDF',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Mesra',
    category: 'previousProjects',
    claim: 'NESAC Dept of Space 5-year MoU for GeoAI remote sensing GIS and geospatial research',
    sourceUrl: 'https://www.jharkhandmirror.net/bit-mesra-nesac-mou-space-research/',
    sourceType: 'news report',
    evidenceQuality: 'medium',
  },

  // =========================================================================
  // NIT Jamshedpur
  // =========================================================================
  {
    institution: 'NIT Jamshedpur',
    category: 'identity',
    claim: '11 departments as per ordinance document approved December 2024',
    sourceUrl: 'https://nitjsr.ac.in/backend/uploads/recents/ordinance/UG_new.pdf',
    sourceType: 'official PDF',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIT Jamshedpur',
    category: 'facilities',
    claim: 'CIIC operating under NIDHI-iTBI scheme of DST with grants up to 10 lakh for startups',
    sourceUrl: 'https://ciicnitjsr.org/directors-message/',
    sourceType: 'partner website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIT Jamshedpur',
    category: 'previousProjects',
    claim: '51 ongoing sponsored projects with named sponsors PIs and amounts on R and C portal',
    sourceUrl: 'https://www.rnc-nitjsr.in/sponsoredresearch',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIT Jamshedpur',
    category: 'previousProjects',
    claim: 'SERB funded low cost flood proof house for rural flood prone areas 2023',
    sourceUrl: 'https://www.rnc-nitjsr.in/sponsoredresearch',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIT Jamshedpur',
    category: 'previousProjects',
    claim: 'ICMR funded AI for prediction of bone mineral density with 2.18 crore',
    sourceUrl: 'https://www.rnc-nitjsr.in/sponsoredresearch',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIT Jamshedpur',
    category: 'previousProjects',
    claim: 'Ministry of Textiles National Technical Textiles Mission project with 1.66 crore',
    sourceUrl: 'https://www.rnc-nitjsr.in/sponsoredresearch',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // Central University of Jharkhand
  // =========================================================================
  {
    institution: 'Central University of Jharkhand',
    category: 'identity',
    claim: '26 departments listed on official department page',
    sourceUrl: 'https://cuj.ac.in/department.php',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Central University of Jharkhand',
    category: 'facilities',
    claim: 'Centre for Excellence in Green and Efficient Energy Technology established under FAST scheme of MHRD 2015',
    sourceUrl: 'http://cuj.cuj.ac.in/GEETDepartment.php',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Central University of Jharkhand',
    category: 'previousProjects',
    claim: 'DBT BUILDER programme with 4.79 crore funding for interdisciplinary life science departments',
    sourceUrl: 'http://cuj.cuj.ac.in/manojlifescience.php',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Central University of Jharkhand',
    category: 'previousProjects',
    claim: 'ISRO SAC funded flood prognosis and inundation mapping using airborne SAR L-band images',
    sourceUrl: 'http://cuj.cuj.ac.in/Bikash.php',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Central University of Jharkhand',
    category: 'collaborations',
    claim: 'MoU with Energy Efficiency Services Limited EESL 2024',
    sourceUrl: 'https://cuj.ac.in/Rd_cell.php',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // Birsa Agricultural University
  // =========================================================================
  {
    institution: 'Birsa Agricultural University',
    category: 'identity',
    claim: '12 colleges and faculties across agriculture veterinary forestry and fisheries',
    sourceUrl: 'https://bauranchi.org/about-bau/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Birsa Agricultural University',
    category: 'facilities',
    claim: '28 named laboratories for entrepreneurial development including soil testing food processing bio-fertilizer and aquaculture',
    sourceUrl: 'https://bauranchi.org/facilities/laboratories-for-entrepreneurial-development/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Birsa Agricultural University',
    category: 'previousProjects',
    claim: '61 outside-funded projects including 38 AICRPs and 5 network projects',
    sourceUrl: 'https://bauranchi.org/research/research-projects/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Birsa Agricultural University',
    category: 'previousProjects',
    claim: '16 Krishi Vigyan Kendras under BAU administrative control',
    sourceUrl: 'https://bauranchi.org/extension/kvks/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Birsa Agricultural University',
    category: 'previousProjects',
    claim: '3 Zonal Research Stations in Dumka East Singhbhum and Palamu',
    sourceUrl: 'https://bauranchi.org/research/zrs/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Birsa Agricultural University',
    category: 'collaborations',
    claim: 'National collaborators include ICAR IARI CIMMYT IRRI and international partners from Thailand Mexico Philippines and USA',
    sourceUrl: 'https://bauranchi.org/about-bau/collaborations-linkages/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Birsa Agricultural University',
    category: 'innovationCapability',
    claim: 'BAU Birsin herbal formulation granted patent by Indian Patent Office Kolkata',
    sourceUrl: 'https://bauranchi.org/',
    sourceType: 'official website',
    evidenceQuality: 'medium',
  },

  // =========================================================================
  // IIIT Ranchi
  // =========================================================================
  {
    institution: 'IIIT Ranchi',
    category: 'identity',
    claim: 'PPP institute with Tata Technologies TCS and Central Coalfields Limited established 2016',
    sourceUrl: 'https://www.iiitranchi.ac.in/glance.aspx',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIIT Ranchi',
    category: 'previousProjects',
    claim: 'Ministry of Coal TCIL CMPDI 5G Use Case Test Lab for coal industry with 454.15 lakh funding',
    sourceUrl: 'https://cep.iitp.ac.in/MCA%20-%20IIIT%20Ranchi_AUTUMN%202026.pdf',
    sourceType: 'official PDF',
    evidenceQuality: 'high',
  },
  {
    institution: 'IIIT Ranchi',
    category: 'previousProjects',
    claim: 'E-Vidya Vahini project with Department of School Education and Literacy Jharkhand',
    sourceUrl: 'https://cep.iitp.ac.in/MCA%20-%20IIIT%20Ranchi_AUTUMN%202026.pdf',
    sourceType: 'official PDF',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // Ranchi University
  // =========================================================================
  {
    institution: 'Ranchi University',
    category: 'identity',
    claim: '36 postgraduate departments 19 constituent colleges and 47 affiliated colleges serving approximately 160000 students',
    sourceUrl: 'https://ranchiuniversity.ac.in/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Ranchi University',
    category: 'facilities',
    claim: 'Advanced Research R and D Laboratory with SEM and Ore Microscope in Geology department',
    sourceUrl: 'https://ranchiuniversity.ac.in/geology',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Ranchi University',
    category: 'previousProjects',
    claim: 'MoU with IIT ISM Dhanbad BIT Mesra CSIR-CIMFR Zoological Survey of India and Atomic Minerals Directorate',
    sourceUrl: 'https://ranchiuniversity.ac.in/mou',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Ranchi University',
    category: 'previousProjects',
    claim: 'DST-FIST and UGC-SAP projects awarded to Geology Department',
    sourceUrl: 'https://ranchiuniversity.ac.in/geology',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Ranchi University',
    category: 'innovationCapability',
    claim: 'Faculty of Tribal and Regional Languages is first of its kind in India for indigenous languages with 9 departments',
    sourceUrl: 'https://ranchiuniversity.ac.in/institutional-distinctiveness',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // Kolhan University
  // =========================================================================
  {
    institution: 'Kolhan University',
    category: 'identity',
    claim: '4 faculties 19 departments located in Chaibasa West Singhbhum',
    sourceUrl: 'https://www.kolhanuniversity.ac.in/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Kolhan University',
    category: 'facilities',
    claim: 'Centre for Environmental Research Biotechnology and Life Sciences Laboratory and Centre for Tribal and Regional Studies',
    sourceUrl: 'https://www.kolhanuniversity.ac.in/research-and-labs',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Kolhan University',
    category: 'previousProjects',
    claim: 'Design patent granted for AI-based blood sugar test device Dr. Shovit Ranjan',
    sourceUrl: 'https://www.kolhanuniversity.ac.in/research-innovation',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // Nilamber-Pitamber University
  // =========================================================================
  {
    institution: 'Nilamber-Pitamber University',
    category: 'identity',
    claim: 'State university established January 2009 in Medininagar Palamu district with 21 departments',
    sourceUrl: 'https://npu.ac.in/Pages/TheUniversity',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Nilamber-Pitamber University',
    category: 'collaborations',
    claim: 'TISS collaboration for soft skill add-on courses in constituent colleges',
    sourceUrl: 'https://npu.ac.in/Pages/TheUniversity',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Nilamber-Pitamber University',
    category: 'collaborations',
    claim: 'PM USHA scheme with 20 crore government grant received in 2024',
    sourceUrl: 'https://npu.ac.in/Pages/TheUniversity',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // BBMKU Dhanbad
  // =========================================================================
  {
    institution: 'BBMKU Dhanbad',
    category: 'identity',
    claim: 'State university established March 2017 with 28 PG departments and 13 constituent colleges',
    sourceUrl: 'https://bbmku.ac.in/about',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BBMKU Dhanbad',
    category: 'collaborations',
    claim: 'MoU with CSIR-CIMFR Dhanbad ICAR-Indian Institute of Agricultural Biotechnology and CyberVidyapeeth Foundation',
    sourceUrl: 'https://bbmku.ac.in/collaborations',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BBMKU Dhanbad',
    category: 'previousProjects',
    claim: '21 research proposals received from colleges under JCSTI and registered on I-STEM portal',
    sourceUrl: 'https://bbmku.ac.in/collaborations',
    sourceType: 'official website',
    evidenceQuality: 'medium',
  },

  // =========================================================================
  // JUT Ranchi
  // =========================================================================
  {
    institution: 'JUT Ranchi',
    category: 'identity',
    claim: 'State university affiliating 65 colleges across Jharkhand established 2011',
    sourceUrl: 'https://jutranchi.ac.in/?page_id=94',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'JUT Ranchi',
    category: 'innovationCapability',
    claim: 'EKJUT Technology Business Incubator supported by Central Coalfields Limited CSR with dedicated facilities',
    sourceUrl: 'https://jutranchi.ac.in/?page_id=4816',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'JUT Ranchi',
    category: 'collaborations',
    claim: 'MoU with IIT Madras Pravartak Technologies Foundation for deep-tech education and Research Park',
    sourceUrl: 'https://acr.iitm.ac.in/iitm_in_news/iit-madras-jharkhand-university-partners-to-boost-deep-tech-disciplines-in-jharkhand/',
    sourceType: 'partner website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // BIT Sindri
  // =========================================================================
  {
    institution: 'BIT Sindri',
    category: 'identity',
    claim: 'Government engineering institute established 1949 with 15 departments affiliated to JUT',
    sourceUrl: 'https://www.bitsindri.ac.in/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Sindri',
    category: 'facilities',
    claim: 'Siemens Centre of Excellence in Manufacturing with 14 specialized labs established 2017',
    sourceUrl: 'https://www.bitsindri.ac.in/siemens-coe-bit/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Sindri',
    category: 'facilities',
    claim: 'Sindri Industrial Research and Testing Development Organization SIRTDO for testing certification and consultancy',
    sourceUrl: 'https://www.bitsindri.ac.in/sindri-industrial-research-and-testing-development-organization/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Sindri',
    category: 'previousProjects',
    claim: 'NPIU Ministry of HRD approved 21 research proposals with 1.84 crore funding',
    sourceUrl: 'https://www.bitsindri.ac.in/old/docs/RG%20Session%202019-20.pdf',
    sourceType: 'official PDF',
    evidenceQuality: 'high',
  },
  {
    institution: 'BIT Sindri',
    category: 'collaborations',
    claim: 'MoUs with Tata Steel CSIR-CIMFR SAIL R and D TEXMiN IIT ISM and CTIF Denmark',
    sourceUrl: 'https://www.bitsindri.ac.in/mous-of-bit-sindri-signed-with-industries-other-institutes/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // NIAMT Ranchi
  // =========================================================================
  {
    institution: 'NIAMT Ranchi',
    category: 'identity',
    claim: 'Established 1966 with UNDP-UNESCO assistance renamed from NIFFT in 2021 deemed university status Feb 2024',
    sourceUrl: 'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1125',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIAMT Ranchi',
    category: 'facilities',
    claim: 'Centre of Excellence in Industry 4.0 with STPI and Smart Manufacturing Facility with CMTI Bangalore',
    sourceUrl: 'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1125',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIAMT Ranchi',
    category: 'facilities',
    claim: 'Technology Business Incubation Centre as Section 8 company with approximately 5 crore investment from Jharkhand Government',
    sourceUrl: 'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1125',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIAMT Ranchi',
    category: 'previousProjects',
    claim: 'BHEL Haridwar funded establishing technology for higher yield of critical castings with 32 lakh',
    sourceUrl: 'http://niamt.ac.in/WriteReadData/Pratibimbh%20V2_compressed.pdf',
    sourceType: 'official PDF',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIAMT Ranchi',
    category: 'previousProjects',
    claim: 'DST funded solar driven community potable water purification system',
    sourceUrl: 'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1256',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NIAMT Ranchi',
    category: 'previousProjects',
    claim: 'MoU with IIT ISM Dhanbad for mining machinery manufacturing and Industry 4.0 joint R and D',
    sourceUrl: 'https://www.jharkhandmirror.net/iit-ism-dhanbad-partners-with-niamt-ranchi-to-enhance-mining-machinery-manufacturing/',
    sourceType: 'news report',
    evidenceQuality: 'medium',
  },

  // =========================================================================
  // NUSRL Ranchi
  // =========================================================================
  {
    institution: 'NUSRL Ranchi',
    category: 'identity',
    claim: 'Established 2010 by Act No. 4 of Jharkhand State Assembly recognized by UGC and Bar Council of India',
    sourceUrl: 'https://nusrlranchi.ac.in/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NUSRL Ranchi',
    category: 'innovationCapability',
    claim: 'Centre for Child Rights established 2017 in partnership with UNICEF MacJannet Prize second place 2025',
    sourceUrl: 'https://ccr.nusrlranchi.ac.in/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NUSRL Ranchi',
    category: 'previousProjects',
    claim: 'Project Nyay Setu CSR initiative of Central Coalfields Limited for legal aid',
    sourceUrl: 'https://cllrnusrl.com/project-nyay-setu/',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'NUSRL Ranchi',
    category: 'previousProjects',
    claim: 'Department of Justice Ministry of Law and Justice recognition under Pro Bono Club Scheme with legal aid to villages and prisons',
    sourceUrl: 'https://talloiresnetwork.tufts.edu/clap-program/',
    sourceType: 'partner website',
    evidenceQuality: 'high',
  },

  // =========================================================================
  // Sarla Birla University
  // =========================================================================
  {
    institution: 'Sarla Birla University',
    category: 'identity',
    claim: 'Private university established 2017 under Sarla Birla University Act 2017 recognized by UGC BCI and PCI',
    sourceUrl: 'https://sbu.ac.in/whoweare/whatwevalue',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Sarla Birla University',
    category: 'facilities',
    claim: 'Virtual Labs Nodal Center selected under Ministry of Education initiative',
    sourceUrl: 'https://sbu.ac.in/virtuallabs',
    sourceType: 'official website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Sarla Birla University',
    category: 'collaborations',
    claim: 'MoU with Asian Institute of Information Technology Thailand for academic programs research and student mobility',
    sourceUrl: 'https://ait.ac.th/2025/06/ait-and-sarala-birla-university-formalize-academic-partnership/',
    sourceType: 'partner website',
    evidenceQuality: 'high',
  },
  {
    institution: 'Sarla Birla University',
    category: 'collaborations',
    claim: 'Knowledge Partner to Jharkhand State Faculty Development Academy under JHTED',
    sourceUrl: 'https://sbu.ac.in/',
    sourceType: 'official website',
    evidenceQuality: 'medium',
  },
]

// ---------------------------------------------------------------------------
// Summary statistics
// ---------------------------------------------------------------------------

export const EVIDENCE_STATS = {
  totalEntries: EVIDENCE_MANIFEST.length,
  highQuality: EVIDENCE_MANIFEST.filter((e) => e.evidenceQuality === 'high').length,
  mediumQuality: EVIDENCE_MANIFEST.filter((e) => e.evidenceQuality === 'medium').length,
  lowQuality: EVIDENCE_MANIFEST.filter((e) => e.evidenceQuality === 'low').length,
  institutionsCovered: new Set(EVIDENCE_MANIFEST.map((e) => e.institution)).size,
  officialSources: EVIDENCE_MANIFEST.filter((e) =>
    ['official website', 'official PDF', 'official subdomain', 'government portal'].includes(e.sourceType),
  ).length,
} as const
