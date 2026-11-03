export interface ProjectTemplate {
  id: string
  title: string
  titleId: string
  titleEn: string
  descriptionId: string
  descriptionEn: string
  category: 'Presentation' | 'Journal' | 'Thesis' | 'Report' | 'Academic' | 'Resume'
  badge: string
  tags: string[]
  files: Record<string, string>
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl_beamer',
    title: 'Presentation Slide Deck (LaTeX Beamer)',
    titleId: 'Presentasi Ilmiah & Slide Konferensi (Beamer Deck)',
    titleEn: 'Academic Presentation Deck (LaTeX Beamer)',
    descriptionId: 'Slide presentasi modern aspect-ratio 16:9, outline agenda, blok persamaan matematika, dan layout multi-kolom.',
    descriptionEn: 'Modern 16:9 widescreen presentation slides with agenda outline, math theorem blocks, and 2-column layout.',
    category: 'Presentation',
    badge: 'SLIDES // 16:9',
    tags: ['Beamer', 'Presentation', 'Slides'],
    files: {
      'main.tex': `\\documentclass[aspectratio=169,11pt]{beamer}
\\usetheme{Madrid}
\\usecolortheme{beaver}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}

\\title[CorTeX Academic Suite]{High-Performance Academic Presentation}
\\subtitle{Scientific Research \\& WebAssembly LaTeX Intelligence}
\\author{Dr. Lead Researcher}
\\institute{CorTeX Research Institute}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Outline Agenda}
  \\tableofcontents
\\end{frame}

\\section{Introduction \\& Scope}
\\begin{frame}{Background \\& Research Motivation}
  \\begin{itemize}
    \\item Rapid evolution of client-side browser compilation paradigms.
    \\item Elimination of network round-trip overhead and server queue delays.
    \\item Guaranteed privacy: sensitive manuscripts never leave local device memory.
  \\end{itemize}
  \\begin{block}{Core Objective}
    Achieve sub-second compilation latencies with 100\\% deterministic PDF output.
  \\end{block}
\\end{frame}

\\section{Mathematical Formulation}
\\begin{frame}{System Model \\& Optimization}
  \\begin{columns}
    \\begin{column}{0.48\\textwidth}
      \\textbf{Optimization Objective:}
      \\begin{equation}
        \\min_{\\theta} \\sum_{i=1}^{N} \\| \\hat{y}_i - y_i \\|^2 + \\lambda \\Omega(\\theta)
      \\end{equation}
      \\begin{itemize}
        \\item 64MB WASM Heap Buffer
        \\item AST Diff Engine: $< 142$ ms
      \\end{itemize}
    \\end{column}
    \\begin{column}{0.48\\textwidth}
      \\begin{exampleblock}{Performance Benchmark}
        \\begin{itemize}
          \\item Cold start compile: $\\sim 380$ ms
          \\item Incremental paint: $\\sim 95$ ms
          \\item Sync accuracy: $99.8\\%$
        \\end{itemize}
      \\end{exampleblock}
    \\end{column}
  \\end{columns}
\\end{frame}

\\section{Conclusion}
\\begin{frame}{Concluding Remarks \\& Future Directions}
  \\begin{itemize}
    \\item Sovereign document engineering completely decoupled from central cloud servers.
    \\item Built-in multi-tenant IAM isolation with independent project sandboxing.
  \\end{itemize}
  \\vspace{1.5em}
  \\centering
  \\textbf{\\Large Thank You!} \\\\
  \\vspace{0.5em}
  \\small Questions and discussion welcome.
\\end{frame}

\\end{document}`,
    },
  },
  {
    id: 'tpl_ieee',
    title: 'IEEE Transactions 2-Column Journal',
    titleId: 'Naskah Jurnal IEEE 2-Kolom (Transactions Standard)',
    titleEn: 'IEEE Transactions 2-Column Journal Manuscript',
    descriptionId: 'Format resmi IEEE 2-kolom dengan abstract, keywords, IEEE author affiliations, tabel benchmarking, dan sitasi BibTeX.',
    descriptionEn: 'Standard IEEE 2-column format featuring abstract, IEEE keywords, author affiliations, benchmark table, and BibTeX citations.',
    category: 'Journal',
    badge: 'IEEE // 2-COLUMN',
    tags: ['IEEE', 'Journal', '2-Column'],
    files: {
      'main.tex': `\\documentclass[10pt,journal,final]{article}
\\usepackage[margin=1.8cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{cite}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{multicol}

\\title{\\textbf{Scalable In-Browser LaTeX Compilation and Collaborative Architecture for Academic Research}}

\\author{Lead Researcher, \\textit{Senior Member, IEEE}, and Co-Author Two, \\textit{Member, IEEE} \\\\
CorTeX Institute of Scientific Publishing, Jakarta, Indonesia \\\\
\\texttt{\\{researcher, coauthor\\}@cortex.ai}}

\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Scientific publishing workflows have historically relied either on heavyweight local distribution toolchains or centralized cloud compilers subject to network latency and privacy constraints. We propose an embeddable WebAssembly-native compilation architecture executing TeX Live binaries directly inside browser client execution sandboxes. The proposed framework demonstrates sub-second compilation latencies, bi-directional SyncTeX correlation, and isolated multi-tenant workspaces.
\\end{abstract}

\\noindent\\textbf{Index Terms}---WebAssembly, LaTeX compilation, SyncTeX, scientific publishing, distributed document processing.

\\setlength{\\columnsep}{18pt}
\\begin{multicols}{2}

\\section{Introduction}
Precise typography and rigorous mathematical formulation remain foundational to scientific communication. Traditional cloud-based compile cycles impose round-trip network latencies exceeding multiple seconds over public networks \\cite{vaswani2017attention}. In this paper, we demonstrate local client compilation operating within a 64MB memory boundary.

\\section{System Formulation}
Consider an input source document $\\mathcal{D} = \\{s_1, s_2, \\dots, s_M\\}$ transformed into a serialized output stream $\\mathcal{P}$. The energy minimization for incremental typesetting is governed by:
\\begin{equation}
\\mathcal{J}(\\mathcal{D}) = \\arg\\min_{\\Omega} \\left( \\|\\nabla \\mathcal{P}\\|^2 + \\alpha \\sum_{k=1}^{K} \\delta(s_k) \\right)
\\label{eq:formulation}
\\end{equation}

\\section{Experimental Evaluation}
Table~\\ref{tab:benchmarks} summarizes the benchmark comparisons between standard cloud platforms and our in-browser engine.

\\begin{table*}[t]
\\caption{Latency and Resource Comparison Across Environments}
\\label{tab:benchmarks}
\\centering
\\begin{tabular}{lccc}
\\toprule
\\textbf{Platform} & \\textbf{Cold Start (s)} & \\textbf{Sync Delay (ms)} & \\textbf{Privacy Model} \\\\
\\midrule
Cloud LaTeX & 3.84 & 1420 & Remote Server \\\\
Local TeX Live & 0.92 & 310 & Local Disk \\\\
\\textbf{CorTeX WASM} & \\textbf{0.38} & \\textbf{112} & \\textbf{In-Browser Sandbox} \\\\
\\bottomrule
\\end{tabular}
\\end{table*}

\\section{Conclusion}
We established a sovereign, zero-server document engineering model capable of high-velocity publication preparation without external cloud dependencies.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{multicols}
\\end{document}`,
      'refs.bib': `@article{vaswani2017attention,
  author = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob},
  title = {Attention Is All You Need},
  journal = {Advances in Neural Information Processing Systems},
  volume = {30},
  year = {2017}
}`,
    },
  },
  {
    id: 'tpl_elsevier',
    title: 'Elsevier ScienceDirect Journal Template',
    titleId: 'Template Naskah Jurnal Standar Elsevier (ScienceDirect)',
    titleEn: 'Elsevier ScienceDirect Standard Journal Preprint',
    descriptionId: 'Struktur artikel ilmiah Elsevier: Abstrak terstruktur, Graphical Abstract note, pemodelan matematika, dan daftar pustaka lengkap.',
    descriptionEn: 'Elsevier preprint standard format: Structured abstract, author affiliations, mathematical modeling, and reference bibliography.',
    category: 'Journal',
    badge: 'ELSEVIER // ARTICLE',
    tags: ['Elsevier', 'ScienceDirect', 'Journal'],
    files: {
      'main.tex': `\\documentclass[preprint,12pt]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{hyperref}

\\title{\\textbf{Advanced Methodologies for Benchtop Direct Air Capture and Multi-Sensor Data Fusion}}

\\author{Lead Researcher$^a$, Senior Metrology Specialist$^b$ \\\\
\\small $^a$ Department of Chemical \\& Industrial Engineering, CorTeX Institute \\\\
\\small $^b$ Sensor Systems Metrology Group, Global Research Network}

\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Direct Air Capture (DAC) and biochar adsorption screening necessitate rigorous differential metrology to mitigate transient environmental drift. This study establishes a dual NDIR spectroscopic framework integrated with multi-run Kalman filtering. Empirical validations demonstrate a 99.4\\% repeatability factor under fluctuating humidity and temperature conditions.
\\end{abstract}

\\noindent\\textbf{Keywords:} Direct air capture, Carbon dioxide adsorption, Differential sensor metrology, Data fusion.

\\section{Introduction}
Quantitative carbon dioxide sequestration modeling requires continuous baseline stability. Traditional single-channel measurement platforms suffer from thermomechanical drift over extended adsorption screening epochs.

\\section{Material and Experimental Setup}
The experimental assembly consists of a benchtop adsorption column packed with engineered biochar sorbent substrates. Mass balance monitoring is achieved with dual load cells operating synchronously with NDIR spectroscopy.

\\begin{equation}
q_t = \\frac{(C_0 - C_t) \\cdot V_{\\text{gas}}}{m_{\\text{sorbent}}}
\\label{eq:adsorption}
\\end{equation}
where $q_t$ denotes the instantaneous adsorption capacity in $\\mathrm{mg/g}$.

\\section{Results and Discussion}
Adsorption isotherms followed the Langmuir model with an $R^2 > 0.992$, corroborating monolayer chemisorption mechanisms on activated surface functional sites.

\\section{Conclusion}
The proposed methodology offers a robust diagnostic screening framework for emerging negative emission technologies.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{he2016deep,
  author = {He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},
  title = {Deep Residual Learning for Image Recognition},
  journal = {Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition},
  year = {2016}
}`,
    },
  },
  {
    id: 'tpl_thesis',
    title: 'Academic Thesis & Dissertation (Multi-Chapter)',
    titleId: 'Format Tesis / Skripsi / Disertasi Lengkap (Multi-Bab)',
    titleEn: 'Comprehensive Academic Thesis & Dissertation Format',
    descriptionId: 'Template buku tesis akademik standar dengan halaman judul resmi, daftar isi otomatis, bab pendahuluan, metodologi, dan hasil.',
    descriptionEn: 'Academic thesis & dissertation layout with official title page, automated Table of Contents, and modular chapter structure.',
    category: 'Thesis',
    badge: 'THESIS // A4 REPORT',
    tags: ['Thesis', 'Report', 'Dissertation'],
    files: {
      'main.tex': `\\documentclass[12pt,a4paper,oneside]{report}
\\usepackage[margin=3cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\begin{document}

\\begin{titlepage}
  \\centering
  \\vspace*{2cm}
  {\\LARGE \\textbf{DESIGN AND IMPLEMENTATION OF NEXT-GENERATION IN-BROWSER SCIENTIFIC WORKSPACES}\\par}
  \\vspace{1.5cm}
  {\\large Disertasi / Tesis Akademik\\par}
  \\vspace{2cm}
  {\\large Disusun Oleh:\\par}
  \\textbf{\\Large Candidate Scholar}\\par
  \\vspace{0.5cm}
  ID / NIM: 2026-CS-9912\\par
  \\vfill
  Fakultas Teknik \\& Ilmu Komputer\\\\
  CorTeX Institute of Technology\\\\
  \\today
\\end{titlepage}

\\pagenumbering{roman}
\\tableofcontents
\\newpage

\\chapter*{Ringkasan Eksekutif}
Penelitian ini menginvestigasi arsitektur komputasi mutakhir berbasis WebAssembly untuk aplikasi teknik industri dan penulisan ilmiah real-time tanpa server...
\\newpage

\\pagenumbering{arabic}
\\chapter{Pendahuluan}
\\section{Latar Belakang}
Perkembangan sistem komputasi terdistribusi menuntut kecepatan dan keamanan data tinggi tanpa ketergantungan pada server pihak ketiga.

\\section{Rumusan Masalah}
Bagaimana merancang arsitektur compiler di peramban yang mampu memproses dokumen kompleks dengan latensi sub-detik?

\\chapter{Tinjauan Pustaka}
\\section{WebAssembly dan Kompilasi Native}
WebAssembly (WASM) menyediakan sandbox biner portabel berkecepatan tinggi mendekati performa native C/C++ pada browser modern.

\\chapter{Metodologi Penelitian}
\\section{Perancangan Arsitektur}
Model sistem mengintegrasikan memori heap 64MB dengan isolasi peran berbasis Identity and Access Management (IAM).

\\chapter{Hasil dan Pembahasan}
\\section{Pengujian Performa}
Hasil pengujian menunjukkan efisiensi pemrosesan hingga 84\\% lebih cepat dibandingkan compiler cloud konvensional.

\\chapter{Kesimpulan dan Saran}
\\section{Kesimpulan}
Arsitektur yang diusulkan terbukti stabil, handal, dan sepenuhnya terisolasi antar-pengguna pada IndexedDB.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{smith2024embedded,
  author = {Smith, John and Doe, Jane},
  title = {Next-Generation Embedded Architectures},
  journal = {Journal of Systems Architecture},
  year = {2024}
}`,
    },
  },
  {
    id: 'tpl_nature',
    title: 'Nature & Springer High-Impact Paper',
    titleId: 'Template Naskah Saintifik Nature / Springer',
    titleEn: 'Nature & Springer High-Impact Scientific Paper',
    descriptionId: 'Format artikel saintifik prestisius kolom tunggal dengan abstrak tebal, metodologi presisi, dan tipografi elegan.',
    descriptionEn: 'Single-column high-impact scientific manuscript format with bold executive abstract and elegant typography.',
    category: 'Journal',
    badge: 'NATURE // SPRINGER',
    tags: ['Nature', 'Springer', 'High-Impact'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.2cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{cite}
\\usepackage{hyperref}

\\title{\\textbf{Sub-second client-side typesetting and deterministic AST synchronization in browser runtimes}}
\\author{Dr. Aris Thorne$^{1,*}$, Prof. Elena Rostova$^2$ \\\\
\\small $^1$ Quantum Computing \\& Document Engineering Division, CorTeX Lab \\\\
\\small $^2$ Department of Computer Science, Institute of Applied Technology \\\\
\\small $^*$Corresponding author: athorne@cortex.ai}

\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
\\textbf{Here we demonstrate that complete LaTeX typesetting ecosystems can be isolated and executed in memory-bounded client WebAssembly sandboxes without losing typesetting fidelity. Our benchmarks demonstrate a 10-fold reduction in compilation turnaround while preserving 100\\% byte-level deterministic PDF reproducibility across heterogeneous browser environments.}
\\end{abstract}

\\section*{Introduction}
The reproducibility crisis in computational sciences extends to document preparation pipelines. Document compilers historically depend on host-specific font configurations and dynamic library paths.

\\section*{Results}
Across a benchmark corpus of 1,200 peer-reviewed papers containing heavy mathematical formulations, average compile duration clocked at 182 ms on standard quad-core client hardware.

\\section*{Methods}
The virtual file system executes inside memory-mapped buffers with SyncTeX forward and backward correlation primitives.

\\bibliographystyle{unsrt}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{thorne2026nature,
  author = {Thorne, Aris and Rostova, Elena},
  title = {Deterministic Document Engineering},
  journal = {Nature Computational Science},
  year = {2026}
}`,
    },
  },
  {
    id: 'tpl_report',
    title: 'Engineering Technical Report & Lab Monograph',
    titleId: 'Laporan Teknis Proyek & Eksperimen Laboratorium',
    titleEn: 'Engineering Technical Report & Lab Monograph',
    descriptionId: 'Format laporan teknis industri profesional dengan running header, nomor laporan, spesifikasi instrumentasi, dan ringkasan eksekutif.',
    descriptionEn: 'Professional engineering project report format with running header, equipment specs, and executive summary.',
    category: 'Report',
    badge: 'TECHNICAL // REPORT',
    tags: ['Report', 'Technical', 'Engineering'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{CorTeX Technical Report \\#TR-2026-04}
\\lhead{Industrial Automation \\& Telemetry Station}
\\rfoot{Page \\thepage}

\\title{\\textbf{TECHNICAL REPORT: AUTOMATED PUMP TEST BED V3 AND SENSOR TELEMETRY CALIBRATION}}
\\author{Industrial Automation \\& Controls Group \\\\ Lead Controls Engineer}
\\date{\\today}

\\begin{document}
\\maketitle
\\thispagestyle{fancy}

\\section{Executive Summary}
This document outlines the testing, wiring validation, and Modbus RTU telemetry synchronization for the dual pump testing station (45kW 380V line and 160kW 1000V line) operated via Yaskawa GA700 VFD and Weidmuller UC20-M3000 controller.

\\section{System Specifications}
\\begin{itemize}
  \\item \\textbf{Line 1 (4-inch pipe):} TB1 45kW 380V pump, Wingel PCM2052-GP pressure transmitter.
  \\item \\textbf{Line 2 (8-inch pipe):} TB2 160kW 1000V pump, MicroSensor MPM486 pressure transmitter.
  \\item \\textbf{Telemetry Bus:} RS485 Modbus RTU, 19200 baud, 8-E-1.
\\end{itemize}

\\section{Safety Interlocks (STO \\& Emergency Stop)}
All emergency stop circuits are hardwired directly into the VFD STO (Safe Torque Off) terminals and verified compliant with SIL3 / Ple safety interlock standards.

\\section{Conclusion \\& Commissioning Checklist}
The system is cleared for operational baseline validation testing up to 60Hz variable frequency curves.

\\end{document}`,
    },
  },
  {
    id: 'tpl_acm',
    title: 'ACM Conference Proceedings (SIGCONF Format)',
    titleId: 'Prosiding Konferensi ACM (Format SIGCONF)',
    titleEn: 'ACM Conference Proceedings (SIGCONF Format)',
    descriptionId: 'Naskah ilmiah ilmu komputer dan rekayasa perangkat lunak standar Association for Computing Machinery (ACM).',
    descriptionEn: 'Computer Science and Software Engineering conference format matching Association for Computing Machinery standards.',
    category: 'Journal',
    badge: 'ACM // SIGCONF',
    tags: ['ACM', 'Computer Science', 'Proceedings'],
    files: {
      'main.tex': `\\documentclass[sigconf]{article}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{microtype}

\\title{Scalable In-Browser WebAssembly LaTeX Document Execution}
\\author{Dr. Alex Mercer}
\\affiliation{Department of Computer Science, University of Technology}

\\begin{document}

\\begin{abstract}
We present a deterministic in-browser execution model for scientific LaTeX authoring using headless WebAssembly compilation nodes. By streaming TeX Live assets on-demand and leveraging SharedArrayBuffer worker threads, compile times remain strictly under 150ms.
\\end{abstract}

\\maketitle

\\section{Introduction}
Modern cloud document collaboration platforms suffer from significant network round-trip overhead and server queue latency. We demonstrate browser-local compilation.

\\section{System Design}
The architecture separates compilation stages into independent headless workers communicating via SharedArrayBuffer.

\\begin{equation}
\\mathcal{T}_{\\text{compile}} = \\tau_{\\text{wasm}} + \\tau_{\\text{synctex}} + \\mathcal{O}(1)
\\end{equation}

\\section{Conclusion}
Client-side WebAssembly compilers provide reproducible, zero-server document generation.

\\end{document}`,
    },
  },
  {
    id: 'tpl_cv',
    title: 'Academic & Researcher Curriculum Vitae (CV / Resume)',
    titleId: 'Curriculum Vitae Akademik & Peneliti (CV / Resume)',
    titleEn: 'Academic & Researcher Curriculum Vitae (CV / Resume)',
    descriptionId: 'Tata letak CV akademik elegan dan bersih untuk lamaran beasiswa, hibah riset, atau posisi dosen/peneliti.',
    descriptionEn: 'Clean and elegant academic CV layout for fellowship applications, research grants, or faculty positions.',
    category: 'Resume',
    badge: 'ACADEMIC // CV',
    tags: ['CV', 'Resume', 'Academic'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2cm]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}

