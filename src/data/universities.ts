/**
 * Verified Jharkhand University Capability Dataset — V1
 *
 * Version: university-dataset-v1
 * Generated: 2026-09-04
 * Methodology: Web research from official university/institute websites,
 *   government portals, NIRF filings, and official reports. Every non-trivial
 *   capability claim is traceable to a sourceUrls[] entry.
 *
 * Policy: Only evidence-backed capabilities are included. Fields without
 *   verifiable evidence use the literal string "unknown" or an empty array.
 *   No institutional capability is inferred from department names alone.
 */

import type { UniversityProfile } from '@/features/matching/types'

// ---------------------------------------------------------------------------
// Dataset metadata
// ---------------------------------------------------------------------------

export const DATASET_VERSION = 'university-dataset-v1'
export const DATASET_DATE = '2026-09-04'
export const DATASET_METHOD =
  'Official university websites, NIRF filings, government portals, official reports'

// ---------------------------------------------------------------------------
// Canonical university capability profiles
// ---------------------------------------------------------------------------

export const UNIVERSITIES: UniversityProfile[] = [
  // -------------------------------------------------------------------------
  // 1. IIT (ISM) Dhanbad
  // -------------------------------------------------------------------------
  {
    id: 'iit-ism-dhanbad',
    name: 'Indian Institute of Technology (ISM) Dhanbad',
    type: 'IIT',
    district: 'Dhanbad',
    region: 'Santhal',
    domains: [
      'Energy',
      'Environment',
      'Water Management',
      'Education',
      'Agriculture',
      'Urban Development',
    ],
    expertise: [
      'Mining Engineering',
      'Petroleum Engineering',
      'Environmental Science and Engineering',
      'Civil Engineering',
      'Computer Science and Engineering',
      'Electrical Engineering',
      'Electronics Engineering',
      'Chemical Engineering',
      'Applied Geology',
      'Applied Geophysics',
      'Renewable Energy',
      'Materials Science',
      'Hydrogen Technology',
      'Data Analytics',
    ],
    facilities: [
      'Central Research Facility with 30+ analytical instruments',
      'High Performance Computing Facility',
      'Fabrication and 3D-Printing Facility',
      'Seismological Observatory',
      'Advance Rapid Prototyping Lab',
      'Mine Simulation Space',
      'Mine Automation Lab',
      'Electronics and Sensor Space',
      'Virtual Reality Lab',
      'Design Thinking Lab',
      'Fab Lab and Makerspace',
    ],
    previousProjects: [
      'Centre for Societal Mission under Unnat Bharat Abhiyan adopting villages around Dhanbad since 2015',
      'Centre of Excellence for Tribal Welfare funded by Ministry of Tribal Affairs',
      'Centre of Excellence in Renewable Energy with Suryamitra Skill Development Program',
      'Naresh Vashisht Centre for Hydrogen and CCUS Technology',
      'CIL Innovation and Incubation Centre with Coal India Limited under Atal Innovation Mission',
      'Atal Community Innovation Centre under NITI Aayog',
      'Technology Innovation Hub TEXMiN for Mining 4.0 under National Mission on Cyber Physical Systems',
      'DRDO funded antenna and optoelectronic research',
      'ISRO funded photonic beam-forming for satellite communication',
      'CSIR funded food adulteration sensor development',
      'ONGC supported petroleum engineering lab equipment',
      'DGH funded CBM resource estimation projects',
      'ANRF funded critical minerals exploration and smart mining',
      'Jindal Stainless joint R&D MoU',
    ],
    studentCapabilities: [
      'software development',
      'data analysis',
      'electronics prototyping',
      'civil infrastructure design',
      'environmental monitoring',
      'geospatial analysis',
      'mining technology',
      'renewable energy systems',
    ],
    innovationCapability:
      'Five dedicated innovation and incubation centres: NVCTI for tinkering and innovation, CIIE for startup scaling, CIL Innovation and Incubation Centre with Coal India, ACIC under NITI Aayog, and TEXMiN for mining technology. 19 documented startups spanning agriculture, healthtech, cybersecurity, IoT, and EV technology.',
    capacity: 90,
    taxonomyMappings: [
      'Renewable Energy',
      'Energy Access',
      'Environmental Monitoring',
      'Climate Resilience',
      'Water Quality',
      'Groundwater',
      'Higher Education',
      'Digital Learning',
      'Skill Development',
    ],
    sourceUrls: [
      'https://www.iitism.ac.in/center',
      'https://www.iitism.ac.in/nvcti',
      'https://ciicentre.iitism.ac.in/',
      'https://people.iitism.ac.in/~csm/',
      'https://people.iitism.ac.in/~cre/',
      'https://people.iitism.ac.in/~ceeer/',
      'https://people.iitism.ac.in/~research/crf/index.php',
      'https://www.iitism.ac.in/incubation-diie',
      'https://people.iitism.ac.in/~nvchccust/',
      'https://aciciitism.in/',
      'https://texmin.in/',
      'https://ir.iitism.ac.in/information-portal/collaborations.php',
      'https://people.iitism.ac.in/~academics/Academic/department_wise',
    ],
  },

  // -------------------------------------------------------------------------
  // 2. Birla Institute of Technology, Mesra
  // -------------------------------------------------------------------------
  {
    id: 'bit-mesra',
    name: 'Birla Institute of Technology, Mesra',
    type: 'Deemed University',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Energy',
      'Environment',
      'Education',
      'Healthcare',
      'Urban Development',
      'Agriculture',
    ],
    expertise: [
      'Computer Science and Engineering',
      'Artificial Intelligence and Machine Learning',
      'Electrical and Electronics Engineering',
      'Electronics and Communication Engineering',
      'Civil and Environmental Engineering',
      'Chemical Engineering',
      'Biotechnology',
      'Pharmaceutical Sciences',
      'Remote Sensing and Geoinformatics',
      'Architecture and Planning',
      'Space Engineering',
      'Mechanical Engineering',
      'Data Science',
      'Food Engineering',
    ],
    facilities: [
      'Central Instrumentation Facility with advanced analytical equipment',
      'High Performance Computing Facility',
      'DST-PURSE Lab with ARMLEGS geospatial analytics centre',
      'AICTE IDEA Lab',
      'Central CAD Facility with 70 workstations',
      'Aerodynamics Laboratory',
      'Rocket Propulsion Laboratory',
      'Combustion Lab',
      'CFD and Simulation Lab',
      'Plasma and Thin Film Lab',
      'Bioinformatics Centre',
      'Interdisciplinary Statistical Research Lab',
    ],
    previousProjects: [
      'ISRO sponsoredReusable Launch Vehicle aerodynamic characterization project',
      'DST-FIST funded Closed Circuit Wind Tunnel establishment',
      'DHR funded 2.45 crore mental well-being spatio-temporal predictive modelling project',
      'NRSC ISRO and Jharkhand Forest Department forest phenology monitoring MoU',
      'NESAC Department of Space 5-year GeoAI and remote sensing MoU',
      'ICMR supported multicentric AI-based non-invasive anemia detection project',
      'DST-SERB funded low-cost COVID-19 detection kit for rural areas',
      'Architecture Department Ranchi Smart City SAAR 2.0 case study for RSCCL',
      'Architecture Department heritage consultation for 8 centrally protected monuments',
      'Architecture Department Gram Panchayat Development Plans',
      'DRDO funded high angle of attack CFD aerodynamic database for missile configurations',
      'Tata Steel and DST funded project on production and industrial engineering',
    ],
    studentCapabilities: [
      'software development',
      'data analysis',
      'electronics prototyping',
      'civil infrastructure design',
      'geospatial analysis',
      'AI and machine learning',
      'aerospace prototyping',
      'architectural planning',
    ],
    innovationCapability:
      'Formal Innovation Incubation and Entrepreneurship policy with pre-incubation to incubation pipeline. Entrepreneurship Development Cell established 2007 with 118 students. Institute Innovation Council under MIC MHRD. Digital Innovation Lab with 3.1 crore funding. 3 patents granted, 60 published, 68 filed. BIT Interdisciplinary Research Clusters strategic initiative.',
    capacity: 85,
    taxonomyMappings: [
      'Renewable Energy',
      'Energy Access',
      'Environmental Monitoring',
      'Climate Resilience',
      'Public Infrastructure',
      'Smart Infrastructure',
      'Higher Education',
      'Digital Learning',
      'Skill Development',
      'Water Quality',
    ],
    sourceUrls: [
      'https://bitmesra.ac.in/edudepartment/1/0',
      'https://bitmesra.ac.in/Visit-Other-Department/1/190',
      'https://purse.bitmesra.ac.in/',
      'https://sites.google.com/bitmesra.ac.in/bitmesra-aicteidealab/home',
      'https://bitmesra.ac.in/view/details/1/13',
      'https://bitmesra.ac.in/edudepartment/content/1/167/61',
      'https://bitmesra.ac.in/edudepartment/content/1/169/971',
      'https://bitmesra.ac.in/UploadedDocuments/adminiic/files/Final%20_IIC%20Annual%20Report%20%202023-2024.pdf',
      'https://bitmesra.ac.in/edudepartment/content/1/49/894',
      'https://www.edcbitmesra.in/',
      'https://bitmesra.ac.in/UploadedDocuments/adminrie/files/BIRCs_Vision.pdf',
      'https://bitmesra.ac.in/edudepartment/1/71',
    ],
  },

  // -------------------------------------------------------------------------
  // 3. National Institute of Technology Jamshedpur
  // -------------------------------------------------------------------------
  {
    id: 'nit-jamshedpur',
    name: 'National Institute of Technology Jamshedpur',
    type: 'NIT',
    district: 'East Singhbhum',
    region: 'South',
    domains: [
      'Environment',
      'Energy',
      'Water Management',
      'Education',
      'Urban Development',
    ],
    expertise: [
      'Civil Engineering',
      'Computer Science and Engineering',
      'Electronics and Communication Engineering',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Metallurgical and Materials Engineering',
      'Production and Industrial Engineering',
      'Data Analytics',
      'Geoinformatics',
    ],
    facilities: [
      'Centre for Innovation and Incubation Council',
      'Design and Innovation Centre',
      'Central Research Facility',
      'Central Analytical and Instrumentation Facility',
      'Innovation and Biotechnology Incubation Center',
      'OVAL Computer Center with IBM Dell-EMC HP servers',
    ],
    previousProjects: [
      'SERB funded low cost flood proof house for rural flood prone areas',
      'Ministry of Textiles National Technical Textiles Mission project',
      'ICMR funded AI for prediction of bone mineral density',
      'SERB funded data driven agriculture model for rice crop in Indo-ASEAN region',
      'HEFA funded IoT and GNSS technology based tea farming and tourism',
      'MEITY funded system on chip based next-gen IoT for Industry 4.0',
      'DST funded fusion technology for high quality waste plastic recycle',
      'Ministry of Education funded enhancement of stability of engineered slope by vegetation',
      'TIHAN IIT Guwahati and IIT Hyderabad funded remotely operated underwater vehicle design',
    ],
    studentCapabilities: [
      'software development',
      'data analysis',
      'electronics prototyping',
      'civil infrastructure design',
      'manufacturing engineering',
      'IoT development',
    ],
    innovationCapability:
      'Centre for Innovation and Incubation Council operating under NIDHI-iTBI scheme of DST with grants up to 10 lakh for eligible startups. Design and Innovation Centre inaugurated 2024. 9 patents published and 5 patents granted in 2023. IPR Cell for patent awareness.',
    capacity: 75,
    taxonomyMappings: [
      'Environmental Monitoring',
      'Climate Resilience',
      'Water Quality',
      'Water Supply',
      'Renewable Energy',
      'Higher Education',
      'Digital Learning',
      'Skill Development',
      'Public Infrastructure',
    ],
    sourceUrls: [
      'https://www.nitjsr.ac.in/Institute/About_NITJSR',
      'https://www.nitjsr.ac.in/academic/Departments',
      'https://www.rnc-nitjsr.in/sponsoredresearch',
      'https://ciicnitjsr.org/',
      'https://ciicnitjsr.org/our-facilities/',
      'https://nitjsr.ac.in/facilities/Computer_Center',
      'https://nitjsr.ac.in/Cell/IPR_Cell',
      'https://nitjsr.irins.org/',
    ],
  },

  // -------------------------------------------------------------------------
  // 4. Central University of Jharkhand
  // -------------------------------------------------------------------------
  {
    id: 'cu-jharkhand',
    name: 'Central University of Jharkhand',
    type: 'Central University',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Energy',
      'Environment',
      'Education',
      'Water Management',
    ],
    expertise: [
      'Energy Engineering',
      'Environmental Sciences',
      'Civil Engineering',
      'Computer Science and Engineering',
      'Geoinformatics',
      'Geography',
      'Life Sciences',
      'Metallurgical and Materials Engineering',
      'Anthropology and Tribal Studies',
    ],
    facilities: [
      'Centre for Excellence in Green and Efficient Energy Technology',
      'Central Instrumentation Facility',
      'Solar PV Lab',
      'Solar Thermal Lab',
      'Wind Power Lab',
      'Biodiesel Lab',
      'IC Engine and Gas Turbine Lab',
    ],
    previousProjects: [
      'DBT BUILDER programme for interdisciplinary life science departments with 4.79 crore funding',
      'Centre of Excellence on Green and Efficient Energy Technology funded by MHRD with 2.5 crore',
      'DST-SERB funded climate and non-climatic drivers of ecosystem change',
      'ISRO SAC funded flood prognosis and inundation mapping using airborne SAR images',
      'MoU with Energy Efficiency Services Limited EESL',
      'MoU with CSIR-IMMT Bhubaneswar',
      'MoU with IMD India Meteorological Department',
    ],
    studentCapabilities: [
      'software development',
      'data analysis',
      'environmental monitoring',
      'geospatial analysis',
      'energy systems design',
    ],
    innovationCapability:
      'Centre for Innovation Incubation and Entrepreneurship established to promote innovation culture. Institution Innovation Council under MHRD. Research and Development Cell established September 2021 under NEP 2020 guidelines.',
    capacity: 60,
    taxonomyMappings: [
      'Renewable Energy',
      'Energy Access',
      'Environmental Monitoring',
      'Climate Resilience',
      'Higher Education',
      'Digital Learning',
    ],
    sourceUrls: [
      'https://cuj.ac.in/department.php',
      'http://cuj.cuj.ac.in/GEETDepartment.php',
      'https://cuj.ac.in/Rd_cell.php',
      'http://cuj.cuj.ac.in/Energy/Facilities.php',
      'https://cuj.ac.in/Placement/CIIE%20Document.pdf',
      'http://cuj.cuj.ac.in/manojlifescience.php',
      'http://cuj.cuj.ac.in/Bikash.php',
      'https://cuj.ac.in/campus.php',
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Birsa Agricultural University
  // -------------------------------------------------------------------------
  {
    id: 'birsa-agricultural-university',
    name: 'Birsa Agricultural University',
    type: 'State University',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Agriculture',
      'Environment',
      'Rural Livelihoods',
      'Education',
    ],
    expertise: [
      'Crop Science',
      'Soil Science',
      'Agricultural Engineering',
      'Veterinary Science',
      'Forestry',
      'Fisheries Science',
      'Biotechnology',
      'Horticulture',
      'Food Technology',
      'Agribusiness Management',
      'Dairy Technology',
    ],
    facilities: [
      'Soil and Water Testing Laboratory',
      'Bio-fertilizer Production Unit',
      'Protected Cultivation Unit',
      'Seed Production Unit',
      'Agricultural Research Farm',
      'Aquaculture Lab',
      'Fish Hatchery Complex',
      'Referral Veterinary Clinic with Advanced Diagnostic Lab',
      'Piggery Unit',
      'Poultry Unit',
      'Integrated Farming System Unit',
      'Technology Park',
      'Food Processing and Value Addition Unit',
      'Medicinal and Aromatic Plants Garden',
      'Forest Products and Utilization Lab',
      'Gene Bank',
    ],
    previousProjects: [
      'All 38 ICAR All India Coordinated Research Projects including Soybean since 1975 and Sesame-Niger since 1971',
      'Network Project on Organic Farming',
      'All India Network Project on Soil Biodiversity Biofertilizer',
      'DBT India IRRI Network Project on marker assisted breeding of abiotic stress tolerant rice',
      'Coal India funded mine water aqua-ecosystem for fish culture in abandoned coal quarries',
      'National Horticulture Mission spices project',
      'Precision Farming Development Centre under Ministry of Agriculture',
      'Department of Atomic Energy funded drought tolerant soybean mungbean brassica mutants',
      'Capacity Building of Tribal in Value-Addition and Post-Harvest Management',
      'IRRI Philippines three collaborative projects on drought tolerant rice',
      'CIMMYT Mexico collaborative wheat research',
    ],
    studentCapabilities: [
      'agricultural technology',
      'soil analysis',
      'crop management',
      'food processing',
      'animal husbandry',
      'GIS analysis',
    ],
    innovationCapability:
      'Labs for Entrepreneurial Development with 28 facilities designed for entrepreneurial use including Technology Park. Startup India linked. Herbal formulation BAU Birsin granted patent by Indian Patent Office. Students secured 2nd rank nationally in startup competition.',
    capacity: 70,
    taxonomyMappings: [
      'Crop Management',
      'Soil Health',
      'Agricultural Technology',
      'Farmer Support',
      'Irrigation',
      'Environmental Monitoring',
      'Climate Resilience',
      'Higher Education',
      'Vocational Training',
      'Rural Enterprises',
    ],
    sourceUrls: [
      'https://bauranchi.org/',
      'https://bauranchi.org/about-bau/',
      'https://bauranchi.org/research/research-projects/',
      'https://bauranchi.org/research/zrs/',
      'https://bauranchi.org/extension/kvks/',
      'https://bauranchi.org/facilities/laboratories-for-entrepreneurial-development/',
      'https://bauranchi.org/about-bau/collaborations-linkages/',
      'https://bauranchi.org/mandate/',
    ],
  },

  // -------------------------------------------------------------------------
  // 6. IIIT Ranchi
  // -------------------------------------------------------------------------
  {
    id: 'iiit-ranchi',
    name: 'Indian Institute of Information Technology Ranchi',
    type: 'Specialized National Institute',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Education',
      'Healthcare',
    ],
    expertise: [
      'Computer Science and Engineering',
      'Data Science',
      'Artificial Intelligence',
      'Electronics and Communication Engineering',
      'Embedded Systems',
      'Internet of Things',
      'Machine Learning',
      'Renewable Energy Systems',
    ],
    facilities: [
      'Machine Learning and Artificial Intelligence Lab',
      'Embedded System and IoT Lab',
      'Data Science and Bio-informatics Lab',
      'VLSI and Embedded System Lab',
      'Advance Computing Laboratory',
      'Advance Communication System Lab',
      'Sensors and IoT Lab',
    ],
    previousProjects: [
      'Ministry of Coal TCIL CMPDI 5G Use Case Test Lab for coal industry with 454.15 lakh funding',
      'E-Vidya Vahini project with Department of School Education and Literacy Jharkhand',
      'Indian Army 14 Grenadiers digitization of battalion data',
      'Unnat Bharat Abhiyan MHRD flagship programme participation',
    ],
    studentCapabilities: [
      'software development',
      'data analysis',
      'IoT development',
      'electronics prototyping',
    ],
    innovationCapability:
      'Institution Innovation Council under MHRD Innovation Cell organizing SIH hackathons and patent workshops. RIOT Club for Robotics and IoT. Student chapters including IEEE and ACM.',
    capacity: 45,
    taxonomyMappings: [
      'Digital Learning',
      'Higher Education',
      'Public Services',
      'Citizen Services',
    ],
    sourceUrls: [
      'https://www.iiitranchi.ac.in/',
      'https://www.iiitranchi.ac.in/CSE.aspx',
      'https://www.iiitranchi.ac.in/ECE.aspx',
      'https://www.iiitranchi.ac.in/facilities.aspx',
      'https://www.iiitranchi.ac.in/courses.aspx',
      'https://www.iiitranchi.ac.in/UBA.aspx',
    ],
  },

  // -------------------------------------------------------------------------
  // 7. Ranchi University
  // -------------------------------------------------------------------------
  {
    id: 'ranchi-university',
    name: 'Ranchi University',
    type: 'State University',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Education',
      'Environment',
      'Healthcare',
      'Rural Livelihoods',
    ],
    expertise: [
      'Geology',
      'Geography',
      'Environmental Sciences',
      'Biotechnology',
      'Zoology',
      'Botany',
      'Anthropology',
      'Tribal and Regional Languages',
      'Public Administration',
    ],
    facilities: [
      'Centre of Excellence for Biotechnology and Microbiology',
      'Multidisciplinary Multi-Institutional Collaborative Research Centre',
      'Advanced Research R and D Laboratory with SEM and Ore Microscope',
      'Gemology Diagnostics Laboratory',
      'Central Instrumentation Laboratory',
      'Algal Biotechnology Laboratory',
      'Community Radio Khanchi 90.4 FM',
      'National Knowledge Network with 1 Gbps connectivity',
    ],
    previousProjects: [
      'MoU with IIT ISM Dhanbad for multi-institutional multi-disciplinary research cooperation',
      'MoU with BIT Mesra for academic research collaborations',
      'MoU with CSIR-CIMFR Dhanbad for student education training and postgraduate research',
      'MoU with Vigyan Prasar DST for ANUBHAV 2.0 science communication through community radios',
      'MoU with ICAR-National Bureau of Fish Genetic Resources for long-term collaboration',
      'MoU with Zoological Survey of India for scientific and educational cooperation',
      'MoU with Atomic Minerals Directorate for exploration and research',
      'DST-FIST and UGC-SAP projects awarded to Geology Department',
      'UGC sponsored research projects across multiple departments',
    ],
    studentCapabilities: [
      'geological field analysis',
      'biological laboratory research',
      'GIS analysis',
      'social science research',
      'community radio production',
    ],
    innovationCapability:
      'MMCRC for collaborative research. Centre of Excellence for Biotechnology and Microbiology. UGC-HRDC for faculty development. Computer Centre with Shodhganga integration hosting 186 theses. Faculty of Tribal and Regional Languages is first of its kind in India for indigenous languages.',
    capacity: 55,
    taxonomyMappings: [
      'Higher Education',
      'Digital Learning',
      'Environmental Monitoring',
      'Biodiversity',
      'Public Services',
    ],
    sourceUrls: [
      'https://ranchiuniversity.ac.in/',
      'https://ranchiuniversity.ac.in/department',
      'https://ranchiuniversity.ac.in/index.php/mmcrc',
      'https://ranchiuniversity.ac.in/mou',
      'https://ranchiuniversity.ac.in/geology',
      'https://ranchiuniversity.ac.in/index.php/botany',
      'https://ranchiuniversity.ac.in/computer-center',
      'https://ranchiuniversity.ac.in/institutional-distinctiveness',
    ],
  },

  // -------------------------------------------------------------------------
  // 8. Kolhan University
  // -------------------------------------------------------------------------
  {
    id: 'kolhan-university',
    name: 'Kolhan University',
    type: 'State University',
    district: 'West Singhbhum',
    region: 'South',
    domains: [
      'Environment',
      'Education',
      'Rural Livelihoods',
    ],
    expertise: [
      'Environmental Sciences',
      'Anthropology',
      'Geology',
      'Geography',
      'Zoology',
      'Tribal Studies',
    ],
    facilities: [
      'Centre for Environmental Research',
      'Biotechnology and Life Sciences Laboratory',
      'Computer Science and Data Analytics Lab',
      'Centre for Tribal and Regional Studies',
      'Physics and Material Science Laboratory',
      'Social Science Research Cell',
    ],
    previousProjects: [
      'Research supported by UGC DST ICSSR and DBT as documented on official research page',
    ],
    studentCapabilities: [
      'environmental monitoring',
      'social science research',
      'data analysis',
    ],
    innovationCapability:
      'Research and labs page documents 6 named research centres. Faculty members and scholars actively engage in research supported by UGC DST ICSSR and DBT. Design patent granted for AI-based blood sugar test device.',
    capacity: 35,
    taxonomyMappings: [
      'Environmental Monitoring',
      'Biodiversity',
      'Higher Education',
    ],
    sourceUrls: [
      'https://www.kolhanuniversity.ac.in/',
      'https://www.kolhanuniversity.ac.in/research-and-labs',
      'https://www.kolhanuniversity.ac.in/faculties',
      'https://www.kolhanuniversity.ac.in/research-innovation',
      'https://www.kolhanuniversity.ac.in/index.php/campus-facilities',
    ],
  },

  // -------------------------------------------------------------------------
  // 9. Nilamber-Pitamber University
  // -------------------------------------------------------------------------
  {
    id: 'nilamber-pitamber-university',
    name: 'Nilamber-Pitamber University',
    type: 'State University',
    district: 'Palamu',
    region: 'South',
    domains: [
      'Education',
    ],
    expertise: [
      'Geology',
      'Zoology',
      'Botany',
      'Geography',
    ],
    facilities: [
      'Digital Language Labs',
      'ICT Labs',
      'Smart Classrooms',
      'Virtual Classroom',
    ],
    previousProjects: [
      'TISS collaboration for soft skill add-on courses in constituent colleges',
      'PM USHA scheme with 20 crore government grant received in 2024',
    ],
    studentCapabilities: [
      'basic laboratory research',
      'social science research',
    ],
    innovationCapability:
      'University departments engaged in teaching and research with Ph.D. programs through 18 departments in 4 faculties. Research Projects and Research Areas sections exist on official website. Limited documented external research infrastructure.',
    capacity: 30,
    taxonomyMappings: [
      'Higher Education',
    ],
    sourceUrls: [
      'https://npu.ac.in/',
      'https://npu.ac.in/Pages/TheUniversity',
      'https://npu.ac.in/Pages/FacultyDepartments',
      'https://npu.ac.in/Uploads/BulletinforPhD.pdf',
    ],
  },

  // -------------------------------------------------------------------------
  // 10. Binod Bihari Mahto Koyalanchal University
  // -------------------------------------------------------------------------
  {
    id: 'bbmku-dhanbad',
    name: 'Binod Bihari Mahto Koyalanchal University',
    type: 'State University',
    district: 'Dhanbad',
    region: 'Santhal',
    domains: [
      'Education',
      'Environment',
      'Healthcare',
    ],
    expertise: [
      'Computer Science',
      'Environmental Science and Disaster Management',
      'Life Sciences',
      'Geology',
      'Geography',
      'Mass Communication',
    ],
    facilities: [
      'unknown',
    ],
    previousProjects: [
      'MoU with CSIR-CIMFR Dhanbad for research collaboration',
      'MoU with ICAR-Indian Institute of Agricultural Biotechnology Namkum Ranchi',
      'MoU with CyberVidyapeeth Foundation for cyber defence diploma and PG diploma courses',
      '21 research proposals received from colleges and university departments under JCSTI',
      'BBMKU registered on I-STEM portal for access to national government laboratory equipment',
    ],
    studentCapabilities: [
      'basic laboratory research',
      'data analysis',
    ],
    innovationCapability:
      'Newer state university established 2017 with 28 PG departments and 200+ research scholars. Collaborations with CSIR-CIMFR and ICAR documented. Research Programs page exists but marked Coming Soon on official website.',
    capacity: 30,
    taxonomyMappings: [
      'Higher Education',
      'Environmental Monitoring',
    ],
    sourceUrls: [
      'https://bbmku.ac.in/about',
      'https://bbmku.ac.in/collaborations',
      'https://www.bbmku.ac.in/alumni_asociation',
      'https://bbmku.ac.in/phd_regulation',
    ],
  },

  // -------------------------------------------------------------------------
  // 11. Jharkhand University of Technology
  // -------------------------------------------------------------------------
  {
    id: 'jut-ranchi',
    name: 'Jharkhand University of Technology',
    type: 'State University',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Education',
      'Urban Development',
    ],
    expertise: [
      'Civil Engineering',
      'Computer Science and Engineering',
      'Electrical Engineering',
      'Electronics and Communication Engineering',
      'Mechanical Engineering',
      'Mining Engineering',
      'Metallurgical Engineering',
      'Chemical Engineering',
    ],
    facilities: [
      'EKJUT Technology Business Incubator',
    ],
    previousProjects: [
      'MoU with IIT Madras Pravartak Technologies Foundation for deep-tech education innovation and skill development',
      'MoU with NIT Jamshedpur for incubation and deep-tech research',
      'MoU with Anudip Foundation for IBM Skills Build program across 63 affiliated colleges',
      'Central Coalfields Limited CSR support for EKJUT TBI',
    ],
    studentCapabilities: [
      'software development',
      'civil infrastructure design',
      'electronics prototyping',
    ],
    innovationCapability:
      'EKJUT Technology Business Incubator established on campus supported by Central Coalfields Limited CSR with dedicated office spaces LAN Wi-Fi DG power backup training hall and access to JUT labs. MoU with IIT Madras for Research Park development.',
    capacity: 45,
    taxonomyMappings: [
      'Higher Education',
      'Skill Development',
      'Public Infrastructure',
    ],
    sourceUrls: [
      'https://jutranchi.ac.in/?page_id=94',
      'https://jutranchi.ac.in/?page_id=93',
      'https://jutranchi.ac.in/?page_id=4816',
      'https://jutranchi.ac.in/?page_id=229',
    ],
  },

  // -------------------------------------------------------------------------
  // 12. BIT Sindri
  // -------------------------------------------------------------------------
  {
    id: 'bit-sindri',
    name: 'Birla Institute of Technology, Sindri',
    type: 'Government Engineering Institute',
    district: 'Dhanbad',
    region: 'Santhal',
    domains: [
      'Energy',
      'Environment',
      'Urban Development',
      'Education',
    ],
    expertise: [
      'Mechanical Engineering',
      'Electrical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Metallurgical Engineering',
      'Mining Engineering',
      'Computer Science and Engineering',
      'Electronics and Communication Engineering',
      'Production and Industrial Engineering',
      'Environmental Engineering',
    ],
    facilities: [
      'Siemens Centre of Excellence in Manufacturing with 14 labs',
      'Advanced Manufacturing Lab',
      'Robotics Lab',
      'Rapid Prototyping Lab',
      'CNC Workshop',
      'Product Design and Validation Lab',
      'Mechatronics Lab',
      'Sindri Industrial Research and Testing Development Organization',
      'AICTE IDEA Lab',
      'AI Lab',
    ],
    previousProjects: [
      'NPIU Ministry of HRD approved 21 research proposals with 1.84 crore funding for new labs',
      'MoU with Tata Steel for training of employees',
      'MoU with CSIR-CIMFR Dhanbad for research collaboration',
      'MoU with SAIL R and D Centre for Iron and Steel Ranchi for collaborative research',
      'MoU with TEXMiN for mining innovation internships and startups',
      'MoU with CTIF Global Capsule Aarhus University Denmark for 6G and beyond research',
      'MoU with IIT ISM Dhanbad for academic and R and D resource sharing',
      'Jharkhand Government plans to develop BIT Sindri into research hub announced 2026',
    ],
    studentCapabilities: [
      'manufacturing engineering',
      'civil infrastructure design',
      'electronics prototyping',
      'software development',
      'robotics',
    ],
    innovationCapability:
      'Siemens Centre of Excellence in Manufacturing with 14 specialized labs. SIRTDO for testing certification and consultancy. AICTE IDEA Lab. Innovation and Incubation Centre established June 2019. Atal Bihari Vajpayee Innovation Lab for incubation support.',
    capacity: 65,
    taxonomyMappings: [
      'Renewable Energy',
      'Higher Education',
      'Skill Development',
      'Public Infrastructure',
      'Vocational Training',
    ],
    sourceUrls: [
      'https://www.bitsindri.ac.in/',
      'https://www.bitsindri.ac.in/siemens-coe-bit/',
      'https://www.bitsindri.ac.in/sindri-industrial-research-and-testing-development-organization/',
      'https://www.bitsindri.ac.in/mous-of-bit-sindri-signed-with-industries-other-institutes/',
      'https://www.bitsindri.ac.in/aicte-idea-lab/',
      'https://www.bitsindri.ac.in/b-tech/',
    ],
  },

  // -------------------------------------------------------------------------
  // 13. NIAMT Ranchi
  // -------------------------------------------------------------------------
  {
    id: 'niamt-ranchi',
    name: 'National Institute of Advanced Manufacturing Technology',
    type: 'Specialized National Institute',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Energy',
      'Environment',
      'Education',
      'Urban Development',
    ],
    expertise: [
      'Foundry and Forge Technology',
      'Manufacturing Engineering',
      'Materials and Metallurgical Engineering',
      'Mechanical Engineering',
      'Environmental Engineering',
      'Electronics and Computer Engineering',
    ],
    facilities: [
      'Centre of Excellence in Industry 4.0 with STPI',
      'Smart Manufacturing Facility with CMTI Bangalore',
      'Technology Business Incubation Centre',
      'Women Technology Park funded by DST',
      'Simulation and Modeling Center for Research and Engineering',
      'Electron Microscopy Laboratory',
      'X-Ray Diffraction Laboratory',
      'Scanning Electron Microscopy',
      'Corrosion Laboratory',
      'Foundry Workshop',
      'Forge Workshop',
      'Rapid Prototyping Lab with 3D Printer',
    ],
    previousProjects: [
      'Tata Steel Jamshedpur funded technology development for electrical steel thin ring profile casting with 9.99 lakh',
      'CMTI Bengaluru funded smart heat treatment technologies with 6.2 lakh',
      'BHEL Haridwar funded establishing technology for higher yield of critical castings with 32 lakh',
      'DST-SERB funded development of electrocaloric heat pump module for domestic cooling',
      'DST funded solar driven community potable water purification system',
      'SERB funded chitosan based thin active layer forward osmosis membrane',
      'Ministry of MSME funded smart depression monitoring system',
      'MoU with IIT ISM Dhanbad for mining machinery manufacturing and Industry 4.0',
    ],
    studentCapabilities: [
      'manufacturing engineering',
      'materials characterization',
      'environmental engineering',
      'electronics prototyping',
      'CAD and CAM design',
    ],
    innovationCapability:
      'Centre of Excellence in Industry 4.0 established with STPI under MeitY. Technology Business Incubation Centre as Section 8 company with approximately 5 crore investment from Jharkhand Government. Women Technology Park funded by DST. Deemed to be University status granted February 2024.',
    capacity: 55,
    taxonomyMappings: [
      'Renewable Energy',
      'Energy Efficiency',
      'Higher Education',
      'Skill Development',
      'Vocational Training',
      'Environmental Monitoring',
    ],
    sourceUrls: [
      'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1125',
      'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1246',
      'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1225',
      'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1232',
      'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1253',
      'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1256',
      'https://niamt.ac.in/UserView/UserView.aspx?TypeID=1478',
    ],
  },

  // -------------------------------------------------------------------------
  // 14. NUSRL Ranchi
  // -------------------------------------------------------------------------
  {
    id: 'nusrl-ranchi',
    name: 'National University of Study and Research in Law',
    type: 'Specialized National Institute',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Public Administration',
      'Education',
      'Rural Livelihoods',
    ],
    expertise: [
      'Law',
      'Child Rights',
      'Intellectual Property Rights',
      'Labour Law',
      'Alternative Dispute Resolution',
      'Public Administration',
    ],
    facilities: [
      'Moot Court',
      'Central Library with Manupatra SCC Online WestLaw India HeinOnline and JSTOR databases',
      'Common Service Centre for pro bono legal services',
    ],
    previousProjects: [
      'Project Nyay Setu CSR initiative of Central Coalfields Limited implemented by CLLR NUSRL',
      'UNICEF partnership for child protection and child rights training',
      'Department of Justice Ministry of Law and Justice recognition under Pro Bono Club Scheme',
      'Training of Trainers Programme on Mediation with Mediation and Conciliation Project Committee Supreme Court of India',
      'MoU with Jharkhand State Youth Commission for youth development and legal education',
      'Project Saarthi for prison-based legal aid and rehabilitation',
      'Village adoption project for community legal services',
      'Continuous Legal Education Program for young lawyers',
    ],
    studentCapabilities: [
      'legal research',
      'legal aid services',
      'mediation and arbitration',
      'child rights advocacy',
      'community legal education',
    ],
    innovationCapability:
      'Centre for Child Rights established 2017 in partnership with UNICEF. DPIIT IPR Chair and Centre for Study and Research in Intellectual Property Rights. Centre for Labour Law and Research. Centre for Research in Alternative Dispute Resolution. MacJannet Prize for Global Citizenship 2025 second place. National Legal Award for Legal Aid 2023 and 2024.',
    capacity: 40,
    taxonomyMappings: [
      'Public Services',
      'Governance',
      'Citizen Services',
      'Inclusive Services',
      'Higher Education',
    ],
    sourceUrls: [
      'https://nusrlranchi.ac.in/',
      'https://nusrlranchi.ac.in/academic-programmes/',
      'https://ccr.nusrlranchi.ac.in/',
      'https://cllrnusrl.com/',
      'https://cllrnusrl.com/project-nyay-setu/',
      'https://nusrlranchi.ac.in/moot-court-committee/',
      'https://nusrlranchi.ac.in/library/',
      'https://talloiresnetwork.tufts.edu/clap-program/',
    ],
  },

  // -------------------------------------------------------------------------
  // 15. Sarla Birla University
  // -------------------------------------------------------------------------
  {
    id: 'sarla-birla-university',
    name: 'Sarla Birla University',
    type: 'Private University',
    district: 'Ranchi',
    region: 'Chotanagpur',
    domains: [
      'Education',
      'Healthcare',
    ],
    expertise: [
      'Computer Science and Engineering',
      'Artificial Intelligence',
      'Civil Engineering',
      'Electrical and Electronics Engineering',
      'Electronics and Communication Engineering',
      'Mechanical Engineering',
      'Nursing',
      'Pharmacy',
    ],
    facilities: [
      'Virtual Labs Nodal Center under Ministry of Education',
      'Drone and Robotics Lab',
      '40 plus specialized labs and workshops',
      'Central Library',
    ],
    previousProjects: [
      'Knowledge Partner to Jharkhand State Faculty Development Academy under Jharkhand Higher and Technical Education Department',
      'MoU with BIT Sindri for SIEMENS CoE training',
      'MoU with Asian Institute of Information Technology Thailand for academic programs and research',
      'MoU with ZOHO Corporation for training and certification',
      'MoU with NIT Jamshedpur for research consultancy and academic exchange',
      'MoU with Central Industrial Security Force for Critical Information Infrastructure Protection training',
    ],
    studentCapabilities: [
      'software development',
      'electronics prototyping',
      'robotics',
      'data analysis',
    ],
    innovationCapability:
      'Institution Innovation Council active with patent awareness. Virtual Labs Nodal Center under Ministry of Education initiative. Drone and Robotics Lab launched April 2025 designed by Milind Raj. R and D Cell leading Ph.D. and research programs.',
    capacity: 35,
    taxonomyMappings: [
      'Higher Education',
      'Digital Learning',
      'Skill Development',
    ],
    sourceUrls: [
      'https://sbu.ac.in/',
      'https://sbu.ac.in/academicsection',
      'https://sbu.ac.in/virtuallabs',
      'https://sbu.ac.in/labs&workshops',
      'https://sbu.ac.in/phd',
      'https://sbu.ac.in/mouandties',
    ],
  },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Returns a university by its stable ID, or undefined if not found. */
export function getUniversityById(id: string): UniversityProfile | undefined {
  return UNIVERSITIES.find((u) => u.id === id)
}

/** Returns all universities in a given district. */
export function getUniversitiesByDistrict(district: string): UniversityProfile[] {
  return UNIVERSITIES.filter((u) => u.district === district)
}

/** Returns all universities that support a given domain. */
export function getUniversitiesByDomain(domain: string): UniversityProfile[] {
  return UNIVERSITIES.filter((u) => u.domains.includes(domain))
}
