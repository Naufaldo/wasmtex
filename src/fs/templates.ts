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
  {
    id: 'tpl_arxiv',
    title: 'arXiv / Machine Learning Research Preprint',
    titleId: 'Preprint arXiv & Riset Machine Learning (2-Kolom)',
    titleEn: 'arXiv / Machine Learning Research Preprint',
    descriptionId: 'Format preprint standar arXiv untuk machine learning, computer vision, dan fisika komputasi dengan tabel booktabs dan algoritma.',
    descriptionEn: 'Standard arXiv preprint format for machine learning, computer vision, and computational science with booktabs and algorithmic blocks.',
    category: 'Journal',
    badge: 'PREPRINT // ARXIV',
    tags: ['arXiv', 'Preprint', 'Machine Learning', 'AI'],
    files: {
      'main.tex': `\\documentclass[10pt,twocolumn,letterpaper]{article}
\\usepackage[top=2cm,bottom=2.2cm,left=1.8cm,right=1.8cm]{geometry}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{microtype}

\\hypersetup{colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue}

\\title{\\textbf{Scalable Zero-Server Neural Architectures for Real-Time Client-Side Inference}}
\\author{
  Alex Chen\\textsuperscript{1}, Maya Lin\\textsuperscript{2}, and David K. Thorne\\textsuperscript{1} \\\\
  \\small \\textsuperscript{1}Department of Computer Science, University of Technology \\\\
  \\small \\textsuperscript{2}Neural Systems Lab, Institute for Advanced Research \\\\
  \\small \\texttt{\\{alex.chen, d.thorne\\}@tech.edu, maya@neurallab.org}
}
\\date{}

\\begin{document}
\\maketitle

\\begin{abstract}
Modern artificial intelligence models increasingly demand decentralized client-side deployment to eliminate server latency, reduce compute costs, and ensure absolute user data sovereignty. In this work, we propose a quantized neural compiler framework executed entirely within WebAssembly runtimes. Extensive benchmarks on standard ImageNet-1K and scientific benchmark tasks demonstrate a $3.4\\times$ speedup over conventional browser runtimes with zero degradation in empirical accuracy ($p < 0.001$).
\\end{abstract}

\\section{Introduction}
Decentralized execution of scientific algorithms represents a paradigm shift in open reproducible research~\\cite{vaswani2017attention, devlin2018bert}. By leveraging compiled native instruction sets within isolated browser sandboxes, heavy matrix operators execute with near-native throughput.

\\section{Methodology}
Let $\\mathcal{X} \\in \\mathbb{R}^{B \\times D}$ represent an input feature tensor with batch size $B$ and hidden dimension $D$. The attention operator is formulated as:
\\begin{equation}
  \\label{eq:attention}
  \\mathrm{Attn}(Q, K, V) = \\mathrm{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V
\\end{equation}
where $d_k$ denotes the projection dimension.

\\subsection{Empirical Benchmark}
Table~\\ref{tab:results} summarizes latency and memory footprints across multiple model configurations.

\\begin{table}[htbp]
  \\centering
  \\caption{Performance comparison on standard benchmark suites.}
  \\label{tab:results}
  \\begin{tabular}{lcccc}
    \\toprule
    \\textbf{Model} & \\textbf{Params (M)} & \\textbf{Latency (ms)} & \\textbf{Throughput} & \\textbf{Memory} \\\\
    \\midrule
    Baseline FP32   & 110.2 & 148.6 & 67.3 tok/s & 440 MB \\\\
    Ours (INT8)     & 110.2 & 43.8  & 228.1 tok/s & 112 MB \\\\
    Ours (WASM-SIMD) & 110.2 & 32.1  & 311.5 tok/s & 98 MB \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section{Conclusion}
Our architecture proves that complex machine learning inference can be performed autonomously on client hardware with robust privacy guarantees.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},
  journal={Advances in Neural Information Processing Systems},
  volume={30},
  year={2017}
}

@article{devlin2018bert,
  title={BERT: Pre-training of deep bidirectional transformers for language understanding},
  author={Devlin, Jacob and Chang, Ming-Wei and Lee, Kenton and Toutanova, Kristina},
  journal={arXiv preprint arXiv:1810.04805},
  year={2018}
}`,
    },
  },
  {
    id: 'tpl_lncs',
    title: 'Springer LNCS Conference Manuscript',
    titleId: 'Springer LNCS (Lecture Notes in Computer Science)',
    titleEn: 'Springer LNCS Conference Manuscript',
    descriptionId: 'Format konferensi ilmu komputer standar Springer LNCS dengan running headers, definisi masalah formal, dan sitasi terstruktur.',
    descriptionEn: 'Standard Springer LNCS Computer Science conference format with running headers, formal problem definitions, and structured citations.',
    category: 'Journal',
    badge: 'SPRINGER // LNCS',
    tags: ['Springer', 'LNCS', 'Algorithms', 'Computer Science'],
    files: {
      'main.tex': `\\documentclass[runningheads]{article}
\\usepackage[top=2.5cm,bottom=2.5cm,left=2.5cm,right=2.5cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\begin{document}

\\title{Provably Efficient Graph Traversal under Bounded Memory Constraints}
\\author{Elena Rostova\\inst{1} \\and Marcus Vance\\inst{2}}
\\authorrunning{E. Rostova and M. Vance}
\\institute{
  Max Planck Institute for Informatics, Saarbr\\"{u}cken, Germany \\\\
  \\email{erostova@mpi-inf.mpg.de}
  \\and
  Stanford University, California, USA \\\\
  \\email{mvance@stanford.edu}
}

\\maketitle

\\begin{abstract}
Graph exploration under sublinear memory bounds is a cornerstone problem in distributed network algorithms and computational biology. We introduce an adaptive sampling strategy that reduces space complexity from $\\mathcal{O}(|V|)$ to $\\mathcal{O}(\\sqrt{|V|} \\log |V|)$ while preserving exact diameter estimation with probability $1 - \\delta$.

\\textbf{Keywords:} Distributed Algorithms, Graph Traversal, Memory-Constrained Computing, Diameter Estimation.
\\end{abstract}

\\section{Introduction}
Given an undirected connected graph $G = (V, E)$, fundamental topological queries such as diameter calculation typically require breadth-first search queues proportional to $|V|$~\\cite{knuth1997art}. In large scale cyber-physical infrastructures, memory per worker node is strictly limited.

\\section{Problem Formulation \\& Invariants}
\\textbf{Definition 1 (Bounded Frontier).} A traversal queue $Q_t$ at step $t$ satisfies the $(k, \\epsilon)$-frontier invariant if:
\\begin{equation}
  |Q_t| \\le k \\cdot \\log(1 / \\epsilon), \\quad \\forall t \\ge 0
\\end{equation}

\\section{Experimental Results}
We tested our algorithm on Stanford Large Network Dataset (SNAP) topologies. Table~\\ref{tab:comparison} demonstrates the memory compression achieved.

\\begin{table}[htbp]
  \\centering
  \\caption{Memory footprint comparison across benchmark graph topologies.}
  \\label{tab:comparison}
  \\begin{tabular}{lrrr}
    \\toprule
    \\textbf{Network Dataset} & \\textbf{$|V|$} & \\textbf{Standard BFS (MB)} & \\textbf{Ours (MB)} \\\\
    \\midrule
    ca-GrQc        & 5,242   & 14.2 & 1.8 \\\\
    wiki-Vote      & 7,115   & 22.6 & 2.4 \\\\
    soc-Epinions1  & 75,879  & 184.1 & 12.9 \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section{Concluding Discussion}
The proposed bounded algorithm guarantees deterministic convergence with negligible memory overhead.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@book{knuth1997art,
  title={The Art of Computer Programming, Volume 1: Fundamental Algorithms},
  author={Knuth, Donald E},
  year={1997},
  publisher={Addison-Wesley}
}`,
    },
  },
  {
    id: 'tpl_neurips_ml',
    title: 'NeurIPS / ICML Deep Learning Conference Paper',
    titleId: 'Naskah Konferensi Deep Learning (NeurIPS / ICML Format)',
    titleEn: 'NeurIPS / ICML Deep Learning Conference Paper',
    descriptionId: 'Format paper konferensi AI papan atas (NeurIPS/ICML/ICLR) lengkap dengan formulasi loss, tabel ablasi, dan ethical impact statement.',
    descriptionEn: 'Top-tier AI conference paper format (NeurIPS/ICML/ICLR) with loss formulation, ablation tables, and broader impact statements.',
    category: 'Journal',
    badge: 'CONF // NEURIPS',
    tags: ['NeurIPS', 'ICML', 'Deep Learning', 'Neural Networks'],
    files: {
      'main.tex': `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amssymb,bm}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{microtype}

\\title{\\LARGE \\textbf{Self-Supervised Representation Alignment via Contrastive Metric Learning}}
\\author{
  \\textbf{Jordan Riley}$^{*,1}$ \\quad \\textbf{Sofia Petrov}$^{*,2}$ \\quad \\textbf{Hassan Al-Mansoor}$^{1}$ \\\\
  \\small $^{1}$Artificial Intelligence Research Lab, MIT \\quad $^{2}$ETH Z\\"{u}rich \\\\
  \\small \\texttt{\\{jriley, hassan\\}@mit.edu, petrovs@ethz.ch}
}
\\date{}

\\begin{document}
\\maketitle
\\def\\thefootnote{*}\\footnotetext{Equal contribution.}

\\begin{abstract}
Self-supervised contrastive learning maps high-dimensional sensory inputs into latent metrics where semantic transformations remain invariant. We introduce \\textsc{MetricAlign}, an objective that explicitly regularizes Riemannian curvature during representation optimization. Experiments across vision and multimodal tasks indicate superior out-of-distribution robustness (+4.8\\% accuracy) compared to existing self-supervised baselines.
\\end{abstract}

\\section{Introduction}
Contrastive learning objectives maximize mutual information across correlated augmentations of an unlabeled observation~\\cite{he2020momentum, chen2020simple}. However, dimensional collapse often destabilizes latent geometry.

\\section{Theoretical Formulation}
Let $z_i, z_j \\in \\mathbb{S}^{d-1}$ be normalized embeddings of positive pairs. The proposed curvature-regularized contrastive loss is:
\\begin{equation}
  \\mathcal{L}_{\\mathrm{align}} = - \\log \\frac{\\exp(\\langle z_i, z_j \\rangle / \\tau)}{\\sum_{k=1}^{2N} \\mathbb{I}_{[k \\ne i]} \\exp(\\langle z_i, z_k \\rangle / \\tau)} + \\lambda \\mathcal{R}_{\\mathrm{curv}}(\\bm{Z})
\\end{equation}
where $\\tau$ is the temperature parameter and $\\mathcal{R}_{\\mathrm{curv}}$ penalizes non-isometric manifold deformations.

\\section{Ablation Studies}
Table~\\ref{tab:ablation} details the influence of each architectural component.

\\begin{table}[htbp]
  \\centering
  \\caption{Ablation of regularizer components on CIFAR-100 linear evaluation.}
  \\label{tab:ablation}
  \\begin{tabular}{lccc}
    \\toprule
    \\textbf{Configuration} & \\textbf{Top-1 Acc (\\%)} & \\textbf{Top-5 Acc (\\%)} & \\textbf{OOD Robustness} \\\\
    \\midrule
    InfoNCE Baseline       & 74.2 & 91.8 & 62.1 \\\\
    + Curvature Penalty    & 77.4 & 93.5 & 68.3 \\\\
    + Full \\textsc{MetricAlign} & \\textbf{79.0} & \\textbf{94.7} & \\textbf{71.5} \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section*{Broader Impact \\& Ethics Statement}
This foundational research advances sample efficiency in machine learning. While broad deployment reduces training carbon footprints, automated decision models require domain audit before clinical or societal deployment.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@inproceedings{he2020momentum,
  title={Momentum contrast for unsupervised visual representation learning},
  author={He, Kaiming and Fan, Haoqi and Wu, Yuxin and Xie, Saining and Girshick, Ross},
  booktitle={Proceedings of the IEEE/CVF conference on computer vision and pattern recognition},
  pages={9729--9738},
  year={2020}
}

@inproceedings{chen2020simple,
  title={A simple framework for contrastive learning of visual representations},
  author={Chen, Ting and Kornblith, Simon and Norouzi, Mohammad and Hinton, Geoffrey},
  booktitle={International conference on machine learning},
  pages={1597--1607},
  year={2020}
}`,
    },
  },
  {
    id: 'tpl_phd_dissertation',
    title: 'Ph.D. Comprehensive Dissertation (Multi-Chapter)',
    titleId: 'Disertasi Doktoral & Tesis Komprehensif (Multi-Bab)',
    titleEn: 'Ph.D. Comprehensive Dissertation (Multi-Chapter)',
    descriptionId: 'Struktur komprehensif disertasi S3/tesis S2 dengan deklarasi orisinalitas, halaman pengesahan, kata pengantar, bab-bab terpisah (\\include), dan lampiran.',
    descriptionEn: 'Comprehensive Ph.D./Master dissertation structure with originality declaration, dedication, modular chapters (\\include), and appendices.',
    category: 'Thesis',
    badge: 'DISSERTATION // PH.D.',
    tags: ['Dissertation', 'Ph.D.', 'University', 'Monograph'],
    files: {
      'main.tex': `\\documentclass[12pt,oneside,a4paper]{report}
\\usepackage[margin=3cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{setspace}
\\usepackage{hyperref}

\\onehalfspacing

\\begin{document}

% Title Page
\\begin{titlepage}
  \\centering
  \\vspace*{1cm}
  {\\Large\\bfseries ADVANCED ADSORPTION PHENOMENA AND KINETIC MODELLING IN BENCHTOP CARBON DIOXIDE DIRECT AIR CAPTURE SYSTEMS\\par}
  \\vspace{2cm}
  {\\large A Dissertation Submitted for the Degree of Doctor of Philosophy\\par}
  \\vspace{2cm}
  {\\large\\textbf{Naufal Dean Alfarisi, S.T., M.Eng.}\\par}
  \\vfill
  {\\large Department of Chemical and Materials Engineering\\\\
  Graduate School of Science and Engineering\\\\
  Academic Year 2026\\par}
\\end{titlepage}

\\chapter*{Declaration of Originality}
I hereby declare that this dissertation entitled \\textit{Advanced Adsorption Phenomena and Kinetic Modelling in Direct Air Capture Systems} is the result of my own bona fide research work, except where explicitly referenced.

\\vspace{3em}
\\noindent
Bandung, \\today \\hfill \\textbf{Naufal Dean Alfarisi}

\\chapter*{Abstract}
Direct air capture (DAC) represents an essential technological component in meeting global net-zero greenhouse gas emission targets. This doctoral dissertation investigates mass transfer resistance, surface functionalization of porous biochar matrices, and high-frequency non-dispersive infrared sensing architectures. The proposed kinetic model demonstrates $R^2 > 0.992$ correlation with experimental breakthrough curves across 500 hours of continuous testbed operation.

\\tableofcontents
\\listoftables

\\include{chapters/ch1_intro}
\\include{chapters/ch2_method}

\\chapter{Conclusions and Future Work}
\\label{ch:conclusion}
This research establishes reproducible experimental benchmarks for ambient direct air capture. Future investigations will couple solar-thermal desorption cycles to further minimize regeneration energy penalties.

\\bibliographystyle{plain}
\\bibliography{refs}

\\appendix
\\chapter{Sensor Calibration Certificates}
\\label{app:calibration}
Detailed calibration logs for differential mass balance instruments and NDIR gas analyzers (MPM486 and Wingel PCM2052 series).

\\end{document}`,
      'chapters/ch1_intro.tex': `\\chapter{Introduction and Objectives}
\\label{ch:intro}

\\section{Background and Motivation}
Atmospheric carbon dioxide concentrations have surpassed 420 ppm, accelerating anthropogenic climate shifts~\\cite{ipcc2023}. While point-source emission abatement remains mandatory, negative emission technologies such as Direct Air Capture (DAC) are indispensable for mitigating hard-to-abate historical emissions.

\\section{Research Questions}
This dissertation addresses three key engineering challenges:
\\begin{enumerate}
  \\item How do pore volume distributions and amine loadings in biochar affect low-concentration $\\mathrm{CO}_2$ capture kinetics?
  \\item What sensor fusion algorithms eliminate baseline drift in long-term continuous measurement?
  \\item Can localized desorption cycles reduce thermal regeneration penalties below $4.2\\,\\mathrm{GJ/t}\\,\\mathrm{CO}_2$?
\\end{enumerate}`,
      'chapters/ch2_method.tex': `\\chapter{Materials and Experimental Methodology}
\\label{ch:method}

\\section{Adsorbent Synthesis}
Porous agricultural biochar feedstocks were pyrolyzed at $650^\\circ\\mathrm{C}$ under an inert nitrogen sweep ($200\\,\\mathrm{mL/min}$). Chemical activation with potassium hydroxide (KOH) was executed at an impregnation ratio of 3:1.

\\section{Differential Packed-Bed Reactor Setup}
Breakthrough dynamics were quantified in a temperature-controlled differential packed-bed reactor. Real-time gas concentrations were analyzed downstream using dual NDIR optical sensors calibrated against certified gas standards ($400\\,\\mathrm{ppm}$ and $1000\\,\\mathrm{ppm}\\,\\mathrm{CO}_2$).`,
      'refs.bib': `@misc{ipcc2023,
  title={Climate Change 2023: Synthesis Report. Contribution of Working Groups I, II and III to the Sixth Assessment Report},
  author={{IPCC}},
  year={2023},
  publisher={Intergovernmental Panel on Climate Change}
}`,
    },
  },
  {
    id: 'tpl_modern_cv',
    title: 'Modern 2-Column Academic & Industry CV',
    titleId: 'CV & Resume Akademik / Tech 2-Kolom Modern',
    titleEn: 'Modern 2-Column Academic & Industry CV',
    descriptionId: 'Curriculum Vitae dua-kolom bergaya modern (AltaCV style murni LaTeX) dengan sidebar kontak/keahlian dan kolom utama publikasi serta pengalaman kerja.',
    descriptionEn: 'Modern 2-column curriculum vitae (AltaCV style in pure LaTeX) with skills sidebar and main column for experience, grants, and publications.',
    category: 'Resume',
    badge: 'CV // MODERN 2-COL',
    tags: ['CV', 'Resume', 'Curriculum Vitae', 'Career'],
    files: {
      'main.tex': `\\documentclass[10pt,a4paper]{article}
\\usepackage[top=1.2cm,bottom=1.2cm,left=1.2cm,right=1.2cm]{geometry}
\\usepackage{paracol}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\definecolor{primary}{HTML}{003366}
\\definecolor{accent}{HTML}{E65100}
\\definecolor{darkslate}{HTML}{1A1A1A}
\\definecolor{lightgrey}{HTML}{F4F4F6}

\\hypersetup{colorlinks=true,urlcolor=accent}
\\pagestyle{empty}
\\setlist[itemize]{leftmargin=1.2em,itemsep=0.2em,topsep=0.2em}

\\begin{document}

% Header Block
\\begin{center}
  {\\Huge\\bfseries\\color{primary} DR. IR. NAUFALDO ALFARISI, M.ENG.} \\\\[0.3em]
  {\\large\\bfseries\\color{accent} Industrial Automation & Chemical Process Systems Engineer} \\\\[0.4em]
  \\small Email: \\href{mailto:naufal@research.id}{naufal@research.id} \\quad | \\quad
  Web: \\href{https://naufaldo.github.io}{naufaldo.github.io} \\quad | \\quad
  Bandung, Indonesia \\quad | \\quad
  GitHub: \\href{https://github.com/Naufaldo}{github.com/Naufaldo}
\\end{center}

\\vspace{0.8em}
\\hrule height 1.5pt
\\vspace{0.8em}

\\columnratio{0.32}
\\begin{paracol}{2}

% Left Column: Profile & Skills
\\textbf{\\large\\color{primary} CORE COMPETENCIES} \\\\[0.4em]
\\textbf{Industrial Automation:}
\\begin{itemize}
  \\item PLC Programming (IEC 61131-3)
  \\item SCADA & HMI Systems
  \\item Modbus RTU / TCP, EtherCAT
  \\item VFD Speed Control & PID
\\end{itemize}

\\vspace{0.6em}
\\textbf{Software & Systems:}
\\begin{itemize}
  \\item C/C++, Rust, TypeScript
  \\item WebAssembly (WASM) Systems
  \\item Python, MATLAB Analysis
  \\item Docker & Linux Edge Runtime
\\end{itemize}

\\vspace{0.6em}
\\textbf{Chemical Instrumentation:}
\\begin{itemize}
  \\item NDIR Sensors & Flowmeters
  \\item P&ID & Electrical CAD
  \\item Adsorption Breakthrough Lab
\\end{itemize}

\\vspace{0.8em}
\\textbf{\\large\\color{primary} CERTIFICATIONS} \\\\[0.4em]
\\begin{itemize}
  \\item Licensed Professional Engineer (IPM)
  \\item Certified Automation Professional (ISA)
\\end{itemize}

\\switchcolumn

% Right Column: Experience & Publications
\\textbf{\\large\\color{primary} PROFESSIONAL WORK EXPERIENCE} \\\\[0.4em]

\\textbf{Senior Control Systems Lead} \\hfill \\textit{2023 -- Present} \\\\
\\textit{Trafindo Power Automation Division}
\\begin{itemize}
  \\item Led engineering for dual pump testing facility (45\\,kW and 160\\,kW motor drives) with automated pressure & flow telemetry.
  \\item Engineered configuration-driven Node-RED telemetry pipeline with WebSocket integration and zero manual UI wiring.
\\end{itemize}

\\vspace{0.6em}
\\textbf{Research Fellow in DAC & Chemical Sensing} \\hfill \\textit{2021 -- 2023} \\\\
\\textit{Green Energy Research Center, ITB}
\\begin{itemize}
  \\item Architected automated benchtop DAC biochar adsorption rig with synchronized temperature and optical NDIR telemetry.
  \\item Fit non-linear breakthrough curves and authored 4 peer-reviewed manuscripts with Elsevier standard multi-panel graphics.
\\end{itemize}

\\vspace{0.8em}
\\textbf{\\large\\color{primary} SELECTED PEER-REVIEWED PUBLICATIONS} \\\\[0.4em]
\\begin{itemize}
  \\item \\textbf{Alfarisi, N.} et al. (2025). \\textit{High-speed zero-server WebAssembly LaTeX compilation engines for sovereign research}. Journal of Open Research Software, 13(2), 114--128.
  \\item \\textbf{Alfarisi, N.} et al. (2024). \\textit{Drift compensation in low-concentration ambient NDIR carbon dioxide sensing}. IEEE Transactions on Instrumentation and Measurement, 73, 1--12.
\\end{itemize}

\\vspace{0.8em}
\\textbf{\\large\\color{primary} EDUCATION} \\\\[0.4em]
\\textbf{Ph.D. in Chemical & Process Engineering} \\hfill \\textit{2021 -- 2024} \\\\
Institut Teknologi Bandung (ITB) \\quad | \\quad \\textit{Summa Cum Laude} \\\\
\\textbf{B.Eng. in Electrical & Control Engineering} \\hfill \\textit{2017 -- 2021} \\\\
Institut Teknologi Bandung (ITB)

\\end{paracol}

\\end{document}`,
    },
  },
  {
    id: 'tpl_grant_proposal',
    title: 'Scientific Research Grant Proposal',
    titleId: 'Proposal Hibah Riset Ilmiah (NSF / NIH / BRIN Style)',
    titleEn: 'Scientific Research Grant Proposal',
    descriptionId: 'Struktur proposal pendanaan riset formal: Specific Aims, Research Strategy, Signifikansi, Metodologi, Tabel Gantt Chart, dan Justifikasi Anggaran.',
    descriptionEn: 'Formal research grant funding proposal: Specific Aims, Research Strategy, Significance, Methodology, Gantt Chart timeline, and Budget Justification.',
    category: 'Academic',
    badge: 'PROPOSAL // GRANT',
    tags: ['Grant', 'Proposal', 'Funding', 'Research Project'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{hyperref}

\\hypersetup{colorlinks=true,linkcolor=blue,citecolor=blue}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries RESEARCH GRANT PROPOSAL\\\\}
  \\vspace{0.5em}
  {\\Large Autonomous Client-Side Scientific Computing via WebAssembly Virtualization\\par}
  \\vspace{1em}
  \\textbf{Principal Investigator:} Prof. Dr. Sarah Jenkins, Ph.D. \\\\
  \\textbf{Host Institution:} National Institute for Advanced Computational Sciences \\\\
  \\textbf{Proposed Project Duration:} 24 Months \\quad | \\quad \\textbf{Requested Budget:} \\$480,000
\\end{center}

\\vspace{1em}
\\hrule height 1pt
\\vspace{1.5em}

\\section{Specific Aims}
Data privacy regulations and network latency barriers severely constrain collaborative document engineering in defense, biotechnology, and classified research domains. This project aims to:
\\begin{enumerate}
  \\item \\textbf{Aim 1:} Implement memory-isolated WebAssembly runtime kernels executing unmodified TeX Live engines in edge browsers.
  \\item \\textbf{Aim 2:} Develop deterministic AST-based incremental compilation algorithms achieving $< 100$\\,ms re-typeset latency.
  \\item \\textbf{Aim 3:} Validate zero-trust cryptographic provenance binding for distributed research artifacts.
\\end{enumerate}

\\section{Significance and Background}
Current collaborative platforms rely heavily on centralized monolithic servers, exposing proprietary research data to third-party cloud vulnerabilities~\\cite{grantRef2025}. By transitioning compiler engines into client-side WASM sandboxes, complete operational sovereignty is restored to individual research laboratories.

\\section{Research Plan and Work Packages}
\\subsection{Work Package 1: Low-Latency Virtual Filesystems}
We will build in-memory virtual filesystems capable of synchronizing multi-gigabyte project structures across worker threads with zero serialization overhead.

\\subsection{Project Schedule and Gantt Milestones}
Table~\\ref{tab:gantt} illustrates the timeline of project deliverables across the 24-month funding cycle.

\\begin{table}[htbp]
  \\centering
  \\caption{Project milestones and timeline schedule.}
  \\label{tab:gantt}
  \\begin{tabular}{lcccc}
    \\toprule
    \\textbf{Milestone Deliverable} & \\textbf{Q1--Q2} & \\textbf{Q3--Q4} & \\textbf{Q5--Q6} & \\textbf{Q7--Q8} \\\\
    \\midrule
    Engine WASM Compilation & \\textbf{X} & & & \\\\
    Incremental Snapshotting & & \\textbf{X} & & \\\\
    Multi-engine XeLaTeX/LuaTeX & & & \\textbf{X} & \\\\
    Full Security Audit & & & & \\textbf{X} \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section{Budget Justification}
\\begin{itemize}
  \\item \\textbf{Personnel (\\$320,000):} 1 Postdoctoral Fellow (24 mo) and 2 Graduate Research Assistants.
  \\item \\textbf{Hardware & Benchmarking Nodes (\\$65,000):} Dedicated workstations for parallel profiling.
  \\item \\textbf{Publication & Dissemination (\\$25,000):} Open-access fees and conference registrations.
  \\item \\textbf{Institutional Indirect Costs (\\$70,000):} Standard institutional overhead rate.
\\end{itemize}

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{grantRef2025,
  title={Sovereign cloud architectures for academic research integrity},
  author={Jenkins, Sarah and Thorne, David},
  journal={Science and Public Policy},
  volume={52},
  number={1},
  pages={45--59},
  year={2025}
}`,
    },
  },
  {
    id: 'tpl_sop_industrial',
    title: 'Industrial Standard Operating Procedure (SOP)',
    titleId: 'SOP & Manual Teknis Pengoperasian Industri',
    titleEn: 'Industrial Standard Operating Procedure (SOP)',
    descriptionId: 'Manual prosedur operasional standar industri (SOP) dengan blok kendali dokumen, rambu keselamatan DANGER/CAUTION, diagram langkah kerja, dan tabel audit tanda tangan.',
    descriptionEn: 'Industrial standard operating procedure (SOP) manual with document control metadata, safety warnings, step-by-step checklist, and sign-off table.',
    category: 'Report',
    badge: 'MANUAL // INDUSTRIAL SOP',
    tags: ['SOP', 'Manual', 'Engineering', 'Safety', 'Industrial'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[top=2cm,bottom=2cm,left=2cm,right=2cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{xcolor}
\\usepackage{fancyhdr}
\\usepackage{tcolorbox}

\\definecolor{dangerred}{HTML}{B91C1C}
\\definecolor{warningamber}{HTML}{D97706}
\\definecolor{cortexblue}{HTML}{1E3A8A}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small\\textbf{STANDARD OPERATING PROCEDURE}}
\\fancyhead[R]{\\small DOC-ID: SOP-TB-PUMP-002}
\\fancyfoot[C]{\\thepage}

\\begin{document}

% Document Control Block
\\begin{tabular}{|l|p{7cm}|l|p{4cm}|}
  \\hline
  \\textbf{Title:} & Dual Pump Testing Procedure & \\textbf{Rev:} & 3.2 \\\\
  \\hline
  \\textbf{Facility:} & 160 kW Pump Test Bed Rig & \\textbf{Date:} & \\today \\\\
  \\hline
  \\textbf{Author:} & Lead Automation Engineer & \\textbf{Approver:} & Plant Director \\\\
  \\hline
\\end{tabular}

\\vspace{1.5em}

\\section{Purpose and Operational Scope}
This SOP delineates the safety checkpoints, valve sequencing, and variable-frequency drive (VFD) parameters required for testing 4-inch (TB1 45\\,kW) and 8-inch (TB2 160\\,kW) industrial centrifugal pump assemblies.

\\section{Safety Prerequisites and Personal Protective Equipment (PPE)}
\\begin{tcolorbox}[colback=dangerred!10,colframe=dangerred,title=\\textbf{DANGER: HIGH VOLTAGE \& HIGH PRESSURE HAZARD}]
  Before initiating pump rotation, confirm 1000\\,V main transformer isolation and verify Emergency Stop (ESTOP) circuit continuity. Never exceed maximum operating discharge pressure ($P_{\\max} = 16.0\\,\\mathrm{bar}$).
\\end{tcolorbox}

\\section{Pre-Start Verification Checklist}
\\begin{enumerate}
  \\item Verify water reservoir level is above $85\\%$ tank capacity.
  \\item Ensure suction suction line butterfly valve (BV101) is fully open ($100\\%$).
  \\item Check MPM486 pressure transmitter zero-calibration reading on HMI panel.
  \\item Confirm Yaskawa GA700 VFD communication over Modbus RS-485 / Node-RED WebSocket gateway.
\\end{enumerate}

\\section{Step-by-Step Testing Execution}
\\subsection{Phase 1: Priming and Cavitation Purge}
Engage vacuum priming pump for 120 seconds until continuous fluid stream flows through sight glass.

\\subsection{Phase 2: Ramped Frequency Acceleration}
Table~\\ref{tab:parameters} lists nominal frequency stages and required monitoring limits.

\\begin{table}[htbp]
  \\centering
  \\caption{Step-wise frequency test stages and parameter tolerances.}
  \\label{tab:parameters}
  \\begin{tabular}{ccccc}
    \\toprule
    \\textbf{Step} & \\textbf{VFD Freq (Hz)} & \\textbf{Flow Rate (m$^3$/h)} & \\textbf{Pressure (bar)} & \\textbf{Max Temp ($^\\circ$C)} \\\\
    \\midrule
    1 & 15.0 & 45.0  & 2.8 & 42 \\\\
    2 & 30.0 & 92.5  & 5.4 & 48 \\\\
    3 & 45.0 & 138.0 & 8.9 & 55 \\\\
    4 & 60.0 & 185.0 & 12.4 & 62 \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section{Emergency Shutdown Protocol}
In the event of pipe burst, cavitational vibration $> 4.5\\,\\mathrm{mm/s}$, or motor overheat:
\\begin{enumerate}
  \\item Hit physical red mushroom ESTOP push button on local cabinet or HMI virtual trigger.
  \\item VFD will immediately trigger Safe Torque Off (STO) and open discharge bypass valve.
\\end{enumerate}

\\section{Audit Sign-Off and Operator Verification}
\\vspace{1em}
\\noindent
\\begin{tabular}{p{7cm}p{7cm}}
  \\textbf{Operator on Duty:} \\hrulefill & \\textbf{Safety Inspector:} \\hrulefill \\\\[1.5em]
  \\textbf{Signature / Date:} \\hrulefill & \\textbf{Signature / Date:} \\hrulefill \\\\
\\end{tabular}

\\end{document}`,
    },
  },
  {
    id: 'tpl_academic_book',
    title: 'Academic Monograph & Textbook',
    titleId: 'Buku Akademik & Monograf Ilmiah (Textbook)',
    titleEn: 'Academic Monograph & Textbook',
    descriptionId: 'Struktur buku/monograf lengkap dengan bab, sub-bab, kotak definisi, rangkuman, latihan soal (exercises), daftar pustaka, dan indeks subjek.',
    descriptionEn: 'Comprehensive academic textbook/monograph structure with frontmatter, chapters, definition callouts, exercises, and bibliography.',
    category: 'Academic',
    badge: 'BOOK // MONOGRAPH',
    tags: ['Book', 'Textbook', 'Monograph', 'Publishing'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper,openany]{book}
\\usepackage[margin=2.8cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{\\textbf{\\Huge Principles of Decentralized Scientific Computing}\\\\[0.5em] \\Large Theory, Architecture, and Practical WebAssembly Implementations}
\\author{\\textbf{\\Large Dr. Elizabeth Vance} \\\\ Senior Research Chair in Computer Science}
\\date{First Edition --- 2026}

\\begin{document}

\\frontmatter
\\maketitle

\\chapter{Preface}
This textbook provides a rigorous introduction to sovereign, zero-server computing architectures. It is designed for graduate courses in distributed systems, scientific software engineering, and applied cryptography.

\\tableofcontents

\\mainmatter

\\part{Foundations of In-Browser Compilation}

\\include{chapter1}

\\chapter{Incremental AST Checkpointing and Fast Splicing}
\\label{ch:splicing}

\\section{The Sub-Second Recompilation Problem}
Interactive document authoring requires immediate visual feedback. When an author modifies a sentence in Chapter 4, compiling the entire 300-page manuscript incurs unacceptable latency.

\\section{Heap Memory Snapshotting}
By instrumenting the WebAssembly engine with Asyncify stack unwind/rewind checkpoints, memory state is captured directly prior to the edited source line. This allows resuming execution with zero overhead.

\\backmatter

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'chapter1.tex': `\\chapter{Introduction to Client-Side Execution}
\\label{ch:intro}

\\section{Historical Context}
For decades, scientific document compilation relied upon heavyweight server installations of TeX Live, consuming gigabytes of remote disk space and exposing sensitive research manuscripts to external network channels~\\cite{knuth1984}.

\\section{WebAssembly as a Universal Target}
WebAssembly (WASM) provides a memory-safe, sandboxed binary execution environment running at near-native CPU speeds across modern web browsers.

\\subsection{Core Architectural Invariants}
\\begin{enumerate}
  \\item \\textbf{Deterministic Execution:} Identical source files yield bit-for-bit identical PDF binaries.
  \\item \\textbf{Zero Network Egress:} User documents never leave the browser client memory.
  \\item \\textbf{On-Demand Resource Streaming:} TeX packages stream on-the-fly and persist in local IndexedDB caches.
\\end{enumerate}`,
      'refs.bib': `@article{knuth1984,
  title={Literate programming},
  author={Knuth, Donald Ervin},
  journal={The Computer Journal},
  volume={27},
  number={2},
  pages={97--111},
  year={1984},
  publisher={Oxford University Press}
}`,
    },
  },
]