\\begin{document}
\\begin{center}
  {\\LARGE \\textbf{Dr. Aris Thorne, Ph.D.}}\\\\[4pt]
  Senior Research Scientist \\& Embedded Systems Engineer\\\\[2pt]
  Jakarta, Indonesia $\\cdot$ contact@cortex-research.org $\\cdot$ ORCID: 0000-0002-1825-0097
\\end{center}

\\section{Research Focus}
WebAssembly document runtimes, distributed sensor telemetry, differential metrology, and high-performance embedded systems.

\\section{Education}
\\textbf{Ph.D. in Computer Science \\& Engineering} \\hfill 2021 -- 2025\\\\
Institute of Advanced Research \\hfill \\textit{Summa Cum Laude}\\\\
Dissertation: \\textit{Deterministic Zero-Server LaTeX Compilation Systems}

\\textbf{B.S. in Electrical \\& Control Engineering} \\hfill 2017 -- 2021\\\\
National Technical University \\hfill \\textit{First Class Honours}

\section{Selected Publications}
\begin{itemize}[leftmargin=1.5em]
  \item \textbf{A. Thorne}, E. Rostova. \`\`In-Browser Headless TeX Engines via WebAssembly.'' \textit{IEEE Transactions on Software Engineering}, 2026.
  \item \textbf{A. Thorne}, M. Tanaka. \`\`Sensor Fusion Repeatability in Benchtop DAC Systems.'' \textit{Elsevier Chemical Engineering Science}, 2025.
\end{itemize}

\\section{Technical Skills}
\\textbf{Languages \\& Frameworks:} TypeScript, C/C++, Rust, WebAssembly, LaTeX, Python, MATLAB.\\\\
\\textbf{Industrial Automation:} Modbus RTU/TCP, EtherCAT, PLC Structured Text, Node-RED, Yaskawa VFDs.

\\end{document}`,
    },
  },
  {
    id: 'tpl_lab',
    title: 'Scientific Laboratory Experiment & Metrology Report',
    titleId: 'Laporan Eksperimen Laboratorium & Metrologi Sensor',
    titleEn: 'Scientific Laboratory Experiment & Metrology Report',
    descriptionId: 'Format laporan laboratorium saintifik dengan tabel kalibrasi sensor, estimasi ketidakpastian pengukuran, dan kurva regresi.',
    descriptionEn: 'Scientific lab report layout with sensor calibration tables, uncertainty budget estimations, and regression analysis.',
    category: 'Report',
    badge: 'LAB // METROLOGY',
    tags: ['Lab', 'Experiment', 'Metrology', 'Report'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.2cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{siunitx}

\\title{\\textbf{LABORATORY EXPERIMENT REPORT: DIFFERENTIAL SENSOR METROLOGY AND DRIFT COMPENSATION}}
\\author{Precision Metrology \\& Instrumentation Lab}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Objective}
Measure zero-point drift and sensitivity repeatability of dual NDIR gas sensors across a temperature range of 20\\textdegree C to 45\\textdegree C.

\\section{Experimental Setup}
Two calibrated pressure transmitters (Wingel PCM2052-GP and MicroSensor MPM486) were mounted in a temperature-controlled test chamber with 16-bit ADC data acquisition running at 10Hz.

\\section{Measurement Results}
\\begin{table}[h]
  \\centering
  \\caption{Calibration Uncertainty Budget ($N=500$ samples)}
  \\begin{tabular}{lcccc}
    \\toprule
    Sensor Node & Nominal Range & Mean Drift (\\%) & Repeatability ($R^2$) & Uncertainty ($\\pm\\sigma$) \\\\
    \\midrule
    PT-101 (Wingel) & 0--10 bar & 0.042 & 0.9984 & 0.015 bar \\\\
    PT-201 (MicroSensor) & 0--25 bar & 0.038 & 0.9991 & 0.022 bar \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section{Discussion}
Temperature compensation algorithms reduce residual drift by 78.4\\%, meeting precision class 0.1 industrial standards.

\\end{document}`,
    },
  },
  {
    id: 'tpl_poster',
    title: 'Academic Research Conference Poster (Portrait / Landscape)',
    titleId: 'Poster Konferensi Riset Akademik (Format A0 / A1)',
    titleEn: 'Academic Research Conference Poster',
    descriptionId: 'Template poster ilmiah 3-kolom dengan blok visual tebal untuk mempresentasikan hasil riset pada simposium internasional.',
    descriptionEn: '3-column scientific research poster template with bold visual blocks for international conference symposiums.',
    category: 'Presentation',
    badge: 'POSTER // SYMPOSIUM',
    tags: ['Poster', 'Conference', 'Visual'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1.8cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{multicol}
\\usepackage{tcolorbox}

\\title{\\textbf{\\huge Scaling Academic Research: In-Browser LaTeX Intelligence}}
\\author{\\textbf{Dr. Elena Rostova}, \\textbf{Dr. Aris Thorne} \\\\ CorTeX Scientific Research Group}
\\date{}

\\begin{document}
\\maketitle

\\begin{multicols}{2}

\\begin{tcolorbox}[colback=orange!10,colframe=orange!80!black,title=\\textbf{1. PROBLEM STATEMENT}]
Cloud LaTeX engines suffer from high network latency, queueing bottlenecks, and privacy compliance hurdles.
\\end{tcolorbox}

\\begin{tcolorbox}[colback=blue!10,colframe=blue!80!black,title=\\textbf{2. PROPOSED SOLUTION}]
Compile TeX Live directly inside the user's browser threads using WebAssembly (WasmTex core) with zero server latency.
\\begin{equation}
\\Delta t_{\\text{render}} \\le 142 \\text{ ms}
\\end{equation}
\\end{tcolorbox}

\\begin{tcolorbox}[colback=green!10,colframe=green!80!black,title=\\textbf{3. EXPERIMENTAL FINDINGS}]
Evaluated over 2,000 document compilations:
\\begin{itemize}
  \\item Zero data leakage (100\\% browser privacy).
  \\item Sub-second turnaround for multi-chapter manuscripts.
  \\item Seamless SyncTeX bidirectional navigation.
\\end{itemize}
\\end{tcolorbox}

\\begin{tcolorbox}[colback=gray!10,colframe=black,title=\\textbf{4. CONCLUSIONS}]
WebAssembly native execution represents the next frontier of secure, reproducible scientific documentation.
\\end{tcolorbox}

\\end{multicols}

\\end{document}`,
    },
  },
  {
    id: 'tpl_assignment',
    title: 'University Problem Set & Coursework Assignment',
    titleId: 'Tugas Kuliah & Solusi Problem Set Matematika / Fisika',
    titleEn: 'University Problem Set & Coursework Assignment',
    descriptionId: 'Format pengerjaan soal latihan, tugas kuliah, dan problem set dengan blok pertanyaan bernomor dan kotak solusi terpisah.',
    descriptionEn: 'Structured problem set format with numbered question prompts and boxed step-by-step solutions.',
    category: 'Academic',
    badge: 'COURSEWORK // PSET',
    tags: ['Homework', 'Assignment', 'Math', 'Physics'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb,amsthm}

\\theoremstyle{definition}
\\newtheorem{problem}{Problem}
\\newtheorem{solution}{Solution}

\\title{\\textbf{Advanced Applied Mathematics: Problem Set \\#3}}
\\author{Student Name $\\cdot$ ID: 2026-9041 \\\\ Course: Linear Algebra \\& Differential Equations}
\\date{Due: November 2026}

\\begin{document}
\\maketitle

\\begin{problem}
Consider the linear transformation $T: \\mathbb{R}^3 \\to \\mathbb{R}^3$ defined by the matrix $A$:
\\begin{equation*}
A = \\begin{pmatrix} 4 & 1 & -2 \\\\ 1 & 2 & 0 \\\\ -2 & 0 & 3 \\end{pmatrix}
\\end{equation*}
Determine the eigenvalues and orthonormal eigenvectors of $A$.
\\end{problem}

\\begin{solution}
Since $A$ is symmetric ($A = A^T$), by the Spectral Theorem all eigenvalues are real and the eigenvectors can be chosen orthonormal. We solve $\\det(A - \\lambda I) = 0$:
\\begin{equation*}
\\det \\begin{pmatrix} 4 - \\lambda & 1 & -2 \\\\ 1 & 2 - \\lambda & 0 \\\\ -2 & 0 & 3 - \\lambda \\end{pmatrix} = 0
\\end{equation*}
Expanding along the second row yields the characteristic polynomial.
\\end{solution}

\\end{document}`,
    },
  },
  {
    id: 'tpl_math_paper',
    title: 'Pure Mathematics & Theorem-Proof Manuscript',
    titleId: 'Naskah Matematika Murni & Teorema-Bukti (AMS-LaTeX)',
    titleEn: 'Pure Mathematics & Theorem-Proof Manuscript',
    descriptionId: 'Format artikel matematika teoritis dengan lingkungan Teorema, Lemma, Proposisi, dan Q.E.D. proofs standar AMS.',
    descriptionEn: 'Theoretical mathematics paper with standard AMS Theorem, Lemma, Proposition, and Proof environments.',
    category: 'Academic',
    badge: 'MATH // THEOREMS',
    tags: ['Mathematics', 'Preprint', 'Theorems', 'AMS'],
    files: {
      'main.tex': `\\documentclass[11pt,reqno]{article}
\\usepackage[margin=2.8cm]{geometry}
\\usepackage{amsmath,amssymb,amsthm}

\\newtheorem{theorem}{Theorem}[section]
\\newtheorem{lemma}[theorem]{Lemma}
\\newtheorem{proposition}[theorem]{Proposition}
\\theoremstyle{definition}
\\newtheorem{definition}[theorem]{Definition}
\\newtheorem{remark}[theorem]{Remark}

\\title{\\textbf{On the Existence and Uniqueness of Solutions in Functional Banach Manifolds}}
\\author{CorTeX Mathematical Sciences Institute}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
We establish global existence criteria for nonlinear differential operators on complete Riemannian manifolds, extending classical Sobolev embedding inequalities to compact boundary conditions.
\\end{abstract}

\\section{Fundamental Definitions}
Let $(\\mathcal{M}, g)$ be a complete connected Riemannian manifold of dimension $n \\ge 3$.

\\begin{definition}
A functional $\\mathcal{E}: H^1(\\mathcal{M}) \\to \\mathbb{R}$ is coercive if $\\lim_{\\|u\\| \\to \\infty} \\mathcal{E}(u) = +\\infty$.
\\end{definition}

\\section{Main Results}
\\begin{theorem}
Every weakly continuous and strictly convex functional on a reflexive Banach space attains a unique global minimum.
\\end{theorem}

\\begin{proof}
Let $\\{u_k\\}$ be a minimizing sequence such that $\\lim_{k \\to \\infty} \\mathcal{E}(u_k) = \\inf_{u \\in X} \\mathcal{E}(u)$. Since $\\mathcal{E}$ is coercive, the sequence $\\{u_k\\}$ is bounded. By reflexivity of $X$, there exists a weakly convergent subsequence $u_{k_j} \\rightharpoonup u^*$. Weak lower semicontinuity implies $\\mathcal{E}(u^*) \\le \\liminf \\mathcal{E}(u_{k_j})$, establishing the minimum. Strict convexity guarantees uniqueness.
\\end{proof}

\\end{document}`,
    },
  },
]
